import type { InventoryCategory, InventoryItem } from "@/lib/inventory-types";
import { inventoryExpiryStatus } from "@/lib/inventory-types";

export type InventorySortField = "name" | "category" | "quantity" | "expiryDate" | "lastUpdatedAt";
export type SortDirection = "asc" | "desc";

export type InventoryQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: InventorySortField;
  sortDir?: SortDirection;
  query?: string;
  category?: InventoryCategory;
  lowStockOnly?: boolean;
  expiryOnly?: boolean;
};

export type InventoryQueryResult = {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(item: InventoryItem, query: string) {
  const haystack = [item.name, item.category, item.vendor, item.batchNumber, item.lotNumber].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: InventorySortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: InventoryItem, right: InventoryItem) => {
    if (field === "quantity") return (left.quantity - right.quantity) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Pagination/sorting/filtering for the Inventory module (Track 3.1
 * rollout). Same pure, in-memory shape as the other *-query modules.
 * lowStockOnly and expiryOnly extend the Track 0.2-style safety-
 * visibility pattern: quick access to the stock that actually needs
 * staff attention, same as Lab's criticalOnly and IPD's escalatedOnly.
 */
export function queryInventoryItems(allItems: InventoryItem[], params: InventoryQueryParams): InventoryQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allItems;
  if (params.category) filtered = filtered.filter((item) => item.category === params.category);
  if (params.lowStockOnly) filtered = filtered.filter((item) => item.quantity <= item.reorderLevel);
  if (params.expiryOnly) filtered = filtered.filter((item) => inventoryExpiryStatus(item) !== null);
  if (query) filtered = filtered.filter((item) => matchesQuery(item, query));

  const sortBy = params.sortBy ?? "name";
  const sortDir = params.sortDir ?? "asc";
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
