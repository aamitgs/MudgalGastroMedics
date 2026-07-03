import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { PatientRecord, PatientStatus } from "@/lib/patient-types";

type PatientStore = {
  patients: PatientRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmPatientStore?: PatientStore;
};

const storeFile = join(process.cwd(), ".data", "patients.json");

function readPatientsFromDisk(): PatientRecord[] {
  try {
    if (!existsSync(storeFile)) return [];
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<PatientStore>;
    return Array.isArray(parsed.patients) ? parsed.patients : [];
  } catch {
    return [];
  }
}

function writePatientsToDisk(patients: PatientRecord[]) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify({ patients }, null, 2));
}

function getStore() {
  globalStore.__mgmPatientStore ??= { patients: readPatientsFromDisk() };
  return globalStore.__mgmPatientStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function createUhid() {
  const year = new Date().getFullYear();
  const sequence = getStore().patients.length + 1;
  return `MGM-${year}-${String(sequence).padStart(5, "0")}`;
}

export function listPatients() {
  return getStore().patients;
}

export function getPatientById(id: string) {
  return getStore().patients.find((patient) => patient.id === id || patient.uhid === id) ?? null;
}

export function findPatientByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 6) return null;

  return getStore().patients.find((patient) => {
    const patientPhone = normalizePhone(patient.phone);
    return patientPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(patientPhone);
  }) ?? null;
}

export function upsertPatientFromInput(input: Record<string, unknown>) {
  const phone = normalizeText(input.phone);
  const name = normalizeText(input.name);
  const existing = findPatientByPhone(phone);
  const now = new Date().toISOString();

  if (existing) {
    existing.name = name || existing.name;
    existing.email = normalizeText(input.email) || existing.email;
    existing.age = normalizeText(input.age) || existing.age;
    existing.gender = normalizeText(input.gender) || existing.gender;
    existing.currentMedicines = normalizeText(input.medicines) || existing.currentMedicines;
    existing.updatedAt = now;
    existing.lastVisitAt = now;
    writePatientsToDisk(getStore().patients);
    return existing;
  }

  const patient: PatientRecord = {
    id: `PAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    uhid: createUhid(),
    createdAt: now,
    updatedAt: now,
    status: "Active",
    name,
    phone,
    email: normalizeText(input.email),
    age: normalizeText(input.age),
    gender: normalizeText(input.gender),
    currentMedicines: normalizeText(input.medicines),
    notes: normalizeText(input.message),
    lastVisitAt: now
  };

  getStore().patients.unshift(patient);
  writePatientsToDisk(getStore().patients);
  return patient;
}

export function createPatient(input: Record<string, unknown>) {
  const name = normalizeText(input.name);
  const phone = normalizeText(input.phone);
  if (!name || normalizePhone(phone).length < 6) return null;

  const existing = findPatientByPhone(phone);
  if (existing) return updatePatient({ ...input, id: existing.id });

  const now = new Date().toISOString();
  const patient: PatientRecord = {
    id: `PAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    uhid: createUhid(),
    createdAt: now,
    updatedAt: now,
    status: "Active",
    name,
    phone,
    alternatePhone: normalizeText(input.alternatePhone),
    email: normalizeText(input.email),
    age: normalizeText(input.age),
    gender: normalizeText(input.gender),
    bloodGroup: normalizeText(input.bloodGroup),
    address: normalizeText(input.address),
    city: normalizeText(input.city),
    emergencyContact: normalizeText(input.emergencyContact),
    allergies: normalizeText(input.allergies),
    chronicConditions: normalizeText(input.chronicConditions),
    currentMedicines: normalizeText(input.currentMedicines),
    notes: normalizeText(input.notes)
  };

  getStore().patients.unshift(patient);
  writePatientsToDisk(getStore().patients);
  return patient;
}

export function updatePatient(input: Record<string, unknown>) {
  const id = normalizeText(input.id);
  const patient = getPatientById(id);
  if (!patient) return null;

  const status = normalizeText(input.status);
  if (status) patient.status = status as PatientStatus;
  if (typeof input.name === "string") patient.name = normalizeText(input.name);
  if (typeof input.phone === "string") patient.phone = normalizeText(input.phone);
  if (typeof input.alternatePhone === "string") patient.alternatePhone = normalizeText(input.alternatePhone);
  if (typeof input.email === "string") patient.email = normalizeText(input.email);
  if (typeof input.age === "string") patient.age = normalizeText(input.age);
  if (typeof input.gender === "string") patient.gender = normalizeText(input.gender);
  if (typeof input.bloodGroup === "string") patient.bloodGroup = normalizeText(input.bloodGroup);
  if (typeof input.address === "string") patient.address = normalizeText(input.address);
  if (typeof input.city === "string") patient.city = normalizeText(input.city);
  if (typeof input.emergencyContact === "string") patient.emergencyContact = normalizeText(input.emergencyContact);
  if (typeof input.allergies === "string") patient.allergies = normalizeText(input.allergies);
  if (typeof input.chronicConditions === "string") patient.chronicConditions = normalizeText(input.chronicConditions);
  if (typeof input.currentMedicines === "string") patient.currentMedicines = normalizeText(input.currentMedicines);
  if (typeof input.notes === "string") patient.notes = normalizeText(input.notes);
  patient.updatedAt = new Date().toISOString();

  writePatientsToDisk(getStore().patients);
  return patient;
}
