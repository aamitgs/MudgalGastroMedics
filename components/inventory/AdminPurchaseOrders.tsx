"use client";

import { AlertTriangle, Download, FileDown, PackagePlus, PlusCircle, Trash2, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/lib/inventory-types";
import { isPurchaseOrderOverdue, purchaseOrderStatuses } from "@/lib/purchase-order-types";
import type { PurchaseOrderRecord, PurchaseOrderStatus } from "@/lib/purchase-order-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { downloadCsv } from "@/lib/table-export";
import { notify } from "@/lib/notify";

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

type DraftLine = { inventoryItemId: string; name: string; unit: string; quantityOrdered: number; unitCost: number };

type InventoryListResponse = { ok: boolean; items?: InventoryItem[]; error?: string };
type PurchaseOrderListResponse = { ok: boolean; orders?: PurchaseOrderRecord[]; order?: PurchaseOrderRecord; error?: string };

const statusTone: Record<PurchaseOrderStatus, string> = {
  Draft: "border-line bg-soft text-muted",
  Ordered: "border-cyan-200 bg-cyan-50 text-brand dark:border-cyan-900 dark:bg-cyan-950",
  Received: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
};

const purchaseOrderExportHeaders = ["Order ID", "Vendor", "Status", "Items", "Expected Delivery", "Created"];

function purchaseOrderExportRow(order: PurchaseOrderRecord) {
  return [
    order.id,
    order.vendor,
    order.status,
    order.items.map((item) => `${item.name} x${item.quantityOrdered} ${item.unit}`).join("; "),
    order.expectedDeliveryDate ?? "",
    order.createdAt
  ];
}

/** Restock target: bring stock up to twice the reorder level, never less than the reorder level itself. */
function suggestedReorderQty(item: InventoryItem) {
  return Math.max(item.reorderLevel * 2 - item.quantity, item.reorderLevel);
}

export function AdminPurchaseOrders() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendor, setVendor] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [pendingItemId, setPendingItemId] = useState("");
  const [pendingQty, setPendingQty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");

  async function loadAll() {
    setLoading(true);
    setError("");
    const [itemsResponse, ordersResponse] = await Promise.all([
      fetch("/api/inventory", { cache: "no-store" }).catch(() => null),
      fetch("/api/purchase-orders", { cache: "no-store" }).catch(() => null)
    ]);
    const itemsData = ((await itemsResponse?.json().catch(() => ({}))) ?? {}) as InventoryListResponse;
    const ordersData = ((await ordersResponse?.json().catch(() => ({}))) ?? {}) as PurchaseOrderListResponse;
    if (!itemsResponse?.ok || !itemsData.ok || !ordersResponse?.ok || !ordersData.ok) {
      setError(itemsData.error || ordersData.error || "Unable to load purchase orders.");
      setLoading(false);
      return;
    }
    setItems(itemsData.items ?? []);
    setOrders(ordersData.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const overdueOrders = useMemo(() => orders.filter((order) => isPurchaseOrderOverdue(order)), [orders]);
  const visibleOrders = useMemo(() => (statusFilter ? orders.filter((order) => order.status === statusFilter) : orders), [orders, statusFilter]);

  const lowStockByVendor = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>();
    for (const item of items) {
      if (item.quantity > item.reorderLevel) continue;
      const vendorKey = item.vendor?.trim() || "Unspecified vendor";
      groups.set(vendorKey, [...(groups.get(vendorKey) ?? []), item]);
    }
    return [...groups.entries()];
  }, [items]);

  function addLine() {
    const item = items.find((entry) => entry.id === pendingItemId);
    const qty = Number(pendingQty);
    if (!item || !Number.isFinite(qty) || qty <= 0) {
      notify.error("Pick an item and a valid quantity.");
      return;
    }
    setLines((current) => {
      const existing = current.find((line) => line.inventoryItemId === item.id);
      if (existing) return current.map((line) => (line.inventoryItemId === item.id ? { ...line, quantityOrdered: line.quantityOrdered + qty } : line));
      return [...current, { inventoryItemId: item.id, name: item.name, unit: item.unit, quantityOrdered: qty, unitCost: 0 }];
    });
    setPendingItemId("");
    setPendingQty("");
  }

  function removeLine(inventoryItemId: string) {
    setLines((current) => current.filter((line) => line.inventoryItemId !== inventoryItemId));
  }

  function startVendorOrder(vendorName: string, stockItems: InventoryItem[]) {
    setVendor(vendorName === "Unspecified vendor" ? "" : vendorName);
    setLines(stockItems.map((item) => ({ inventoryItemId: item.id, name: item.name, unit: item.unit, quantityOrdered: suggestedReorderQty(item), unitCost: 0 })));
    notify.success(`Draft started for ${stockItems.length} low-stock item${stockItems.length === 1 ? "" : "s"}.`);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vendor.trim() || !lines.length) {
      notify.error("Add a vendor and at least one item line.");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        items: lines.map((line) => ({ inventoryItemId: line.inventoryItemId, quantityOrdered: line.quantityOrdered, unitCost: line.unitCost || undefined }))
      })
    });
    const data = (await response.json().catch(() => ({}))) as PurchaseOrderListResponse;
    setSubmitting(false);
    if (!response.ok || !data.ok || !data.order) {
      notify.error(data.error || "Unable to create purchase order.");
      return;
    }
    setOrders((current) => [data.order as PurchaseOrderRecord, ...current]);
    setVendor("");
    setExpectedDeliveryDate("");
    setLines([]);
    notify.success("Purchase order created.");
  }

  async function setStatus(id: string, status: PurchaseOrderStatus) {
    const response = await fetch("/api/purchase-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as PurchaseOrderListResponse;
    if (!response.ok || !data.ok || !data.order) {
      notify.error(data.error || "Unable to update purchase order.");
      return;
    }
    const updated = data.order;
    setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
    if (status === "Received") {
      void loadAll();
      notify.success("Marked received — inventory quantities updated.");
    } else {
      notify.success(`Marked ${status}.`);
    }
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Restocking</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Purchase orders</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Turn low-stock alerts into a vendor order, track it through Ordered and Received, and Received orders restock inventory automatically.</p>
      </div>

      {lowStockByVendor.length ? (
        <div className="border-b border-line p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <AlertTriangle size={16} className="text-red-600" /> Low stock, by vendor
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {lowStockByVendor.map(([vendorName, stockItems]) => (
              <div key={vendorName} className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm font-bold text-ink">{vendorName}</p>
                <p className="mt-1 text-xs text-muted">{stockItems.map((item) => item.name).join(", ")}</p>
                <ActionButton variant="secondary" size="sm" className="mt-2" onClick={() => startVendorOrder(vendorName, stockItems)}>
                  <PackagePlus size={13} /> Start order
                </ActionButton>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {overdueOrders.length ? (
        <div className="border-b border-line bg-amber-50 p-4 dark:bg-amber-950">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
            <AlertTriangle size={16} /> {overdueOrders.length} order{overdueOrders.length === 1 ? "" : "s"} past expected delivery: {overdueOrders.map((order) => `${order.vendor} (${order.expectedDeliveryDate})`).join(", ")}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 p-4 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitOrder} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <Truck size={19} /> New purchase order
          </p>
          <div className="grid gap-3">
            <input value={vendor} onChange={(event) => setVendor(event.target.value)} className={fieldClass} placeholder="Vendor / supplier" required />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">Expected delivery (optional)</span>
              <input
                value={expectedDeliveryDate}
                onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                type="date"
                aria-label="Expected delivery date"
                className={fieldClass}
              />
            </label>

            <div className="rounded border border-line bg-surface p-3">
              <p className="mb-2 text-sm font-bold text-ink">Order lines</p>
              {lines.length === 0 ? <p className="text-xs text-muted">No items added yet.</p> : null}
              <div className="grid gap-1.5">
                {lines.map((line) => (
                  <div key={line.inventoryItemId} className="flex items-center justify-between gap-2 rounded border border-line bg-soft/60 px-2.5 py-1.5">
                    <span className="text-xs font-semibold text-ink">
                      {line.name} — {line.quantityOrdered} {line.unit}
                    </span>
                    <button type="button" onClick={() => removeLine(line.inventoryItemId)} aria-label={`Remove ${line.name}`} className="text-muted hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_90px_auto]">
                <select aria-label="Item to add" value={pendingItemId} onChange={(event) => setPendingItemId(event.target.value)} className={fieldClass}>
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit} in stock)
                    </option>
                  ))}
                </select>
                <input value={pendingQty} onChange={(event) => setPendingQty(event.target.value)} type="number" min="1" placeholder="Qty" className={fieldClass} />
                <ActionButton type="button" variant="secondary" onClick={addLine}>
                  <PlusCircle size={15} /> Add
                </ActionButton>
              </div>
            </div>

            <ActionButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving…" : "Create Purchase Order"}
            </ActionButton>
          </div>
        </form>

        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PurchaseOrderStatus | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {purchaseOrderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => downloadCsv(purchaseOrderExportHeaders, visibleOrders.map(purchaseOrderExportRow), "purchase-orders.csv")}
            >
              <Download size={13} /> Export CSV
            </ActionButton>
          </div>
          {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p> : null}
          {!loading && visibleOrders.length === 0 ? (
            <ModuleEmptyState
              icon={Truck}
              title={statusFilter ? "No orders with this status" : "No purchase orders yet"}
              description={statusFilter ? "Try a different status filter." : "Start one from a low-stock vendor group above, or build a custom order with the form."}
            />
          ) : null}
          <div className="grid max-h-[640px] gap-2 overflow-auto">
            {visibleOrders.map((order) => {
              const overdue = isPurchaseOrderOverdue(order);
              return (
              <div key={order.id} className="rounded border border-line bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{order.id}</p>
                    <h3 className="mt-1 text-base font-bold text-ink">{order.vendor}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {overdue ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        Overdue
                      </span>
                    ) : null}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${statusTone[order.status]}`}>{order.status}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">{order.items.map((item) => `${item.name} × ${item.quantityOrdered} ${item.unit}`).join(", ")}</p>
                {order.expectedDeliveryDate ? (
                  <p className="mt-1 text-[11px] text-muted">Expected delivery: {order.expectedDeliveryDate}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/api/pdf/purchase-order?orderId=${encodeURIComponent(order.id)}`}
                    className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-line bg-surface px-2 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
                  >
                    <FileDown size={13} /> PDF
                  </a>
                  {order.status === "Draft" ? (
                    <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(order.id, "Ordered")}>
                      Mark Ordered
                    </ActionButton>
                  ) : null}
                  {order.status === "Ordered" ? (
                    <ActionButton variant="success" size="sm" onClick={() => void setStatus(order.id, "Received")}>
                      Mark Received
                    </ActionButton>
                  ) : null}
                  {order.status === "Draft" || order.status === "Ordered" ? (
                    <ActionButton variant="ghost" size="sm" onClick={() => void setStatus(order.id, "Cancelled")}>
                      Cancel
                    </ActionButton>
                  ) : null}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
