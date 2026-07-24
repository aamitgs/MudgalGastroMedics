"use client";

/**
 * Offline autosave queue (Track: offline sync) — localStorage-backed so it
 * survives a closed tab, not just a dropped connection mid-session.
 *
 * Deliberately does NOT auto-replay on reconnect. components/design-system/
 * OfflineBanner.tsx already documents why: "a clinical write should never
 * silently replay once connectivity returns" — a doctor could have moved on,
 * corrected the value a different way, or the record could have changed
 * under them while offline. This module only queues and lists; the actual
 * replay is a doctor-initiated action (OfflineQueueBanner's "Sync Now"),
 * same principle applied to a new mechanism rather than overridden by it.
 */

const STORAGE_KEY = "offline-save-queue:opd-visit";
const CHANGE_EVENT = "offline-save-queue-changed";

export type QueuedSave = {
  id: string;
  visitId: string;
  patientName: string;
  updates: Record<string, unknown>;
  queuedAt: string;
};

function readQueue(): QueuedSave[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedSave[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedSave[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function fieldSetKey(entry: Pick<QueuedSave, "visitId" | "updates">) {
  return `${entry.visitId}:${Object.keys(entry.updates).sort().join(",")}`;
}

/** A newer queued write for the same visit+fields supersedes an older still-queued one, so replay only ever sends the latest value typed, not every intermediate keystroke's debounce tick. */
export function enqueueSave(visitId: string, patientName: string, updates: Record<string, unknown>) {
  const entry: QueuedSave = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    visitId,
    patientName,
    updates,
    queuedAt: new Date().toISOString()
  };
  const withoutStale = readQueue().filter((existing) => fieldSetKey(existing) !== fieldSetKey(entry));
  writeQueue([...withoutStale, entry]);
  return entry;
}

export function listQueuedSaves(): QueuedSave[] {
  return readQueue();
}

export function removeQueuedSave(id: string) {
  writeQueue(readQueue().filter((entry) => entry.id !== id));
}

/**
 * Called whenever a save for this visit+field-set succeeds through the
 * normal (non-queue) path — e.g. the retry action on the "you're offline"
 * toast fires once connectivity is back, bypassing Sync Now entirely. Without
 * this, a later "Sync Now" would replay the older queued value over whatever
 * was just saved, silently reverting it.
 */
export function clearQueuedSaveForFields(visitId: string, updates: Record<string, unknown>) {
  const key = fieldSetKey({ visitId, updates });
  const current = readQueue();
  const remaining = current.filter((entry) => fieldSetKey(entry) !== key);
  if (remaining.length !== current.length) writeQueue(remaining);
}

export function subscribeToQueueChanges(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
