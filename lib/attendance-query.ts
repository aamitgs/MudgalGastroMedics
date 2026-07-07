import type { AttendanceRecord, AttendanceStatus } from "@/lib/hr-types";

export type AttendanceSortField = "staffName" | "date" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AttendanceQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AttendanceSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: AttendanceStatus;
};

export type AttendanceQueryResult = {
  attendance: AttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(record: AttendanceRecord, query: string) {
  const haystack = [record.staffName, record.date, record.status].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AttendanceSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AttendanceRecord, right: AttendanceRecord) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for the attendance log
 * (Track 3.1 rollout). Runs against the already-loaded attendance array:
 * the module's "Present Today" stat needs the complete history to filter
 * by date, so the full set is resident in memory regardless — same
 * reasoning as the Staff Directory table on this same screen.
 */
export function queryAttendance(allAttendance: AttendanceRecord[], params: AttendanceQueryParams): AttendanceQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allAttendance;
  if (params.status) filtered = filtered.filter((record) => record.status === params.status);
  if (query) filtered = filtered.filter((record) => matchesQuery(record, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    attendance: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
