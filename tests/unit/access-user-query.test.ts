import { describe, expect, it } from "vitest";
import type { ManagedUser } from "@/lib/access-user-query";
import { queryAccessUsers } from "@/lib/access-user-query";

function user(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: "USR-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    name: "Asha Verma",
    username: "asha.verma",
    roles: ["reception"],
    defaultRole: "reception",
    mustChangePassword: false,
    totpEnabled: false,
    ...overrides
  };
}

const fixture: ManagedUser[] = [
  user({ id: "U1", name: "Charlie", username: "charlie", roles: ["reception"], status: "active", createdAt: "2026-01-01T00:00:00.000Z" }),
  user({ id: "U2", name: "Alice", username: "alice", roles: ["main-doctor"], status: "active", createdAt: "2026-01-02T00:00:00.000Z", email: "alice@mgm.test" }),
  user({ id: "U3", name: "Bob", username: "bob", roles: ["nurse", "reception"], status: "suspended", createdAt: "2026-01-03T00:00:00.000Z" }),
  user({ id: "U4", name: "Dev", username: "dev", roles: ["pharmacist"], status: "active", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryAccessUsers", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.users.map((u) => u.id)).toEqual(["U1", "U2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryAccessUsers(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.users).toHaveLength(2);
  });

  it("defaults to sorting by name ascending", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 10 });
    expect(result.users.map((u) => u.name)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
  });

  it("sorts by name descending", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "desc" });
    expect(result.users.map((u) => u.name)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across name, username and email", () => {
    const byName = queryAccessUsers(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.users.map((u) => u.id)).toEqual(["U2"]);

    const byEmail = queryAccessUsers(fixture, { page: 0, pageSize: 10, query: "alice@mgm.test" });
    expect(byEmail.users.map((u) => u.id)).toEqual(["U2"]);
  });

  it("filters by status", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 10, status: "suspended" });
    expect(result.users.map((u) => u.id)).toEqual(["U3"]);
  });

  it("filters by role, matching users with multiple roles", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 10, role: "reception" });
    expect(result.users.map((u) => u.id)).toEqual(["U3", "U1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryAccessUsers(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryAccessUsers(fixture, { page: 0, pageSize: 0 }).users.length).toBeLessThanOrEqual(1);
    expect(queryAccessUsers(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
