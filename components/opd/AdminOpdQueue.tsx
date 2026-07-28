"use client";

import { Banknote, ClipboardList, Download, Edit3, HeartPulse, Stethoscope, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { roleHasPermission } from "@/lib/access/matrix";
import { hospitalRoleToAccessRole } from "@/lib/hospital-os-data";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";
import { opdVisitStatuses } from "@/lib/opd-types";
import type { OpdSortField } from "@/lib/opd-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

type VitalFieldKey = "vitalsHeight" | "vitalsWeight" | "vitalsBp" | "vitalsPulse" | "vitalsRespiratoryRate" | "vitalsTemperature" | "vitalsSpo2" | "vitalsBloodSugar";

const vitalsFields: { key: VitalFieldKey; label: string; placeholder: string }[] = [
  { key: "vitalsWeight", label: "Weight", placeholder: "e.g. 62 kg" },
  { key: "vitalsBp", label: "Blood Pressure", placeholder: "e.g. 120/80" },
  { key: "vitalsPulse", label: "Pulse", placeholder: "e.g. 78/min" },
  { key: "vitalsSpo2", label: "SpO2", placeholder: "e.g. 98%" }
];

const opdExportHeaders = ["Token", "Patient", "Phone", "Service", "Status", "Billing Status", "Created"];

function opdExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.status, visit.billingStatus, visit.createdAt];
}

type OpdListResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  visit?: OpdVisit;
  pageCount?: number;
  stats?: { waiting: number; inConsultation: number; completed: number; paid: number };
  error?: string;
};

const billingStatuses: OpdVisit["billingStatus"][] = ["Not Started", "Estimate Shared", "Paid"];
const paymentMethods: NonNullable<OpdVisit["paymentMethod"]>[] = ["Cash", "UPI", "Card", "Insurance", "Other"];
const pageSize = 25;

export function AdminOpdQueue() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const role = useHospitalOsStore((state) => state.role);
  // UI convenience only — DELETE /api/opd re-checks appointments:delete
  // server-side (reserved for admin/super-admin) on every request, same as
  // every other mutation in the app.
  const canDelete = roleHasPermission(hospitalRoleToAccessRole[role], "appointments", "delete");

  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ waiting: 0, inConsultation: 0, completed: 0, paid: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OpdVisitStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingVisit, setEditingVisit] = useState<OpdVisit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ items: OpdVisit[]; clearSelection?: () => void } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortField = (sorting[0]?.id as OpdSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadVisits() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/opd?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as OpdListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load OPD queue.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
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
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: OpdVisitStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  async function updateVisit(
    id: string,
    updates: Partial<
      Pick<
        OpdVisit,
        | "status"
        | "billingStatus"
        | "estimatedAmount"
        | "paymentMethod"
        | "notes"
        | "vitalsHeight"
        | "vitalsWeight"
        | "vitalsBp"
        | "vitalsPulse"
        | "vitalsRespiratoryRate"
        | "vitalsTemperature"
        | "vitalsSpo2"
        | "vitalsBloodSugar"
      >
    >
  ) {
    let response: Response;
    try {
      response = await fetch("/api/opd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateVisit(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as OpdListResponse;
    if (!response.ok || !data.ok || !data.visit) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed update must not blank the list.
      notify.error(data.error || "Unable to update OPD visit.");
      return;
    }
    const updated = data.visit as OpdVisit;
    setVisits((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingVisit((current) => (current?.id === id ? updated : current));
    notify.success("Visit updated");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    let deleted = 0;
    let lastError = "";
    for (const visit of deleteTarget.items) {
      let response: Response;
      try {
        response = await fetch("/api/opd", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visit.id })
        });
      } catch {
        lastError = "Unable to reach the server. Check your connection and retry.";
        continue;
      }
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        deleted += 1;
      } else {
        lastError = data.error || "Unable to delete this visit.";
      }
    }
    setIsDeleting(false);

    if (deleted > 0) {
      notify.success(deleted === 1 ? "Visit deleted" : `${deleted} visits deleted`);
      void loadVisits();
    }
    if (deleted < deleteTarget.items.length) {
      notify.error(lastError || "Some visits could not be deleted.");
    }
    setDeleteTarget(null);
  }

  const statTiles = useMemo(
    () => [
      { label: "Waiting", value: stats.waiting },
      { label: "In Consultation", value: stats.inConsultation },
      { label: "Completed", value: stats.completed },
      { label: "Paid", value: stats.paid }
    ],
    [stats]
  );

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
      { accessorKey: "service", header: "Service", size: 160 },
      {
        id: "priority",
        header: "Priority",
        size: 100,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.priority?.toLowerCase().includes("urgent") ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{row.original.priority}</span>
          ) : (
            <span className="text-muted">{row.original.priority || "Routine"}</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Visit status"
            value={row.original.status}
            onChange={(event) => void updateVisit(row.original.id, { status: event.target.value as OpdVisitStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {opdVisitStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        accessorKey: "billingStatus",
        header: "Billing",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Billing status"
            value={row.original.billingStatus}
            onChange={(event) => void updateVisit(row.original.id, { billingStatus: event.target.value as OpdVisit["billingStatus"] })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {billingStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        accessorKey: "estimatedAmount",
        header: "Amount",
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (row.original.estimatedAmount ? `Rs. ${row.original.estimatedAmount}` : "—")
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const eligibleForDelete =
            row.original.status === "Cancelled" &&
            row.original.billingStatus === "Not Started" &&
            !row.original.paidAt &&
            !row.original.receiptId &&
            !row.original.refundStatus;
          return (
            <div className="flex items-center gap-1">
              <ActionButton variant="secondary" size="sm" onClick={() => setEditingVisit((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={editingVisit?.id === row.original.id}>
                <Edit3 size={13} /> Notes
              </ActionButton>
              {canDelete ? (
                <ActionButton
                  variant="danger"
                  size="sm"
                  className="h-8 w-8 min-h-8 px-0"
                  disabled={!eligibleForDelete}
                  title={eligibleForDelete ? "Delete permanently" : "Only a Cancelled visit with no billing/refund history can be deleted"}
                  onClick={() => setDeleteTarget({ items: [row.original] })}
                >
                  <Trash2 size={13} />
                </ActionButton>
              ) : null}
            </div>
          );
        }
      }
    ],
    // updateVisit only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, editingVisit, canDelete]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">OPD Queue</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Today&apos;s patient tokens</h2>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line p-4 md:grid-cols-4">
        {statTiles.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
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
            icon: ClipboardList,
            title: globalFilter || statusFilter ? "No tokens match your filters" : "No OPD tokens yet",
            description:
              globalFilter || statusFilter
                ? "Try a different search term, or clear the status filter."
                : "Create a token from an appointment request in the Appointments module.",
            action: globalFilter || statusFilter ? "Clear filters" : undefined,
            onAction:
              globalFilter || statusFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                  }
                : undefined
          }}
          export={{ headers: opdExportHeaders, row: opdExportRow, filename: "opd-queue.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => updateStatusFilter(event.target.value as OpdVisitStatus | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {opdVisitStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => {
            const allEligible = selected.every(
              (visit) => visit.status === "Cancelled" && visit.billingStatus === "Not Started" && !visit.paidAt && !visit.receiptId && !visit.refundStatus
            );
            return (
              <>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    downloadCsv(opdExportHeaders, selected.map(opdExportRow), "selected-opd-visits.csv");
                    clear();
                  }}
                >
                  <Download size={14} /> Export selected
                </ActionButton>
                {canDelete ? (
                  <ActionButton
                    variant="danger"
                    size="sm"
                    disabled={!allEligible}
                    title={allEligible ? "Delete selected permanently" : "Only Cancelled visits with no billing/refund history can be deleted"}
                    onClick={() => setDeleteTarget({ items: selected, clearSelection: clear })}
                  >
                    <Trash2 size={14} /> Delete selected
                  </ActionButton>
                ) : null}
              </>
            );
          }}
        />

        {editingVisit ? (
          <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                  {editingVisit.token}
                  {editingVisit.uhid ? ` · ${editingVisit.uhid}` : ""}
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink">{editingVisit.patientName}</h3>
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => setEditingVisit(null)}>
                Close
              </ActionButton>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <select
                aria-label="Payment method"
                value={editingVisit.paymentMethod || "Cash"}
                onChange={(event) => void updateVisit(editingVisit.id, { paymentMethod: event.target.value as OpdVisit["paymentMethod"] })}
                className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                {paymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <label className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  defaultValue={editingVisit.estimatedAmount}
                  onBlur={(event) => void updateVisit(editingVisit.id, { estimatedAmount: event.target.value })}
                  className="min-h-9 w-full rounded border border-line bg-surface pl-9 pr-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder="Estimate"
                />
              </label>
            </div>
            <div className="mt-3">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <HeartPulse size={16} /> Vitals — capture before the doctor sees the patient
              </span>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-4">
                {vitalsFields.map((field) => (
                  <label key={field.key}>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">{field.label}</span>
                    <input
                      defaultValue={editingVisit[field.key]}
                      onBlur={(event) => void updateVisit(editingVisit.id, { [field.key]: event.target.value } as Partial<Pick<OpdVisit, VitalFieldKey>>)}
                      placeholder={field.placeholder}
                      className="min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    />
                  </label>
                ))}
              </div>
            </div>
            <label className="mt-3 block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <Stethoscope size={16} /> OPD Notes
              </span>
              <textarea
                defaultValue={editingVisit.notes}
                onBlur={(event) => void updateVisit(editingVisit.id, { notes: event.target.value })}
                className="min-h-20 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                placeholder="Consultation, billing or reception notes"
              />
            </label>
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
        ) : null}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.items.length === 1 ? "this visit" : `${deleteTarget.items.length} visits`}?</DialogTitle>
                <DialogDescription>
                  {deleteTarget.items.length === 1
                    ? `This permanently removes ${deleteTarget.items[0].patientName}'s cancelled OPD visit (token ${deleteTarget.items[0].token}). This cannot be undone.`
                    : "This permanently removes the selected cancelled OPD visits. This cannot be undone."}
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
