import type { OpdVisit } from "@/lib/opd-types";

export type BillingSortField = "patientName" | "token" | "service" | "paymentMethod" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";

export type BillingQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: BillingSortField;
  sortDir?: SortDirection;
  query?: string;
  billingStatus?: OpdVisit["billingStatus"];
};

export type BillingQueryResult = {
  visits: OpdVisit[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function amountValue(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchesQuery(visit: OpdVisit, query: string) {
  const haystack = [visit.token, visit.uhid, visit.patientName, visit.phone, visit.service, visit.receiptId].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: BillingSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: OpdVisit, right: OpdVisit) => {
    if (field === "amount") return (amountValue(left.estimatedAmount) - amountValue(right.estimatedAmount)) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for the Billing Summary module
 * (Track 3.1 rollout). Runs against the already-loaded visits array: the
 * stat tiles and payment-method split on the same screen need the complete
 * unfiltered array regardless (aggregate totals), so a server round-trip
 * would add latency without reducing anything actually transferred — same
 * reasoning as IPD and HR. A dedicated module rather than reusing
 * lib/opd-query.ts, since billing filtering/sorting (billingStatus, amount)
 * is a different vocabulary than OPD Queue/Doctor Workflow's clinical
 * status filtering.
 */
export function queryBillingVisits(allVisits: OpdVisit[], params: BillingQueryParams): BillingQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allVisits;
  if (params.billingStatus) filtered = filtered.filter((visit) => visit.billingStatus === params.billingStatus);
  if (query) filtered = filtered.filter((visit) => matchesQuery(visit, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    visits: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
