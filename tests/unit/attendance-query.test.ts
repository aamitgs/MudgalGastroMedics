import { describe, expect, it } from "vitest";
import type { AttendanceRecord } from "@/lib/hr-types";
import { queryAttendance } from "@/lib/attendance-query";

function attendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: "ATT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    staffId: "S1",
    staffName: "Priya Nurse",
    date: "2026-01-01",
    status: "Present",
    ...overrides
  };
}

const fixture: AttendanceRecord[] = [
  attendance({ id: "A1", staffName: "Charlie", status: "Present", createdAt: "2026-01-01T00:00:00.000Z" }),
  attendance({ id: "A2", staffName: "Alice", status: "Absent", createdAt: "2026-01-02T00:00:00.000Z" }),
  attendance({ id: "A3", staffName: "Bob", status: "Half Day", createdAt: "2026-01-03T00:00:00.000Z", date: "2026-01-03" }),
  attendance({ id: "A4", staffName: "Dev", status: "Leave", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAttendance", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAttendance(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.attendance).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.attendance.map((a) => a.id)).toEqual(["A1", "A2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAttendance(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.attendance).toHaveLength(2);
  });

  it("sorts by staff name ascending and descending", () => {
    const asc = queryAttendance(fixture, { page: 0, pageSize: 10, sortBy: "staffName", sortDir: "asc" });
    expect(asc.attendance.map((a) => a.staffName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryAttendance(fixture, { page: 0, pageSize: 10, sortBy: "staffName", sortDir: "desc" });
    expect(desc.attendance.map((a) => a.staffName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across staff name and date", () => {
    const byName = queryAttendance(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.attendance.map((a) => a.id)).toEqual(["A2"]);

    const byDate = queryAttendance(fixture, { page: 0, pageSize: 10, query: "2026-01-03" });
    expect(byDate.attendance.map((a) => a.id)).toEqual(["A3"]);
  });

  it("filters by status", () => {
    const result = queryAttendance(fixture, { page: 0, pageSize: 10, status: "Leave" });
    expect(result.attendance.map((a) => a.id)).toEqual(["A4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryAttendance(fixture, { page: 0, pageSize: 10 });
    expect(result.attendance.map((a) => a.id)).toEqual(["A4", "A3", "A2", "A1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAttendance(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.attendance).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAttendance(fixture, { page: 0, pageSize: 0 }).attendance.length).toBeLessThanOrEqual(1);
    expect(queryAttendance(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
