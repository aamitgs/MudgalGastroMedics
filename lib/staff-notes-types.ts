import type { AccessResource, AccessRole } from "@/lib/access/matrix";
import { roleHasPermission } from "@/lib/access/matrix";

/**
 * Cross-department staff notes (shift handover + department-to-department
 * notes, e.g. Doctor -> Lab, Reception -> Nursing). Deliberately scoped to
 * department-level targeting, not person-to-person: the RBAC login system
 * and the HR staff directory are separate identity spaces with no link
 * between them, and today there is exactly one seeded staff record per
 * role, so "assign to a specific person's shift" isn't meaningful yet.
 */
export type StaffNoteDepartment = "Doctor" | "Reception" | "Nursing" | "Laboratory" | "Pharmacy" | "Billing" | "Insurance" | "HR" | "Administration";

export const staffNoteDepartments: StaffNoteDepartment[] = [
  "Doctor",
  "Reception",
  "Nursing",
  "Laboratory",
  "Pharmacy",
  "Billing",
  "Insurance",
  "HR",
  "Administration"
];

/** "Note" is a routine cross-department message; "Handover" is a higher-visibility shift summary. */
export type StaffNoteCategory = "Note" | "Handover";
export const staffNoteCategories: StaffNoteCategory[] = ["Note", "Handover"];

export type StaffNotePriority = "Normal" | "High" | "Critical";
export const staffNotePriorities: StaffNotePriority[] = ["Normal", "High", "Critical"];

export type StaffNoteStatus = "Open" | "Acknowledged" | "Resolved";
export const staffNoteStatuses: StaffNoteStatus[] = ["Open", "Acknowledged", "Resolved"];

export type StaffNote = {
  id: string;
  createdAt: string;
  updatedAt: string;
  category: StaffNoteCategory;
  fromDepartment: StaffNoteDepartment;
  toDepartment: StaffNoteDepartment;
  authorRole: AccessRole;
  authorName: string;
  priority: StaffNotePriority;
  message: string;
  patientId?: string;
  patientName?: string;
  status: StaffNoteStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
};

/** Each department's notes are visible to whichever role already owns that resource — no new RBAC resource added. */
const departmentResource: Record<StaffNoteDepartment, AccessResource> = {
  Doctor: "patients",
  Reception: "appointments",
  Nursing: "beds",
  Laboratory: "lab-orders",
  Pharmacy: "pharmacy-inventory",
  Billing: "billing",
  Insurance: "liaison-notes",
  HR: "hr-records",
  Administration: "system-settings"
};

export function canViewStaffNoteDepartment(role: AccessRole, department: StaffNoteDepartment): boolean {
  if (role === "super-admin") return true;
  return roleHasPermission(role, departmentResource[department], "view");
}

const roleDepartment: Partial<Record<AccessRole, StaffNoteDepartment>> = {
  "main-doctor": "Doctor",
  "duty-doctor": "Doctor",
  nurse: "Nursing",
  reception: "Reception",
  "lab-technician": "Laboratory",
  pharmacist: "Pharmacy",
  "billing-accounts": "Billing",
  hr: "HR",
  pro: "Insurance",
  admin: "Administration",
  "super-admin": "Administration"
};

export function departmentForRole(role: AccessRole): StaffNoteDepartment {
  return roleDepartment[role] ?? "Administration";
}
