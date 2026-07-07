import type { CommunicationChannel, CommunicationLog, CommunicationStatus } from "@/lib/communication-types";

export type CommunicationLogSortField = "patientName" | "channel" | "status" | "subject" | "createdAt";
export type SortDirection = "asc" | "desc";

export type CommunicationLogQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: CommunicationLogSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: CommunicationStatus;
  channel?: CommunicationChannel;
};

export type CommunicationLogQueryResult = {
  logs: CommunicationLog[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(log: CommunicationLog, query: string) {
  const haystack = [log.patientName, log.phone, log.uhid, log.subject, log.message, log.owner].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: CommunicationLogSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: CommunicationLog, right: CommunicationLog) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for Communication logs (Track
 * 3.1 rollout). The original UI silently capped this list to the newest 14
 * entries with no way to see the rest — pagination replaces that cap.
 */
export function queryCommunicationLogs(allLogs: CommunicationLog[], params: CommunicationLogQueryParams): CommunicationLogQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allLogs;
  if (params.status) filtered = filtered.filter((log) => log.status === params.status);
  if (params.channel) filtered = filtered.filter((log) => log.channel === params.channel);
  if (query) filtered = filtered.filter((log) => matchesQuery(log, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    logs: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
