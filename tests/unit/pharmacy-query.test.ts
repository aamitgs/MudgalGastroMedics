import { describe, expect, it } from "vitest";
import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";
import { queryPharmacyDispenses } from "@/lib/pharmacy-query";

function dispense(overrides: Partial<PharmacyDispenseRecord> = {}): PharmacyDispenseRecord {
  return {
    id: "PH-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Dispensed",
    visitId: "V-1",
    token: "T-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    items: [{ inventoryItemId: "INV-1", name: "PPI Tablets", quantity: 2, unit: "strips", unitPrice: 50, total: 100 }],
    subtotal: 100,
    discount: 0,
    total: 100,
    paymentStatus: "Unpaid",
    ...overrides
  };
}

const fixture: PharmacyDispenseRecord[] = [
  dispense({ id: "P1", patientName: "Charlie", total: 100, createdAt: "2026-01-01T00:00:00.000Z" }),
  dispense({ id: "P2", patientName: "Alice", total: 400, createdAt: "2026-01-02T00:00:00.000Z", paymentStatus: "Paid" }),
  dispense({
    id: "P3",
    patientName: "Bob",
    total: 250,
    createdAt: "2026-01-03T00:00:00.000Z",
    phone: "9123456789",
    items: [{ inventoryItemId: "INV-2", name: "Rifaximin", quantity: 1, unit: "strip", unitPrice: 250, total: 250 }]
  }),
  dispense({ id: "P4", patientName: "Dev", total: 50, createdAt: "2026-01-04T00:00:00.000Z", status: "Cancelled" })
];

describe("queryPharmacyDispenses", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryPharmacyDispenses(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.dispenses).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.dispenses.map((d) => d.id)).toEqual(["P1", "P2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryPharmacyDispenses(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.dispenses).toHaveLength(2);
  });

  it("does not exclude cancelled dispenses — matches the prior card view exactly", () => {
    const result = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10 });
    expect(result.total).toBe(4);
    expect(result.dispenses.map((d) => d.id)).toContain("P4");
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.dispenses.map((d) => d.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.dispenses.map((d) => d.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("sorts numerically by total, not lexicographically", () => {
    const asc = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, sortBy: "total", sortDir: "asc" });
    expect(asc.dispenses.map((d) => d.total)).toEqual([50, 100, 250, 400]);
  });

  it("filters by free-text query across patient/phone/token/medicine name", () => {
    const byName = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.dispenses.map((d) => d.id)).toEqual(["P2"]);

    const byPhone = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.dispenses.map((d) => d.id)).toEqual(["P3"]);

    const byMedicine = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, query: "rifaximin" });
    expect(byMedicine.dispenses.map((d) => d.id)).toEqual(["P3"]);
  });

  it("filters by payment status", () => {
    const result = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, paymentStatus: "Paid" });
    expect(result.dispenses.map((d) => d.id)).toEqual(["P2"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10 });
    expect(result.dispenses.map((d) => d.id)).toEqual(["P4", "P3", "P2", "P1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryPharmacyDispenses(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.dispenses).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryPharmacyDispenses(fixture, { page: 0, pageSize: 0 }).dispenses.length).toBeLessThanOrEqual(1);
    expect(queryPharmacyDispenses(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
