import { z } from "zod";
import { opdVisitStatuses } from "@/lib/opd-types";

const optionalText = z.string().trim().optional();
const billingStatuses = ["Not Started", "Estimate Shared", "Paid"] as const;
const paymentMethods = ["Cash", "UPI", "Card", "Insurance", "Other"] as const;

export const opdVisitCreateSchema = z.object({
  appointmentId: z.string().trim().min(1, "Appointment id is required.")
});

export const opdVisitUpdateSchema = z.object({
  id: z.string().trim().min(1, "Visit id is required."),
  status: z.enum(opdVisitStatuses as [string, ...string[]], { error: "Invalid OPD status." }).optional(),
  billingStatus: z.enum(billingStatuses, { error: "Invalid billing status." }).optional(),
  estimatedAmount: optionalText,
  paymentMethod: z.enum(paymentMethods, { error: "Invalid payment method." }).optional(),
  notes: optionalText,
  clinicalNote: optionalText,
  prescription: optionalText,
  advice: optionalText,
  followUpDate: optionalText
});

export type OpdVisitCreateInput = z.infer<typeof opdVisitCreateSchema>;
export type OpdVisitUpdateInput = z.infer<typeof opdVisitUpdateSchema>;
