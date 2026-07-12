"use client";

import { AlertTriangle, CalendarClock, CalendarX, Download, PackageCheck, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { InventoryCategory, InventoryItem } from "@/lib/inventory-types";
import { inventoryCategories, inventoryExpirySoonDays, inventoryExpiryStatus } from "@/lib/inventory-types";
import type { InventorySortField } from "@/lib/inventory-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { AdminPurchaseOrders } from "@/components/inventory/AdminPurchaseOrders";
import { notify } from "@/lib/notify";

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

type InventoryListResponse = {
  ok: boolean;
  items?: InventoryItem[];
  item?: InventoryItem;
  pageCount?: number;
  stats?: { total: number; lowStock: number; expiryAlerts: number; medicines: number; procedureKits: number };
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, expiryAlerts: 0, medicines: 0, procedureKits: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | "">("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiryOnly, setExpiryOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortField = (sorting[0]?.id as InventorySortField | undefined) ?? "name";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadItems() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (categoryFilter) params.set("category", categoryFilter);
    if (lowStockOnly) params.set("lowStockOnly", "true");
    if (expiryOnly) params.set("expiryOnly", "true");

    const response = await fetch(`/api/inventory?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as InventoryListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load inventory.");
      setLoading(false);
      return;
    }
    setItems(data.items ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, categoryFilter, lowStockOnly, expiryOnly]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateCategoryFilter(value: InventoryCategory | "") {
    setCategoryFilter(value);
    setPageIndex(0);
  }

  function toggleLowStockOnly(value: boolean) {
    setLowStockOnly(value);
    setPageIndex(0);
  }

  function toggleExpiryOnly(value: boolean) {
    setExpiryOnly(value);
    setPageIndex(0);
  }

  async function adjustQuantity(id: string, delta: number) {
    const response = await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delta })
    });
    const data = (await response.json().catch(() => ({}))) as InventoryListResponse;
    if (!response.ok || !data.ok || !data.item) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed adjustment must not blank the list.
      notify.error(data.error || "Unable to update inventory.");
      return;
    }
    const updated = data.item as InventoryItem;
    setItems((entries) => entries.map((entry) => (entry.id === id ? updated : entry)));
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
    const data = (await response.json().catch(() => ({}))) as InventoryListResponse;
    if (!response.ok || !data.ok || !data.item) {
      notify.error(data.error || "Unable to add inventory item.");
      return;
    }
    notify.success("Stock item saved");
    form.reset();
    void loadItems();
  }

  const statTiles = useMemo(
    () => [
      { label: "Total Items", value: stats.total },
      { label: "Low Stock", value: stats.lowStock },
      { label: `Expiry ≤${inventoryExpirySoonDays}d`, value: stats.expiryAlerts },
      { label: "Medicines", value: stats.medicines },
      { label: "Procedure Kits", value: stats.procedureKits }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<InventoryItem, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 190,
        cell: ({ row }) => <span className="font-bold text-ink">{row.original.name}</span>
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 130,
        cell: ({ row }) => <span className="rounded-full border border-line bg-soft px-2 py-0.5 text-xs font-bold uppercase text-muted">{row.original.category}</span>
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        size: 170,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <ActionButton variant="secondary" size="sm" onClick={() => void adjustQuantity(row.original.id, -1)} aria-label={`Decrease ${row.original.name} quantity`} className="h-7 w-7 min-h-7 px-0">
              -
            </ActionButton>
            <span className="min-w-16 text-center text-sm font-bold text-ink">
              {row.original.quantity} {row.original.unit}
            </span>
            <ActionButton variant="secondary" size="sm" onClick={() => void adjustQuantity(row.original.id, 1)} aria-label={`Increase ${row.original.name} quantity`} className="h-7 w-7 min-h-7 px-0">
              +
            </ActionButton>
            {row.original.quantity <= row.original.reorderLevel ? (
              <span title={`Reorder at ${row.original.reorderLevel}`}>
                <AlertTriangle size={14} className="text-red-600" />
              </span>
            ) : null}
          </div>
        )
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        size: 150,
        cell: ({ row }) => row.original.vendor || "—"
      },
      {
        id: "batchLot",
        header: "Batch / Lot",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => [row.original.batchNumber, row.original.lotNumber].filter(Boolean).join(" / ") || "—"
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        size: 160,
        cell: ({ row }) => {
          const status = inventoryExpiryStatus(row.original);
          if (status === "expired") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <CalendarX size={12} /> Expired {row.original.expiryDate}
              </span>
            );
          }
          if (status === "expiring-soon") {
            return (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <CalendarClock size={12} /> {row.original.expiryDate}
              </span>
            );
          }
          return row.original.expiryDate || "—";
        }
      },
      {
        accessorKey: "lastUpdatedAt",
        header: "Updated",
        size: 110,
        cell: ({ row }) => new Date(row.original.lastUpdatedAt).toLocaleDateString("en-IN")
      }
    ],
    []
  );

  return (
    <div className="grid gap-6">
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Pharmacy + Inventory</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Stock control</h2>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-5">
        {statTiles.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={addItem} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <Plus size={19} /> Add / update stock item
          </p>
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

        <DataTable
          columns={columns}
          data={items}
          getRowId={(item) => item.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search item, vendor, batch, lot"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadItems()}
          emptyState={{
            icon: PackageCheck,
            title: globalFilter || categoryFilter || lowStockOnly || expiryOnly ? "No stock items match your filters" : "No stock items yet",
            description:
              globalFilter || categoryFilter || lowStockOnly || expiryOnly
                ? "Try a different search term, or clear the category/stock/expiry filters."
                : "Add your first medicine, consumable or procedure kit with the form — quantities, reorder levels and expiry tracking start immediately.",
            action: globalFilter || categoryFilter || lowStockOnly || expiryOnly ? "Clear filters" : undefined,
            onAction:
              globalFilter || categoryFilter || lowStockOnly || expiryOnly
                ? () => {
                    setGlobalFilter("");
                    setCategoryFilter("");
                    setLowStockOnly(false);
                    setExpiryOnly(false);
                  }
                : undefined
          }}
          export={{ headers: inventoryExportHeaders, row: inventoryExportRow, filename: "inventory.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <>
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(event) => updateCategoryFilter(event.target.value as InventoryCategory | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All categories</option>
                {inventoryCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                <input type="checkbox" checked={lowStockOnly} onChange={(event) => toggleLowStockOnly(event.target.checked)} className="h-4 w-4 accent-red-600" />
                Low stock
              </label>
              <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                <input type="checkbox" checked={expiryOnly} onChange={(event) => toggleExpiryOnly(event.target.checked)} className="h-4 w-4 accent-amber-600" />
                Expiry alerts
              </label>
            </>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(inventoryExportHeaders, selected.map(inventoryExportRow), "selected-inventory.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />
      </div>
    </div>

    <AdminPurchaseOrders />
    </div>
  );
}
