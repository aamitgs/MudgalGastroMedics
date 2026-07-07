import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";

export type OpdSortField = "patientName" | "token" | "status" | "service" | "createdAt";
export type SortDirection = "asc" | "desc";

export type OpdQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: OpdSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: OpdVisitStatus;
  excludeStatus?: OpdVisitStatus;
};

export type OpdQueryResult = {
  visits: OpdVisit[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(visit: OpdVisit, query: string) {
  const haystack = [visit.token, visit.uhid, visit.patientName, visit.phone, visit.service, visit.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: OpdSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: OpdVisit, right: OpdVisit) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the OPD Queue module
 * (Track 3.1 rollout). Same pure, in-memory shape as the other *-query
 * modules (patient/appointment/lab). Also reused by Doctor Workflow, which
 * operates on the same OpdVisit records and defaults to excludeStatus:
 * "Cancelled" to keep cancelled visits off the doctor's active worklist.
 */
export function queryOpdVisits(allVisits: OpdVisit[], params: OpdQueryParams): OpdQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allVisits;
  if (params.status) filtered = filtered.filter((visit) => visit.status === params.status);
  if (params.excludeStatus) filtered = filtered.filter((visit) => visit.status !== params.excludeStatus);
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
