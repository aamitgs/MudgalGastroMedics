import type { AuditEvent, AuditSeverity } from "@/lib/audit-types";

export type AuditLogSortField = "actorRole" | "action" | "entityType" | "severity" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AuditLogQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AuditLogSortField;
  sortDir?: SortDirection;
  query?: string;
  severity?: AuditSeverity;
};

export type AuditLogQueryResult = {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(event: AuditEvent, query: string) {
  const haystack = [event.actorRole, event.actorId, event.action, event.entityType, event.entityId].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AuditLogSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AuditEvent, right: AuditEvent) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the Audit Log (Track 3.1
 * rollout). Runs over the store's already-bounded event list (retention
 * capped at 1000 events — see lib/audit-store.ts's maxEvents), replacing
 * the old hard `limit=120` fetch that had no way to see older events.
 */
export function queryAuditEvents(allEvents: AuditEvent[], params: AuditLogQueryParams): AuditLogQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allEvents;
  if (params.severity) filtered = filtered.filter((event) => event.severity === params.severity);
  if (query) filtered = filtered.filter((event) => matchesQuery(event, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    events: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
