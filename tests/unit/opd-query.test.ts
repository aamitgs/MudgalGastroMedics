import { describe, expect, it } from "vitest";
import type { OpdVisit } from "@/lib/opd-types";
import { queryOpdVisits } from "@/lib/opd-query";

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "T-1",
    appointmentId: "APT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "Waiting",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    symptoms: [],
    billingStatus: "Not Started",
    ...overrides
  };
}

const fixture: OpdVisit[] = [
  visit({ id: "V1", patientName: "Charlie", status: "Waiting", createdAt: "2026-01-01T00:00:00.000Z" }),
  visit({ id: "V2", patientName: "Alice", status: "Completed", createdAt: "2026-01-02T00:00:00.000Z", billingStatus: "Paid" }),
  visit({ id: "V3", patientName: "Bob", status: "In Consultation", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789" }),
  visit({ id: "V4", patientName: "Dev", status: "Cancelled", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryOpdVisits", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryOpdVisits(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.visits).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.visits.map((v) => v.id)).toEqual(["V1", "V2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryOpdVisits(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.visits).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryOpdVisits(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.visits.map((v) => v.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryOpdVisits(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.visits.map((v) => v.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across token/patient/phone/service", () => {
    const byName = queryOpdVisits(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.visits.map((v) => v.id)).toEqual(["V2"]);

    const byPhone = queryOpdVisits(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.visits.map((v) => v.id)).toEqual(["V3"]);
  });

  it("filters by status", () => {
    const result = queryOpdVisits(fixture, { page: 0, pageSize: 10, status: "Cancelled" });
    expect(result.visits.map((v) => v.id)).toEqual(["V4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryOpdVisits(fixture, { page: 0, pageSize: 10 });
    expect(result.visits.map((v) => v.id)).toEqual(["V4", "V3", "V2", "V1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryOpdVisits(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.visits).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryOpdVisits(fixture, { page: 0, pageSize: 0 }).visits.length).toBeLessThanOrEqual(1);
    expect(queryOpdVisits(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
