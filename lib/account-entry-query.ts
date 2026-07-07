import type { AccountEntry, AccountEntryType } from "@/lib/finance-types";

export type AccountEntrySortField = "date" | "category" | "type" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AccountEntryQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AccountEntrySortField;
  sortDir?: SortDirection;
  query?: string;
  type?: AccountEntryType;
};

export type AccountEntryQueryResult = {
  entries: AccountEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(entry: AccountEntry, query: string) {
  const haystack = [entry.category, entry.party, entry.reference, entry.notes, entry.method].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AccountEntrySortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AccountEntry, right: AccountEntry) => {
    if (field === "amount") return (left.amount - right.amount) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for the account ledger
 * (Track 3.1 rollout). Same reasoning as Insurance Claims on this same
 * screen — runs against the already-loaded entries array.
 */
export function queryAccountEntries(allEntries: AccountEntry[], params: AccountEntryQueryParams): AccountEntryQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allEntries;
  if (params.type) filtered = filtered.filter((entry) => entry.type === params.type);
  if (query) filtered = filtered.filter((entry) => matchesQuery(entry, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    entries: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
