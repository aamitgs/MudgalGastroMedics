import { z } from "zod";

// All fields stay lenient defaults, not min(1): an entirely-absent field (not
// just an empty string) would otherwise fail Zod's *type* check before any
// custom message applies, surfacing a raw "expected string, received
// undefined" instead of the friendly combined message — the same class of
// bug caught in the patient/family slice. The "required" check stays a plain
// truthy check in each route, exactly as before.
export const allergyAcknowledgedSchema = z.object({
  visitId: z.string().trim().default(""),
  allergies: z.string().trim().default(""),
  reason: z.string().trim().optional()
});

export const identityConfirmedSchema = z.object({
  visitId: z.string().trim().default(""),
  patientName: z.string().trim().default(""),
  phone: z.string().trim().default("")
});

export const interactionAcknowledgedSchema = z.object({
  visitId: z.string().trim().default(""),
  drugA: z.string().trim().default(""),
  drugB: z.string().trim().default(""),
  reason: z.string().trim().optional()
});

export const maxDoseAcknowledgedSchema = z.object({
  visitId: z.string().trim().default(""),
  drug: z.string().trim().default(""),
  dailyDose: z.string().trim().optional(),
  maxDose: z.string().trim().optional(),
  reason: z.string().trim().optional()
});

export const cdsRecommendationSchema = z.object({
  visitId: z.string().trim().default(""),
  ruleId: z.string().trim().default(""),
  category: z.string().trim().default(""),
  reason: z.string().trim().optional()
});

export const dischargeSummaryDraftSchema = z.object({
  admissionId: z.string().trim().default("")
});

export const referralLetterDraftSchema = z.object({
  visitId: z.string().trim().default(""),
  referredTo: z.string().trim().default("")
});

export const medicalCertificateDraftSchema = z.object({
  visitId: z.string().trim().default("")
});

// history is bounded well above a realistic single-visit conversation — a
// sanity ceiling against a malformed payload, not an expected volume.
export const visitAssistantQuestionSchema = z.object({
  visitId: z.string().trim().default(""),
  question: z.string().trim().min(1, "question is required.").max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().max(2000)
      })
    )
    .max(20)
    .optional()
});

export const patientSummaryRequestSchema = z.object({
  phone: z.string().trim().default("")
});

export const aiReviewGenerateSchema = z.object({
  action: z.string().default("generate"),
  source: z.string().default("Appointment"),
  sourceId: z.string().default("")
});

export const aiReviewUpdateSchema = z.object({
  id: z.string().default(""),
  status: z.string().optional(),
  doctorReviewNote: z.string().optional(),
  reviewedBy: z.string().optional()
});
