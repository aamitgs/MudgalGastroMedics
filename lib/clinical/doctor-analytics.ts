import { evaluateRecalls } from "@/lib/clinical/recall";
import type { OpdVisit } from "@/lib/opd-types";

export type RankedEntry = { label: string; count: number };

export type DoctorAnalytics = {
  totalConsultations: number;
  /** null when no completed visit has both a start and end timestamp yet — never a fabricated number. */
  avgConsultationMinutes: number | null;
  avgPatientsPerDay: number | null;
  topDiagnoses: RankedEntry[];
  topMedicines: RankedEntry[];
  /** Percent of visits with a follow-up that's either been kept or is now overdue — null when nothing is old enough to judge yet. */
  followUpCompliancePercent: number | null;
};

function rankByFrequency(values: (string | undefined)[], limit = 5): RankedEntry[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

/**
 * Clinic-wide (not per-doctor — the Doctor Portal queue isn't currently
 * scoped to one signed-in doctor's own patients) consultation analytics
 * (Track: consultation analytics), computed entirely from OpdVisit records
 * already loaded for the queue — no extra fetch. Every number here is
 * derived from real timestamps/fields; nothing is estimated or fabricated,
 * matching this app's "never invent data" rule for anything shown to staff.
 */
export function computeDoctorAnalytics(visits: OpdVisit[]): DoctorAnalytics {
  const completed = visits.filter((visit) => visit.status === "Completed");

  const durationsMs = completed
    .map((visit) => {
      if (!visit.consultationStartedAt || !visit.completedAt) return null;
      const ms = new Date(visit.completedAt).getTime() - new Date(visit.consultationStartedAt).getTime();
      return Number.isFinite(ms) && ms > 0 ? ms : null;
    })
    .filter((ms): ms is number => ms !== null);
  const avgConsultationMinutes = durationsMs.length
    ? Math.round((durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length / 60000) * 10) / 10
    : null;

  const visitsByDay = new Map<string, number>();
  for (const visit of visits) {
    const day = visit.createdAt.slice(0, 10);
    visitsByDay.set(day, (visitsByDay.get(day) ?? 0) + 1);
  }
  const avgPatientsPerDay = visitsByDay.size ? Math.round((visits.length / visitsByDay.size) * 10) / 10 : null;

  const topDiagnoses = rankByFrequency(visits.map((visit) => visit.diagnosis));
  const topMedicines = rankByFrequency(visits.flatMap((visit) => visit.prescriptionItems?.map((item) => item.medicine) ?? []));

  const recalls = evaluateRecalls(visits);
  const judgeable = [...recalls.values()].filter((recall) => recall.status === "fulfilled" || recall.status === "overdue");
  const followUpCompliancePercent = judgeable.length
    ? Math.round((judgeable.filter((recall) => recall.status === "fulfilled").length / judgeable.length) * 100)
    : null;

  return { totalConsultations: completed.length, avgConsultationMinutes, avgPatientsPerDay, topDiagnoses, topMedicines, followUpCompliancePercent };
}
