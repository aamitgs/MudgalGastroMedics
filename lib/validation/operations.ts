import { z } from "zod";
import { isValidPhoneNumber } from "@/lib/phone";

// These routes all delegate real validation/normalization to their store
// functions (createX(input: Record<string, unknown>) already does its own
// normalizeText/normalizeNumber per field and returns { error } on failure) —
// Zod's job here is only to converge the couple of fields each ROUTE itself
// inspects (mode/action/type/status discriminators, required-id checks) onto
// one shared culture, never to re-validate what the store already owns.
// z.looseObject (not z.object) so every other field passes through to the
// store completely untouched — nothing gets silently stripped.

// .optional() matters here beyond typing: a bare (non-optional) z.unknown()
// still rejects an entirely-absent key in Zod v4, which would fail the whole
// parse — silently discarding every OTHER field the caller did send, not
// just defaulting this one to "". .optional() lets an absent key through so
// the transform still runs and yields "".
const coercedRequiredText = z.unknown().optional().transform((value) => String(value ?? "").trim());

export const appointmentCreateSchema = z.looseObject({
  name: coercedRequiredText,
  phone: coercedRequiredText,
  service: coercedRequiredText
});

/**
 * Client-side inline validation only, for the staff "New appointment" form
 * (useAdvancedForm). appointmentCreateSchema above stays loose on purpose —
 * the POST route's own missing-field check already owns precise per-field
 * error messages for the public booking form, and a strict schema failing
 * the whole object would blur which field was actually invalid. This one
 * never reaches the route; the form still POSTs to the same /api/appointment
 * body shape appointmentCreateSchema accepts.
 */
// Patient-profile fields below are optional on this schema on purpose — the
// fast path (existing patient found by phone, or a new patient with just a
// name) never has to fill them in. They only get used when reception
// expands "Add more patient details" for a genuinely new patient (Reception
// unified booking flow) and flow straight through to upsertPatientFromInput.
export const appointmentStaffBookingSchema = z.object({
  name: z.string().trim().min(1, "Patient name is required."),
  phone: z.string().trim().refine(isValidPhoneNumber, "Enter a valid phone number."),
  service: z.string().trim().min(1, "Select an appointment type."),
  date: z.string().trim().optional(),
  timeSlot: z.string().trim().min(1, "Select a preferred time."),
  priority: z.string().trim().optional(),
  message: z.string().trim().optional(),
  email: z.string().trim().optional(),
  age: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  bloodGroup: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  chronicConditions: z.string().trim().optional(),
  currentMedicines: z.string().trim().optional()
});

export type AppointmentStaffBookingInput = z.infer<typeof appointmentStaffBookingSchema>;

export const appointmentStatusUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().default("")
});

export const appointmentDeleteSchema = z.object({
  id: z.string().trim().min(1, "Appointment id is required.")
});

export const automationActionSchema = z.looseObject({
  action: z.string().default("create"),
  type: z.string().optional(),
  priority: z.string().optional()
});

export const automationUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueAt: z.string().optional(),
  owner: z.string().optional(),
  ownerStaffId: z.string().optional(),
  notes: z.string().optional()
});

export const automationDeleteSchema = z.object({
  id: z.string().trim().min(1, "Task id is required.")
});

export const cmsUpsertSchema = z.looseObject({
  type: z.string().optional(),
  status: z.string().optional()
});

export const cmsStatusUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().optional()
});

export const cmsDeleteSchema = z.object({
  id: z.string().trim().min(1, "Content id is required.")
});

export const communicationCreateSchema = z.looseObject({
  channel: z.string().optional(),
  status: z.string().optional()
});

export const communicationUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().optional(),
  channel: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  scheduledFor: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional()
});

export const financeCreateSchema = z.looseObject({
  mode: z.string().default("entry"),
  type: z.string().optional()
});

export const financeClaimUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().optional(),
  requestedAmount: z.unknown().optional(),
  approvedAmount: z.unknown().optional(),
  settledAmount: z.unknown().optional(),
  claimNumber: z.string().optional(),
  documents: z.string().optional(),
  notes: z.string().optional()
});

export const financeClaimDeleteSchema = z.object({
  id: z.string().trim().min(1, "Claim id is required.")
});

export const inventoryAdjustSchema = z.looseObject({
  id: z.string().default(""),
  delta: z.unknown().optional()
});

export const labOrderUpdateSchema = z.looseObject({
  id: z.string().default(""),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  amount: z.unknown().optional(),
  resultSummary: z.string().optional(),
  reportReference: z.string().optional(),
  notes: z.string().optional(),
  criticalManual: z.unknown().optional(),
  acknowledgeCritical: z.unknown().optional()
});

export const labOrderDeleteSchema = z.object({
  id: z.string().trim().min(1, "Lab order id is required.")
});

export const notificationActionSchema = z.looseObject({
  action: z.string().default(""),
  id: z.string().default("")
});

export const mobilePatientLookupSchema = z.object({
  phone: z.string().trim().default(""),
  requestId: z.string().trim().default("")
});
