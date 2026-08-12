"use client";

import { BedDouble, Edit3, FileDown } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { BedWardMap, type OccupancyStats } from "@/components/design-system/BedWardMap";
import type { BedStatus, BedTransfer, HospitalBed, HospitalWard, IpdAdmission, IpdAdmissionStatus, VitalsReading } from "@/lib/ipd-types";
import { admissionReference, computeHduEscalation, ipdAdmissionStatuses } from "@/lib/ipd-types";
import { queryIpdAdmissions, type IpdAdmissionSortField } from "@/lib/ipd-admission-query";
import type { OpdVisit } from "@/lib/opd-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { AdminMedicationRecord } from "@/components/ipd/AdminMedicationRecord";
import { AiDischargeSummaryDraft } from "@/components/ipd/AiDischargeSummaryDraft";
import { notify } from "@/lib/notify";
import { downloadCsv } from "@/lib/table-export";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

// The leading column now carries the admission number rather than the OPD
// token that used to sit there: a token repeats every morning, so exports
// filed against it could not tell two stays apart. The token is kept, moved to
// the end and labelled for what it actually is, so nothing is lost from
// spreadsheets already built on this export.
const ipdExportHeaders = ["Admission No.", "UHID", "Patient", "Phone", "Ward", "Bed", "Status", "Diagnosis", "Admitting Doctor", "Assigned Nurse", "Admitted", "OPD Token"];

function ipdExportRow(admission: IpdAdmission) {
  return [
    admissionReference(admission),
    admission.uhid ?? "",
    admission.patientName,
    admission.phone,
    admission.ward,
    admission.bedLabel,
    admission.status,
    admission.diagnosis,
    admission.admittingDoctor,
    admission.assignedNurse ?? "",
    admission.createdAt,
    admission.token
  ];
}

type IpdResponse = {
  ok: boolean;
  beds?: HospitalBed[];
  admissions?: IpdAdmission[];
  admission?: IpdAdmission;
  bed?: HospitalBed;
  visits?: OpdVisit[];
  vitals?: VitalsReading[];
  transfers?: BedTransfer[];
  transfer?: BedTransfer;
  reading?: VitalsReading;
  occupancy?: OccupancyStats;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

const emptyOccupancy: OccupancyStats = {
  totalBeds: 0,
  occupiedBeds: 0,
  hospitalOccupancyPercent: 0,
  bedsPendingTurnover: 0,
  bedsOverdueTurnover: 0,
  averageLengthOfStayDays: 0,
  projectedVacancies24h: 0,
  wardOccupancy: []
};

export function AdminIpdBeds() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [vitals, setVitals] = useState<VitalsReading[]>([]);
  const [transfers, setTransfers] = useState<BedTransfer[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyStats>(emptyOccupancy);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<IpdAdmissionStatus | "">("");
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [editingAdmission, setEditingAdmission] = useState<IpdAdmission | null>(null);

  const sortField = (sorting[0]?.id as IpdAdmissionSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  function applySnapshot(data: IpdResponse) {
    setBeds(data.beds ?? []);
    setAdmissions(data.admissions ?? []);
    setVisits(data.visits ?? []);
    setVitals(data.vitals ?? []);
    setTransfers(data.transfers ?? []);
    setOccupancy(data.occupancy ?? emptyOccupancy);
  }

  async function loadIpd() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ipd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load IPD.");
      setLoading(false);
      return;
    }
    applySnapshot(data);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialIpd() {
      const response = await fetch("/api/ipd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as IpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load IPD.");
        setLoading(false);
        return;
      }
      applySnapshot(data);
      setLoading(false);
    }

    void loadInitialIpd();

    return () => {
      active = false;
    };
  }, []);

  // onRetry re-invokes the specific caller (handleTransfer, handleLogVitals,
  // etc.) with its original arguments, not patchIpd itself — only the caller
  // knows how to apply the response (setAdmissions/setBeds/setTransfers/...).
  async function patchIpd(payload: Record<string, unknown>, onRetry: () => void) {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", onRetry);
      return null;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed ward-board action must not
      // blank the admissions table below it.
      notify.error(data.error || "Unable to update IPD.");
      return null;
    }
    notify.success("IPD update saved");
    return data;
  }

  async function handleTransfer(admissionId: string, toBedId: string, reason: string) {
    const data = await patchIpd({ type: "transfer", admissionId, toBedId, reason }, () => void handleTransfer(admissionId, toBedId, reason));
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
    if (data.beds) setBeds(data.beds);
    if (data.transfer) setTransfers((items) => [data.transfer as BedTransfer, ...items]);
    void loadIpd();
  }

  async function handleLogVitals(admissionId: string, payload: Partial<VitalsReading>) {
    const data = await patchIpd({ type: "vitals", admissionId, ...payload }, () => void handleLogVitals(admissionId, payload));
    if (!data) return;
    if (data.reading) setVitals((items) => [data.reading as VitalsReading, ...items]);
  }

  async function handleEscalate(admissionId: string, escalated: boolean, reason?: string) {
    const data = await patchIpd({ type: "escalate", id: admissionId, escalated, reason }, () => void handleEscalate(admissionId, escalated, reason));
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
  }

  async function handleBedStatus(bedId: string, status: BedStatus) {
    const data = await patchIpd({ type: "bed", id: bedId, status }, () => void handleBedStatus(bedId, status));
    if (!data) return;
    if (data.bed) setBeds((items) => items.map((item) => (item.id === data.bed!.id ? data.bed! : item)));
  }

  async function handleMarkForDischarge(admissionId: string, markedForDischarge: boolean) {
    const data = await patchIpd({ id: admissionId, markedForDischarge }, () => void handleMarkForDischarge(admissionId, markedForDischarge));
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
  }

  async function handleAddBed(input: { ward: HospitalWard; label: string; dailyRate: number; notes?: string }) {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bed", ...input })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void handleAddBed(input));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.bed) {
      notify.error(data.error || "Unable to add bed.");
      return;
    }
    setBeds((current) => data.beds ?? current);
    notify.success(`${data.bed.label} added`);
  }

  async function handleRemoveBed(bedId: string) {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bedId })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void handleRemoveBed(bedId));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to remove bed.");
      return;
    }
    setBeds((current) => data.beds ?? current);
    notify.success("Bed removed");
  }

  async function createAdmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void createAdmission(event));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.admission) {
      notify.error(data.error || "Unable to admit patient.");
      return;
    }
    setAdmissions((items) => [data.admission as IpdAdmission, ...items.filter((item) => item.id !== data.admission?.id)]);
    setBeds((current) => data.beds ?? current);
    notify.success("Patient admitted");
    event.currentTarget.reset();
  }

  async function updateAdmission(
    id: string,
    updates: Partial<Pick<IpdAdmission, "status" | "bedId" | "diagnosis" | "carePlan" | "nursingNotes" | "dietAdvice" | "depositAmount" | "dischargeSummary" | "assignedNurse" | "expectedDischargeDate">>
  ) {
    let response: Response;
    try {
      response = await fetch("/api/ipd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateAdmission(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.admission) {
      notify.error(data.error || "Unable to update admission.");
      return;
    }
    const updated = data.admission as IpdAdmission;
    setAdmissions((items) => items.map((item) => (item.id === id ? updated : item)));
    setBeds((current) => data.beds ?? current);
    setEditingAdmission((current) => (current?.id === id ? updated : current));
  }

  // Deferred to an effect (never computed inline during render) so escalation
  // freshness updates without ever calling Date.now() from a memo body. First
  // tick goes through the timer too, keeping this effect body free of
  // synchronous state writes (react-hooks/set-state-in-effect).
  const [now, setNow] = useState(0);
  useEffect(() => {
    function tick() {
      setNow(Date.now());
    }
    const firstTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, []);

  const escalatedIds = useMemo(() => {
    if (!now) return new Set<string>();
    const ids = new Set<string>();
    for (const admission of admissions) {
      if (admission.status !== "Admitted" || admission.ward !== "HDU") continue;
      if (computeHduEscalation(admission, vitals, now).flagged) ids.add(admission.id);
    }
    return ids;
  }, [admissions, vitals, now]);

  // Client-side pagination against the already-loaded admissions array — see
  // lib/ipd-admission-query.ts for why this module doesn't server-paginate.
  const { admissions: pageRows, pageCount } = useMemo(
    () =>
      queryIpdAdmissions(admissions, {
        page: pageIndex,
        pageSize,
        sortBy: sortField,
        sortDir,
        query: globalFilter,
        status: statusFilter || undefined,
        escalatedIds,
        escalatedOnly
      }),
    [admissions, pageIndex, sortField, sortDir, globalFilter, statusFilter, escalatedIds, escalatedOnly]
  );

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: IpdAdmissionStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function toggleEscalatedOnly(value: boolean) {
    setEscalatedOnly(value);
    setPageIndex(0);
  }

  const columns = useMemo<ColumnDef<IpdAdmission, unknown>[]>(
    () => [
      {
        accessorKey: "admissionNo",
        header: "Admission No.",
        size: 130,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-bold text-ink">{admissionReference(row.original)}</span>
            {row.original.uhid ? <span className="mt-0.5 block text-[10px] text-muted">{row.original.uhid}</span> : null}
          </div>
        )
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 170,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openDrawer(row.original.phone, row.original.patientName)}
            title="Open patient summary"
            className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            {row.original.patientName}
          </button>
        )
      },
      {
        accessorKey: "ward",
        header: "Bed / Ward",
        size: 150,
        cell: ({ row }) => (
          <span>
            {row.original.bedLabel} <span className="text-muted">· {row.original.ward}</span>
          </span>
        )
      },
      {
        id: "diagnosis",
        header: "Diagnosis",
        size: 200,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 text-muted" title={row.original.diagnosis}>
            {row.original.diagnosis}
          </span>
        )
      },
      {
        id: "escalation",
        header: "Attention",
        size: 120,
        enableSorting: false,
        cell: ({ row }) =>
          escalatedIds.has(row.original.id) ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">HDU flag</span>
          ) : (
            <span className="text-muted">—</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <select
            aria-label="Admission status"
            value={row.original.status}
            onChange={(event) => void updateAdmission(row.original.id, { status: event.target.value as IpdAdmissionStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {ipdAdmissionStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => setEditingAdmission((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={editingAdmission?.id === row.original.id}>
            <Edit3 size={13} /> Edit
          </ActionButton>
        )
      }
    ],
    // updateAdmission only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, editingAdmission, escalatedIds]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">IPD + Bed Management</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Admissions and live bed board</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Admit from OPD, assign beds, transfer rooms, track nursing notes and discharge summaries.</p>
        </div>
      </div>

      <div className="border-b border-line p-4">
        <BedWardMap
          beds={beds}
          admissions={admissions}
          vitals={vitals}
          transfers={transfers}
          visits={visits}
          occupancy={occupancy}
          onTransfer={handleTransfer}
          onLogVitals={handleLogVitals}
          onEscalate={handleEscalate}
          onBedStatus={handleBedStatus}
          onMarkForDischarge={handleMarkForDischarge}
          onAddBed={handleAddBed}
          onRemoveBed={handleRemoveBed}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
        <form onSubmit={createAdmission} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <BedDouble size={19} /> Admit patient
          </p>
          <div className="grid gap-3">
            <select aria-label="OPD visit" name="visitId" className={fieldClass} required>
              <option value="">Select OPD visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.token} | {visit.patientName}
                  {visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}
                </option>
              ))}
            </select>
            <select aria-label="Bed" name="bedId" className={fieldClass} required>
              <option value="">Select vacant bed</option>
              {beds
                .filter((bed) => bed.status === "Vacant")
                .map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {bed.label} | {bed.ward}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <select aria-label="Admission type" name="admissionType" className={fieldClass} defaultValue="Observation">
                {["Observation", "Post Procedure", "Planned", "Emergency"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <input name="depositAmount" className={fieldClass} type="number" min="0" placeholder="Deposit amount" />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <input name="admittingDoctor" className={fieldClass} placeholder="Admitting doctor" defaultValue="Dr. Deepak Kumar Sharma" />
              <input name="assignedNurse" className={fieldClass} placeholder="Assigned nurse" />
            </div>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Expected discharge
              <input aria-label="Expected discharge date" name="expectedDischargeDate" className={fieldClass} type="datetime-local" />
            </label>
            <input name="diagnosis" className={fieldClass} placeholder="Provisional diagnosis" required />
            <textarea name="carePlan" className={`${fieldClass} min-h-24 py-3`} placeholder="Care plan / monitoring instructions" />
            <label className="flex items-start gap-2.5 rounded border-2 border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <input type="checkbox" name="consentRecorded" value="true" required className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span className="text-sm font-semibold leading-relaxed text-ink">
                Patient/family consent for admission and care has been explained and confirmed. Admission is rejected server-side without this.
              </span>
            </label>
            <ActionButton type="submit" variant="primary">
              Create Admission
            </ActionButton>
          </div>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={pageRows}
            getRowId={(admission) => admission.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search admission, UHID, patient, bed"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadIpd()}
            emptyState={{
              icon: BedDouble,
              title: globalFilter || statusFilter || escalatedOnly ? "No admissions match your filters" : "No IPD admissions",
              description:
                globalFilter || statusFilter || escalatedOnly
                  ? "Try a different search term, or clear the status/attention filters."
                  : "Admitted in-patients and their bed allocations show here. Admit a patient with the form to the left.",
              action: globalFilter || statusFilter || escalatedOnly ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter || escalatedOnly
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                      setEscalatedOnly(false);
                    }
                  : undefined
            }}
            stickyFirstColumn
            toolbarExtra={
              <>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => updateStatusFilter(event.target.value as IpdAdmissionStatus | "")}
                  className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  <option value="">All statuses</option>
                  {ipdAdmissionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={escalatedOnly} onChange={(event) => toggleEscalatedOnly(event.target.checked)} className="h-4 w-4 accent-red-600" />
                  Needs attention
                </label>
              </>
            }
            export={{ headers: ipdExportHeaders, row: ipdExportRow, filename: "ipd-admissions.csv" }}
            bulkActions={(selected, clear) => (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(ipdExportHeaders, selected.map(ipdExportRow), "selected-ipd-admissions.csv");
                  clear();
                }}
              >
                <FileDown size={14} /> Export selected
              </ActionButton>
            )}
          />

          {editingAdmission ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {/* The two numbers staff actually quote — this stay, then the patient
                      for life. The internal id is not shown: it identifies nothing a
                      clinician can act on, and both of these are searchable. */}
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                    {admissionReference(editingAdmission)}
                    {editingAdmission.uhid ? ` · ${editingAdmission.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{editingAdmission.patientName}</h3>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingAdmission(null)}>
                  Close
                </ActionButton>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
                <select
                  aria-label="Bed"
                  value={editingAdmission.bedId}
                  onChange={(event) => void updateAdmission(editingAdmission.id, { bedId: event.target.value })}
                  className={fieldClass}
                  disabled={editingAdmission.status !== "Admitted"}
                >
                  <option value={editingAdmission.bedId}>{editingAdmission.bedLabel}</option>
                  {beds
                    .filter((bed) => bed.status === "Vacant")
                    .map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        {bed.label} | {bed.ward}
                      </option>
                    ))}
                </select>
                <input
                  defaultValue={editingAdmission.depositAmount}
                  onBlur={(event) => void updateAdmission(editingAdmission.id, { depositAmount: Number(event.target.value) })}
                  className={fieldClass}
                  type="number"
                  min="0"
                  placeholder="Deposit"
                />
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
                <input
                  defaultValue={editingAdmission.assignedNurse}
                  onBlur={(event) => void updateAdmission(editingAdmission.id, { assignedNurse: event.target.value })}
                  className={fieldClass}
                  placeholder="Assigned nurse"
                />
                <input
                  defaultValue={editingAdmission.expectedDischargeDate}
                  onBlur={(event) => void updateAdmission(editingAdmission.id, { expectedDischargeDate: event.target.value })}
                  className={fieldClass}
                  type="datetime-local"
                />
              </div>
              <textarea
                defaultValue={editingAdmission.carePlan}
                onBlur={(event) => void updateAdmission(editingAdmission.id, { carePlan: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Care plan"
              />
              <textarea
                defaultValue={editingAdmission.nursingNotes}
                onBlur={(event) => void updateAdmission(editingAdmission.id, { nursingNotes: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Nursing notes"
              />
              <textarea
                defaultValue={editingAdmission.dietAdvice}
                onBlur={(event) => void updateAdmission(editingAdmission.id, { dietAdvice: event.target.value })}
                className={`${fieldClass} mt-3 min-h-16 py-3`}
                placeholder="Diet advice"
              />
              <AdminMedicationRecord key={editingAdmission.id} admissionId={editingAdmission.id} />
              <textarea
                key={editingAdmission.dischargeSummary}
                defaultValue={editingAdmission.dischargeSummary}
                onBlur={(event) => void updateAdmission(editingAdmission.id, { dischargeSummary: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Discharge summary"
              />
              <AiDischargeSummaryDraft
                admissionId={editingAdmission.id}
                onUseDraft={(draft) => void updateAdmission(editingAdmission.id, { dischargeSummary: draft })}
              />
              <PdfPreviewButton
                href={`/api/pdf/discharge-summary?admissionId=${encodeURIComponent(editingAdmission.id)}`}
                title={`Discharge Summary — ${editingAdmission.patientName}`}
                label="Discharge Summary PDF"
                variant="secondary"
                size="md"
                className="mt-3"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
