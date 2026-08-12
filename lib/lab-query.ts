import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";

export type LabSortField = "patientName" | "token" | "status" | "priority" | "createdAt";
export type SortDirection = "asc" | "desc";

export type LabQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: LabSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: LabOrderStatus;
  criticalOnly?: boolean;
};

export type LabQueryResult = {
  orders: LabOrder[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(order: LabOrder, query: string) {
  const haystack = [order.id, order.orderNo, order.visitNo, order.token, order.uhid, order.patientName, order.phone, order.tests.join(" "), order.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function isCriticalUnacknowledged(order: LabOrder) {
  return Boolean(order.criticalFlag) && !order.criticalAcknowledgedAt && order.status !== "Cancelled";
}

function compareBy(field: LabSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: LabOrder, right: LabOrder) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the Laboratory module
 * (Track 3.1 rollout). Same pure, in-memory shape as lib/patient-query.ts
 * and lib/appointment-query.ts. criticalOnly surfaces unacknowledged
 * critical results (Track 0.2) ahead of everything else in the queue.
 */
export function queryLabOrders(allOrders: LabOrder[], params: LabQueryParams): LabQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allOrders;
  if (params.status) filtered = filtered.filter((order) => order.status === params.status);
  if (params.criticalOnly) filtered = filtered.filter(isCriticalUnacknowledged);
  if (query) filtered = filtered.filter((order) => matchesQuery(order, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    orders: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
