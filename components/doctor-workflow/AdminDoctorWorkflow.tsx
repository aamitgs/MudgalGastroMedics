"use client";

import { Copy, Download, Edit3, FileText, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { OpdVisit } from "@/lib/opd-types";
import type { OpdSortField } from "@/lib/opd-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const doctorWorkflowExportHeaders = ["Token", "Patient", "Phone", "Service", "Status", "Clinical Note", "Prescription", "Follow-up Date"];

function doctorWorkflowExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.status, visit.clinicalNote ?? "", visit.prescription ?? "", visit.followUpDate ?? ""];
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  visit?: OpdVisit;
  pageCount?: number;
  error?: string;
};

const textareaClass = "min-h-24 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const inputClass = "min-h-10 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

export function AdminDoctorWorkflow() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [visits, setVisits] = useState<OpdVisit[]>([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingVisit, setEditingVisit] = useState<OpdVisit | null>(null);

  const sortField = (sorting[0]?.id as OpdSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadVisits() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir, excludeStatus: "Cancelled" });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());

    const response = await fetch(`/api/opd?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as OpdResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load doctor workflow.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
    setEditingVisit((current) => {
      if (!current) return current;
      return data.visits?.find((visit) => visit.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadVisits(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  async function updateVisit(id: string, updates: Partial<Pick<OpdVisit, "clinicalNote" | "prescription" | "advice" | "followUpDate">>) {
    const response = await fetch("/api/opd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok || !data.visit) {
      notify.error(data.error || "Unable to save doctor workflow.");
      return;
    }
    const updated = data.visit as OpdVisit;
    setVisits((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingVisit((current) => (current?.id === id ? updated : current));
  }

  async function copySummary(visit: OpdVisit) {
    const summary = [
      `Patient: ${visit.patientName}`,
      visit.uhid ? `UHID: ${visit.uhid}` : "",
      `Service: ${visit.service}`,
      `Token: ${visit.token}`,
      visit.clinicalNote ? `Clinical note: ${visit.clinicalNote}` : "",
      visit.prescription ? `Prescription: ${visit.prescription}` : "",
      visit.advice ? `Advice: ${visit.advice}` : "",
      visit.followUpDate ? `Follow-up: ${visit.followUpDate}` : ""
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(summary);
    notify.success("Patient summary copied");
  }

  const columns = useMemo<ColumnDef<OpdVisit, unknown>[]>(
    () => [
      {
        accessorKey: "token",
        header: "Token",
        size: 110,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-bold text-ink">{row.original.token}</span>
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
      { accessorKey: "service", header: "Service", size: 170 },
      { accessorKey: "status", header: "Status", size: 130 },
      {
        id: "clinicalNote",
        header: "Clinical Note",
        size: 220,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.clinicalNote ? (
            <span className="line-clamp-1 text-muted" title={row.original.clinicalNote}>
              {row.original.clinicalNote}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )
      },
      {
        id: "followUpDate",
        header: "Follow-up",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => row.original.followUpDate || <span className="text-muted">—</span>
      },
      {
        id: "actions",
        header: "Actions",
        size: 190,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="secondary" size="sm" onClick={() => setEditingVisit((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={editingVisit?.id === row.original.id}>
              <Edit3 size={13} /> Notes
            </ActionButton>
            <ActionButton variant="secondary" size="sm" onClick={() => void copySummary(row.original)}>
              <Copy size={13} /> Copy
            </ActionButton>
          </div>
        )
      }
    ],
    [openDrawer, editingVisit]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Doctor Workflow</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Clinical notes and follow-up</h2>
        </div>
      </div>

      <div className="p-4">
        <DataTable
          columns={columns}
          data={visits}
          getRowId={(visit) => visit.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search token, patient, phone, service"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadVisits()}
          emptyState={{
            icon: Stethoscope,
            title: globalFilter ? "No visits match your search" : "No OPD visits available",
            description: globalFilter ? "Try a different search term." : "Create OPD tokens from appointment requests to start clinical workflow.",
            action: globalFilter ? "Clear search" : undefined,
            onAction: globalFilter ? () => setGlobalFilter("") : undefined
          }}
          export={{ headers: doctorWorkflowExportHeaders, row: doctorWorkflowExportRow, filename: "doctor-workflow.csv" }}
          stickyFirstColumn
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(doctorWorkflowExportHeaders, selected.map(doctorWorkflowExportRow), "selected-doctor-workflow.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />

        {editingVisit ? (
          <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                  {editingVisit.token} | {editingVisit.status}
                </p>
                <h3 className="mt-1 text-xl font-bold text-ink">{editingVisit.patientName}</h3>
                <p className="mt-1 text-sm text-muted">
                  {editingVisit.service} | {editingVisit.phone}
                  {editingVisit.uhid ? ` | ${editingVisit.uhid}` : ""}
                </p>
                {editingVisit.symptoms.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editingVisit.symptoms.map((symptom) => (
                      <span key={symptom} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-teal-dark">
                        {symptom}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => setEditingVisit(null)}>
                Close
              </ActionButton>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label>
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  <FileText size={16} /> Clinical Note
                </span>
                <textarea
                  defaultValue={editingVisit.clinicalNote}
                  onBlur={(event) => void updateVisit(editingVisit.id, { clinicalNote: event.target.value })}
                  className={textareaClass}
                  placeholder="Doctor review notes, exam findings, procedure note, or clinical summary"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-bold text-ink">Prescription</span>
                <textarea
                  defaultValue={editingVisit.prescription}
                  onBlur={(event) => void updateVisit(editingVisit.id, { prescription: event.target.value })}
                  className={textareaClass}
                  placeholder="Medicine name, dose, duration, instructions"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-bold text-ink">Advice / Instructions</span>
                <textarea
                  defaultValue={editingVisit.advice}
                  onBlur={(event) => void updateVisit(editingVisit.id, { advice: event.target.value })}
                  className={textareaClass}
                  placeholder="Diet advice, procedure preparation, warning signs, report instructions"
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-bold text-ink">Follow-up Date</span>
                <input
                  type="date"
                  defaultValue={editingVisit.followUpDate}
                  onBlur={(event) => void updateVisit(editingVisit.id, { followUpDate: event.target.value })}
                  className={inputClass}
                />
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  Doctor workflow notes are internal platform records. Final medical instructions should be reviewed by the clinician before sharing with patients.
                </p>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
