import { z } from "zod";
import { automationTaskPriorities, automationTaskTypes } from "@/lib/automation-types";

// The { error } option on the base z.string() call (not just a chained
// .min() message) is what covers an entirely-absent key — .min() alone
// only fires once the type check already passed, so an absent required
// field would otherwise surface a raw "expected string, received
// undefined" instead of this friendly message.
export const automationTaskCreateSchema = z.object({
  title: z.string({ error: "Task title is required." }).trim().min(1, "Task title is required."),
  type: z.enum(automationTaskTypes, { error: "Invalid task type." }),
  priority: z.enum(automationTaskPriorities, { error: "Invalid priority." }),
  dueAt: z.string().trim().optional(),
  ownerStaffId: z.string().trim().optional(),
  patientName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export type AutomationTaskCreateInput = z.infer<typeof automationTaskCreateSchema>;
