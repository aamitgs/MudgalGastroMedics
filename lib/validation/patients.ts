import { z } from "zod";
import { patientStatuses } from "@/lib/patient-types";

const optionalText = z.string().trim().optional();

function hasEnoughDigits(phone: string) {
  return phone.replace(/\D/g, "").length >= 6;
}

export const patientCreateSchema = z.object({
  name: z.string().trim().min(1, "Patient name is required."),
  phone: z.string().trim().refine(hasEnoughDigits, "Enter a valid phone number."),
  // The client sends `forceNew: duplicateMatch && confirmedNewPatient`, which
  // is `null` (not `false`) whenever there's no duplicate match — nullish(),
  // not optional(), so that ordinary create requests still validate.
  forceNew: z.boolean().nullish(),
  alternatePhone: optionalText,
  email: optionalText,
  age: optionalText,
  gender: optionalText,
  bloodGroup: optionalText,
  address: optionalText,
  city: optionalText,
  emergencyContact: optionalText,
  allergies: optionalText,
  chronicConditions: optionalText,
  currentMedicines: optionalText,
  notes: optionalText
});

export const patientUpdateSchema = z.object({
  id: z.string().trim().min(1, "Patient id is required."),
  status: z.enum(patientStatuses as [string, ...string[]], { error: "Invalid patient status." }).optional(),
  name: optionalText,
  phone: optionalText,
  alternatePhone: optionalText,
  email: optionalText,
  age: optionalText,
  gender: optionalText,
  bloodGroup: optionalText,
  address: optionalText,
  city: optionalText,
  emergencyContact: optionalText,
  allergies: optionalText,
  chronicConditions: optionalText,
  currentMedicines: optionalText,
  notes: optionalText
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
