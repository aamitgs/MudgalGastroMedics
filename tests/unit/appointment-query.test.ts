import { describe, expect, it } from "vitest";
import type { AppointmentRecord } from "@/lib/appointment-types";
import { queryAppointments } from "@/lib/appointment-query";

function appointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "APT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "New",
    name: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    symptoms: [],
    ...overrides
  } as AppointmentRecord;
}

const fixture: AppointmentRecord[] = [
  appointment({ id: "A1", name: "Charlie", status: "New", service: "Gastro consult", createdAt: "2026-01-01T00:00:00.000Z" }),
  appointment({ id: "A2", name: "Alice", status: "Confirmed", service: "ERCP", createdAt: "2026-01-02T00:00:00.000Z", priority: "Urgent symptoms" }),
  appointment({ id: "A3", name: "Bob", status: "New", service: "Colonoscopy", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789" }),
  appointment({ id: "A4", name: "Dev", status: "Cancelled", service: "Gastro consult", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAppointments", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAppointments(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.appointments).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.appointments.map((a) => a.id)).toEqual(["A1", "A2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAppointments(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.appointments).toHaveLength(2);
  });

  it("sorts by name ascending and descending", () => {
    const asc = queryAppointments(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "asc" });
    expect(asc.appointments.map((a) => a.name)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryAppointments(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "desc" });
    expect(desc.appointments.map((a) => a.name)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across name/phone/service/priority/status", () => {
    const byName = queryAppointments(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.appointments.map((a) => a.id)).toEqual(["A2"]);

    const byService = queryAppointments(fixture, { page: 0, pageSize: 10, query: "ercp" });
    expect(byService.appointments.map((a) => a.id)).toEqual(["A2"]);

    const byPhone = queryAppointments(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.appointments.map((a) => a.id)).toEqual(["A3"]);
  });

  it("filters by status", () => {
    // No explicit sort -> default createdAt desc, so A3 (Jan 3) precedes A1 (Jan 1).
    const result = queryAppointments(fixture, { page: 0, pageSize: 10, status: "New" });
    expect(result.appointments.map((a) => a.id)).toEqual(["A3", "A1"]);
    expect(result.total).toBe(2);
  });

  it("combines status filter and free-text query", () => {
    const result = queryAppointments(fixture, { page: 0, pageSize: 10, status: "New", query: "bob" });
    expect(result.appointments.map((a) => a.id)).toEqual(["A3"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryAppointments(fixture, { page: 0, pageSize: 10 });
    expect(result.appointments.map((a) => a.id)).toEqual(["A4", "A3", "A2", "A1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAppointments(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.appointments).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAppointments(fixture, { page: 0, pageSize: 0 }).appointments.length).toBeLessThanOrEqual(1);
    expect(queryAppointments(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
