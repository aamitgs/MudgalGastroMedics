import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listAuditEvents } from "@/lib/audit-store";
import { auditSeverities } from "@/lib/audit-types";
import type { AuditSeverity } from "@/lib/audit-types";
import { queryAuditEvents, type AuditLogSortField, type SortDirection } from "@/lib/audit-log-query";

const sortFields: AuditLogSortField[] = ["actorRole", "action", "entityType", "severity", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "audit-logs", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");

  // Backward compatible: existing callers (verify-auth-flows.mjs) that pass
  // no pagination params keep getting the old { events } shape, honoring a
  // caller-provided limit.
  if (pageParam === null) {
    const limit = Number(params.get("limit") ?? 250);
    return NextResponse.json({ ok: true, events: await listAuditEvents(Number.isFinite(limit) ? limit : 250) });
  }

  const allEvents = await listAuditEvents(1000);
  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const severity = params.get("severity");

  const result = queryAuditEvents(allEvents, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as AuditLogSortField) ? (sortBy as AuditLogSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    severity: severity && auditSeverities.includes(severity as AuditSeverity) ? (severity as AuditSeverity) : undefined
  });

  return NextResponse.json({ ok: true, ...result });
}
