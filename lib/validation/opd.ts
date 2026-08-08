import { z } from "zod";
import { opdVisitStatuses } from "@/lib/opd-types";

const optionalText = z.string().trim().optional();
const billingStatuses = ["Not Started", "Estimate Shared", "Paid"] as const;
const paymentMethods = ["Cash", "UPI", "Card", "Insurance", "Other"] as const;

/**
 * Vitals stay free text on purpose: staff annotate them — "84 bpm",
 * "98% on room air", "37.2 C axillary" — and forcing a bare number would slow
 * down the people this system exists to serve, which the decision hierarchy
 * puts above tidy data.
 *
 * But a value containing no digit at all is not an annotation, it is a
 * mis-keyed field, and on screen it reads as though a measurement was taken.
 * Live records carried vitalsBp "fdgfd" and vitalsPulse "gfdgfdg" on a patient
 * under work-up for a GI bleed — a blank would have been safer, because a
 * blank is obviously missing.
 *
 * The rule is therefore deliberately weak: if something was entered, it must
 * contain a number. That rejects keyboard noise without second-guessing the
 * clinician or blocking any realistic entry.
 */
const vitalsMeasurement = (label: string, example: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /\d/.test(value), `${label} must include a number (for example ${example}).`)
    .optional();

/**
 * Blood pressure additionally needs both numbers: a lone "120" is ambiguous
 * between systolic and a mis-paste, and the field drives clinical judgement.
 * Anything around the pair is allowed, so "120/80 mmHg (left arm)" passes.
 */
const bloodPressure = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /\d{2,3}\s*\/\s*\d{1,3}/.test(value),
    "Blood pressure must include systolic and diastolic (for example 120/80)."
  )
  .optional();

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
  vitalsBp: bloodPressure,
  vitalsPulse: vitalsMeasurement("Pulse", "84"),
  vitalsWeight: vitalsMeasurement("Weight", "72 kg"),
  vitalsHeight: vitalsMeasurement("Height", "168 cm"),
  vitalsRespiratoryRate: vitalsMeasurement("Respiratory rate", "16"),
  vitalsTemperature: vitalsMeasurement("Temperature", "98.6 F"),
  vitalsSpo2: vitalsMeasurement("SpO2", "98%"),
  vitalsBloodSugar: vitalsMeasurement("Blood sugar", "110 mg/dL"),
  generalExamination: optionalText,
  perAbdomen: optionalText,
  priorInvestigation: optionalText,
  clinicalNote: optionalText,
  diagnosis: optionalText,
  diagnosisIcd10Code: optionalText,
  diagnosisIcd10Label: optionalText,
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
