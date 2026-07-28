"use client";

import { BadgeIndianRupee, Banknote, FileText, Receipt, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { formatPaise } from "@/lib/billing-calc";
import type { Invoice, InvoiceStatus } from "@/lib/billing-types";
import { invoiceStatuses } from "@/lib/billing-types";
import { invoiceExportHeaders, invoiceExportRow, type InvoiceSortField, type InvoiceStats } from "@/lib/invoice-query";
import { notify } from "@/lib/notify";
import type { InvoicePaymentFormInput } from "@/lib/validation/billing";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { InvoiceCollectionPanel, type SkippedCharge } from "@/components/billing/InvoiceCollectionPanel";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const rowsPerPage = 25;

const statusTone: Record<InvoiceStatus, BadgeTone> = {
  Draft: "inactive",
  Issued: "info",
  "Partially Paid": "warning",
  Paid: "success",
  Cancelled: "critical"
};

type InvoiceListResponse = {
  ok: boolean;
  invoices?: Invoice[];
  pageCount?: number;
  total?: number;
  stats?: InvoiceStats;
  error?: string;
};

type MutationResponse = { ok: boolean; invoice?: Invoice; error?: string };

type SyncResponse = MutationResponse & { added?: number; skipped?: SkippedCharge[] };

/**
 * The billing counter's collection desk (Track 5.2) — the first screen over
 * the invoice entity from 5.0 and the price master from 5.1.
 *
 * Defaults to outstanding invoices only: the reason a billing executive opens
 * this screen is to take money, and a list dominated by already-settled bills
 * buries the ones that need action. Everything else is one filter away.
 *
 * Deliberately scoped to collection. The full patient-context workspace
 * (previous bills, advance balance, insurance status, sticky action bar) is
 * Track 5.4 — this is the screen that makes 5.0/5.1 usable, not that.
 */
export function BillingCollectionDesk() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [outstandingOnly, setOutstandingOnly] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Charges the last sync deliberately didn't bill; cleared when another invoice is opened. */
  const [skipped, setSkipped] = useState<SkippedCharge[]>([]);
  /** Guards against an out-of-order response overwriting a newer query's results. */
  const latestRequest = useRef(0);

  const sortField = (sorting[0]?.id as InvoiceSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(pageIndex),
      pageSize: String(rowsPerPage),
      sortBy: sortField,
      sortDir
    });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (outstandingOnly) params.set("outstandingOnly", "true");

    let response: Response;
    try {
      response = await fetch(`/api/billing?${params.toString()}`, { cache: "no-store" });
    } catch {
      if (requestId !== latestRequest.current) return;
      setError("Unable to reach the server. Check your connection and retry.");
      setLoading(false);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as InvoiceListResponse;
    // A slower earlier request must never overwrite a newer one's results —
    // otherwise a fast second search flashes back to the first one's rows.
    if (requestId !== latestRequest.current) return;

    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load invoices.");
      setLoading(false);
      return;
    }

    setInvoices(data.invoices ?? []);
    setPageCount(data.pageCount ?? 1);
    setStats(data.stats ?? null);
    setLoading(false);
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, outstandingOnly]);

  useEffect(() => {
    // Debounced: filtering and search run server-side now, so firing a request
    // per keystroke would put the whole ledger behind a per-character
    // round-trip. 250ms keeps a settled query inside §26's 300ms budget.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const selected = useMemo(() => invoices.find((invoice) => invoice.id === selectedId) ?? null, [invoices, selectedId]);

  async function patchInvoice(body: Record<string, unknown>, onDone: (invoice: Invoice) => void) {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void patchInvoice(body, onDone));
      return false;
    }

    const data = (await response.json().catch(() => ({}))) as MutationResponse;
    setBusy(false);
    if (!response.ok || !data.ok || !data.invoice) {
      notify.error(data.error || "Unable to update this invoice.");
      return false;
    }

    const updated = data.invoice;
    setInvoices((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    onDone(updated);
    return true;
  }

  async function syncCharges(invoice: Invoice) {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-charges", id: invoice.id })
      });
    } catch {
      setBusy(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void syncCharges(invoice));
      return;
    }

    const data = (await response.json().catch(() => ({}))) as SyncResponse;
    setBusy(false);
    if (!response.ok || !data.ok || !data.invoice) {
      notify.error(data.error || "Unable to pull charges for this invoice.");
      return;
    }

    const updated = data.invoice;
    setInvoices((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setSkipped(data.skipped ?? []);

    const added = data.added ?? 0;
    if (added > 0) {
      notify.success(`${added} ${added === 1 ? "charge" : "charges"} added`, { description: `${updated.invoiceNo} now totals ${formatPaise(updated.totalPaise)}` });
    } else {
      // Nothing new is a normal, useful answer here — say so rather than
      // leaving the user unsure whether the action ran.
      notify.info("Everything from this visit is already on the bill.");
    }

    // A skip is never fatal, but it does need a human decision, so it gets its
    // own warning rather than being buried in the success toast.
    if (data.skipped?.length) {
      notify.warning(`${data.skipped.length} ${data.skipped.length === 1 ? "item was" : "items were"} not billed automatically — review the panel.`);
    }
  }

  async function issueInvoice(invoice: Invoice) {
    await patchInvoice({ action: "issue", id: invoice.id }, (updated) => {
      notify.success(`${updated.invoiceNo} issued`, { description: `${formatPaise(updated.totalPaise)} due from ${updated.patientName}` });
    });
  }

  async function collectPayment(invoice: Invoice, payment: InvoicePaymentFormInput) {
    return patchInvoice({ action: "record-payment", id: invoice.id, ...payment }, (updated) => {
      const settled = updated.balancePaise <= 0;
      notify.success(settled ? `${updated.invoiceNo} settled in full` : `${formatPaise(Math.round(payment.amount * 100))} received`, {
        description: settled ? `${formatPaise(updated.paidPaise)} collected` : `${formatPaise(updated.balancePaise)} still due`
      });
      // A settled bill leaves the outstanding-only view, so the row it was
      // opened from is gone — refetch rather than leave a stale page behind.
      if (settled && outstandingOnly) {
        setSelectedId(null);
        void load();
      }
    });
  }

  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 190,
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
      {
        accessorKey: "invoiceNo",
        header: "Invoice",
        size: 165,
        cell: ({ row }) => <span className="font-mono text-xs font-bold text-ink">{row.original.invoiceNo}</span>
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <StatusBadge tone={statusTone[row.original.status]} className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {row.original.status}
          </StatusBadge>
        )
      },
      {
        accessorKey: "totalPaise",
        header: "Total",
        size: 110,
        cell: ({ row }) => <span className="tabular-nums text-ink">{formatPaise(row.original.totalPaise)}</span>
      },
      {
        accessorKey: "balancePaise",
        header: "Balance",
        size: 120,
        cell: ({ row }) => (
          <span className={`font-bold tabular-nums ${row.original.balancePaise > 0 ? "text-coral" : "text-teal-dark"}`}>
            {formatPaise(row.original.balancePaise)}
          </span>
        )
      },
      {
        id: "actions",
        header: "Actions",
        size: 130,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const isOpen = selectedId === row.original.id;
          return (
            <button
              type="button"
              onClick={() => {
                setSkipped([]);
                setSelectedId(isOpen ? null : row.original.id);
              }}
              aria-expanded={isOpen}
              className="inline-flex min-h-8 items-center gap-1.5 rounded border border-line bg-soft px-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              <Banknote size={13} /> {row.original.balancePaise > 0 ? "Collect" : "View"}
            </button>
          );
        }
      }
    ],
    [openDrawer, selectedId]
  );

  const tiles = [
    { label: "Outstanding", value: formatPaise(stats?.outstandingPaise ?? 0), icon: BadgeIndianRupee },
    { label: "Collected Today", value: formatPaise(stats?.collectedTodayPaise ?? 0), icon: Wallet },
    { label: "Awaiting Payment", value: stats?.awaitingPaymentCount ?? 0, icon: Receipt },
    { label: "Draft Bills", value: stats?.draftCount ?? 0, icon: FileText }
  ];

  return (
    // A named landmark, not a bare div: this page carries two billing surfaces
    // until 5.4 merges them, so a screen-reader user needs to be able to tell
    // the collection desk from the revenue summary below it.
    <section aria-label="Collection desk" className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Collection</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Itemised invoices with split and part payments. Showing unpaid bills by default.
        </p>
      </div>

      <div className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 p-4">
        <DataTable
          columns={columns}
          data={invoices}
          getRowId={(invoice) => invoice.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={(value) => {
            setGlobalFilter(value);
            setPageIndex(0);
          }}
          searchPlaceholder="Search invoice no., patient, UHID, phone"
          loading={loading}
          error={error || undefined}
          onRetry={() => void load()}
          printTitle="Invoices"
          emptyState={{
            icon: Receipt,
            title: globalFilter || statusFilter ? "No invoices match your filters" : outstandingOnly ? "Nothing outstanding" : "No invoices yet",
            description:
              globalFilter || statusFilter
                ? "Try a different search term, or clear the status filter."
                : outstandingOnly
                  ? "Every issued bill is settled. Switch to all invoices to see the full ledger."
                  : "Invoices raised against a visit, procedure or pharmacy sale appear here.",
            action: globalFilter || statusFilter ? "Clear filters" : outstandingOnly ? "Show all invoices" : undefined,
            onAction:
              globalFilter || statusFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setPageIndex(0);
                  }
                : outstandingOnly
                  ? () => {
                      setOutstandingOnly(false);
                      setPageIndex(0);
                    }
                  : undefined
          }}
          export={{ headers: invoiceExportHeaders, row: invoiceExportRow, filename: "invoices.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={outstandingOnly}
                  onChange={(event) => {
                    setOutstandingOnly(event.target.checked);
                    setPageIndex(0);
                  }}
                  className="size-4 accent-[var(--site-brand)]"
                />
                Unpaid only
              </label>
              <select
                aria-label="Filter by invoice status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as InvoiceStatus | "");
                  setPageIndex(0);
                }}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {invoiceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {selected ? (
          <InvoiceCollectionPanel
            invoice={selected}
            busy={busy}
            skipped={skipped}
            onIssue={issueInvoice}
            onCollect={collectPayment}
            onSyncCharges={syncCharges}
            onClose={() => {
              setSkipped([]);
              setSelectedId(null);
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
