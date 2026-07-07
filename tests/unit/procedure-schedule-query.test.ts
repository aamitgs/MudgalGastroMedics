import { describe, expect, it } from "vitest";
import type { ProcedureSchedule } from "@/lib/procedure-types";
import { defaultProcedureChecklist } from "@/lib/procedure-types";
import { queryProcedureSchedules } from "@/lib/procedure-schedule-query";

function schedule(overrides: Partial<ProcedureSchedule> = {}): ProcedureSchedule {
  return {
    id: "PROC-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    visitId: "V-1",
    token: "T-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    procedureSlug: "upper-gi-endoscopy",
    procedureTitle: "Upper GI Endoscopy",
    scheduledDate: "2026-01-10",
    scheduledTime: "09:00",
    room: "Endoscopy Room",
    doctor: "Dr. Deepak Kumar Sharma",
    priority: "Routine",
    status: "Planned",
    checklist: { ...defaultProcedureChecklist },
    ...overrides
  };
}

const fixture: ProcedureSchedule[] = [
  schedule({ id: "P1", patientName: "Charlie", procedureTitle: "Colonoscopy", room: "Procedure Room", status: "Planned", createdAt: "2026-01-01T00:00:00.000Z" }),
  schedule({ id: "P2", patientName: "Alice", procedureTitle: "ERCP", room: "ERCP Suite", status: "In Procedure", createdAt: "2026-01-02T00:00:00.000Z" }),
  schedule({
    id: "P3",
    patientName: "Bob",
    procedureTitle: "Upper GI Endoscopy",
    room: "Endoscopy Room",
    status: "Completed",
    createdAt: "2026-01-03T00:00:00.000Z",
    phone: "9123456789"
  }),
  schedule({ id: "P4", patientName: "Dev", procedureTitle: "Colonoscopy", room: "Procedure Room", status: "Cancelled", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryProcedureSchedules", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryProcedureSchedules(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.schedules).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.schedules.map((s) => s.id)).toEqual(["P1", "P2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryProcedureSchedules(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.schedules).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.schedules.map((s) => s.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.schedules.map((s) => s.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across patient, procedure title and room", () => {
    const byName = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.schedules.map((s) => s.id)).toEqual(["P2"]);

    const byRoom = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, query: "ercp suite" });
    expect(byRoom.schedules.map((s) => s.id)).toEqual(["P2"]);

    const byProcedure = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, query: "colonoscopy" });
    expect(byProcedure.schedules.map((s) => s.id)).toEqual(["P4", "P1"]);
  });

  it("filters by status", () => {
    const result = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, status: "Cancelled" });
    expect(result.schedules.map((s) => s.id)).toEqual(["P4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryProcedureSchedules(fixture, { page: 0, pageSize: 10 });
    expect(result.schedules.map((s) => s.id)).toEqual(["P4", "P3", "P2", "P1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryProcedureSchedules(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.schedules).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryProcedureSchedules(fixture, { page: 0, pageSize: 0 }).schedules.length).toBeLessThanOrEqual(1);
    expect(queryProcedureSchedules(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
