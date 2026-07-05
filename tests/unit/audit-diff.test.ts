import { describe, expect, it } from "vitest";
import { computeAuditChanges } from "@/lib/audit-diff";

describe("computeAuditChanges", () => {
  it("captures a changed scalar field as before -> after", () => {
    const changes = computeAuditChanges({ status: "active" }, { status: "suspended" });
    expect(changes).toEqual({ status: { before: "active", after: "suspended" } });
  });

  it("captures array field changes (roles)", () => {
    const changes = computeAuditChanges(
      { roles: ["reception"] },
      { roles: ["doctor", "reception"] }
    );
    expect(changes?.roles).toEqual({ before: ["reception"], after: ["doctor", "reception"] });
  });

  it("returns undefined when nothing visible changed", () => {
    expect(computeAuditChanges({ status: "active" }, { status: "active" })).toBeUndefined();
  });

  it("ignores unchanged fields and only reports the delta", () => {
    const changes = computeAuditChanges(
      { name: "Asha", status: "active" },
      { name: "Asha", status: "suspended" }
    );
    expect(Object.keys(changes ?? {})).toEqual(["status"]);
  });

  it("ignores timestamp bookkeeping fields by default", () => {
    const changes = computeAuditChanges(
      { status: "active", updatedAt: "2026-01-01" },
      { status: "active", updatedAt: "2026-07-05" }
    );
    expect(changes).toBeUndefined();
  });

  it("redacts sensitive field values instead of storing them", () => {
    const changes = computeAuditChanges(
      { passwordHash: "old-hash" },
      { passwordHash: "new-hash" }
    );
    expect(changes?.passwordHash).toEqual({ before: "[redacted]", after: "[redacted]" });
  });

  it("treats an added field as undefined -> value", () => {
    const changes = computeAuditChanges({}, { defaultRole: "doctor" });
    expect(changes?.defaultRole).toEqual({ before: undefined, after: "doctor" });
  });

  it("does not flag structurally-equal arrays", () => {
    expect(computeAuditChanges({ roles: ["a", "b"] }, { roles: ["a", "b"] })).toBeUndefined();
  });
});
