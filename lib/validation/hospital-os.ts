import { z } from "zod";

export const patientRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "Enter the patient's first name."),
  lastName: z.string().trim().min(2, "Enter the patient's last name."),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  age: z.coerce.number().int().min(0, "Age cannot be negative.").max(120, "Check the patient's age."),
  sex: z.enum(["Female", "Male", "Other"], { error: "Select sex." }),
  concern: z.string().trim().min(5, "Add a short presenting concern.")
});

export const appointmentSchema = z.object({
  patientUhid: z.string().trim().min(4, "Enter UHID or choose a patient."),
  doctor: z.string().trim().min(2, "Choose a doctor."),
  department: z.string().trim().min(2, "Choose a department."),
  appointmentDate: z.string().trim().min(1, "Choose appointment date."),
  appointmentTime: z.string().trim().min(1, "Choose appointment time."),
  reason: z.string().trim().min(5, "Add appointment reason.")
});

export const billingSchema = z.object({
  invoiceId: z.string().trim().min(3, "Enter invoice ID."),
  patientUhid: z.string().trim().min(4, "Enter UHID."),
  amount: z.coerce.number().min(1, "Amount must be greater than zero."),
  payerType: z.enum(["Self pay", "Insurance", "Corporate"], { error: "Select payer type." }),
  notes: z.string().trim().min(5, "Add billing note.")
});

export const bulkPatientFlowActionSchema = z.object({
  rowIds: z.array(z.string().trim().min(1, "Patient flow row is required.")).min(1, "Select at least one patient flow row."),
  status: z.enum(["Scheduled"], { error: "Choose a supported bulk action." })
});

export const doctorAssignmentSchema = z.object({
  patientId: z.string().trim().min(1, "Patient flow row is required."),
  doctor: z.string().trim().min(2, "Choose a doctor.")
});

export const clinicalNotesAutosaveSchema = z.object({
  patientId: z.string().trim().min(1, "Patient is required."),
  notes: z.string().trim().min(5, "Clinical notes need at least 5 characters.").max(5000, "Clinical notes are too long.")
});

export const aiPrescriptionConfirmationSchema = z.object({
  patientId: z.string().trim().min(1, "Patient is required."),
  suggestion: z.string().trim().min(5, "Prescription suggestion is required.")
});

export const teleconsultationRequestSchema = z.object({
  patientId: z.string().trim().min(1, "Patient is required."),
  symptomNote: z.string().trim().min(5, "Symptom note is required.")
});

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type BillingInput = z.infer<typeof billingSchema>;
export type BulkPatientFlowActionInput = z.infer<typeof bulkPatientFlowActionSchema>;
export type DoctorAssignmentInput = z.infer<typeof doctorAssignmentSchema>;
export type ClinicalNotesAutosaveInput = z.infer<typeof clinicalNotesAutosaveSchema>;
export type AiPrescriptionConfirmationInput = z.infer<typeof aiPrescriptionConfirmationSchema>;
export type TeleconsultationRequestInput = z.infer<typeof teleconsultationRequestSchema>;
