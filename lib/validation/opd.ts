import { z } from "zod";
import { opdVisitStatuses } from "@/lib/opd-types";

const optionalText = z.string().trim().optional();
const billingStatuses = ["Not Started", "Estimate Shared", "Paid"] as const;
const paymentMethods = ["Cash", "UPI", "Card", "Insurance", "Other"] as const;

export const opdVisitCreateSchema = z
  .object({
    appointmentId: optionalText,
    // Walk-in path: no appointment exists yet — clinical/reception staff are
    // starting a consultation directly for a patient in front of them.
    patientName: optionalText,
    phone: optionalText,
    service: optionalText,
    symptoms: z.array(z.string()).optional(),
    priority: optionalText
  })
  .refine((data) => Boolean(data.appointmentId) || Boolean(data.patientName && data.phone && data.service), {
    message: "Provide an appointment id, or a patient name, phone and service for a walk-in visit."
  });

const refundActions = ["request", "complete"] as const;

export const opdVisitUpdateSchema = z.object({
  id: z.string().trim().min(1, "Visit id is required."),
  status: z.enum(opdVisitStatuses as [string, ...string[]], { error: "Invalid OPD status." }).optional(),
  billingStatus: z.enum(billingStatuses, { error: "Invalid billing status." }).optional(),
  estimatedAmount: optionalText,
  paymentMethod: z.enum(paymentMethods, { error: "Invalid payment method." }).optional(),
  notes: optionalText,
  clinicalNote: optionalText,
  diagnosis: optionalText,
  prescription: optionalText,
  advice: optionalText,
  followUpDate: optionalText,
  refundAction: z.enum(refundActions, { error: "Invalid refund action." }).optional(),
  refundReason: optionalText,
  refundAmount: optionalText
});

export type OpdVisitCreateInput = z.infer<typeof opdVisitCreateSchema>;
export type OpdVisitUpdateInput = z.infer<typeof opdVisitUpdateSchema>;
