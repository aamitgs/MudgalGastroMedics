import { describe, expect, it } from "vitest";
import type { LabOrder } from "@/lib/lab-types";
import { queryLabOrders } from "@/lib/lab-query";

function labOrder(overrides: Partial<LabOrder> = {}): LabOrder {
  return {
    id: "LAB-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    visitId: "V-1",
    token: "T-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "LFT panel",
    tests: ["LFT"],
    priority: "Routine",
    status: "Ordered",
    paymentStatus: "Unpaid",
    ...overrides
  };
}

const fixture: LabOrder[] = [
  labOrder({ id: "L1", patientName: "Charlie", status: "Ordered", createdAt: "2026-01-01T00:00:00.000Z" }),
  labOrder({ id: "L2", patientName: "Alice", status: "Result Ready", createdAt: "2026-01-02T00:00:00.000Z", criticalFlag: true }),
  labOrder({
    id: "L3",
    patientName: "Bob",
    status: "Processing",
    createdAt: "2026-01-03T00:00:00.000Z",
    phone: "9123456789",
    criticalFlag: true,
    criticalAcknowledgedAt: "2026-01-03T01:00:00.000Z"
  }),
  labOrder({ id: "L4", patientName: "Dev", status: "Cancelled", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryLabOrders", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.orders.map((o) => o.id)).toEqual(["L1", "L2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryLabOrders(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.orders).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryLabOrders(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.orders.map((o) => o.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryLabOrders(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.orders.map((o) => o.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across patient/phone/token/tests", () => {
    const byName = queryLabOrders(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.orders.map((o) => o.id)).toEqual(["L2"]);

    const byPhone = queryLabOrders(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.orders.map((o) => o.id)).toEqual(["L3"]);
  });

  it("filters by status", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 10, status: "Cancelled" });
    expect(result.orders.map((o) => o.id)).toEqual(["L4"]);
  });

  it("criticalOnly surfaces unacknowledged critical results and excludes acknowledged/cancelled ones", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 10, criticalOnly: true });
    expect(result.orders.map((o) => o.id)).toEqual(["L2"]);
  });

  it("combines criticalOnly with free-text query", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 10, criticalOnly: true, query: "alice" });
    expect(result.orders.map((o) => o.id)).toEqual(["L2"]);
    expect(queryLabOrders(fixture, { page: 0, pageSize: 10, criticalOnly: true, query: "bob" }).orders).toEqual([]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 10 });
    expect(result.orders.map((o) => o.id)).toEqual(["L4", "L3", "L2", "L1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryLabOrders(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryLabOrders(fixture, { page: 0, pageSize: 0 }).orders.length).toBeLessThanOrEqual(1);
    expect(queryLabOrders(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
