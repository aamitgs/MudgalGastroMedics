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
  owner?: string;
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
