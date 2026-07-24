import { z } from "zod";
import { opdVisitStatuses } from "@/lib/opd-types";

const optionalText = z.string().trim().optional();
const billingStatuses = ["Not Started", "Estimate Shared", "Paid"] as const;
const paymentMethods = ["Cash", "UPI", "Card", "Insurance", "Other"] as const;

const prescriptionItemSchema = z.object({
  id: z.string().trim().min(1),
  medicine: z.string().trim().min(1, "Medicine name is required."),
  strength: optionalText,
  instruction: z.string().trim().min(1, "Instruction is required."),
  days: optionalText,
  status: z.enum(["Continue", "Modify"]).optional()
});

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
  presentingComplaints: optionalText,
  history: optionalText,
  vitalsBp: optionalText,
  vitalsPulse: optionalText,
  vitalsWeight: optionalText,
  vitalsHeight: optionalText,
  vitalsRespiratoryRate: optionalText,
  vitalsTemperature: optionalText,
  vitalsSpo2: optionalText,
  vitalsBloodSugar: optionalText,
  generalExamination: optionalText,
  perAbdomen: optionalText,
  priorInvestigation: optionalText,
  clinicalNote: optionalText,
  diagnosis: optionalText,
  investigationAdvice: optionalText,
  prescription: optionalText,
  prescriptionItems: z.array(prescriptionItemSchema).optional(),
  advice: optionalText,
  followUpDate: optionalText,
  referralTo: optionalText,
  referralLetter: optionalText,
  certificateNote: optionalText,
  refundAction: z.enum(refundActions, { error: "Invalid refund action." }).optional(),
  refundReason: optionalText,
  refundAmount: optionalText
});

export const opdVisitDeleteSchema = z.object({
  id: z.string().trim().min(1, "Visit id is required.")
});

export type OpdVisitCreateInput = z.infer<typeof opdVisitCreateSchema>;
export type OpdVisitUpdateInput = z.infer<typeof opdVisitUpdateSchema>;
