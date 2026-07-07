import { describe, expect, it } from "vitest";
import { queryPatients } from "@/lib/patient-query";
import type { PatientRecord } from "@/lib/patient-types";

function patient(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id: "PAT-1",
    uhid: "MGM-2026-00001",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Active",
    name: "Asha Verma",
    phone: "9876543210",
    ...overrides
  };
}

const fixture: PatientRecord[] = [
  patient({ id: "P1", uhid: "MGM-2026-00001", name: "Charlie", status: "Active", createdAt: "2026-01-01T00:00:00.000Z", lastVisitAt: "2026-01-05T00:00:00.000Z" }),
  patient({ id: "P2", uhid: "MGM-2026-00002", name: "Alice", status: "Flagged", createdAt: "2026-01-02T00:00:00.000Z", allergies: "Penicillin" }),
  patient({ id: "P3", uhid: "MGM-2026-00003", name: "Bob", status: "Active", createdAt: "2026-01-03T00:00:00.000Z", city: "Agra" }),
  patient({ id: "P4", uhid: "MGM-2026-00004", name: "Dev", status: "Inactive", createdAt: "2026-01-04T00:00:00.000Z", phone: "9123456789" })
];

describe("queryPatients", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryPatients(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.patients).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.patients.map((p) => p.id)).toEqual(["P1", "P2"]);
  });

  it("returns the second page correctly", () => {
    const result = queryPatients(fixture, { page: 1, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.patients.map((p) => p.id)).toEqual(["P3", "P4"]);
    expect(result.page).toBe(1);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryPatients(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.patients).toHaveLength(2);
  });

  it("sorts by name ascending and descending", () => {
    const asc = queryPatients(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "asc" });
    expect(asc.patients.map((p) => p.name)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryPatients(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "desc" });
    expect(desc.patients.map((p) => p.name)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across uhid/name/phone/city", () => {
    const byName = queryPatients(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.patients.map((p) => p.id)).toEqual(["P2"]);

    const byCity = queryPatients(fixture, { page: 0, pageSize: 10, query: "agra" });
    expect(byCity.patients.map((p) => p.id)).toEqual(["P3"]);

    const byPhone = queryPatients(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.patients.map((p) => p.id)).toEqual(["P4"]);
  });

  it("filters by status", () => {
    const result = queryPatients(fixture, { page: 0, pageSize: 10, status: "Flagged" });
    expect(result.patients.map((p) => p.id)).toEqual(["P2"]);
    expect(result.total).toBe(1);
  });

  it("combines status filter and free-text query", () => {
    const result = queryPatients(fixture, { page: 0, pageSize: 10, status: "Active", query: "bob" });
    expect(result.patients.map((p) => p.id)).toEqual(["P3"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryPatients(fixture, { page: 0, pageSize: 10 });
    expect(result.patients.map((p) => p.id)).toEqual(["P4", "P3", "P2", "P1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryPatients(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.patients).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryPatients(fixture, { page: 0, pageSize: 0 }).patients.length).toBeLessThanOrEqual(1);
    expect(queryPatients(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
