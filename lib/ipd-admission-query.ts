import type { IpdAdmission, IpdAdmissionStatus } from "@/lib/ipd-types";

export type IpdAdmissionSortField = "patientName" | "token" | "status" | "ward" | "createdAt";
export type SortDirection = "asc" | "desc";

export type IpdAdmissionQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: IpdAdmissionSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: IpdAdmissionStatus;
  /** Admission ids currently HDU-escalated (Track 0.2-style safety visibility). */
  escalatedIds?: ReadonlySet<string>;
  escalatedOnly?: boolean;
};

export type IpdAdmissionQueryResult = {
  admissions: IpdAdmission[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(admission: IpdAdmission, query: string) {
  const haystack = [admission.id, admission.token, admission.uhid, admission.patientName, admission.phone, admission.bedLabel, admission.status, admission.diagnosis]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: IpdAdmissionSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: IpdAdmission, right: IpdAdmission) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Pagination/sorting/filtering for the IPD admissions list (Track 3.1
 * rollout). Unlike the other *-query modules, this one runs CLIENT-SIDE
 * against the already-loaded admissions array rather than a fresh server
 * fetch: the bed ward map on the same screen needs the complete,
 * unpaginated admissions list regardless, so a server round-trip for a
 * "page" of admissions would add latency without reducing what's already
 * transferred. Same pure shape as the other *-query modules for
 * consistency and testability.
 */
export function queryIpdAdmissions(allAdmissions: IpdAdmission[], params: IpdAdmissionQueryParams): IpdAdmissionQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allAdmissions;
  if (params.status) filtered = filtered.filter((admission) => admission.status === params.status);
  if (params.escalatedOnly) filtered = filtered.filter((admission) => params.escalatedIds?.has(admission.id));
  if (query) filtered = filtered.filter((admission) => matchesQuery(admission, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    admissions: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
