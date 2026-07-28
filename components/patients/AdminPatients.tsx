"use client";

import { CreditCard, Download, FileHeart, Plus, Trash2, UserRoundCheck, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { roleHasPermission } from "@/lib/access/matrix";
import { hospitalRoleToAccessRole } from "@/lib/hospital-os-data";
import type { PatientRecord, PatientStatus } from "@/lib/patient-types";
import { bloodGroups, patientStatuses } from "@/lib/patient-types";
import type { PatientSortField } from "@/lib/patient-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/design-system/FormField";
import { FormSection } from "@/components/design-system/FormSection";
import { DraftRestoredNotice } from "@/components/design-system/DraftRestoredNotice";
import { RecentValueChips } from "@/components/design-system/RecentValueChips";
import { getStatusToneClass, type BadgeTone } from "@/components/design-system/StatusBadge";
import { PrintIdCardDialog } from "@/components/patients/PrintIdCardDialog";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { useFormDraft } from "@/hooks/useFormDraft";
import { useRecentValues } from "@/hooks/useRecentValues";
import { patientCreateSchema, type PatientCreateInput } from "@/lib/validation/patients";

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

const statusTone: Record<PatientStatus, BadgeTone> = {
  Active: "success",
  Inactive: "inactive",
  Flagged: "critical"
};

export function AdminPatients() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const role = useHospitalOsStore((state) => state.role);
  // UI convenience only — DELETE /api/patients re-checks patients:delete
  // server-side (reserved for admin/super-admin) on every request, same as
  // every other mutation in the app.
  const canDelete = roleHasPermission(hospitalRoleToAccessRole[role], "patients", "delete");

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
  const [printPatient, setPrintPatient] = useState<PatientRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ items: PatientRecord[]; clearSelection?: () => void } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const allergyRecents = useRecentValues("patient-allergies");
  const conditionRecents = useRecentValues("patient-chronic-conditions");
  const medicineRecents = useRecentValues("patient-current-medicines");

  const {
    register,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
    submit: submitPatient
  } = useAdvancedForm<PatientCreateInput>({
    schema: patientCreateSchema,
    defaultValues: { name: "", phone: "" },
    async onValid(values) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed create must not blank the list.
      let response: Response;
      try {
        response = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, forceNew: duplicateMatch && confirmedNewPatient })
        });
      } catch {
        // Network failure (offline/connection drop), not a server response —
        // the form still holds every field the staff member typed (reset()
        // only runs below, on success), and Retry re-reads the current form
        // state rather than a stale captured copy, so an edit made while the
        // toast is showing isn't silently discarded (Track 4.2).
        notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitPatient());
        return;
      }
      const data = (await response.json().catch(() => ({}))) as PatientResponse;
      if (!response.ok || !data.ok || !data.patient) {
        notify.error(data.error || "Unable to save patient.");
        return;
      }
      notify.success(duplicateMatch && !confirmedNewPatient ? "Existing patient updated" : duplicateMatch ? "New patient saved as a separate record (shared number confirmed)" : "Patient saved");
      for (const token of (values.allergies ?? "").split(",")) allergyRecents.remember(token);
      for (const token of (values.chronicConditions ?? "").split(",")) conditionRecents.remember(token);
      for (const token of (values.currentMedicines ?? "").split(",")) medicineRecents.remember(token);
      reset();
      draft.clear();
      setDuplicateMatch(null);
      setConfirmedNewPatient(false);
      setTypedName("");
      void loadPatients();
    }
  });

  const draft = useFormDraft<PatientCreateInput>("patient-registration", watch, reset);

  function insertRecentValue(field: "allergies" | "chronicConditions" | "currentMedicines", value: string) {
    const current = (getValues(field) ?? "").trim();
    setValue(field, current ? `${current}, ${value}` : value, { shouldValidate: true });
  }

  async function updateStatus(id: string, status: PatientStatus) {
    let response: Response;
    try {
      response = await fetch("/api/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateStatus(id, status));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok || !data.patient) {
      notify.error(data.error || "Unable to update patient.");
      return;
    }
    setPatients((items) => items.map((item) => (item.id === id ? (data.patient as PatientRecord) : item)));
    notify.success("Patient updated");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    let deleted = 0;
    let lastError = "";
    for (const patient of deleteTarget.items) {
      let response: Response;
      try {
        response = await fetch("/api/patients", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: patient.id })
        });
      } catch {
        lastError = "Unable to reach the server. Check your connection and retry.";
        continue;
      }
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        deleted += 1;
      } else {
        lastError = data.error || "Unable to delete this patient.";
      }
    }
    setIsDeleting(false);

    if (deleted > 0) {
      notify.success(deleted === 1 ? "Patient deleted" : `${deleted} patients deleted`);
      void loadPatients();
    }
    if (deleted < deleteTarget.items.length) {
      notify.error(lastError || "Some patients could not be deleted.");
    }
    setDeleteTarget(null);
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
            className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${getStatusToneClass(statusTone[row.original.status])}`}
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
        header: "Actions",
        size: 150,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={`https://wa.me/${row.original.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              WhatsApp
            </a>
            <ActionButton variant="secondary" size="sm" onClick={() => setPrintPatient(row.original)} aria-label={`Print ID card for ${row.original.name}`}>
              <CreditCard size={13} /> Print ID
            </ActionButton>
            {canDelete ? (
              <ActionButton
                variant="danger"
                size="sm"
                className="h-8 w-8 min-h-8 px-0"
                title="Delete permanently"
                aria-label={`Delete ${row.original.name}`}
                onClick={() => setDeleteTarget({ items: [row.original] })}
              >
                <Trash2 size={13} />
              </ActionButton>
            ) : null}
          </div>
        )
      }
    ],
    // updateStatus only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, canDelete]
  );

  return (
    <div className="grid gap-4">
      {/* min-w-0: this card wraps the patient DataTable, and a grid item
          without it refuses to shrink below its content — pushing the page
          into horizontal scroll rather than letting the table scroll itself. */}
      <div className="min-w-0 rounded border border-line/80 bg-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Patient Master / UHID</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Permanent patient records</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
              New appointment requests now create or match a UHID automatically by phone number. Use this master to manage core patient profile details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line p-4 md:grid-cols-4">
          {statTiles.map((stat) => (
            <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
              <p className="text-xl font-bold text-ink">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <form onSubmit={submitPatient} noValidate className="mb-4 rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <Plus size={19} /> Create patient record
            </p>
            {draft.restored ? (
              <DraftRestoredNotice onDiscard={draft.clear} message="Recovered an unfinished registration from before — review and save, or discard it." />
            ) : null}
            <div className="grid gap-4">
              <FormSection title="Identity">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                  <FormField label="Patient name" htmlFor="patient-name" required error={errors.name?.message}>
                    <input
                      id="patient-name"
                      className={fieldClass}
                      placeholder="Patient name"
                      {...register("name", { onChange: (event) => setTypedName(event.target.value) })}
                    />
                  </FormField>
                  <FormField label="Mobile number" htmlFor="patient-phone" required error={errors.phone?.message}>
                    <input
                      id="patient-phone"
                      className={fieldClass}
                      placeholder="Mobile number"
                      inputMode="tel"
                      {...register("phone", { onBlur: (event) => void checkDuplicate(event.target.value) })}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                  <FormField label="Age" htmlFor="patient-age" error={errors.age?.message}>
                    <input id="patient-age" className={fieldClass} placeholder="Age" inputMode="numeric" {...register("age")} />
                  </FormField>
                  <FormField label="Gender" htmlFor="patient-gender">
                    <select id="patient-gender" className={fieldClass} defaultValue="" {...register("gender")}>
                      <option value="">Gender</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </FormField>
                  <FormField label="Blood group" htmlFor="patient-blood-group">
                    <select id="patient-blood-group" className={fieldClass} defaultValue="" {...register("bloodGroup")}>
                      <option value="">Blood group</option>
                      {bloodGroups.filter(Boolean).map((group) => (
                        <option key={group}>{group}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </FormSection>

              <FormSection title="Contact">
                <FormField label="Email" htmlFor="patient-email" error={errors.email?.message}>
                  <input id="patient-email" className={fieldClass} placeholder="Email" type="email" {...register("email")} />
                </FormField>
                <FormField label="Emergency contact" htmlFor="patient-emergency-contact" error={errors.emergencyContact?.message}>
                  <input id="patient-emergency-contact" className={fieldClass} placeholder="Emergency contact" {...register("emergencyContact")} />
                </FormField>
                <FormField label="Address" htmlFor="patient-address" error={errors.address?.message}>
                  <textarea id="patient-address" className={`${fieldClass} min-h-20 py-3`} placeholder="Address" {...register("address")} />
                </FormField>
              </FormSection>

              <FormSection title="Clinical" description="Free text — recently used entries appear as quick-insert chips.">
                <FormField label="Allergies / drug reactions" htmlFor="patient-allergies" error={errors.allergies?.message}>
                  <textarea id="patient-allergies" className={`${fieldClass} min-h-20 py-3`} placeholder="Allergies / drug reactions" {...register("allergies")} />
                  <RecentValueChips values={allergyRecents.values} onPick={(value) => insertRecentValue("allergies", value)} />
                </FormField>
                <FormField label="Chronic conditions" htmlFor="patient-chronic-conditions" error={errors.chronicConditions?.message}>
                  <textarea
                    id="patient-chronic-conditions"
                    className={`${fieldClass} min-h-20 py-3`}
                    placeholder="Chronic conditions, liver disease history, diabetes, hypertension..."
                    {...register("chronicConditions")}
                  />
                  <RecentValueChips values={conditionRecents.values} onPick={(value) => insertRecentValue("chronicConditions", value)} />
                </FormField>
                <FormField label="Current medicines" htmlFor="patient-current-medicines" error={errors.currentMedicines?.message}>
                  <textarea id="patient-current-medicines" className={`${fieldClass} min-h-20 py-3`} placeholder="Current medicines" {...register("currentMedicines")} />
                  <RecentValueChips values={medicineRecents.values} onPick={(value) => insertRecentValue("currentMedicines", value)} />
                </FormField>
              </FormSection>

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
              <ActionButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
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
              <>
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
                {canDelete ? (
                  <ActionButton
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget({ items: selected, clearSelection: clear })}
                  >
                    <Trash2 size={14} /> Delete selected
                  </ActionButton>
                ) : null}
              </>
            )}
          />
        </div>
      </div>
      <PrintIdCardDialog patient={printPatient} setPatient={setPrintPatient} />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.items.length === 1 ? "this patient" : `${deleteTarget.items.length} patients`}?</DialogTitle>
                <DialogDescription>
                  {deleteTarget.items.length === 1
                    ? `This permanently removes ${deleteTarget.items[0].name}'s record (${deleteTarget.items[0].uhid}). Only allowed when the patient has no appointment, visit, admission, lab or pharmacy history. This cannot be undone.`
                    : "This permanently removes the selected patients. Only patients with no appointment, visit, admission, lab or pharmacy history can be deleted — the rest will be skipped with an error. This cannot be undone."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <ActionButton variant="secondary" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
                  Keep it
                </ActionButton>
                <ActionButton
                  variant="danger"
                  loading={isDeleting}
                  disabled={isDeleting}
                  onClick={async () => {
                    const clearSelection = deleteTarget.clearSelection;
                    await handleConfirmDelete();
                    clearSelection?.();
                  }}
                >
                  {isDeleting ? "Deleting…" : "Delete permanently"}
                </ActionButton>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
