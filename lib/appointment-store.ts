import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { upsertPatientFromInput } from "@/lib/patient-store";

type AppointmentStore = {
  appointments: AppointmentRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmAppointmentStore?: AppointmentStore;
};

const storeFile = join(process.cwd(), ".data", "appointments.json");

function readAppointmentsFromDisk(): AppointmentRecord[] {
  try {
    if (!existsSync(storeFile)) return [];
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<AppointmentStore>;
    return Array.isArray(parsed.appointments) ? parsed.appointments : [];
  } catch {
    return [];
  }
}

function writeAppointmentsToDisk(appointments: AppointmentRecord[]) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify({ appointments }, null, 2));
}

function getStore() {
  globalStore.__mgmAppointmentStore ??= { appointments: readAppointmentsFromDisk() };
  return globalStore.__mgmAppointmentStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createAppointment(input: Record<string, unknown>) {
  const patient = upsertPatientFromInput(input);
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
    patientType: normalizeText(input.patientType),
    contactMethod: normalizeText(input.contactMethod) || "Phone / WhatsApp",
    service: normalizeText(input.service),
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

  getStore().appointments.unshift(appointment);
  writeAppointmentsToDisk(getStore().appointments);
  return appointment;
}

export function listAppointments() {
  return getStore().appointments;
}

export function getAppointmentById(id: string) {
  return getStore().appointments.find((appointment) => appointment.id === id) ?? null;
}

export function listPatientAppointments(phone: string, requestId?: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const normalizedRequestId = requestId?.trim().toUpperCase();

  if (normalizedPhone.length < 6) return [];

  return getStore().appointments.filter((appointment) => {
    const appointmentPhone = appointment.phone.replace(/\D/g, "");
    const phoneMatches = appointmentPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(appointmentPhone);
    const requestMatches = normalizedRequestId ? appointment.id.toUpperCase() === normalizedRequestId : true;
    return phoneMatches && requestMatches;
  });
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const appointment = getStore().appointments.find((item) => item.id === id);
  if (!appointment) return null;
  appointment.status = status;
  writeAppointmentsToDisk(getStore().appointments);
  return appointment;
}
