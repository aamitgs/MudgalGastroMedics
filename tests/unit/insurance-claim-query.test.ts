import { describe, expect, it } from "vitest";
import type { InsuranceClaim } from "@/lib/finance-types";
import { queryInsuranceClaims } from "@/lib/insurance-claim-query";

function claim(overrides: Partial<InsuranceClaim> = {}): InsuranceClaim {
  return {
    id: "CLM-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    patientName: "Priya Sharma",
    phone: "9900000001",
    insurer: "Star Health",
    requestedAmount: 10000,
    approvedAmount: 0,
    settledAmount: 0,
    status: "Draft",
    ...overrides
  };
}

const fixture: InsuranceClaim[] = [
  claim({ id: "C1", patientName: "Charlie", insurer: "Star Health", status: "Draft", settledAmount: 0, createdAt: "2026-01-01T00:00:00.000Z" }),
  claim({ id: "C2", patientName: "Alice", insurer: "HDFC Ergo", status: "Approved", settledAmount: 5000, createdAt: "2026-01-02T00:00:00.000Z", policyNumber: "POL-99" }),
  claim({ id: "C3", patientName: "Bob", insurer: "ICICI Lombard", status: "Settled", settledAmount: 20000, createdAt: "2026-01-03T00:00:00.000Z", claimNumber: "CLN-77" }),
  claim({ id: "C4", patientName: "Dev", insurer: "Star Health", status: "Rejected", settledAmount: 0, createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryInsuranceClaims", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryInsuranceClaims(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.claims).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.claims.map((c) => c.id)).toEqual(["C1", "C2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryInsuranceClaims(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.claims).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.claims.map((c) => c.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.claims.map((c) => c.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("sorts by settled amount numerically, not lexicographically", () => {
    const result = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, sortBy: "settledAmount", sortDir: "desc" });
    expect(result.claims.map((c) => c.id)).toEqual(["C3", "C2", "C1", "C4"]);
  });

  it("filters by free-text query across patient, insurer, policy and claim number", () => {
    const byName = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.claims.map((c) => c.id)).toEqual(["C2"]);

    const byPolicy = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, query: "pol-99" });
    expect(byPolicy.claims.map((c) => c.id)).toEqual(["C2"]);

    const byClaimNumber = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, query: "cln-77" });
    expect(byClaimNumber.claims.map((c) => c.id)).toEqual(["C3"]);

    const byInsurer = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, query: "star health" });
    expect(byInsurer.claims.map((c) => c.id)).toEqual(["C4", "C1"]);
  });

  it("filters by status", () => {
    const result = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, status: "Settled" });
    expect(result.claims.map((c) => c.id)).toEqual(["C3"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryInsuranceClaims(fixture, { page: 0, pageSize: 10 });
    expect(result.claims.map((c) => c.id)).toEqual(["C4", "C3", "C2", "C1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryInsuranceClaims(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.claims).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryInsuranceClaims(fixture, { page: 0, pageSize: 0 }).claims.length).toBeLessThanOrEqual(1);
    expect(queryInsuranceClaims(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
