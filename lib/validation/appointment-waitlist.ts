import { z } from "zod";
import { appointmentWaitlistStatuses } from "@/lib/appointment-waitlist-types";

export const appointmentWaitlistCreateSchema = z.object({
  name: z.string().trim().min(1, "Patient name is required."),
  phone: z.string().trim().min(6, "A valid phone number is required."),
  service: z.string().trim().min(1, "Service is required."),
  preferredDate: z.string().trim().optional(),
  notes: z.string().trim().max(500, "Keep notes under 500 characters.").optional()
});

export const appointmentWaitlistStatusUpdateSchema = z.object({
  id: z.string().trim().min(1, "Waitlist entry id is required."),
  status: z.enum(appointmentWaitlistStatuses as [string, ...string[]], { error: "Invalid waitlist status." })
});
