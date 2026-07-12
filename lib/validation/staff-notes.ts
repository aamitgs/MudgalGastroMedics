import { z } from "zod";

export const staffNoteCreateSchema = z.object({
  category: z.enum(["Note", "Handover"]).default("Note"),
  toDepartment: z.enum(["Doctor", "Reception", "Nursing", "Laboratory", "Pharmacy", "Billing", "Insurance", "HR", "Administration"]),
  priority: z.enum(["Normal", "High", "Critical"]).default("Normal"),
  message: z.string().trim().min(1, "Message is required.").max(1000, "Keep the message under 1000 characters."),
  patientId: z.string().trim().optional(),
  patientName: z.string().trim().optional()
});

export type StaffNoteCreateInput = z.infer<typeof staffNoteCreateSchema>;

export const staffNoteStatusUpdateSchema = z.object({
  id: z.string().trim().min(1, "Note id is required."),
  status: z.enum(["Open", "Acknowledged", "Resolved"])
});
