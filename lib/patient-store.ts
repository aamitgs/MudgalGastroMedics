import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId, nextSerialNumber } from "@/lib/id";
import type { PatientRecord, PatientStatus } from "@/lib/patient-types";

type PatientStore = {
  patients: PatientRecord[];
  /**
   * UHIDs belonging to hard-deleted patients. Kept because deletePatient
   * removes the record but cannot un-print the card the patient was given:
   * without this, the next registration would be issued a number someone is
   * still carrying. Numbers only, no patient data — this is a list of what may
   * not be reused, not a shadow copy of deleted records.
   */
  retiredUhids: string[];
};

const store = createDocumentStore<PatientStore>("patients", (parsed) => {
  const doc = parsed as Partial<PatientStore> | undefined;
  return {
    patients: Array.isArray(doc?.patients) ? (doc.patients as PatientRecord[]) : [],
    retiredUhids: Array.isArray(doc?.retiredUhids) ? (doc.retiredUhids as string[]) : []
  };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * A UHID is lifelong and gets printed on a card the patient keeps, so it is
 * issued from the highest number ever used — live patients and retired numbers
 * together — rather than from the patient count. Counting live rows would hand
 * the next person to register a number someone is still walking around with,
 * and the most likely deletion of all is the mis-registration that was created
 * moments ago, whose number is the highest one issued.
 *
 * Same MGM-YYYY-00001 shape the count-based version produced, so every number
 * already out in the world keeps working.
 */
function createUhid(doc: PatientStore) {
  return nextSerialNumber("MGM", [...doc.patients.map((patient) => patient.uhid), ...doc.retiredUhids]);
}

function findByPhoneIn(patients: PatientRecord[], phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 6) return null;
  return (
    patients.find((patient) => {
      const patientPhone = normalizePhone(patient.phone);
      return patientPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(patientPhone);
    }) ?? null
  );
}

export async function listPatients() {
  return (await store.load()).patients;
}

export async function getPatientById(id: string) {
  return (await store.load()).patients.find((patient) => patient.id === id || patient.uhid === id) ?? null;
}

export async function findPatientByPhone(phone: string) {
  return findByPhoneIn((await store.load()).patients, phone);
}

export async function upsertPatientFromInput(input: Record<string, unknown>) {
  const phone = normalizeText(input.phone);
  const name = normalizeText(input.name);
  const doc = await store.load();
  // Same forceNew override as createPatient — a phone match usually means
  // the same person re-booking, but the Appointments staff booking form's
  // duplicate-detection banner lets reception explicitly say "different
  // person, same number" instead of silently overwriting the existing name.
  const existing = input.forceNew === true ? null : findByPhoneIn(doc.patients, phone);
  const now = new Date().toISOString();

  // input.medicines (public-site booking form's own field name) and
  // input.currentMedicines (staff booking form, matching Patient
  // registration's field name) are two different callers of this same
  // upsert — accept either so neither loses data.
  const currentMedicines = normalizeText(input.currentMedicines) || normalizeText(input.medicines);

  if (existing) {
    existing.name = name || existing.name;
    existing.email = normalizeText(input.email) || existing.email;
    existing.age = normalizeText(input.age) || existing.age;
    existing.gender = normalizeText(input.gender) || existing.gender;
    existing.currentMedicines = currentMedicines || existing.currentMedicines;
    existing.bloodGroup = normalizeText(input.bloodGroup) || existing.bloodGroup;
    existing.address = normalizeText(input.address) || existing.address;
    existing.emergencyContact = normalizeText(input.emergencyContact) || existing.emergencyContact;
    existing.allergies = normalizeText(input.allergies) || existing.allergies;
    existing.chronicConditions = normalizeText(input.chronicConditions) || existing.chronicConditions;
    existing.updatedAt = now;
    existing.lastVisitAt = now;
    await store.save(doc);
    return existing;
  }

  const patient: PatientRecord = {
    id: generateId("PAT"),
    uhid: createUhid(doc),
    createdAt: now,
    updatedAt: now,
    status: "Active",
    name,
    phone,
    email: normalizeText(input.email),
    age: normalizeText(input.age),
    gender: normalizeText(input.gender),
    bloodGroup: normalizeText(input.bloodGroup),
    address: normalizeText(input.address),
    emergencyContact: normalizeText(input.emergencyContact),
    allergies: normalizeText(input.allergies),
    chronicConditions: normalizeText(input.chronicConditions),
    currentMedicines,
    notes: normalizeText(input.message),
    lastVisitAt: now
  };

  doc.patients.unshift(patient);
  await store.save(doc);
  return patient;
}

export async function createPatient(input: Record<string, unknown>) {
  const name = normalizeText(input.name);
  const phone = normalizeText(input.phone);
  if (!name || normalizePhone(phone).length < 6) return null;

  const doc = await store.load();
  const existing = findByPhoneIn(doc.patients, phone);
  // Duplicate-patient detection (Track 0.3): a phone match normally merges
  // into the existing record, since that's usually the same person
  // re-registering. forceNew is the explicit staff override for a genuinely
  // different person sharing a number (e.g. a family member) — confirmed via
  // the "Different person" choice in the registration form, never silent.
  if (existing && input.forceNew !== true) return (await updatePatient({ ...input, id: existing.id }));

  const now = new Date().toISOString();
  const patient: PatientRecord = {
    id: generateId("PAT"),
    uhid: createUhid(doc),
    createdAt: now,
    updatedAt: now,
    status: "Active",
    name,
    phone,
    alternatePhone: normalizeText(input.alternatePhone),
    email: normalizeText(input.email),
    age: normalizeText(input.age),
    dateOfBirth: normalizeText(input.dateOfBirth),
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

  doc.patients.unshift(patient);
  await store.save(doc);
  return patient;
}

export async function updatePatient(input: Record<string, unknown>) {
  const id = normalizeText(input.id);
  const doc = await store.load();
  const patient = doc.patients.find((item) => item.id === id || item.uhid === id);
  if (!patient) return null;

  const status = normalizeText(input.status);
  if (status) patient.status = status as PatientStatus;
  if (typeof input.name === "string") patient.name = normalizeText(input.name);
  if (typeof input.phone === "string") patient.phone = normalizeText(input.phone);
  if (typeof input.alternatePhone === "string") patient.alternatePhone = normalizeText(input.alternatePhone);
  if (typeof input.email === "string") patient.email = normalizeText(input.email);
  if (typeof input.age === "string") patient.age = normalizeText(input.age);
  if (typeof input.dateOfBirth === "string") patient.dateOfBirth = normalizeText(input.dateOfBirth);
  if (typeof input.gender === "string") patient.gender = normalizeText(input.gender);
  if (typeof input.bloodGroup === "string") patient.bloodGroup = normalizeText(input.bloodGroup);
  if (typeof input.address === "string") patient.address = normalizeText(input.address);
  if (typeof input.city === "string") patient.city = normalizeText(input.city);
  if (typeof input.emergencyContact === "string") patient.emergencyContact = normalizeText(input.emergencyContact);
  if (typeof input.allergies === "string") patient.allergies = normalizeText(input.allergies);
  if (typeof input.chronicConditions === "string") patient.chronicConditions = normalizeText(input.chronicConditions);
  if (typeof input.currentMedicines === "string") patient.currentMedicines = normalizeText(input.currentMedicines);
  if (typeof input.notes === "string") patient.notes = normalizeText(input.notes);
  if (typeof input.dietPlan === "string") patient.dietPlan = normalizeText(input.dietPlan);
  patient.updatedAt = new Date().toISOString();

  await store.save(doc);
  return patient;
}

/**
 * Hard delete — the route (app/api/patients/route.ts) already verified there's
 * no appointment/visit/admission/lab/pharmacy activity against this patient
 * before calling this, so this function itself carries no safety guard. That
 * check lives in the route, not here, because it's genuinely cross-store
 * (appointment-store.ts already imports FROM this file for upsertPatientFromInput,
 * so patient-store.ts importing back from appointment-store.ts would be a
 * circular import) — deleteAppointment/deleteBed can self-guard because their
 * checks are intra-store; this one can't be.
 */
export async function deletePatient(id: string) {
  const doc = await store.load();
  const patient = doc.patients.find((item) => item.id === id);
  if (!patient) return { error: "Patient not found." };

  doc.patients = doc.patients.filter((item) => item.id !== id);
  // The record goes; the number does not come back. A card or wristband
  // carrying this UHID may already be in the patient's hands, so reissuing it
  // would point their identifier at a different person.
  if (patient.uhid && !doc.retiredUhids.includes(patient.uhid)) doc.retiredUhids.push(patient.uhid);
  await store.save(doc);
  return { patient };
}
