import type { ProcedureSchedule, ProcedureScheduleStatus } from "@/lib/procedure-types";

export type ProcedureScheduleSortField = "patientName" | "procedureTitle" | "room" | "status" | "scheduledDate" | "createdAt";
export type SortDirection = "asc" | "desc";

export type ProcedureScheduleQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: ProcedureScheduleSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: ProcedureScheduleStatus;
};

export type ProcedureScheduleQueryResult = {
  schedules: ProcedureSchedule[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(schedule: ProcedureSchedule, query: string) {
  const haystack = [schedule.id, schedule.token, schedule.uhid, schedule.patientName, schedule.procedureTitle, schedule.room, schedule.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: ProcedureScheduleSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: ProcedureSchedule, right: ProcedureSchedule) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for Procedure Scheduling
 * (Track 3.1 rollout). Same shape as lib/lab-query.ts: only the schedules
 * array is paginated — the create-schedule form's OPD visit/procedure
 * dropdowns are separate arrays passed through unpaginated.
 */
export function queryProcedureSchedules(allSchedules: ProcedureSchedule[], params: ProcedureScheduleQueryParams): ProcedureScheduleQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allSchedules;
  if (params.status) filtered = filtered.filter((schedule) => schedule.status === params.status);
  if (query) filtered = filtered.filter((schedule) => matchesQuery(schedule, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    schedules: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
