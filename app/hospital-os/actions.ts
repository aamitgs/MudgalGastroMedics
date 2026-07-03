"use server";

import {
  aiPrescriptionConfirmationSchema,
  appointmentSchema,
  billingSchema,
  bulkPatientFlowActionSchema,
  clinicalNotesAutosaveSchema,
  doctorAssignmentSchema,
  patientRegistrationSchema,
  teleconsultationRequestSchema
} from "@/lib/validation/hospital-os";
import type {
  AiPrescriptionConfirmationInput,
  AppointmentInput,
  BillingInput,
  BulkPatientFlowActionInput,
  ClinicalNotesAutosaveInput,
  DoctorAssignmentInput,
  PatientRegistrationInput,
  TeleconsultationRequestInput
} from "@/lib/validation/hospital-os";
import { recordAuditEvent } from "@/lib/audit-store";

type ActionResult = {
  ok: boolean;
  message: string;
  auditId?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<Record<string, string>>((errors, issue) => {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
    return errors;
  }, {});
}

export async function registerHospitalPatient(input: PatientRegistrationInput): Promise<ActionResult> {
  const parsed = patientRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Patient registration could not be saved.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "admin",
    actorId: "hospital-os-registration",
    action: "hospital_os.patient.registered",
    entityType: "patient",
    entityId: `registration-${parsed.data.mobile.slice(-4)}`,
    metadata: {
      workflow: "patient_registration",
      age: parsed.data.age,
      sex: parsed.data.sex
    }
  });

  return {
    ok: true,
    message: `Patient registration saved for ${parsed.data.firstName} ${parsed.data.lastName}.`,
    auditId: event.id
  };
}

export async function bookHospitalAppointment(input: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Appointment could not be booked.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "admin",
    actorId: "hospital-os-front-desk",
    action: "hospital_os.appointment.booked",
    entityType: "appointment",
    entityId: parsed.data.patientUhid,
    metadata: {
      department: parsed.data.department,
      doctor: parsed.data.doctor,
      appointmentDate: parsed.data.appointmentDate,
      appointmentTime: parsed.data.appointmentTime
    }
  });

  return {
    ok: true,
    message: `Appointment booked for ${parsed.data.patientUhid}.`,
    auditId: event.id
  };
}

export async function postHospitalBilling(input: BillingInput): Promise<ActionResult> {
  const parsed = billingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Billing could not be posted.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "admin",
    actorId: "hospital-os-billing",
    action: "hospital_os.billing.posted",
    entityType: "invoice",
    entityId: parsed.data.invoiceId,
    metadata: {
      patientUhid: parsed.data.patientUhid,
      amount: parsed.data.amount,
      payerType: parsed.data.payerType
    }
  });

  return {
    ok: true,
    message: `Billing posted for ${parsed.data.invoiceId}.`,
    auditId: event.id
  };
}

export async function bulkUpdatePatientFlow(input: BulkPatientFlowActionInput): Promise<ActionResult> {
  const parsed = bulkPatientFlowActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Bulk patient flow action could not be applied.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "admin",
    actorId: "hospital-os-command-center",
    action: "hospital_os.patient_flow.bulk_updated",
    entityType: "patient_flow",
    entityId: parsed.data.rowIds.join(","),
    metadata: {
      rowIds: parsed.data.rowIds,
      status: parsed.data.status
    }
  });

  return {
    ok: true,
    message: `${parsed.data.rowIds.length} patient flow ${parsed.data.rowIds.length === 1 ? "row" : "rows"} scheduled.`,
    auditId: event.id
  };
}

export async function assignHospitalDoctor(input: DoctorAssignmentInput): Promise<ActionResult> {
  const parsed = doctorAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Doctor assignment could not be saved.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "admin",
    actorId: "hospital-os-command-center",
    action: "hospital_os.patient_flow.doctor_assigned",
    entityType: "patient_flow",
    entityId: parsed.data.patientId,
    metadata: {
      doctor: parsed.data.doctor
    }
  });

  return {
    ok: true,
    message: `Doctor assigned to ${parsed.data.patientId}.`,
    auditId: event.id
  };
}

export async function autosaveClinicalNotes(input: ClinicalNotesAutosaveInput): Promise<ActionResult> {
  const parsed = clinicalNotesAutosaveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Clinical notes could not be autosaved.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "doctor",
    actorId: "doctor-workspace",
    action: "hospital_os.clinical_notes.autosaved",
    entityType: "patient",
    entityId: parsed.data.patientId,
    metadata: {
      noteLength: parsed.data.notes.length
    }
  });

  return {
    ok: true,
    message: "Clinical notes autosaved.",
    auditId: event.id
  };
}

export async function confirmAiPrescriptionSuggestion(input: AiPrescriptionConfirmationInput): Promise<ActionResult> {
  const parsed = aiPrescriptionConfirmationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "AI prescription suggestion could not be confirmed.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "doctor",
    actorId: "doctor-workspace",
    action: "hospital_os.ai_prescription.confirmed",
    entityType: "patient",
    entityId: parsed.data.patientId,
    metadata: {
      suggestionLength: parsed.data.suggestion.length,
      requiresDoctorConfirmation: true
    }
  });

  return {
    ok: true,
    message: "AI prescription suggestion confirmed by doctor.",
    auditId: event.id
  };
}

export async function requestTeleconsultation(input: TeleconsultationRequestInput): Promise<ActionResult> {
  const parsed = teleconsultationRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Teleconsultation request could not be sent.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues)
    };
  }

  const event = await recordAuditEvent({
    actorRole: "patient",
    actorId: "patient-portal",
    action: "hospital_os.teleconsultation.requested",
    entityType: "patient",
    entityId: parsed.data.patientId,
    metadata: {
      source: "symptom_checker",
      symptomLength: parsed.data.symptomNote.length
    }
  });

  return {
    ok: true,
    message: "Teleconsultation request sent.",
    auditId: event.id
  };
}
