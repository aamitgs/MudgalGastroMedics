import { z } from "zod";
import { procedureScheduleStatuses } from "@/lib/procedure-types";

const optionalText = z.string().trim().optional();

export const procedureChecklistSchema = z
  .object({
    consent: z.boolean(),
    fastingConfirmed: z.boolean(),
    vitalsChecked: z.boolean(),
    allergiesReviewed: z.boolean(),
    reportsReviewed: z.boolean(),
    attendantAvailable: z.boolean(),
    equipmentReady: z.boolean(),
    recoveryInstructions: z.boolean()
  })
  .partial();

export const procedureScheduleCreateSchema = z.object({
  visitId: z.string().trim().min(1, "OPD visit is required."),
  procedureSlug: z.string().trim().min(1, "Procedure is required."),
  scheduledDate: z.string().trim().min(1, "Scheduled date is required."),
  scheduledTime: z.string().trim().min(1, "Scheduled time is required."),
  room: optionalText,
  doctor: optionalText,
  anesthesiaPlan: optionalText,
  priority: optionalText,
  notes: optionalText
});

export const procedureScheduleUpdateSchema = z.object({
  id: z.string().trim().min(1, "Procedure schedule id is required."),
  status: z.enum(procedureScheduleStatuses as [string, ...string[]], { error: "Invalid procedure status." }).optional(),
  checklist: procedureChecklistSchema.optional(),
  findings: optionalText,
  complications: optionalText,
  notes: optionalText,
  scheduledDate: optionalText,
  scheduledTime: optionalText,
  room: optionalText,
  doctor: optionalText,
  anesthesiaPlan: optionalText
});

export type ProcedureScheduleCreateInput = z.infer<typeof procedureScheduleCreateSchema>;
export type ProcedureScheduleUpdateInput = z.infer<typeof procedureScheduleUpdateSchema>;
