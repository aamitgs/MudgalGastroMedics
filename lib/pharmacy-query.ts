import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";

export type PharmacySortField = "patientName" | "token" | "total" | "createdAt";
export type SortDirection = "asc" | "desc";
export type PharmacyPaymentFilter = "Unpaid" | "Paid";

export type PharmacyQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: PharmacySortField;
  sortDir?: SortDirection;
  query?: string;
  paymentStatus?: PharmacyPaymentFilter;
};

export type PharmacyQueryResult = {
  dispenses: PharmacyDispenseRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(record: PharmacyDispenseRecord, query: string) {
  const haystack = [record.id, record.dispenseNo, record.visitNo, record.token, record.uhid, record.patientName, record.phone, record.service, record.items.map((item) => item.name).join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: PharmacySortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: PharmacyDispenseRecord, right: PharmacyDispenseRecord) => {
    if (field === "total") return (left.total - right.total) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the Pharmacy module
 * (Track 3.1 rollout). Same pure, in-memory shape as the other *-query
 * modules. Shows all dispenses regardless of status, matching the prior
 * card view exactly (it never filtered by status) — no behavior change.
 */
export function queryPharmacyDispenses(allDispenses: PharmacyDispenseRecord[], params: PharmacyQueryParams): PharmacyQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allDispenses;
  if (params.paymentStatus) filtered = filtered.filter((record) => record.paymentStatus === params.paymentStatus);
  if (query) filtered = filtered.filter((record) => matchesQuery(record, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    dispenses: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
