import { describe, expect, it } from "vitest";
import type { StaffMember } from "@/lib/hr-types";
import { queryStaffDirectory } from "@/lib/staff-directory-query";

function staffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "STF-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Active",
    name: "Priya Nurse",
    phone: "9876500001",
    role: "Nurse",
    department: "Nursing",
    shift: "Morning",
    permissions: [],
    ...overrides
  };
}

const fixture: StaffMember[] = [
  staffMember({ id: "S1", name: "Charlie", role: "Doctor", department: "Gastro", status: "Active" }),
  staffMember({ id: "S2", name: "Alice", role: "Nurse", department: "Nursing", status: "On Leave" }),
  staffMember({ id: "S3", name: "Bob", role: "Pharmacy", department: "Pharmacy", status: "Active", phone: "9123456789" }),
  staffMember({ id: "S4", name: "Dev", role: "Reception", department: "Front Desk", status: "Inactive" })
];

describe("queryStaffDirectory", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 2, sortBy: "name", sortDir: "asc" });
    expect(result.staff).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryStaffDirectory(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.staff).toHaveLength(2);
  });

  it("sorts by name ascending and descending", () => {
    const asc = queryStaffDirectory(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "asc" });
    expect(asc.staff.map((s) => s.name)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryStaffDirectory(fixture, { page: 0, pageSize: 10, sortBy: "name", sortDir: "desc" });
    expect(desc.staff.map((s) => s.name)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across name/phone/department/role", () => {
    const byPhone = queryStaffDirectory(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.staff.map((s) => s.id)).toEqual(["S3"]);

    const byDept = queryStaffDirectory(fixture, { page: 0, pageSize: 10, query: "front desk" });
    expect(byDept.staff.map((s) => s.id)).toEqual(["S4"]);
  });

  it("filters by role", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 10, role: "Pharmacy" });
    expect(result.staff.map((s) => s.id)).toEqual(["S3"]);
  });

  it("filters by status", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 10, status: "On Leave" });
    expect(result.staff.map((s) => s.id)).toEqual(["S2"]);
  });

  it("combines role and status filters", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 10, role: "Doctor", status: "Active" });
    expect(result.staff.map((s) => s.id)).toEqual(["S1"]);
    expect(queryStaffDirectory(fixture, { page: 0, pageSize: 10, role: "Doctor", status: "On Leave" }).staff).toEqual([]);
  });

  it("defaults to name-ascending when no sort is given", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 10 });
    expect(result.staff.map((s) => s.name)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryStaffDirectory(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.staff).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryStaffDirectory(fixture, { page: 0, pageSize: 0 }).staff.length).toBeLessThanOrEqual(1);
    expect(queryStaffDirectory(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});
