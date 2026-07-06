"use client";

import { AlertTriangle, CalendarClock, CalendarX, Download, PackageCheck, Plus, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/lib/inventory-types";
import { inventoryCategories, inventoryExpirySoonDays, inventoryExpiryStatus } from "@/lib/inventory-types";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const inventoryExportHeaders = ["Name", "Category", "Quantity", "Reorder Level", "Unit", "Vendor", "Batch", "Lot", "Expiry", "Last Updated"];

function inventoryExportRow(item: InventoryItem) {
  return [
    item.name,
    item.category,
    String(item.quantity),
    String(item.reorderLevel),
    item.unit,
    item.vendor ?? "",
    item.batchNumber ?? "",
    item.lotNumber ?? "",
    item.expiryDate ?? "",
    item.lastUpdatedAt
  ];
}

type InventoryResponse = {
  ok: boolean;
  items?: InventoryItem[];
  item?: InventoryItem;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/inventory", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as InventoryResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load inventory.");
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function adjustQuantity(id: string, delta: number) {
    const response = await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delta })
    });
    const data = (await response.json().catch(() => ({}))) as InventoryResponse;
    if (!response.ok || !data.ok || !data.item) {
      setError(data.error || "Unable to update inventory.");
      return;
    }
    setItems((entries) => entries.map((entry) => (entry.id === id ? data.item as InventoryItem : entry)));
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as InventoryResponse;
    if (!response.ok || !data.ok || !data.item) {
      setError(data.error || "Unable to add inventory item.");
      return;
    }
    setItems((entries) => [data.item as InventoryItem, ...entries.filter((entry) => entry.id !== data.item?.id)]);
    form.reset();
  }

  useEffect(() => {
    let active = true;

    async function loadInitialItems() {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as InventoryResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load inventory.");
        setLoading(false);
        return;
      }
      setItems(data.items ?? []);
      setLoading(false);
    }

    void loadInitialItems();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const lowStock = items.filter((item) => item.quantity <= item.reorderLevel);
    const expiryAlerts = items.filter((item) => inventoryExpiryStatus(item) !== null);
    return [
      { label: "Total Items", value: items.length },
      { label: "Low Stock", value: lowStock.length },
      { label: `Expiry ≤${inventoryExpirySoonDays}d`, value: expiryAlerts.length },
      { label: "Medicines", value: items.filter((item) => item.category === "Medicine").length },
      { label: "Procedure Kits", value: items.filter((item) => item.category === "Procedure Kit").length }
    ];
  }, [items]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Pharmacy + Inventory</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Stock control</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            variant="secondary"
            onClick={() => downloadCsv(inventoryExportHeaders, items.map(inventoryExportRow), "inventory.csv")}
            disabled={items.length === 0}
          >
            <Download size={17} /> Export CSV
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => void loadItems()}>
            <RefreshCw size={17} /> Refresh Stock
          </ActionButton>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={addItem} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Plus size={19} /> Add / update stock item</p>
          <div className="grid gap-3">
            <input name="name" className={fieldClass} placeholder="Item name" required />
            <select aria-label="Category" name="category" className={fieldClass} defaultValue="Consumable">
              {inventoryCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="quantity" type="number" min="0" className={fieldClass} placeholder="Qty" required />
              <input name="reorderLevel" type="number" min="0" className={fieldClass} placeholder="Reorder" required />
              <input name="unit" className={fieldClass} placeholder="Unit" defaultValue="pcs" />
            </div>
            <input name="vendor" className={fieldClass} placeholder="Vendor / supplier" />
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="batchNumber" className={fieldClass} placeholder="Batch no." />
              <input name="lotNumber" className={fieldClass} placeholder="Lot no." />
              <input name="expiryDate" type="date" aria-label="Expiry date" className={fieldClass} />
            </div>
            <ActionButton type="submit" variant="primary">
              Save Stock Item
            </ActionButton>
          </div>
        </form>

        <div className="grid gap-3">
          {loading ? <ModuleSkeleton /> : null}
          {!loading && items.length === 0 ? (
            <ModuleEmptyState
              icon={PackageCheck}
              title="No stock items yet"
              description="Add your first medicine, consumable or procedure kit with the form — quantities, reorder levels and expiry tracking start immediately."
            />
          ) : null}
          {items.map((item) => {
            const isLow = item.quantity <= item.reorderLevel;
            const expiry = inventoryExpiryStatus(item);
            return (
              <article key={item.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-ink">{item.name}</h3>
                      <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{item.category}</span>
                      {isLow ? <span className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-red-700 dark:text-red-300"><AlertTriangle size={13} /> Low</span> : null}
                      {expiry === "expired" ? <span className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-red-700 dark:text-red-300"><CalendarX size={13} /> Expired {item.expiryDate}</span> : null}
                      {expiry === "expiring-soon" ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300"><CalendarClock size={13} /> Expires {item.expiryDate}</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Vendor: {item.vendor || "-"} | Reorder at {item.reorderLevel} {item.unit}
                      {item.batchNumber ? ` | Batch ${item.batchNumber}` : ""}
                      {item.lotNumber ? ` | Lot ${item.lotNumber}` : ""}
                      {item.expiryDate && !expiry ? ` | Expires ${item.expiryDate}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionButton variant="secondary" onClick={() => void adjustQuantity(item.id, -1)} aria-label={`Decrease ${item.name} quantity`} className="h-10 w-10 min-h-10 px-0">-</ActionButton>
                    <span className="min-w-28 rounded border border-line bg-surface px-4 py-2 text-center font-bold text-ink">{item.quantity} {item.unit}</span>
                    <ActionButton variant="secondary" onClick={() => void adjustQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`} className="h-10 w-10 min-h-10 px-0">+</ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
