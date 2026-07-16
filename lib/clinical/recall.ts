/**
 * Chronic-care recall / follow-up surveillance.
 *
 * GI/hepatology has real recurring-review patients (cirrhosis surveillance,
 * IBD monitoring, post-polypectomy intervals) — a missed follow-up is a
 * patient-safety gap, not just a scheduling nicety. Reuses OpdVisit's
 * existing `followUpDate` field (no schema change); a recall is considered
 * fulfilled once the same patient has any later real visit, whether or not
 * staff ever manually closed the reminder.
 */

import type { OpdVisit } from "@/lib/opd-types";

export type RecallStatus = "not-due" | "due-soon" | "overdue" | "fulfilled";

export type RecallEvaluation = {
  status: RecallStatus;
  dueDate: string;
  /** Positive once past the due date; negative days-until-due otherwise. */
  daysOverdue: number;
};

/** A follow-up due within this many days is surfaced as "due-soon" rather than staying silent until it's actually overdue. */
export const recallDueSoonWindowDays = 7;

/** Past this many days overdue, a recall reads as an escalated safety concern, not a routine reminder. */
export const recallEscalationDays = 30;

function groupVisitsByPatient(visits: OpdVisit[]): Map<string, OpdVisit[]> {
  const byPatient = new Map<string, OpdVisit[]>();
  for (const visit of visits) {
    if (!visit.patientId) continue;
    const list = byPatient.get(visit.patientId);
    if (list) list.push(visit);
    else byPatient.set(visit.patientId, [visit]);
  }
  return byPatient;
}

/**
 * Visits with no patientId (unregistered/walk-in edge case) can never be
 * reliably matched to a later visit by the same person, so they're never
 * auto-marked fulfilled — safer to leave a human to resolve it than to guess
 * a false match and silently hide a real gap.
 */
function evaluate(visit: OpdVisit, visitsForPatient: OpdVisit[], now: Date): RecallEvaluation | null {
  if (!visit.followUpDate) return null;
  const dueDate = new Date(visit.followUpDate);
  if (Number.isNaN(dueDate.getTime())) return null;

  const returned =
    Boolean(visit.patientId) &&
    visitsForPatient.some((other) => other.id !== visit.id && new Date(other.createdAt) >= dueDate);

  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / 86400000);

  if (returned) return { status: "fulfilled", dueDate: visit.followUpDate, daysOverdue };
  if (daysOverdue > 0) return { status: "overdue", dueDate: visit.followUpDate, daysOverdue };
  if (daysOverdue >= -recallDueSoonWindowDays) return { status: "due-soon", dueDate: visit.followUpDate, daysOverdue };
  return { status: "not-due", dueDate: visit.followUpDate, daysOverdue };
}

/** Single-visit evaluation — mainly for tests; call sites evaluating many visits should use evaluateRecalls to avoid re-scanning the full list per visit. */
export function evaluateRecall(visit: OpdVisit, allVisits: OpdVisit[], now = new Date()): RecallEvaluation | null {
  const visitsForPatient = visit.patientId ? allVisits.filter((other) => other.patientId === visit.patientId) : [visit];
  return evaluate(visit, visitsForPatient, now);
}

/** Groups by patient once (O(n)), then evaluates every visit that carries a followUpDate. Keyed by visit id. */
export function evaluateRecalls(visits: OpdVisit[], now = new Date()): Map<string, RecallEvaluation> {
  const byPatient = groupVisitsByPatient(visits);
  const results = new Map<string, RecallEvaluation>();
  for (const visit of visits) {
    if (!visit.followUpDate) continue;
    const visitsForPatient = visit.patientId ? byPatient.get(visit.patientId) ?? [visit] : [visit];
    const evaluation = evaluate(visit, visitsForPatient, now);
    if (evaluation) results.set(visit.id, evaluation);
  }
  return results;
}
