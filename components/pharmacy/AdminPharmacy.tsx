"use client";

import { BadgeIndianRupee, Download, Eye, PackageCheck, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { InventoryItem } from "@/lib/inventory-types";
import type { OpdVisit } from "@/lib/opd-types";
import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";
import type { PharmacyPaymentFilter, PharmacySortField } from "@/lib/pharmacy-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const dispenseExportHeaders = ["Token", "Patient", "Phone", "Status", "Items", "Total", "Payment Status", "Created"];

function dispenseExportRow(record: PharmacyDispenseRecord) {
  return [
    record.token,
    record.patientName,
    record.phone,
    record.status,
    record.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
    String(record.total),
    record.paymentStatus,
    record.createdAt
  ];
}

type PharmacyListResponse = {
  ok: boolean;
  dispenses?: PharmacyDispenseRecord[];
  dispense?: PharmacyDispenseRecord;
  visits?: OpdVisit[];
  inventory?: InventoryItem[];
  pageCount?: number;
  stats?: { total: number; paidTotal: number; unpaid: number; lowStock: number };
  error?: string;
};

type DraftItem = {
  inventoryItemId: string;
  quantity: string;
  unitPrice: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminPharmacy() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);

  const [dispenses, setDispenses] = useState<PharmacyDispenseRecord[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([{ inventoryItemId: "", quantity: "1", unitPrice: "0" }]);
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<"Unpaid" | "Paid">("Unpaid");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, paidTotal: 0, unpaid: 0, lowStock: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PharmacyPaymentFilter | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingRecord, setViewingRecord] = useState<PharmacyDispenseRecord | null>(null);

  const sortField = (sorting[0]?.id as PharmacySortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadPharmacy() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (paymentFilter) params.set("paymentStatus", paymentFilter);

    const response = await fetch(`/api/pharmacy?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as PharmacyListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load pharmacy.");
      setLoading(false);
      return;
    }
    setDispenses(data.dispenses ?? []);
    setVisits(data.visits ?? []);
    setInventory(data.inventory ?? []);
    setSelectedVisitId((current) => current || data.visits?.[0]?.id || "");
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPharmacy(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, paymentFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updatePaymentFilter(value: PharmacyPaymentFilter | "") {
    setPaymentFilter(value);
    setPageIndex(0);
  }

  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId);
  const medicineItems = inventory.filter((item) => item.category === "Medicine" || item.category === "Consumable" || item.category === "Procedure Kit");
  const subtotal = draftItems.reduce((sum, draft) => {
    const quantity = Number(draft.quantity) || 0;
    const unitPrice = Number(draft.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const statTiles = useMemo(
    () => [
      { label: "Dispenses", value: stats.total },
      { label: "Paid Pharmacy", value: formatAmount(stats.paidTotal) },
      { label: "Unpaid", value: stats.unpaid },
      { label: "Low Medicine Stock", value: stats.lowStock }
    ],
    [stats]
  );

  function updateDraftItem(index: number, patch: Partial<DraftItem>) {
    setDraftItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function issueDispense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/pharmacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId: selectedVisitId,
        items: draftItems,
        discount,
        paymentStatus,
        paymentMethod,
        notes
      })
    });
    const data = (await response.json().catch(() => ({}))) as PharmacyListResponse;
    if (!response.ok || !data.ok || !data.dispense) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed dispense must not blank the list.
      notify.error(data.error || "Unable to issue pharmacy dispense.");
      return;
    }
    notify.success("Dispense recorded");
    setDraftItems([{ inventoryItemId: "", quantity: "1", unitPrice: "0" }]);
    setDiscount("0");
    setPaymentStatus("Unpaid");
    setPaymentMethod("Cash");
    setNotes("");
    void loadPharmacy();
  }

  const columns = useMemo<ColumnDef<PharmacyDispenseRecord, unknown>[]>(
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
      {
        id: "items",
        header: "Items",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => {
          const summary = row.original.items.map((item) => `${item.name} x${item.quantity}`).join(", ");
          return (
            <span className="line-clamp-1 text-muted" title={summary}>
              {summary}
            </span>
          );
        }
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        size: 100,
        cell: ({ row }) =>
          row.original.paymentStatus === "Paid" ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">Paid</span>
          ) : (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">Unpaid</span>
          )
      },
      {
        accessorKey: "total",
        header: "Total",
        size: 110,
        cell: ({ row }) => <span className="font-bold text-ink">{formatAmount(row.original.total)}</span>
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        size: 130,
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("en-IN")
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => setViewingRecord((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={viewingRecord?.id === row.original.id}>
            <Eye size={13} /> View
          </ActionButton>
        )
      }
    ],
    [openDrawer, viewingRecord]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Pharmacy Counter</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Medicine and kit dispensing</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Issue medicines or procedure consumables against OPD visits. Dispensed quantities reduce stock automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {statTiles.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={issueDispense} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <PackageCheck size={19} /> Issue dispense
          </p>
          <div className="grid gap-3">
            <label>
              <span className="mb-2 block text-sm font-bold text-ink">OPD Visit</span>
              <select aria-label="Selected visit id" value={selectedVisitId} onChange={(event) => setSelectedVisitId(event.target.value)} className={fieldClass} required>
                <option value="">Select OPD visit</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.token} | {visit.patientName}
                    {visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}
                  </option>
                ))}
              </select>
            </label>
            {selectedVisit ? (
              <div className="rounded border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300">
                <p className="font-bold">
                  {selectedVisit.patientName} {selectedVisit.uhid ? `(${selectedVisit.uhid})` : ""}
                </p>
                <p>
                  {selectedVisit.service} | {selectedVisit.phone}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3">
              {draftItems.map((item, index) => {
                const stockItem = inventory.find((entry) => entry.id === item.inventoryItemId);
                return (
                  <div key={index} className="grid gap-2 rounded border border-line bg-surface p-3 md:grid-cols-[1fr_90px_110px_auto] md:items-center">
                    <select aria-label="Inventory item id" value={item.inventoryItemId} onChange={(event) => updateDraftItem(index, { inventoryItemId: event.target.value })} className={fieldClass} required>
                      <option value="">Select item</option>
                      {medicineItems.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} | {entry.quantity} {entry.unit}
                        </option>
                      ))}
                    </select>
                    <input value={item.quantity} onChange={(event) => updateDraftItem(index, { quantity: event.target.value })} className={fieldClass} type="number" min="1" placeholder="Qty" required />
                    <input value={item.unitPrice} onChange={(event) => updateDraftItem(index, { unitPrice: event.target.value })} className={fieldClass} type="number" min="0" placeholder="Price" />
                    <ActionButton
                      variant="ghost"
                      onClick={() => setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                      className="h-11 w-11 min-h-11 border border-red-200 bg-red-50 px-0 text-red-700 hover:bg-red-100 hover:text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </ActionButton>
                    {stockItem ? (
                      <p className="text-xs font-semibold text-muted md:col-span-4">
                        Available: {stockItem.quantity} {stockItem.unit} | Reorder at {stockItem.reorderLevel}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <ActionButton variant="secondary" onClick={() => setDraftItems((items) => [...items, { inventoryItemId: "", quantity: "1", unitPrice: "0" }])} className="min-h-10">
              <Plus size={16} /> Add Item
            </ActionButton>

            <div className="grid gap-3 md:grid-cols-3">
              <input value={discount} onChange={(event) => setDiscount(event.target.value)} className={fieldClass} type="number" min="0" placeholder="Discount" />
              <select aria-label="Payment status" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as "Unpaid" | "Paid")} className={fieldClass}>
                <option>Unpaid</option>
                <option>Paid</option>
              </select>
              <select aria-label="Payment method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}>
                {["Cash", "UPI", "Card", "Insurance", "Other"].map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass} min-h-20 py-3`} placeholder="Pharmacy instructions or notes" />
            <div className="rounded border border-line bg-surface p-4">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span className="font-bold text-ink">{formatAmount(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-muted">
                <span>Discount</span>
                <span className="font-bold text-ink">{formatAmount(Number(discount) || 0)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatAmount(total)}</span>
              </div>
            </div>
            <ActionButton type="submit" variant="primary" disabled={!selectedVisitId}>
              <BadgeIndianRupee size={17} /> Issue Dispense
            </ActionButton>
          </div>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={dispenses}
            getRowId={(record) => record.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search token, patient, phone, medicine"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadPharmacy()}
            emptyState={{
              icon: PackageCheck,
              title: globalFilter || paymentFilter ? "No dispenses match your filters" : "No pharmacy dispenses yet",
              description:
                globalFilter || paymentFilter
                  ? "Try a different search term, or clear the payment filter."
                  : "Medicines dispensed to patients are recorded here with billing status. Record a dispense with the form to the left.",
              action: globalFilter || paymentFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || paymentFilter
                  ? () => {
                      setGlobalFilter("");
                      setPaymentFilter("");
                    }
                  : undefined
            }}
            export={{ headers: dispenseExportHeaders, row: dispenseExportRow, filename: "pharmacy-dispenses.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by payment status"
                value={paymentFilter}
                onChange={(event) => updatePaymentFilter(event.target.value as PharmacyPaymentFilter | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All payments</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            }
            bulkActions={(selected, clear) => (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(dispenseExportHeaders, selected.map(dispenseExportRow), "selected-pharmacy-dispenses.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />

          {viewingRecord ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">
                    {viewingRecord.id} · {viewingRecord.token}
                    {viewingRecord.uhid ? ` · ${viewingRecord.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{viewingRecord.patientName}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {viewingRecord.service} · {new Date(viewingRecord.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setViewingRecord(null)}>
                  Close
                </ActionButton>
              </div>
              <div className="mt-3 grid gap-2">
                {viewingRecord.items.map((item) => (
                  <div key={`${viewingRecord.id}-${item.inventoryItemId}`} className="flex justify-between rounded border border-line bg-surface px-3 py-2 text-sm">
                    <span className="font-semibold text-muted">
                      {item.name} x {item.quantity} {item.unit}
                    </span>
                    <span className="font-bold text-ink">{formatAmount(item.total)}</span>
                  </div>
                ))}
              </div>
              {viewingRecord.notes ? <p className="mt-3 rounded border border-line bg-soft/60 p-3 text-sm text-muted">{viewingRecord.notes}</p> : null}
              <div className="mt-3 flex justify-between rounded border border-cyan-200 bg-cyan-50 px-3 py-2 font-bold text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300">
                <span>Total</span>
                <span>{formatAmount(viewingRecord.total)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
