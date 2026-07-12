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

export const dischargeSummaryDraftSchema = z.object({
  admissionId: z.string().trim().default("")
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
