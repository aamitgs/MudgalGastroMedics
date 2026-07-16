/**
 * Pure waitlist-matching logic, separated from appointment-waitlist-store.ts
 * (which is server-only/impure) so the actual matching rules are unit
 * testable in isolation — same split as lib/clinical/recall.ts.
 */

import type { AppointmentRecord } from "@/lib/appointment-types";
import type { AppointmentWaitlistEntry } from "@/lib/appointment-waitlist-types";

/**
 * Finds the oldest "Waiting" entry matching a cancelled appointment's
 * service, whose preferred date is either blank ("any date works") or
 * exactly the cancelled slot's date. FIFO — only one match per cancellation,
 * so a single opening is never offered to more than one patient at once.
 */
export function findWaitlistMatch(entries: AppointmentWaitlistEntry[], cancelledAppointment: AppointmentRecord): AppointmentWaitlistEntry | undefined {
  if (!cancelledAppointment.date) return undefined;

  return [...entries]
    .filter((entry) => entry.status === "Waiting")
    .filter((entry) => entry.service.trim().toLowerCase() === cancelledAppointment.service.trim().toLowerCase())
    .filter((entry) => !entry.preferredDate || entry.preferredDate === cancelledAppointment.date)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
}
