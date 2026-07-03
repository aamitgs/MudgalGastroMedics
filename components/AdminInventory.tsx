"use client";

import { AlertTriangle, Download, PackageCheck, Plus, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/lib/inventory-types";
import { inventoryCategories } from "@/lib/inventory-types";
import { downloadCsv } from "@/lib/table-export";

const inventoryExportHeaders = ["Name", "Category", "Quantity", "Reorder Level", "Unit", "Vendor", "Last Updated"];

function inventoryExportRow(item: InventoryItem) {
  return [
    item.name,
    item.category,
    String(item.quantity),
    String(item.reorderLevel),
    item.unit,
    item.vendor ?? "",
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
    return [
      { label: "Total Items", value: items.length },
      { label: "Low Stock", value: lowStock.length },
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
          <button
            type="button"
            onClick={() => downloadCsv(inventoryExportHeaders, items.map(inventoryExportRow), "inventory.csv")}
            disabled={items.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh Stock
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
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
            <select name="category" className={fieldClass} defaultValue="Consumable">
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
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">
              Save Stock Item
            </button>
          </div>
        </form>

        <div className="grid gap-3">
          {loading ? <p className="rounded border border-line bg-soft/60 p-4 font-semibold text-muted">Loading inventory...</p> : null}
          {!loading && items.length === 0 ? (
            <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
              <PackageCheck className="mx-auto text-brand" size={34} />
              <p className="mt-4 text-xl font-bold text-ink">No stock items yet.</p>
            </div>
          ) : null}
          {items.map((item) => {
            const isLow = item.quantity <= item.reorderLevel;
            return (
              <article key={item.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-ink">{item.name}</h3>
                      <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{item.category}</span>
                      {isLow ? <span className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-red-700 dark:text-red-300"><AlertTriangle size={13} /> Low</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted">Vendor: {item.vendor || "-"} | Reorder at {item.reorderLevel} {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => void adjustQuantity(item.id, -1)} className="grid h-10 w-10 place-items-center rounded border border-line bg-soft font-bold text-ink">-</button>
                    <span className="min-w-28 rounded border border-line bg-surface px-4 py-2 text-center font-bold text-ink">{item.quantity} {item.unit}</span>
                    <button type="button" onClick={() => void adjustQuantity(item.id, 1)} className="grid h-10 w-10 place-items-center rounded border border-line bg-soft font-bold text-ink">+</button>
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
