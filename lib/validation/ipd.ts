import { z } from "zod";
import { bedStatuses, hospitalWards, ipdAdmissionStatuses, medicationAdministrationStatuses } from "@/lib/ipd-types";

const optionalText = z.string().trim().optional();

export const ipdBedCreateSchema = z.object({
  ward: z.enum(hospitalWards as [string, ...string[]], { error: "Invalid ward." }),
  label: z.string().trim().min(1, "Bed label is required."),
  dailyRate: z.coerce.number().min(0, "Daily rate must be zero or more."),
  notes: optionalText
});

export const ipdBedDeleteSchema = z.object({
  id: z.string().trim().min(1, "Bed id is required.")
});

export const ipdAdmissionCreateSchema = z
  .object({
    // Optional rather than required since the direct-admission path: an
    // emergency arriving by ambulance never sat in the OPD queue, and tying
    // every admission to a visit left that patient with no way in at all.
    // Callers that send a visitId behave exactly as before.
    visitId: optionalText,
    // Direct-admission path — identifies the patient instead of a visit.
    // patientId short-circuits to an already-registered record (looked up by
    // Patient ID/UHID, no re-entry of demographics); without it, the record
    // is matched by phone or registered on the spot, so intake is one form
    // rather than register-then-admit.
    patientId: optionalText,
    patientName: optionalText,
    phone: optionalText,
    age: optionalText,
    gender: optionalText,
    bedId: z.string().trim().min(1, "Bed is required."),
    admissionType: optionalText,
    admittingDoctor: optionalText,
    assignedNurse: optionalText,
    expectedDischargeDate: optionalText,
    diagnosis: optionalText,
    carePlan: optionalText,
    depositAmount: z.coerce.number().optional(),
    // Track 0.7: consent is captured at intake, not a later status transition —
    // admission is created immediately (there's no "pending" pre-admission
    // status to gate instead), so this is required at creation time. The
    // checkbox is inside a FormData-submitted form, which always sends the
    // string "true" when checked and omits the key entirely when unchecked —
    // never a real boolean — so this matches the literal string, not `true`.
    consentRecorded: z.literal("true", { error: "Patient/family consent must be confirmed before admission." })
  })
  .refine((data) => Boolean(data.visitId) || Boolean(data.patientId) || Boolean(data.patientName && data.phone), {
    message: "Select an OPD visit, choose an existing patient by ID, or give a patient name and phone for a direct admission."
  });

export const ipdBedUpdateSchema = z.object({
  id: z.string().trim().min(1, "Bed id is required."),
  status: z.enum(bedStatuses as [string, ...string[]], { error: "Invalid bed status." }).optional(),
  notes: optionalText
});

export const ipdTransferSchema = z.object({
  admissionId: z.string().trim().min(1, "Admission id is required."),
  toBedId: z.string().trim().min(1, "Target bed is required."),
  // Left as a plain (possibly empty) string, not `.min(1)` — transferBed()
  // already owns the "reason is required" business rule and returns its own
  // { error } for it; duplicating the check here would just move which layer
  // reports the identical failure.
  reason: z.string().trim().default("")
});

export const ipdVitalsSchema = z.object({
  admissionId: z.string().trim().min(1, "Admission id is required."),
  heartRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  bloodPressure: optionalText,
  temperature: z.coerce.number().optional(),
  notes: optionalText
});

export const ipdEscalateSchema = z.object({
  id: z.string().trim().min(1, "Admission id is required."),
  escalated: z.coerce.boolean(),
  reason: optionalText
});

export const ipdAdmissionUpdateSchema = z.object({
  id: z.string().trim().min(1, "Admission id is required."),
  status: z.enum(ipdAdmissionStatuses as [string, ...string[]], { error: "Invalid admission status." }).optional(),
  bedId: optionalText,
  diagnosis: optionalText,
  carePlan: optionalText,
  nursingNotes: optionalText,
  dietAdvice: optionalText,
  assignedNurse: optionalText,
  expectedDischargeDate: optionalText,
  markedForDischarge: z.boolean().optional(),
  depositAmount: z.coerce.number().optional(),
  dischargeSummary: optionalText
});

export const ipdMedicationOrderCreateSchema = z.object({
  admissionId: z.string().trim().min(1, "Admission id is required."),
  drugName: z.string().trim().min(1, "Drug name is required."),
  dose: optionalText,
  route: optionalText,
  frequency: optionalText,
  notes: optionalText
});

export const ipdMedicationOrderDiscontinueSchema = z.object({
  id: z.string().trim().min(1, "Medication order id is required.")
});

export const ipdMedicationAdministrationSchema = z.object({
  medicationOrderId: z.string().trim().min(1, "Medication order id is required."),
  status: z.enum(medicationAdministrationStatuses as [string, ...string[]], { error: "Invalid administration status." }).default("Given"),
  notes: optionalText
});

export type IpdAdmissionCreateInput = z.infer<typeof ipdAdmissionCreateSchema>;
export type IpdBedUpdateInput = z.infer<typeof ipdBedUpdateSchema>;
export type IpdTransferInput = z.infer<typeof ipdTransferSchema>;
export type IpdVitalsInput = z.infer<typeof ipdVitalsSchema>;
export type IpdEscalateInput = z.infer<typeof ipdEscalateSchema>;
export type IpdAdmissionUpdateInput = z.infer<typeof ipdAdmissionUpdateSchema>;
