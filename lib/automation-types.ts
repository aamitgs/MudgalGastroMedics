import type { AccessResource, AccessRole } from "@/lib/access/matrix";
import { roleHasPermission } from "@/lib/access/matrix";

export type AutomationTaskType =
  | "Appointment Follow-up"
  | "Procedure Prep"
  | "OPD Follow-up"
  | "Payment Reminder"
  | "Lab Delivery"
  | "Low Stock"
  | "AI Review"
  | "Communication Follow-up"
  | "IPD Review";

export type AutomationTaskStatus = "Open" | "Queued" | "Done" | "Skipped" | "Escalated";

export type AutomationTaskPriority = "Low" | "Normal" | "High" | "Urgent";

export type AutomationTask = {
  id: string;
  key: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  type: AutomationTaskType;
  status: AutomationTaskStatus;
  priority: AutomationTaskPriority;
  title: string;
  description: string;
  sourceId?: string;
  patientId?: string;
  uhid?: string;
  patientName?: string;
  phone?: string;
  /** Display label — auto-generated tasks get a generic team name; kept in sync with ownerStaffId's name when that's set. */
  owner?: string;
  /** Real assignee (Track 4.7) — a lib/hr-store.ts StaffMember.id, not the RBAC login system's separate AccessUser.id. */
  ownerStaffId?: string;
  actionUrl?: string;
  notes?: string;
};

export const automationTaskStatuses: AutomationTaskStatus[] = ["Open", "Queued", "Done", "Skipped", "Escalated"];

export const automationTaskPriorities: AutomationTaskPriority[] = ["Low", "Normal", "High", "Urgent"];

export const automationTaskTypes: AutomationTaskType[] = [
  "Appointment Follow-up",
  "Procedure Prep",
  "OPD Follow-up",
  "Payment Reminder",
  "Lab Delivery",
  "Low Stock",
  "AI Review",
  "Communication Follow-up",
  "IPD Review"
];

/**
 * Which permission gates visibility of each task type (Track 4.7) — derived
 * from the same matrix the server enforces, same pattern as
 * canViewNotificationCategory. Previously the whole queue required
 * system-settings:view (admin-only), so tasks nominally owned by
 * Reception/Lab/IPD teams were invisible to those roles entirely.
 */
const taskTypeResource: Record<AutomationTaskType, AccessResource> = {
  "Appointment Follow-up": "appointments",
  "Procedure Prep": "appointments",
  "OPD Follow-up": "appointments",
  "Payment Reminder": "billing",
  "Lab Delivery": "lab-orders",
  "Low Stock": "pharmacy-inventory",
  "AI Review": "patients",
  "Communication Follow-up": "appointments",
  "IPD Review": "beds"
};

export function canViewAutomationTask(role: AccessRole, type: AutomationTaskType): boolean {
  if (role === "super-admin") return true;
  return roleHasPermission(role, taskTypeResource[type], "view");
}

export function canEditAutomationTask(role: AccessRole, type: AutomationTaskType): boolean {
  if (role === "super-admin") return true;
  return roleHasPermission(role, taskTypeResource[type], "edit");
}
