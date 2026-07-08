"use client";

import { Download, FileHeart, Plus, UserRoundCheck, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { PatientRecord, PatientStatus } from "@/lib/patient-types";
import { bloodGroups, patientStatuses } from "@/lib/patient-types";
import type { PatientSortField } from "@/lib/patient-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const patientExportHeaders = ["UHID", "Name", "Phone", "Email", "Age", "Gender", "Blood Group", "City", "Status", "Last Visit"];

function patientExportRow(patient: PatientRecord) {
  return [
    patient.uhid,
    patient.name,
    patient.phone,
    patient.email ?? "",
    patient.age ?? "",
    patient.gender ?? "",
    patient.bloodGroup ?? "",
    patient.city ?? "",
    patient.status,
    patient.lastVisitAt ?? ""
  ];
}

type PatientListResponse = {
  ok: boolean;
  patients?: PatientRecord[];
  total?: number;
  page?: number;
  pageCount?: number;
  stats?: { total: number; active: number; flagged: number; withAllergies: number };
  error?: string;
};

type PatientResponse = { ok: boolean; patient?: PatientRecord; error?: string };

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const pageSize = 25;

type DuplicateMatch = { id: string; uhid: string; name: string; phone: string };

const statusTone: Record<PatientStatus, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Inactive: "border-line bg-soft text-muted",
  Flagged: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
};

export function AdminPatients() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, flagged: 0, withAllergies: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [typedName, setTypedName] = useState("");
  const [confirmedNewPatient, setConfirmedNewPatient] = useState(false);

  const sortField = (sorting[0]?.id as PatientSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadPatients() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(pageIndex),
      pageSize: String(pageSize),
      sortBy: sortField,
      sortDir
    });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/patients?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as PatientListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load patients.");
      setLoading(false);
      return;
    }
    setPatients(data.patients ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  // Debounced re-fetch whenever page, sort, search or status filter changes.
  // Filter/status changes reset to page 0 in their own onChange handlers below
  // (not via a reactive effect) so this stays the only effect driving fetches.
  useEffect(() => {
    const timer = window.setTimeout(() => void loadPatients(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: PatientStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  // Duplicate-patient detection (Track 0.3): the store merges on phone match, so
  // a "new" registration silently updates the existing record. Look the number
  // up as staff type it so they see the match before submitting, and give them
  // an explicit choice (update existing vs. confirm this is a different person
  // sharing a number) rather than always silently merging.
  async function checkDuplicate(phone: string) {
    setConfirmedNewPatient(false);
    if (phone.replace(/\D/g, "").length < 6) {
      setDuplicateMatch(null);
      return;
    }
    const response = await fetch(`/api/patients/match?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setDuplicateMatch(response.ok && data.ok ? data.match : null);
  }

  async function addPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, forceNew: duplicateMatch && confirmedNewPatient })
    });
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok || !data.patient) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed create must not blank the list.
      notify.error(data.error || "Unable to save patient.");
      return;
    }
    notify.success(duplicateMatch && !confirmedNewPatient ? "Existing patient updated" : duplicateMatch ? "New patient saved as a separate record (shared number confirmed)" : "Patient saved");
    form.reset();
    setDuplicateMatch(null);
    setConfirmedNewPatient(false);
    setTypedName("");
    void loadPatients();
  }

  async function updateStatus(id: string, status: PatientStatus) {
    const response = await fetch("/api/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok || !data.patient) {
      notify.error(data.error || "Unable to update patient.");
      return;
    }
    setPatients((items) => items.map((item) => (item.id === id ? (data.patient as PatientRecord) : item)));
    notify.success("Patient updated");
  }

  const statTiles = useMemo(
    () => [
      { label: "Patient Records", value: stats.total },
      { label: "Active", value: stats.active },
      { label: "Flagged", value: stats.flagged },
      { label: "With Allergy Notes", value: stats.withAllergies }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<PatientRecord, unknown>[]>(
    () => [
      {
        accessorKey: "uhid",
        header: "UHID",
        size: 130,
        cell: ({ row }) => (
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.1em] text-brand dark:border-cyan-900 dark:bg-cyan-950">
            {row.original.uhid}
          </span>
        )
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openDrawer(row.original.phone, row.original.name)}
            title="Open patient summary"
            className="inline-flex items-center gap-1.5 rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            <UserRoundCheck size={15} className="shrink-0 text-brand" />
            {row.original.name}
          </button>
        )
      },
      { accessorKey: "phone", header: "Phone", size: 130 },
      {
        id: "ageGender",
        header: "Age/Gender",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{[row.original.age, row.original.gender].filter(Boolean).join(" / ") || "—"}</span>
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood",
        size: 80,
        cell: ({ row }) => row.original.bloodGroup || "—"
      },
      {
        id: "allergies",
        header: "Allergies",
        size: 140,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.allergies ? (
            <span className="line-clamp-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" title={row.original.allergies}>
              {row.original.allergies}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <select
            aria-label="Status"
            value={row.original.status}
            onChange={(event) => void updateStatus(row.original.id, event.target.value as PatientStatus)}
            className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${statusTone[row.original.status]}`}
          >
            {patientStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        accessorKey: "lastVisitAt",
        header: "Last Visit",
        size: 110,
        cell: ({ row }) => (row.original.lastVisitAt ? new Date(row.original.lastVisitAt).toLocaleDateString("en-IN") : "—")
      },
      {
        id: "actions",
        header: "",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <a
            href={`https://wa.me/${row.original.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            WhatsApp
          </a>
        )
      }
    ],
    [openDrawer]
  );

  return (
    <div className="grid gap-4">
      <div className="rounded border border-line/80 bg-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Patient Master / UHID</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Permanent patient records</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
              New appointment requests now create or match a UHID automatically by phone number. Use this master to manage core patient profile details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
          {statTiles.map((stat) => (
            <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
              <p className="text-xl font-bold text-ink">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <form onSubmit={addPatient} className="mb-4 rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <Plus size={19} /> Create patient record
            </p>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="name" className={fieldClass} placeholder="Patient name" required onChange={(event) => setTypedName(event.target.value)} />
                <input name="phone" className={fieldClass} placeholder="Mobile number" inputMode="tel" required onBlur={(event) => void checkDuplicate(event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input name="age" className={fieldClass} placeholder="Age" inputMode="numeric" />
                <select aria-label="Gender" name="gender" className={fieldClass} defaultValue="">
                  <option value="">Gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
                <select aria-label="Blood group" name="bloodGroup" className={fieldClass} defaultValue="">
                  <option value="">Blood group</option>
                  {bloodGroups.filter(Boolean).map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </div>
              <input name="email" className={fieldClass} placeholder="Email" type="email" />
              <input name="emergencyContact" className={fieldClass} placeholder="Emergency contact" />
              <textarea name="address" className={`${fieldClass} min-h-20 py-3`} placeholder="Address" />
              <textarea name="allergies" className={`${fieldClass} min-h-20 py-3`} placeholder="Allergies / drug reactions" />
              <textarea name="chronicConditions" className={`${fieldClass} min-h-20 py-3`} placeholder="Chronic conditions, liver disease history, diabetes, hypertension..." />
              <textarea name="currentMedicines" className={`${fieldClass} min-h-20 py-3`} placeholder="Current medicines" />
              {duplicateMatch ? (
                <div className="flex items-start gap-2.5 rounded border-2 border-amber-300 bg-amber-50 p-3 dark:bg-amber-950" role="alert">
                  <UsersRound size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-black uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">Possible existing patient</p>
                    <p className="mt-1 font-semibold">
                      {duplicateMatch.name} · {duplicateMatch.uhid} · {duplicateMatch.phone}
                    </p>
                    <p className="mt-1 leading-relaxed">
                      This number is already on file.
                      {typedName.trim() && typedName.trim().toLowerCase() !== duplicateMatch.name.toLowerCase() ? (
                        <span className="mt-1 block font-bold text-red-700 dark:text-red-300">
                          Different name entered — this may be a shared number (e.g. a family member), not the same person.
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmedNewPatient(false)}
                        aria-pressed={!confirmedNewPatient}
                        className={`rounded border px-3 py-1.5 text-xs font-bold transition ${!confirmedNewPatient ? "border-amber-600 bg-amber-600 text-white" : "border-amber-300 bg-white text-amber-800"}`}
                      >
                        Same person — update existing record
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmedNewPatient(true)}
                        aria-pressed={confirmedNewPatient}
                        className={`rounded border px-3 py-1.5 text-xs font-bold transition ${confirmedNewPatient ? "border-amber-600 bg-amber-600 text-white" : "border-amber-300 bg-white text-amber-800"}`}
                      >
                        Different person — create a new record
                      </button>
                    </div>
                    {confirmedNewPatient ? (
                      <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Saving will create a new, separate patient record with its own UHID, even though the number matches {duplicateMatch.name}.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Saving will update {duplicateMatch.name}&apos;s existing record — no new UHID is generated.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              <ActionButton type="submit" variant="primary">
                Save Patient + Generate UHID
              </ActionButton>
            </div>
          </form>

          <DataTable
            columns={columns}
            data={patients}
            getRowId={(patient) => patient.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search UHID, patient, phone, city"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadPatients()}
            emptyState={{
              icon: FileHeart,
              title: globalFilter || statusFilter ? "No patients match your filters" : "No patient records found",
              description:
                globalFilter || statusFilter
                  ? "Try a different search term or clear the status filter."
                  : "Register a patient with the form, or accept a website appointment request — a UHID is created or matched by phone automatically.",
              action: globalFilter || statusFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                    }
                  : undefined
            }}
            export={{ headers: patientExportHeaders, row: patientExportRow, filename: "patients.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as PatientStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {patientStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            }
            bulkActions={(selected, clear) => (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(patientExportHeaders, selected.map(patientExportRow), "selected-patients.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />
        </div>
      </div>
    </div>
  );
}
