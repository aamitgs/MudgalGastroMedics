import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AppointmentRecord } from "@/lib/appointment-types";
import { findWaitlistMatch } from "@/lib/appointment-waitlist-match";
import type { AppointmentWaitlistEntry, AppointmentWaitlistStatus } from "@/lib/appointment-waitlist-types";

type AppointmentWaitlistStore = { entries: AppointmentWaitlistEntry[] };

const store = createDocumentStore<AppointmentWaitlistStore>("appointment-waitlist", (parsed) => {
  const doc = parsed as Partial<AppointmentWaitlistStore> | undefined;
  return { entries: Array.isArray(doc?.entries) ? (doc.entries as AppointmentWaitlistEntry[]) : [] };
});

export async function listAppointmentWaitlist() {
  return (await store.load()).entries;
}

export async function createAppointmentWaitlistEntry(input: {
  name: string;
  phone: string;
  service: string;
  preferredDate?: string;
  notes?: string;
}) {
  const doc = await store.load();
  const now = new Date().toISOString();
  const entry: AppointmentWaitlistEntry = {
    id: generateId("WL", 4),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    phone: input.phone,
    service: input.service,
    preferredDate: input.preferredDate,
    notes: input.notes,
    status: "Waiting"
  };
  doc.entries.unshift(entry);
  await store.save(doc);
  return entry;
}

export async function updateAppointmentWaitlistStatus(id: string, status: AppointmentWaitlistStatus) {
  const doc = await store.load();
  const entry = doc.entries.find((item) => item.id === id);
  if (!entry) return null;
  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  await store.save(doc);
  return entry;
}

/**
 * Called when an appointment with a real scheduled date is cancelled. Offers
 * the slot to the OLDEST matching "Waiting" entry only (FIFO, one offer per
 * cancellation) — same service, and either the same date or no preferred
 * date at all ("any date works"). Returns the offered entry, or null if no
 * one on the waitlist matches.
 */
export async function offerWaitlistSlot(cancelledAppointment: AppointmentRecord): Promise<AppointmentWaitlistEntry | null> {
  const doc = await store.load();
  const match = findWaitlistMatch(doc.entries, cancelledAppointment);
  if (!match) return null;

  match.status = "Offered";
  match.offeredAppointmentId = cancelledAppointment.id;
  match.offeredAt = new Date().toISOString();
  match.updatedAt = match.offeredAt;
  await store.save(doc);
  return match;
}
