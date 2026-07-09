"use client";

import { CalendarClock, ClipboardCheck, Download, Edit3 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { OpdVisit } from "@/lib/opd-types";
import type { ProcedureChecklist, ProcedureSchedule, ProcedureScheduleStatus } from "@/lib/procedure-types";
import { procedureRooms, procedureScheduleStatuses } from "@/lib/procedure-types";
import type { ProcedureScheduleSortField } from "@/lib/procedure-schedule-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const procedureExportHeaders = ["Patient", "Phone", "Procedure", "Scheduled Date", "Scheduled Time", "Room", "Doctor", "Priority", "Status"];

function procedureExportRow(schedule: ProcedureSchedule) {
  return [
    schedule.patientName,
    schedule.phone,
    schedule.procedureTitle,
    schedule.scheduledDate,
    schedule.scheduledTime,
    schedule.room,
    schedule.doctor,
    schedule.priority,
    schedule.status
  ];
}

type ProcedureOption = {
  slug: string;
  title: string;
  summary: string;
};

type ProcedureResponse = {
  ok: boolean;
  schedules?: ProcedureSchedule[];
  schedule?: ProcedureSchedule;
  visits?: OpdVisit[];
  procedures?: ProcedureOption[];
  pageCount?: number;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

// "consent" is handled separately below (Track 0.7) — a legal/regulatory
// requirement audited server-side, not a routine housekeeping checkbox like
// these 7.
const checklistLabels: Array<{ key: keyof ProcedureChecklist; label: string }> = [
  { key: "fastingConfirmed", label: "Fasting" },
  { key: "vitalsChecked", label: "Vitals" },
  { key: "allergiesReviewed", label: "Allergies" },
  { key: "reportsReviewed", label: "Reports" },
  { key: "attendantAvailable", label: "Attendant" },
  { key: "equipmentReady", label: "Equipment" },
  { key: "recoveryInstructions", label: "Recovery advice" }
];

function checklistProgress(schedule: ProcedureSchedule) {
  const values = Object.values(schedule.checklist);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function AdminProcedures() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [schedules, setSchedules] = useState<ProcedureSchedule[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<ProcedureOption[]>([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcedureScheduleStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSchedule, setEditingSchedule] = useState<ProcedureSchedule | null>(null);

  const sortField = (sorting[0]?.id as ProcedureScheduleSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadProcedures() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/procedures/schedule?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as ProcedureResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load procedure schedules.");
      setLoading(false);
      return;
    }
    setSchedules(data.schedules ?? []);
    setVisits(data.visits ?? []);
    setProcedureOptions(data.procedures ?? []);
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
    setEditingSchedule((current) => {
      if (!current) return current;
      return data.schedules?.find((schedule) => schedule.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProcedures(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: ProcedureScheduleStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { label: "Scheduled", value: schedules.length },
      { label: "Today", value: schedules.filter((schedule) => schedule.scheduledDate === today).length },
      { label: "In Procedure", value: schedules.filter((schedule) => schedule.status === "In Procedure").length },
      { label: "Completed", value: schedules.filter((schedule) => schedule.status === "Completed").length }
    ];
  }, [schedules]);

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/procedures/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
    if (!response.ok || !data.ok || !data.schedule) {
      notify.error(data.error || "Unable to create procedure schedule.");
      return;
    }
    event.currentTarget.reset();
    void loadProcedures();
  }

  async function updateSchedule(
    id: string,
    updates: Partial<Pick<ProcedureSchedule, "status" | "findings" | "complications" | "notes" | "scheduledDate" | "scheduledTime" | "room" | "doctor" | "anesthesiaPlan">> & {
      checklist?: Partial<ProcedureChecklist>;
    }
  ) {
    const response = await fetch("/api/procedures/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
    if (!response.ok || !data.ok || !data.schedule) {
      notify.error(data.error || "Unable to update procedure schedule.");
      return;
    }
    const updated = data.schedule as ProcedureSchedule;
    setSchedules((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingSchedule((current) => (current?.id === id ? updated : current));
  }

  const columns = useMemo<ColumnDef<ProcedureSchedule, unknown>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 170,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.patientName)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.patientName}
            </button>
            {row.original.uhid ? <span className="mt-0.5 block text-[10px] text-muted">{row.original.uhid}</span> : null}
          </div>
        )
      },
      { accessorKey: "procedureTitle", header: "Procedure", size: 190 },
      {
        accessorKey: "scheduledDate",
        header: "Scheduled",
        size: 140,
        cell: ({ row }) => (
          <span>
            {row.original.scheduledDate} <span className="text-muted">{row.original.scheduledTime}</span>
          </span>
        )
      },
      { accessorKey: "room", header: "Room", size: 140 },
      { id: "doctor", header: "Doctor", size: 150, enableSorting: false, cell: ({ row }) => row.original.doctor },
      {
        id: "priority",
        header: "Priority",
        size: 90,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.priority === "Urgent" ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Urgent</span>
          ) : (
            <span className="text-muted">Routine</span>
          )
      },
      {
        id: "checklist",
        header: "Checklist",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => <span className="font-bold text-ink">{checklistProgress(row.original)}%</span>
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Procedure status"
            value={row.original.status}
            onChange={(event) => void updateSchedule(row.original.id, { status: event.target.value as ProcedureScheduleStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {procedureScheduleStatuses.map((status) => (
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
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={() => setEditingSchedule((current) => (current?.id === row.original.id ? null : row.original))}
            aria-expanded={editingSchedule?.id === row.original.id}
          >
            <Edit3 size={13} /> Manage
          </ActionButton>
        )
      }
    ],
    [openDrawer, editingSchedule]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Procedure Scheduling</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Endoscopy, ERCP and therapeutic checklist</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Schedule procedures from OPD visits, manage prep and safety checks, then record findings and recovery instructions.
          </p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.84fr_1.16fr]">
        <form onSubmit={createSchedule} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarClock size={19} /> Schedule procedure
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
            <select aria-label="Procedure" name="procedureSlug" className={fieldClass} required>
              <option value="">Select procedure</option>
              {procedureOptions.map((procedure) => (
                <option key={procedure.slug} value={procedure.slug}>
                  {procedure.title}
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Scheduled date" name="scheduledDate" className={fieldClass} type="date" required />
              <input aria-label="Scheduled time" name="scheduledTime" className={fieldClass} type="time" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select aria-label="Room" name="room" className={fieldClass} defaultValue="Endoscopy Room">
                {procedureRooms.map((room) => (
                  <option key={room}>{room}</option>
                ))}
              </select>
              <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Routine">
                <option>Routine</option>
                <option>Urgent</option>
              </select>
            </div>
            <input name="doctor" className={fieldClass} placeholder="Doctor" defaultValue="Dr. Deepak Kumar Sharma" />
            <input name="anesthesiaPlan" className={fieldClass} placeholder="Sedation / anesthesia plan" />
            <textarea name="notes" className={`${fieldClass} min-h-24 py-3`} placeholder="Preparation notes, consent remarks, special risks" />
            <ActionButton type="submit" variant="primary">
              <ClipboardCheck size={17} /> Save Procedure Schedule
            </ActionButton>
          </div>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={schedules}
            getRowId={(schedule) => schedule.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search procedure, UHID, patient, room"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadProcedures()}
            emptyState={{
              icon: CalendarClock,
              title: globalFilter || statusFilter ? "No procedures match your filters" : "No procedures scheduled",
              description:
                globalFilter || statusFilter
                  ? "Try a different search term, or clear the status filter."
                  : "Endoscopies, colonoscopies and other procedures you schedule appear here. Add one with the form.",
              action: globalFilter || statusFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                    }
                  : undefined
            }}
            export={{ headers: procedureExportHeaders, row: procedureExportRow, filename: "procedures.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as ProcedureScheduleStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {procedureScheduleStatuses.map((status) => (
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
                  downloadCsv(procedureExportHeaders, selected.map(procedureExportRow), "selected-procedures.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />

          {editingSchedule ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                    {editingSchedule.id} | {editingSchedule.token}
                    {editingSchedule.uhid ? ` | ${editingSchedule.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{editingSchedule.procedureTitle}</h3>
                  <p className="mt-1 text-sm text-muted">{editingSchedule.patientName}</p>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingSchedule(null)}>
                  Close
                </ActionButton>
              </div>

              <div className={`mt-4 rounded border-2 p-3 ${editingSchedule.checklist.consent ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950" : "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"}`} role={editingSchedule.checklist.consent ? undefined : "alert"}>
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={editingSchedule.checklist.consent}
                    onChange={(event) => void updateSchedule(editingSchedule.id, { checklist: { consent: event.target.checked } })}
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    <span className={`block text-sm font-black uppercase tracking-[0.1em] ${editingSchedule.checklist.consent ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                      Patient consent {editingSchedule.checklist.consent ? "recorded" : "required"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-relaxed text-ink">
                      {editingSchedule.checklist.consent
                        ? "Recorded and audited. Status can now move past Planned."
                        : "Must be recorded before this procedure can move past Planned — status changes are rejected server-side until then."}
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-4 rounded border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900 dark:bg-cyan-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-cyan-900 dark:text-cyan-300">Checklist progress</p>
                  <p className="text-sm font-black text-brand">{checklistProgress(editingSchedule)}%</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {checklistLabels.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 rounded border border-cyan-100 bg-surface px-3 py-2 text-xs font-bold text-ink dark:border-cyan-900">
                      <input
                        type="checkbox"
                        checked={editingSchedule.checklist[item.key]}
                        onChange={(event) => void updateSchedule(editingSchedule.id, { checklist: { [item.key]: event.target.checked } })}
                        className="h-4 w-4 accent-cyan-600"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  defaultValue={editingSchedule.doctor}
                  onBlur={(event) => void updateSchedule(editingSchedule.id, { doctor: event.target.value })}
                  className={fieldClass}
                  placeholder="Doctor"
                />
                <input
                  defaultValue={editingSchedule.anesthesiaPlan}
                  onBlur={(event) => void updateSchedule(editingSchedule.id, { anesthesiaPlan: event.target.value })}
                  className={fieldClass}
                  placeholder="Sedation / anesthesia"
                />
              </div>
              <textarea
                defaultValue={editingSchedule.findings}
                onBlur={(event) => void updateSchedule(editingSchedule.id, { findings: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Procedure findings"
              />
              <textarea
                defaultValue={editingSchedule.complications}
                onBlur={(event) => void updateSchedule(editingSchedule.id, { complications: event.target.value })}
                className={`${fieldClass} mt-3 min-h-16 py-3`}
                placeholder="Complications / none"
              />
              <textarea
                defaultValue={editingSchedule.notes}
                onBlur={(event) => void updateSchedule(editingSchedule.id, { notes: event.target.value })}
                className={`${fieldClass} mt-3 min-h-16 py-3`}
                placeholder="Preparation / recovery notes"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
