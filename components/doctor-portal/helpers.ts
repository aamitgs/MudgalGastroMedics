import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { serializePrescriptionItems } from "@/lib/prescription-instructions";
import { site } from "@/lib/site-data";

/** Distinct values used at least twice, most-frequent first — a single past entry isn't a "favourite". */
export function topFrequent(values: (string | undefined)[], limit = 6) {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

/** Same "used at least twice" rule as topFrequent, generalized to objects (prescription rows aren't plain strings) via a caller-supplied dedup key. */
export function topFrequentByKey<T>(items: T[], keyFn: (item: T) => string, limit = 6): T[] {
  const counts = new Map<string, { item: T; count: number }>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { item, count: 1 });
  }
  return [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.item);
}

/** Dedup key for "the same medicine row" — case/whitespace-insensitive on medicine+strength+instruction; days isn't part of identity since the same drug at a shorter/longer course is still the same favourite to quick-insert. */
export function prescriptionItemKey(item: PrescriptionItem) {
  return `${item.medicine.trim().toLowerCase()}|${(item.strength ?? "").trim().toLowerCase()}|${item.instruction.trim().toLowerCase()}`;
}

export function findPatientForVisit(visit: OpdVisit, patients: PatientRecord[]) {
  return patients.find((patient) => patient.id === visit.patientId || patient.uhid === visit.uhid || patient.phone.replace(/\D/g, "").endsWith(visit.phone.replace(/\D/g, "")));
}

export function createDoctorSummaryText(visit: OpdVisit, patient?: PatientRecord) {
  const hasItems = Boolean(visit.prescriptionItems?.length);
  const vitals = [
    visit.vitalsBp ? `BP ${visit.vitalsBp}` : "",
    visit.vitalsPulse ? `Pulse ${visit.vitalsPulse}` : "",
    visit.vitalsWeight ? `Weight ${visit.vitalsWeight}` : ""
  ].filter(Boolean).join(", ");
  return [
    site.name,
    `Patient: ${visit.patientName}`,
    visit.uhid ? `UHID: ${visit.uhid}` : "",
    `Token: ${visit.token}`,
    `Service: ${visit.service}`,
    patient?.allergies ? `Allergies: ${patient.allergies}` : "",
    visit.presentingComplaints ? `Presenting complaints: ${visit.presentingComplaints}` : "",
    visit.history ? `History: ${visit.history}` : "",
    vitals ? `Vitals: ${vitals}` : "",
    visit.generalExamination ? `General examination: ${visit.generalExamination}` : "",
    visit.perAbdomen ? `Per abdomen: ${visit.perAbdomen}` : "",
    visit.priorInvestigation ? `Prior investigation: ${visit.priorInvestigation}` : "",
    visit.diagnosis ? `Diagnosis: ${visit.diagnosis}` : "",
    visit.investigationAdvice ? `Investigation advice: ${visit.investigationAdvice}` : "",
    visit.clinicalNote ? `Clinical note: ${visit.clinicalNote}` : "",
    hasItems ? `Prescription:\n${serializePrescriptionItems(visit.prescriptionItems!)}` : "",
    visit.prescription ? `${hasItems ? "Additional notes" : "Prescription"}: ${visit.prescription}` : "",
    visit.advice ? `Advice: ${visit.advice}` : "",
    visit.followUpDate ? `Follow-up: ${visit.followUpDate}` : ""
  ].filter(Boolean).join("\n");
}
