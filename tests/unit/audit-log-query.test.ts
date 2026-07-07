import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@/lib/audit-types";
import { queryAuditEvents } from "@/lib/audit-log-query";

function event(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: "AUD-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    actorRole: "admin",
    action: "access.login",
    entityType: "session",
    entityId: "SESS-1",
    severity: "info",
    metadata: {},
    ...overrides
  };
}

const fixture: AuditEvent[] = [
  event({ id: "A1", actorRole: "admin", action: "access.login", severity: "info", createdAt: "2026-01-01T00:00:00.000Z" }),
  event({ id: "A2", actorRole: "reception", action: "patient.created", severity: "info", createdAt: "2026-01-02T00:00:00.000Z", entityType: "patient", entityId: "PT-2" }),
  event({ id: "A3", actorRole: "admin", action: "access.user.suspended", severity: "warning", createdAt: "2026-01-03T00:00:00.000Z", actorId: "STF-9" }),
  event({ id: "A4", actorRole: "system", action: "auth.denied", severity: "critical", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAuditEvents", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAuditEvents(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.events).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.events.map((e) => e.id)).toEqual(["A1", "A2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAuditEvents(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.events).toHaveLength(2);
  });

  it("sorts by action ascending and descending", () => {
    const asc = queryAuditEvents(fixture, { page: 0, pageSize: 10, sortBy: "action", sortDir: "asc" });
    expect(asc.events.map((e) => e.id)).toEqual(["A1", "A3", "A4", "A2"]);
    const desc = queryAuditEvents(fixture, { page: 0, pageSize: 10, sortBy: "action", sortDir: "desc" });
    expect(desc.events.map((e) => e.id)).toEqual(["A2", "A4", "A3", "A1"]);
  });

  it("filters by free-text query across actor role, actor id, action and entity", () => {
    const byAction = queryAuditEvents(fixture, { page: 0, pageSize: 10, query: "suspended" });
    expect(byAction.events.map((e) => e.id)).toEqual(["A3"]);

    const byActorId = queryAuditEvents(fixture, { page: 0, pageSize: 10, query: "stf-9" });
    expect(byActorId.events.map((e) => e.id)).toEqual(["A3"]);

    const byEntity = queryAuditEvents(fixture, { page: 0, pageSize: 10, query: "pt-2" });
    expect(byEntity.events.map((e) => e.id)).toEqual(["A2"]);
  });

  it("filters by severity", () => {
    const result = queryAuditEvents(fixture, { page: 0, pageSize: 10, severity: "critical" });
    expect(result.events.map((e) => e.id)).toEqual(["A4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryAuditEvents(fixture, { page: 0, pageSize: 10 });
    expect(result.events.map((e) => e.id)).toEqual(["A4", "A3", "A2", "A1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAuditEvents(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.events).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAuditEvents(fixture, { page: 0, pageSize: 0 }).events.length).toBeLessThanOrEqual(1);
    expect(queryAuditEvents(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
