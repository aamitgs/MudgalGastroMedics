import { z } from "zod";

const optionalText = z.string().trim().optional();
const recordStatuses = ["Active", "Pending", "Completed", "On Hold"] as const;
const priorities = ["Low", "Normal", "High", "Urgent"] as const;

export const hmsRecordCreateSchema = z.object({
  moduleId: z.string().trim().min(1, "Module is required."),
  title: z.string().trim().min(1, "Title is required."),
  // Matches the store's existing leniency: an invalid/missing status or
  // priority silently falls back to a sane default rather than rejecting —
  // the real caller always sends a valid value via a constrained <select>.
  status: z.enum(recordStatuses).default("Pending"),
  priority: z.enum(priorities).default("Normal"),
  owner: optionalText,
  notes: optionalText
});

export const hmsRecordUpdateSchema = z.object({
  id: z.string().trim().min(1, "Record id is required."),
  status: z.enum(recordStatuses, { error: "Invalid status." }).optional(),
  priority: z.enum(priorities, { error: "Invalid priority." }).optional(),
  owner: optionalText,
  notes: optionalText
});

export type HmsRecordCreateInput = z.infer<typeof hmsRecordCreateSchema>;
export type HmsRecordUpdateInput = z.infer<typeof hmsRecordUpdateSchema>;
