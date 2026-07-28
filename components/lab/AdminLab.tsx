"use client";

import { AlertTriangle, Download, Edit3, FlaskConical, TestTube2, Trash2 } from "lucide-react";
import { roleHasPermission } from "@/lib/access/matrix";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/design-system/FormField";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { hospitalRoleToAccessRole } from "@/lib/hospital-os-data";
import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";
import { commonLabTests, labOrderPriorities, labOrderStatuses, labPaymentStatuses } from "@/lib/lab-types";
import type { LabSortField } from "@/lib/lab-query";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { labOrderCreateSchema, type LabOrderCreateInput } from "@/lib/validation/lab";

const labExportHeaders = ["Token", "Patient", "Phone", "Tests", "Priority", "Status", "Payment Status", "Created"];

function labExportRow(order: LabOrder) {
  return [order.token, order.patientName, order.phone, order.tests.join("; "), order.priority, order.status, order.paymentStatus, order.createdAt];
}

type LabListResponse = {
  ok: boolean;
  orders?: LabOrder[];
  order?: LabOrder;
  visits?: OpdVisit[];
  pageCount?: number;
  stats?: { total: number; pendingSamples: number; collectedSamples: number; processing: number; resultReady: number; criticalUnacked: number; paidAmount: number };
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function formatAmount(value: number | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

const pageSize = 25;

export function AdminLab() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const role = useHospitalOsStore((state) => state.role);
  // UI convenience only — DELETE /api/lab re-checks lab-orders:delete
  // server-side (admin/super-admin only).
  const canDelete = roleHasPermission(hospitalRoleToAccessRole[role], "lab-orders", "delete");

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTests, setCustomTests] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, pendingSamples: 0, collectedSamples: 0, processing: 0, resultReady: 0, criticalUnacked: 0, paidAmount: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | "">("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingOrder, setEditingOrder] = useState<LabOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ items: LabOrder[]; clearSelection?: () => void } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortField = (sorting[0]?.id as LabSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const defaultLabOrderValues: LabOrderCreateInput = {
    visitId: "",
    priority: "Routine",
    sampleType: "",
    amount: undefined,
    paymentStatus: "Unpaid",
    notes: ""
  };

  const {
    register: registerLabOrder,
    getValues: getOrderValues,
    setValue: setOrderValue,
    formState: { errors: labOrderErrors, isSubmitting: isLabOrderSubmitting },
    reset: resetLabOrderForm,
    submit: submitLabOrder
  } = useAdvancedForm<LabOrderCreateInput>({
    schema: labOrderCreateSchema,
    defaultValues: defaultLabOrderValues,
    async onValid(values) {
      // tests is combined from the chip toggles + comma-separated custom text
      // (local component state, not a registered field — see lib/validation/lab.ts).
      const custom = customTests.split(",").map((test) => test.trim()).filter(Boolean);
      let response: Response;
      try {
        response = await fetch("/api/lab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, tests: [...selectedTests, ...custom] })
        });
      } catch {
        notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitLabOrder());
        return;
      }
      const data = (await response.json().catch(() => ({}))) as LabListResponse;
      if (!response.ok || !data.ok || !data.order) {
        // Mutation failures are transient/non-blocking (toast), never the
        // table's load-error state — a failed create must not blank the list.
        notify.error(data.error || "Unable to create lab order.");
        return;
      }
      setSelectedTests([]);
      setCustomTests("");
      resetLabOrderForm(defaultLabOrderValues);
      void loadLab();
    }
  });

  async function loadLab() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (criticalOnly) params.set("criticalOnly", "true");

    const response = await fetch(`/api/lab?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as LabListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load lab.");
      setLoading(false);
      return;
    }
    setOrders(data.orders ?? []);
    setVisits(data.visits ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
    setEditingOrder((current) => {
      if (!current) return current;
      return data.orders?.find((order) => order.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLab(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, criticalOnly]);

  // Runs after the <option> elements for `visits` actually commit to the DOM
  // (unlike calling setValue directly inside loadLab, which fired before the
  // matching option existed, so the uncontrolled select had nothing to select).
  useEffect(() => {
    if (!getOrderValues("visitId") && visits[0]?.id) setOrderValue("visitId", visits[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: LabOrderStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function toggleCriticalOnly(value: boolean) {
    setCriticalOnly(value);
    setPageIndex(0);
  }

  function toggleTest(test: string) {
    setSelectedTests((items) => (items.includes(test) ? items.filter((item) => item !== test) : [...items, test]));
  }

  async function updateOrder(id: string, updates: Partial<Pick<LabOrder, "status" | "resultSummary" | "reportReference" | "paymentStatus" | "amount" | "notes">> & { criticalManual?: boolean; acknowledgeCritical?: boolean }) {
    let response: Response;
    try {
      response = await fetch("/api/lab", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateOrder(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as LabListResponse;
    if (!response.ok || !data.ok || !data.order) {
      notify.error(data.error || "Unable to update lab order.");
      return;
    }
    const updated = data.order as LabOrder;
    setOrders((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingOrder((current) => (current?.id === id ? updated : current));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    let deleted = 0;
    let lastError = "";
    for (const order of deleteTarget.items) {
      let response: Response;
      try {
        response = await fetch("/api/lab", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id })
        });
      } catch {
        lastError = "Unable to reach the server. Check your connection and retry.";
        continue;
      }
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        deleted += 1;
      } else {
        lastError = data.error || "Unable to delete this lab order.";
      }
    }
    setIsDeleting(false);

    if (deleted > 0) {
      notify.success(deleted === 1 ? "Lab order deleted" : `${deleted} lab orders deleted`);
      void loadLab();
    }
    if (deleted < deleteTarget.items.length) {
      notify.error(lastError || "Some lab orders could not be deleted.");
    }
    setDeleteTarget(null);
  }

  const statTiles = useMemo(
    () => [
      { label: "Lab Orders", value: stats.total },
      { label: "Pending Samples", value: stats.pendingSamples },
      { label: "Collected", value: stats.collectedSamples },
      { label: "Processing", value: stats.processing },
      { label: "Result Ready", value: stats.resultReady },
      { label: "Critical Unacked", value: stats.criticalUnacked },
      { label: "Paid Lab", value: formatAmount(stats.paidAmount) }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<LabOrder, unknown>[]>(
    () => [
      {
        accessorKey: "token",
        header: "Token",
        size: 130,
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
      {
        id: "tests",
        header: "Tests",
        size: 180,
        enableSorting: false,
        cell: ({ row }) => <span className="line-clamp-1 text-muted" title={row.original.tests.join(", ")}>{row.original.tests.join(", ")}</span>
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 90,
        cell: ({ row }) =>
          row.original.priority === "Urgent" ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Urgent</span>
          ) : (
            <span className="text-muted">Routine</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Order status"
            value={row.original.status}
            onChange={(event) => void updateOrder(row.original.id, { status: event.target.value as LabOrderStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {labOrderStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "critical",
        header: "Critical",
        size: 150,
        enableSorting: false,
        cell: ({ row }) =>
          !row.original.criticalFlag ? (
            <span className="text-muted">—</span>
          ) : row.original.criticalAcknowledgedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={11} /> Acknowledged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle size={11} /> Critical
            </span>
          )
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        size: 110,
        cell: ({ row }) => (
          <select
            aria-label="Payment status"
            value={row.original.paymentStatus}
            onChange={(event) => void updateOrder(row.original.id, { paymentStatus: event.target.value as LabOrder["paymentStatus"] })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            <option>Unpaid</option>
            <option>Paid</option>
          </select>
        )
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 100,
        cell: ({ row }) => formatAmount(row.original.amount)
      },
      {
        id: "actions",
        header: "Actions",
        size: 130,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const eligibleForDelete =
            row.original.status === "Cancelled" &&
            !row.original.resultSummary &&
            !row.original.reportReference &&
            row.original.paymentStatus !== "Paid" &&
            !row.original.criticalFlag &&
            !row.original.criticalAcknowledgedAt;
          return (
            <div className="flex items-center gap-1">
              <ActionButton variant="secondary" size="sm" onClick={() => setEditingOrder((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={editingOrder?.id === row.original.id}>
                <Edit3 size={13} /> Result
              </ActionButton>
              {canDelete ? (
                <ActionButton
                  variant="danger"
                  size="sm"
                  className="h-8 w-8 min-h-8 px-0"
                  disabled={!eligibleForDelete}
                  title={eligibleForDelete ? "Delete permanently" : "Only a Cancelled order with no result, payment or critical-flag history can be deleted"}
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
    // updateOrder only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, editingOrder, canDelete]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Laboratory</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Lab orders and results</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Order tests against OPD visits, track sample status, and record result summaries or report references.</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {statTiles.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form onSubmit={submitLabOrder} noValidate className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <FlaskConical size={19} /> Create lab order
          </p>
          <div className="grid gap-3">
            <FormField label="OPD visit" htmlFor="lab-visitId" error={labOrderErrors.visitId?.message}>
              <select id="lab-visitId" className={fieldClass} {...registerLabOrder("visitId")}>
                <option value="">Select OPD visit</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.token} | {visit.patientName}
                    {visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="rounded border border-line bg-surface p-3">
              <p className="mb-2 text-sm font-bold text-ink">Common tests</p>
              <div className="flex flex-wrap gap-2">
                {commonLabTests.map((test) => (
                  <button
                    key={test}
                    type="button"
                    onClick={() => toggleTest(test)}
                    aria-pressed={selectedTests.includes(test)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${selectedTests.includes(test) ? "border-brand bg-cyan-50 text-brand dark:bg-cyan-950" : "border-line bg-surface text-muted"}`}
                  >
                    {test}
                  </button>
                ))}
              </div>
            </div>
            <input value={customTests} onChange={(event) => setCustomTests(event.target.value)} className={fieldClass} placeholder="Other tests, comma separated" />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
              <FormField label="Priority" htmlFor="lab-priority" error={labOrderErrors.priority?.message}>
                <select id="lab-priority" className={fieldClass} {...registerLabOrder("priority")}>
                  {labOrderPriorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sample type" htmlFor="lab-sampleType" error={labOrderErrors.sampleType?.message}>
                <input id="lab-sampleType" className={fieldClass} placeholder="Sample type" {...registerLabOrder("sampleType")} />
              </FormField>
              <FormField label="Amount" htmlFor="lab-amount" error={labOrderErrors.amount?.message}>
                <input id="lab-amount" className={fieldClass} type="number" min="0" placeholder="Amount" {...registerLabOrder("amount")} />
              </FormField>
            </div>
            <FormField label="Payment status" htmlFor="lab-paymentStatus" error={labOrderErrors.paymentStatus?.message}>
              <select id="lab-paymentStatus" className={fieldClass} {...registerLabOrder("paymentStatus")}>
                {labPaymentStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Notes" htmlFor="lab-notes" error={labOrderErrors.notes?.message}>
              <textarea id="lab-notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Lab notes, fasting status, sample remarks" {...registerLabOrder("notes")} />
            </FormField>
            <ActionButton type="submit" variant="primary" loading={isLabOrderSubmitting} disabled={isLabOrderSubmitting}>
              <TestTube2 size={17} /> Save Lab Order
            </ActionButton>
          </div>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={orders}
            getRowId={(order) => order.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search lab orders"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadLab()}
            emptyState={{
              icon: FlaskConical,
              title: globalFilter || statusFilter || criticalOnly ? "No lab orders match your filters" : "No lab orders here",
              description:
                globalFilter || statusFilter || criticalOnly
                  ? "Try a different search term, or clear the status/critical filters."
                  : "Lab tests raised for patients appear in this queue. Order a test with the form to the left.",
              action: globalFilter || statusFilter || criticalOnly ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter || criticalOnly
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                      setCriticalOnly(false);
                    }
                  : undefined
            }}
            export={{ headers: labExportHeaders, row: labExportRow, filename: "lab-orders.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => updateStatusFilter(event.target.value as LabOrderStatus | "")}
                  className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  <option value="">All statuses</option>
                  {labOrderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={criticalOnly} onChange={(event) => toggleCriticalOnly(event.target.checked)} className="h-4 w-4 accent-red-600" />
                  Critical only
                </label>
              </>
            }
            bulkActions={(selected, clear) => {
              const allEligible = selected.every(
                (order) =>
                  order.status === "Cancelled" &&
                  !order.resultSummary &&
                  !order.reportReference &&
                  order.paymentStatus !== "Paid" &&
                  !order.criticalFlag &&
                  !order.criticalAcknowledgedAt
              );
              return (
                <>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      downloadCsv(labExportHeaders, selected.map(labExportRow), "selected-lab-orders.csv");
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
                      title={allEligible ? "Delete selected permanently" : "Only Cancelled orders with no result, payment or critical-flag history can be deleted"}
                      onClick={() => setDeleteTarget({ items: selected, clearSelection: clear })}
                    >
                      <Trash2 size={14} /> Delete selected
                    </ActionButton>
                  ) : null}
                </>
              );
            }}
          />

          {editingOrder ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                    {editingOrder.token}
                    {editingOrder.uhid ? ` · ${editingOrder.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{editingOrder.patientName}</h3>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingOrder(null)}>
                  Close
                </ActionButton>
              </div>
              <input
                defaultValue={editingOrder.reportReference}
                onBlur={(event) => void updateOrder(editingOrder.id, { reportReference: event.target.value })}
                className={`${fieldClass} mt-3`}
                placeholder="Report file/reference"
              />
              <textarea
                defaultValue={editingOrder.resultSummary}
                onBlur={(event) => void updateOrder(editingOrder.id, { resultSummary: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Result summary / abnormal findings"
              />
              {editingOrder.criticalFlag && editingOrder.criticalReasons?.length ? (
                <ul className="mt-2 grid gap-1 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {editingOrder.criticalReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={editingOrder.criticalSource === "manual"}
                    onChange={(event) => void updateOrder(editingOrder.id, { criticalManual: event.target.checked })}
                    className="h-4 w-4 rounded border-line accent-red-600"
                  />
                  Mark critical (lab judgment)
                </label>
                {editingOrder.criticalFlag && !editingOrder.criticalAcknowledgedAt ? (
                  <ActionButton variant="danger" size="sm" onClick={() => void updateOrder(editingOrder.id, { acknowledgeCritical: true })}>
                    Acknowledge critical result
                  </ActionButton>
                ) : null}
                {editingOrder.criticalAcknowledgedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle size={13} /> Acknowledged by {editingOrder.criticalAcknowledgedBy} at{" "}
                    {new Date(editingOrder.criticalAcknowledgedAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.items.length === 1 ? "this lab order" : `${deleteTarget.items.length} lab orders`}?</DialogTitle>
                <DialogDescription>
                  {deleteTarget.items.length === 1
                    ? `This permanently removes token ${deleteTarget.items[0].token}'s cancelled lab order. This cannot be undone.`
                    : "This permanently removes the selected cancelled lab orders. This cannot be undone."}
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
