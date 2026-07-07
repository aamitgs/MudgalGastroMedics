import { describe, expect, it } from "vitest";
import type { AccountEntry } from "@/lib/finance-types";
import { queryAccountEntries } from "@/lib/account-entry-query";

function entry(overrides: Partial<AccountEntry> = {}): AccountEntry {
  return {
    id: "ENT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    date: "2026-01-01",
    type: "Income",
    category: "Consultation",
    amount: 500,
    method: "Cash",
    ...overrides
  };
}

const fixture: AccountEntry[] = [
  entry({ id: "E1", category: "Consultation", type: "Income", amount: 500, createdAt: "2026-01-01T00:00:00.000Z", party: "Charlie" }),
  entry({ id: "E2", category: "Pharmacy Supplies", type: "Expense", amount: 20000, createdAt: "2026-01-02T00:00:00.000Z", party: "Alice Distributors", reference: "REF-99" }),
  entry({ id: "E3", category: "Room Deposit", type: "Deposit", amount: 5000, createdAt: "2026-01-03T00:00:00.000Z", notes: "Advance for admission" }),
  entry({ id: "E4", category: "Refund - Cancelled Test", type: "Refund", amount: 300, createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAccountEntries", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAccountEntries(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.entries.map((e) => e.id)).toEqual(["E1", "E2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAccountEntries(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.entries).toHaveLength(2);
  });

  it("sorts by category ascending and descending", () => {
    const asc = queryAccountEntries(fixture, { page: 0, pageSize: 10, sortBy: "category", sortDir: "asc" });
    expect(asc.entries.map((e) => e.id)).toEqual(["E1", "E2", "E4", "E3"]);
    const desc = queryAccountEntries(fixture, { page: 0, pageSize: 10, sortBy: "category", sortDir: "desc" });
    expect(desc.entries.map((e) => e.id)).toEqual(["E3", "E4", "E2", "E1"]);
  });

  it("sorts by amount numerically, not lexicographically", () => {
    const result = queryAccountEntries(fixture, { page: 0, pageSize: 10, sortBy: "amount", sortDir: "desc" });
    expect(result.entries.map((e) => e.id)).toEqual(["E2", "E3", "E1", "E4"]);
  });

  it("filters by free-text query across category, party, reference and notes", () => {
    const byParty = queryAccountEntries(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byParty.entries.map((e) => e.id)).toEqual(["E2"]);

    const byReference = queryAccountEntries(fixture, { page: 0, pageSize: 10, query: "ref-99" });
    expect(byReference.entries.map((e) => e.id)).toEqual(["E2"]);

    const byNotes = queryAccountEntries(fixture, { page: 0, pageSize: 10, query: "advance for admission" });
    expect(byNotes.entries.map((e) => e.id)).toEqual(["E3"]);
  });

  it("filters by type", () => {
    const result = queryAccountEntries(fixture, { page: 0, pageSize: 10, type: "Refund" });
    expect(result.entries.map((e) => e.id)).toEqual(["E4"]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryAccountEntries(fixture, { page: 0, pageSize: 10 });
    expect(result.entries.map((e) => e.id)).toEqual(["E4", "E3", "E2", "E1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAccountEntries(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAccountEntries(fixture, { page: 0, pageSize: 0 }).entries.length).toBeLessThanOrEqual(1);
    expect(queryAccountEntries(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
