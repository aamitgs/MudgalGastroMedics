import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
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

export function findPatientForVisit(visit: OpdVisit, patients: PatientRecord[]) {
  return patients.find((patient) => patient.id === visit.patientId || patient.uhid === visit.uhid || patient.phone.replace(/\D/g, "").endsWith(visit.phone.replace(/\D/g, "")));
}

export function createDoctorSummaryText(visit: OpdVisit, patient?: PatientRecord) {
  return [
    site.name,
    `Patient: ${visit.patientName}`,
    visit.uhid ? `UHID: ${visit.uhid}` : "",
    `Token: ${visit.token}`,
    `Service: ${visit.service}`,
    patient?.allergies ? `Allergies: ${patient.allergies}` : "",
    visit.clinicalNote ? `Clinical note: ${visit.clinicalNote}` : "",
    visit.prescription ? `Prescription: ${visit.prescription}` : "",
    visit.advice ? `Advice: ${visit.advice}` : "",
    visit.followUpDate ? `Follow-up: ${visit.followUpDate}` : ""
  ].filter(Boolean).join("\n");
}
