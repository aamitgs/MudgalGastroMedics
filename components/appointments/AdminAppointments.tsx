"use client";

import { AlertTriangle, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Copy, Download, MessageCircle, Phone, UserRound } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { createAppointmentPlanningNote } from "@/lib/ai-planning";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { appointmentStatuses } from "@/lib/appointment-types";
import type { AppointmentSortField } from "@/lib/appointment-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const appointmentExportHeaders = ["Name", "Phone", "Service", "Date", "Time Slot", "Priority", "Status", "Created"];

function appointmentExportRow(appointment: AppointmentRecord) {
  return [
    appointment.name,
    appointment.phone,
    appointment.service,
    appointment.date ?? "",
    appointment.timeSlot ?? "",
    appointment.priority ?? "",
    appointment.status,
    appointment.createdAt
  ];
}

type AppointmentListResponse = {
  ok: boolean;
  appointments?: AppointmentRecord[];
  pageCount?: number;
  stats?: { total: number; new: number; confirmed: number; urgent: number };
  error?: string;
};

type MutationResponse = { ok: boolean; appointment?: AppointmentRecord; error?: string };

const pageSize = 25;

const statusTone: Record<AppointmentStatus, string> = {
  New: "border-cyan-200 bg-cyan-50 text-brand dark:border-cyan-900 dark:bg-cyan-950",
  Contacted: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Completed: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
  Cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
};

export function AdminAppointments() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, new: 0, confirmed: 0, urgent: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planAppointment, setPlanAppointment] = useState<AppointmentRecord | null>(null);

  const sortField = (sorting[0]?.id as AppointmentSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadAppointments() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/appointment?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as AppointmentListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load appointments.");
      setLoading(false);
      return;
    }
    setAppointments(data.appointments ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAppointments(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: AppointmentStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    const response = await fetch("/api/appointment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as MutationResponse;
    if (!response.ok || !data.ok || !data.appointment) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed update must not blank the list.
      notify.error(data.error || "Unable to update appointment.");
      return;
    }
    setAppointments((items) => items.map((item) => (item.id === id ? (data.appointment as AppointmentRecord) : item)));
    notify.success("Appointment updated");
  }

  async function createOpdToken(appointmentId: string) {
    const response = await fetch("/api/opd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to create OPD token.");
      return;
    }
    notify.success("OPD token created", { description: "Refresh the OPD Queue section below." });
  }

  const statTiles = useMemo(
    () => [
      { label: "Total Requests", value: stats.total, icon: CalendarDays },
      { label: "New", value: stats.new, icon: Clock3 },
      { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2 },
      { label: "Urgent Symptoms", value: stats.urgent, icon: UserRound }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<AppointmentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 190,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.name)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.name}
            </button>
            {row.original.uhid ? <span className="ml-2 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase text-brand dark:border-cyan-900 dark:bg-cyan-950">{row.original.uhid}</span> : null}
          </div>
        )
      },
      { accessorKey: "phone", header: "Phone", size: 130 },
      { accessorKey: "service", header: "Service", size: 160 },
      {
        id: "when",
        header: "Date / Time",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{row.original.date || "Flexible"} · {row.original.timeSlot || "Flexible"}</span>
      },
      {
        id: "priority",
        header: "Priority",
        size: 130,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.priority === "Urgent symptoms" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle size={12} /> Urgent
            </span>
          ) : (
            <span className="text-muted">{row.original.priority || "Routine"}</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <select
            aria-label="Appointment status"
            value={row.original.status}
            onChange={(event) => void updateStatus(row.original.id, event.target.value as AppointmentStatus)}
            className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${statusTone[row.original.status]}`}
          >
            {appointmentStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "actions",
        header: "Actions",
        size: 170,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <a href={`tel:${row.original.phone}`} title="Call" className="grid h-8 w-8 place-items-center rounded border border-line text-ink hover:border-brand hover:text-brand">
              <Phone size={14} />
            </a>
            <a
              href={`https://wa.me/${row.original.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              className="grid h-8 w-8 place-items-center rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              <MessageCircle size={14} />
            </a>
            <ActionButton
              variant="secondary"
              size="sm"
              title="AI Plan"
              aria-expanded={planAppointment?.id === row.original.id}
              onClick={() => setPlanAppointment((current) => (current?.id === row.original.id ? null : row.original))}
              className="h-8 w-8 min-h-8 border-cyan-200 bg-cyan-50 px-0 text-brand hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950"
            >
              <BrainCircuit size={14} />
            </ActionButton>
            <ActionButton variant="success" size="sm" title="Create OPD Token" onClick={() => void createOpdToken(row.original.id)} className="h-8 w-8 min-h-8 px-0">
              <CalendarDays size={14} />
            </ActionButton>
          </div>
        )
      }
    ],
    [openDrawer, planAppointment]
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        {statTiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line/80 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="grid h-10 w-10 place-items-center rounded bg-soft text-brand">
                <Icon size={19} />
              </span>
              <span className="text-xl font-bold text-ink">{value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded border border-line/80 bg-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Reception Queue</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Appointment Requests</h2>
          </div>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={appointments}
            getRowId={(appointment) => appointment.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search patient, phone, service"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadAppointments()}
            emptyState={{
              icon: CalendarDays,
              title: globalFilter || statusFilter ? "No requests match your filters" : "No appointment requests yet",
              description:
                globalFilter || statusFilter
                  ? "Try a different patient name, phone number or service."
                  : "Requests from the website booking form land here in real time — refresh to pick up the latest.",
              action: globalFilter || statusFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                    }
                  : undefined
            }}
            export={{ headers: appointmentExportHeaders, row: appointmentExportRow, filename: "appointments.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as AppointmentStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {appointmentStatuses.map((status) => (
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
                  downloadCsv(appointmentExportHeaders, selected.map(appointmentExportRow), "selected-appointments.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />

          {planAppointment ? <PlanningNote appointment={planAppointment} onClose={() => setPlanAppointment(null)} /> : null}
        </div>
      </div>
    </div>
  );
}

function PlanningNote({ appointment, onClose }: { appointment: AppointmentRecord; onClose: () => void }) {
  const note = createAppointmentPlanningNote(appointment);
  const scriptText = note.receptionScript;

  async function copyScript() {
    await navigator.clipboard.writeText(scriptText);
  }

  return (
    <div className="mt-4 overflow-hidden rounded border border-cyan-200 bg-surface shadow-sm dark:border-cyan-900">
      <div className="flex flex-col justify-between gap-4 border-b border-cyan-100 bg-[linear-gradient(135deg,var(--site-soft),var(--site-surface))] p-4 dark:border-cyan-900 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">AI Planning Note · {appointment.name}</p>
          <h4 className="mt-1 text-2xl font-bold text-ink">{note.route}</h4>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{note.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] ${
              note.urgency === "Urgent Reception Call"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                : note.urgency === "Priority Review"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {note.urgency === "Urgent Reception Call" ? <AlertTriangle size={15} /> : <BrainCircuit size={15} />}
            {note.urgency}
          </span>
          <ActionButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </ActionButton>
        </div>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Review flags</p>
          <div className="grid gap-2">
            {note.flags.map((flag) => (
              <span key={flag} className="rounded border border-line bg-soft/60 px-3 py-2 text-sm font-semibold text-teal-dark">
                {flag}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Preparation checklist</p>
          <ol className="grid gap-2">
            {note.preparation.map((item, index) => (
              <li key={item} className="flex gap-3 rounded border border-line bg-surface px-3 py-2 text-sm text-muted">
                <span className="font-bold text-brand">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Reception script</p>
            <ActionButton variant="secondary" size="sm" onClick={() => void copyScript()} className="min-h-7 gap-1 px-2 text-xs">
              <Copy size={13} /> Copy
            </ActionButton>
          </div>
          <p className="rounded border border-line bg-surface p-3 text-sm leading-relaxed text-muted">{note.receptionScript}</p>
          <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {note.safetyNote}
          </p>
        </div>
      </div>
    </div>
  );
}
