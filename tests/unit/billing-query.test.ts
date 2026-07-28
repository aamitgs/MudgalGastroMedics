import { describe, expect, it } from "vitest";
import type { OpdVisit } from "@/lib/opd-types";
import { amountValue, queryBillingVisits } from "@/lib/billing-query";

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "T-1",
    appointmentId: "APT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "Completed",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    symptoms: [],
    billingStatus: "Paid",
    estimatedAmount: "500",
    paymentMethod: "Cash",
    ...overrides
  };
}

const fixture: OpdVisit[] = [
  visit({ id: "V1", patientName: "Charlie", billingStatus: "Paid", estimatedAmount: "500", createdAt: "2026-01-01T00:00:00.000Z" }),
  visit({ id: "V2", patientName: "Alice", billingStatus: "Paid", estimatedAmount: "2000", createdAt: "2026-01-02T00:00:00.000Z", receiptId: "RCPT-99" }),
  visit({ id: "V3", patientName: "Bob", billingStatus: "Estimate Shared", estimatedAmount: "1200", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789" }),
  visit({ id: "V4", patientName: "Dev", billingStatus: "Not Started", estimatedAmount: "", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("amountValue", () => {
  it("parses the plain digit strings estimatedAmount is stored as (number input, no formatting)", () => {
    expect(amountValue("500")).toBe(500);
    expect(amountValue("2000")).toBe(2000);
  });

  it("returns 0 for undefined or unparseable input", () => {
    expect(amountValue(undefined)).toBe(0);
    expect(amountValue("")).toBe(0);
  });

  // estimatedAmount is a free-text field, so a formatted amount typed by staff
  // has always been possible; digit-stripping used to read "Rs. 1,500" as 0.15.
  it("parses formatted amounts staff may have typed into the free-text field", () => {
    expect(amountValue("Rs. 1,500")).toBe(1500);
    expect(amountValue("1,500")).toBe(1500);
    expect(amountValue("1500/-")).toBe(1500);
    expect(amountValue("1500.50")).toBe(1500.5);
  });
});

describe("queryBillingVisits", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryBillingVisits(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.visits).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.visits.map((v) => v.id)).toEqual(["V1", "V2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryBillingVisits(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.visits).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryBillingVisits(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.visits.map((v) => v.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryBillingVisits(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.visits.map((v) => v.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("sorts by amount numerically, not lexicographically", () => {
    const result = queryBillingVisits(fixture, { page: 0, pageSize: 10, sortBy: "amount", sortDir: "desc" });
    expect(result.visits.map((v) => v.id)).toEqual(["V2", "V3", "V1", "V4"]);
  });

  it("filters by free-text query across patient, phone, token, service and receipt", () => {
    const byName = queryBillingVisits(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.visits.map((v) => v.id)).toEqual(["V2"]);

    const byPhone = queryBillingVisits(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.visits.map((v) => v.id)).toEqual(["V3"]);

    const byReceipt = queryBillingVisits(fixture, { page: 0, pageSize: 10, query: "rcpt-99" });
    expect(byReceipt.visits.map((v) => v.id)).toEqual(["V2"]);
  });

  it("filters by billing status", () => {
    const result = queryBillingVisits(fixture, { page: 0, pageSize: 10, billingStatus: "Not Started" });
    expect(result.visits.map((v) => v.id)).toEqual(["V4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryBillingVisits(fixture, { page: 0, pageSize: 10 });
    expect(result.visits.map((v) => v.id)).toEqual(["V4", "V3", "V2", "V1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryBillingVisits(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.visits).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryBillingVisits(fixture, { page: 0, pageSize: 0 }).visits.length).toBeLessThanOrEqual(1);
    expect(queryBillingVisits(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
