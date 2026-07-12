import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { upsertPatientFromInput } from "@/lib/patient-store";

type AppointmentStore = {
  appointments: AppointmentRecord[];
};

const store = createDocumentStore<AppointmentStore>("appointments", (parsed) => {
  const doc = parsed as Partial<AppointmentStore> | undefined;
  return { appointments: Array.isArray(doc?.appointments) ? (doc.appointments as AppointmentRecord[]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createAppointment(input: Record<string, unknown>) {
  const patient = await upsertPatientFromInput(input);
  const symptomsInput = input.symptoms;
  const symptoms = Array.isArray(symptomsInput)
    ? symptomsInput.map(String).map((item) => item.trim()).filter(Boolean)
    : [];

  const appointment: AppointmentRecord = {
    id: `MGM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    patientId: patient.id,
    uhid: patient.uhid,
    createdAt: new Date().toISOString(),
    status: "New",
    name: normalizeText(input.name),
    phone: normalizeText(input.phone),
    email: normalizeText(input.email),
    age: normalizeText(input.age),
    gender: normalizeText(input.gender),
    addressLine: normalizeText(input.addressLine),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    postalCode: normalizeText(input.postalCode),
    patientType: normalizeText(input.patientType),
    contactMethod: normalizeText(input.contactMethod) || "Phone / WhatsApp",
    service: normalizeText(input.service),
    countryCode: normalizeText(input.countryCode),
    admissionReason: normalizeText(input.admissionReason),
    insuranceTpa: normalizeText(input.insuranceTpa),
    roomPreference: normalizeText(input.roomPreference),
    hasReferral: normalizeText(input.hasReferral),
    referredBy: normalizeText(input.referredBy),
    date: normalizeText(input.date),
    timeSlot: normalizeText(input.timeSlot) || "Flexible",
    priority: normalizeText(input.priority) || "Routine",
    symptoms,
    duration: normalizeText(input.duration),
    medicines: normalizeText(input.medicines),
    assistance: normalizeText(input.assistance),
    report: normalizeText(input.report),
    message: normalizeText(input.message)
  };

  const doc = await store.load();
  doc.appointments.unshift(appointment);
  await store.save(doc);
  return appointment;
}

export async function listAppointments() {
  return (await store.load()).appointments;
}

export async function getAppointmentById(id: string) {
  return (await store.load()).appointments.find((appointment) => appointment.id === id) ?? null;
}

export async function listPatientAppointments(phone: string, requestId?: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const normalizedRequestId = requestId?.trim().toUpperCase();

  if (normalizedPhone.length < 6) return [];

  return (await store.load()).appointments.filter((appointment) => {
    const appointmentPhone = appointment.phone.replace(/\D/g, "");
    const phoneMatches = appointmentPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(appointmentPhone);
    const requestMatches = normalizedRequestId ? appointment.id.toUpperCase() === normalizedRequestId : true;
    return phoneMatches && requestMatches;
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const doc = await store.load();
  const appointment = doc.appointments.find((item) => item.id === id);
  if (!appointment) return null;
  appointment.status = status;
  await store.save(doc);
  return appointment;
}
