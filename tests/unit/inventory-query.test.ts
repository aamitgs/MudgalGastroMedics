import { describe, expect, it } from "vitest";
import type { InventoryItem } from "@/lib/inventory-types";
import { queryInventoryItems } from "@/lib/inventory-query";

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "INV-1",
    name: "PPI Tablets",
    category: "Medicine",
    quantity: 100,
    reorderLevel: 30,
    unit: "strips",
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

const fixture: InventoryItem[] = [
  item({ id: "I1", name: "Charlie Gauze", category: "Consumable", quantity: 100, reorderLevel: 30 }),
  item({ id: "I2", name: "Alice Syrup", category: "Medicine", quantity: 5, reorderLevel: 30, vendor: "MedSupply" }),
  item({ id: "I3", name: "Bob Forceps", category: "Procedure Kit", quantity: 50, reorderLevel: 10, batchNumber: "BX-9" }),
  // Fixed, permanently-past date (not relative to "now") so this stays
  // deterministic regardless of when the suite runs — inventoryExpiryStatus
  // uses the real wall clock since queryInventoryItems doesn't thread a
  // fixed `now` through to it.
  item({ id: "I4", name: "Dev Tablets", category: "Medicine", quantity: 40, reorderLevel: 10, expiryDate: "2020-01-01" })
];

describe("queryInventoryItems", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 2, sortBy: "name", sortDir: "asc" });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryInventoryItems(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(2);
  });

  it("sorts by name ascending and descending", () => {
    const asc = queryInventoryItems(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "asc" });
    expect(asc.items.map((i) => i.name)).toEqual(["Alice Syrup", "Bob Forceps", "Charlie Gauze", "Dev Tablets"]);
    const desc = queryInventoryItems(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "desc" });
    expect(desc.items.map((i) => i.name)).toEqual(["Dev Tablets", "Charlie Gauze", "Bob Forceps", "Alice Syrup"]);
  });

  it("sorts numerically by quantity, not lexicographically", () => {
    const asc = queryInventoryItems(fixture, { page: 0, pageSize: 10, sortBy: "quantity", sortDir: "asc" });
    expect(asc.items.map((i) => i.quantity)).toEqual([5, 40, 50, 100]);
  });

  it("filters by free-text query across name/vendor/batch", () => {
    const byVendor = queryInventoryItems(fixture, { page: 0, pageSize: 10, query: "medsupply" });
    expect(byVendor.items.map((i) => i.id)).toEqual(["I2"]);

    const byBatch = queryInventoryItems(fixture, { page: 0, pageSize: 10, query: "bx-9" });
    expect(byBatch.items.map((i) => i.id)).toEqual(["I3"]);
  });

  it("filters by category", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 10, category: "Procedure Kit" });
    expect(result.items.map((i) => i.id)).toEqual(["I3"]);
  });

  it("lowStockOnly surfaces items at or below reorder level", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 10, lowStockOnly: true });
    expect(result.items.map((i) => i.id)).toEqual(["I2"]);
  });

  it("expiryOnly surfaces expired/expiring items", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 10, expiryOnly: true });
    expect(result.items.map((i) => i.id)).toEqual(["I4"]);
  });

  it("combines lowStockOnly with free-text query", () => {
    const match = queryInventoryItems(fixture, { page: 0, pageSize: 10, lowStockOnly: true, query: "alice" });
    expect(match.items.map((i) => i.id)).toEqual(["I2"]);
    const noMatch = queryInventoryItems(fixture, { page: 0, pageSize: 10, lowStockOnly: true, query: "bob" });
    expect(noMatch.items).toEqual([]);
  });

  it("defaults to name-ascending when no sort is given", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 10 });
    expect(result.items.map((i) => i.name)).toEqual(["Alice Syrup", "Bob Forceps", "Charlie Gauze", "Dev Tablets"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryInventoryItems(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryInventoryItems(fixture, { page: 0, pageSize: 0 }).items.length).toBeLessThanOrEqual(1);
    expect(queryInventoryItems(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
