"use client";

import { BadgeIndianRupee, Banknote, ClipboardList, CreditCard, Download, Edit3, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { OpdVisit } from "@/lib/opd-types";
import { amountValue, queryBillingVisits, type BillingSortField } from "@/lib/billing-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { PdfPreviewButton } from "@/components/design-system/PdfPreviewButton";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const billingExportHeaders = ["Token", "Patient", "Phone", "Service", "Billing Status", "Amount", "Payment Method", "Receipt ID"];

function billingExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.billingStatus, visit.estimatedAmount ?? "", visit.paymentMethod ?? "", visit.receiptId ?? ""];
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  error?: string;
};

const billingStatuses: OpdVisit["billingStatus"][] = ["Not Started", "Estimate Shared", "Paid"];
const paymentMethods: NonNullable<OpdVisit["paymentMethod"]>[] = ["Cash", "UPI", "Card", "Insurance", "Other"];
const rowsPerPage = 25;
const todayIso = () => new Date().toISOString().slice(0, 10);

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminBillingSummary() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState<OpdVisit["billingStatus"] | "">("Paid");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [editingVisit, setEditingVisit] = useState<OpdVisit | null>(null);
  const [refundReasonDraft, setRefundReasonDraft] = useState("");
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<NonNullable<OpdVisit["paymentMethod"]>>("Cash");

  const sortField = (sorting[0]?.id as BillingSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadBilling() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/opd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load billing summary.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialBilling() {
      const response = await fetch("/api/opd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as OpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load billing summary.");
        setLoading(false);
        return;
      }
      setVisits(data.visits ?? []);
      setLoading(false);
    }

    void loadInitialBilling();

    return () => {
      active = false;
    };
  }, []);

  async function updateVisit(
    id: string,
    updates: Partial<Pick<OpdVisit, "billingStatus" | "estimatedAmount" | "paymentMethod">> & {
      refundAction?: "request" | "complete";
      refundReason?: string;
      refundAmount?: string;
    }
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
    const data = (await response.json().catch(() => ({}))) as { ok: boolean; visit?: OpdVisit; error?: string };
    if (!response.ok || !data.ok || !data.visit) {
      notify.error(data.error || "Unable to update billing record.");
      return;
    }
    const updated = data.visit;
    setVisits((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingVisit((current) => (current?.id === id ? updated : current));
  }

  async function recordPayment(visit: OpdVisit, method: OpdVisit["paymentMethod"]) {
    await updateVisit(visit.id, { billingStatus: "Paid", paymentMethod: method });
    notify.success(`Marked ${visit.patientName}'s bill as paid.`);
    setEditingVisit(null);
  }

  async function requestRefund(visit: OpdVisit) {
    if (!refundReasonDraft.trim()) {
      notify.error("A refund reason is required.");
      return;
    }
    await updateVisit(visit.id, { refundAction: "request", refundReason: refundReasonDraft, refundAmount: visit.estimatedAmount });
    notify.success("Refund requested — it now appears in the refund queue.");
    setRefundReasonDraft("");
    setEditingVisit(null);
  }

  async function completeRefund(visit: OpdVisit) {
    await updateVisit(visit.id, { refundAction: "complete" });
    notify.success(`Refund for ${visit.patientName} marked as completed.`);
  }

  function openManage(visit: OpdVisit) {
    setEditingVisit((current) => (current?.id === visit.id ? null : visit));
    setRefundReasonDraft("");
    setPaymentMethodDraft(visit.paymentMethod || "Cash");
  }

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateBillingStatusFilter(value: OpdVisit["billingStatus"] | "") {
    setBillingStatusFilter(value);
    setPageIndex(0);
  }

  // Stat tiles and the payment-method split need the complete unfiltered
  // array to compute accurate aggregate totals, so they're always derived
  // from the full `visits` list, not the paginated table page.
  const billing = useMemo(() => {
    const paidVisits = visits.filter((visit) => visit.billingStatus === "Paid");
    const pendingVisits = visits.filter((visit) => visit.billingStatus !== "Paid");
    const today = todayIso();
    return {
      paidTotal: paidVisits.reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0),
      pendingTotal: pendingVisits.reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0),
      paidCount: paidVisits.length,
      pendingCount: pendingVisits.length,
      todayRevenue: paidVisits.filter((visit) => visit.paidAt?.slice(0, 10) === today).reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0),
      refundQueue: visits.filter((visit) => visit.refundStatus === "Requested"),
      paymentSplit: ["Cash", "UPI", "Card", "Insurance", "Other"].map((method) => ({
        method,
        value: paidVisits.filter((visit) => (visit.paymentMethod || "Cash") === method).reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0)
      }))
    };
  }, [visits]);

  const { visits: pageRows, pageCount } = useMemo(
    () =>
      queryBillingVisits(visits, {
        page: pageIndex,
        pageSize: rowsPerPage,
        sortBy: sortField,
        sortDir,
        query: globalFilter,
        billingStatus: billingStatusFilter || undefined
      }),
    [visits, pageIndex, sortField, sortDir, globalFilter, billingStatusFilter]
  );

  const columns = useMemo<ColumnDef<OpdVisit, unknown>[]>(
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
      { accessorKey: "token", header: "Token", size: 110, cell: ({ row }) => <span className="font-mono text-xs font-bold text-ink">{row.original.token}</span> },
      { accessorKey: "service", header: "Service", size: 170 },
      {
        id: "billingStatus",
        header: "Billing Status",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{row.original.billingStatus}</span>
      },
      {
        id: "amount",
        accessorFn: (visit) => amountValue(visit.estimatedAmount),
        header: "Amount",
        size: 110,
        cell: ({ row }) => <span className="font-bold text-teal-dark">{formatAmount(amountValue(row.original.estimatedAmount))}</span>
      },
      { accessorKey: "paymentMethod", header: "Method", size: 100, cell: ({ row }) => row.original.paymentMethod || "Cash" },
      {
        id: "receiptId",
        header: "Receipt",
        size: 140,
        enableSorting: false,
        cell: ({ row }) => row.original.receiptId || <span className="text-muted">Pending</span>
      },
      {
        id: "refund",
        header: "Refund",
        size: 120,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.refundStatus === "Refunded" ? (
            <span className="rounded-full border border-line bg-soft px-2 py-0.5 text-[10px] font-bold uppercase text-muted">Refunded</span>
          ) : row.original.refundStatus === "Requested" ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">Requested</span>
          ) : (
            <span className="text-muted">—</span>
          )
      },
      {
        id: "actions",
        header: "Actions",
        size: 190,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            {row.original.billingStatus === "Paid" ? (
              <PdfPreviewButton
                href={`/api/pdf/invoice?visitId=${encodeURIComponent(row.original.id)}`}
                title={`Receipt — ${row.original.patientName}`}
                description={`${row.original.token} · ${row.original.receiptId || "Receipt pending"}`}
                label="Receipt"
                size="sm"
                className="min-h-8 px-2 text-xs"
              />
            ) : null}
            <ActionButton variant="secondary" size="sm" onClick={() => openManage(row.original)} aria-expanded={editingVisit?.id === row.original.id}>
              <Edit3 size={13} /> Manage
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
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Revenue and receipts</h2>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-5">
        {[
          { label: "Today's Revenue", value: formatAmount(billing.todayRevenue), icon: Banknote },
          { label: "Paid Total", value: formatAmount(billing.paidTotal), icon: BadgeIndianRupee },
          { label: "Pending Estimate", value: formatAmount(billing.pendingTotal), icon: CreditCard },
          { label: "Paid Receipts", value: billing.paidCount, icon: ClipboardList },
          { label: "Pending Bills", value: billing.pendingCount, icon: ClipboardList }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-line p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <Undo2 size={16} className="text-brand" /> Refund queue
        </p>
        {billing.refundQueue.length === 0 ? (
          <ModuleEmptyState icon={Undo2} title="No refunds pending" description="Refunds requested from a paid receipt (via Manage) appear here until marked as completed." />
        ) : (
          <div className="grid gap-2">
            {billing.refundQueue.map((visit) => (
              <div
                key={visit.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950"
              >
                <div>
                  <p className="text-sm font-bold text-ink">
                    {visit.patientName} · {visit.token}
                  </p>
                  <p className="text-xs text-muted">
                    {visit.refundReason || "No reason given"} — {formatAmount(amountValue(visit.refundAmount))} · requested by {visit.refundRequestedBy || "—"}
                  </p>
                </div>
                <ActionButton variant="secondary" size="sm" onClick={() => void completeRefund(visit)}>
                  <Undo2 size={13} /> Mark refunded
                </ActionButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.4fr_1fr]">
        <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="text-sm font-bold text-ink">Payment method split</p>
          <div className="mt-4 grid gap-3">
            {billing.paymentSplit.map((item) => (
              <div key={item.method} className="flex items-center justify-between rounded border border-line bg-surface px-4 py-3">
                <span className="font-semibold text-muted">{item.method}</span>
                <span className="font-bold text-ink">{formatAmount(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-bold text-ink">Receipts</p>
          <DataTable
            columns={columns}
            data={pageRows}
            getRowId={(visit) => visit.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search patient, token, service, receipt"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadBilling()}
            emptyState={{
              icon: ClipboardList,
              title: globalFilter || billingStatusFilter ? "No receipts match your filters" : "No billing records yet",
              description:
                globalFilter || billingStatusFilter
                  ? "Try a different search term, or clear the billing status filter."
                  : "Billing activity from OPD visits appears here once a visit gets an estimate or receipt.",
              action: globalFilter || billingStatusFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || billingStatusFilter
                  ? () => {
                      setGlobalFilter("");
                      setBillingStatusFilter("");
                    }
                  : undefined
            }}
            export={{ headers: billingExportHeaders, row: billingExportRow, filename: "billing.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by billing status"
                value={billingStatusFilter}
                onChange={(event) => updateBillingStatusFilter(event.target.value as OpdVisit["billingStatus"] | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All billing statuses</option>
                {billingStatuses.map((status) => (
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
                  downloadCsv(billingExportHeaders, selected.map(billingExportRow), "selected-billing.csv");
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
                    {editingVisit.token}
                    {editingVisit.uhid ? ` · ${editingVisit.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{editingVisit.patientName}</h3>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingVisit(null)}>
                  Close
                </ActionButton>
              </div>

              {editingVisit.refundStatus === "Refunded" ? (
                <p className="mt-3 text-sm font-semibold text-muted">
                  Refunded {formatAmount(amountValue(editingVisit.refundAmount))}
                  {editingVisit.refundedAt
                    ? ` on ${new Date(editingVisit.refundedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                  {editingVisit.refundedBy ? ` by ${editingVisit.refundedBy}.` : "."}
                </p>
              ) : editingVisit.refundStatus === "Requested" ? (
                <div className="mt-3 grid gap-2 rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <p className="text-sm font-semibold text-ink">Refund requested: {editingVisit.refundReason || "No reason given"}</p>
                  <p className="text-xs text-muted">
                    {formatAmount(amountValue(editingVisit.refundAmount))} · requested by {editingVisit.refundRequestedBy || "—"}
                  </p>
                  <ActionButton variant="secondary" size="sm" onClick={() => void completeRefund(editingVisit)}>
                    <Undo2 size={13} /> Mark refunded
                  </ActionButton>
                </div>
              ) : editingVisit.billingStatus === "Paid" ? (
                <div className="mt-3 grid gap-2">
                  <textarea
                    value={refundReasonDraft}
                    onChange={(event) => setRefundReasonDraft(event.target.value)}
                    className="min-h-16 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="Refund reason (required) — e.g. duplicate payment, cancelled visit"
                  />
                  <ActionButton variant="danger" size="sm" onClick={() => void requestRefund(editingVisit)}>
                    <Undo2 size={13} /> Request refund
                  </ActionButton>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    aria-label="Payment method"
                    value={paymentMethodDraft}
                    onChange={(event) => setPaymentMethodDraft(event.target.value as NonNullable<OpdVisit["paymentMethod"]>)}
                    className="min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                  <ActionButton variant="primary" size="sm" onClick={() => void recordPayment(editingVisit, paymentMethodDraft)}>
                    <Banknote size={13} /> Mark Paid
                  </ActionButton>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
