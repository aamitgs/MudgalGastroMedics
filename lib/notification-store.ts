import "server-only";
import { listAiReviews } from "@/lib/ai-review-store";
import { listAppointments } from "@/lib/appointment-store";
import { createDocumentStore } from "@/lib/document-store";
import { listInventoryItems } from "@/lib/inventory-store";
import { listBeds, listIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { evaluateNotificationRules, notificationRulePrefixes, type NotificationInput } from "@/lib/notification-rules";
import type { StaffNotification } from "@/lib/notification-types";
import { listOpdVisits } from "@/lib/opd-store";

type NotificationDoc = {
  notifications: StaffNotification[];
};

const docStore = createDocumentStore<NotificationDoc>("notifications", (parsed) => {
  const doc = parsed as Partial<NotificationDoc> | undefined;
  return { notifications: Array.isArray(doc?.notifications) ? (doc.notifications as StaffNotification[]) : [] };
});

/** Keep the inbox bounded: oldest closed items fall off beyond this. */
const maxStoredNotifications = 200;

function isOpen(notification: StaffNotification) {
  return notification.status === "Unread" || notification.status === "Read";
}

export async function listNotifications() {
  return (await docStore.load()).notifications;
}

function applyUpsert(doc: NotificationDoc, input: NotificationInput, now: string) {
  const open = doc.notifications.find((item) => item.source === input.source && isOpen(item));
  if (open) {
    // Same condition still firing: refresh content/priority in place, keep read state.
    if (open.title !== input.title || open.detail !== input.detail || open.priority !== input.priority) {
      open.title = input.title;
      open.detail = input.detail;
      open.priority = input.priority;
      open.updatedAt = now;
    }
    return open;
  }
  const created: StaffNotification = {
    id: `NTF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: "Unread",
    ...input
  };
  doc.notifications.unshift(created);
  return created;
}

/**
 * Direct push for event-driven notifications (e.g. Track 0.2 critical lab
 * results). Deduplicates against an open notification with the same source.
 */
export async function createNotification(input: NotificationInput) {
  const doc = await docStore.load();
  const notification = applyUpsert(doc, input, new Date().toISOString());
  trim(doc);
  await docStore.save(doc);
  return notification;
}

export async function updateNotificationStatus(id: string, status: StaffNotification["status"]) {
  const doc = await docStore.load();
  const notification = doc.notifications.find((item) => item.id === id);
  if (!notification) return null;
  notification.status = status;
  notification.updatedAt = new Date().toISOString();
  if (status === "Resolved") notification.resolvedAt = notification.updatedAt;
  await docStore.save(doc);
  return notification;
}

export async function markAllNotificationsRead() {
  const doc = await docStore.load();
  const now = new Date().toISOString();
  let changed = 0;
  for (const notification of doc.notifications) {
    if (notification.status === "Unread") {
      notification.status = "Read";
      notification.updatedAt = now;
      changed += 1;
    }
  }
  if (changed) await docStore.save(doc);
  return changed;
}

function trim(doc: NotificationDoc) {
  if (doc.notifications.length <= maxStoredNotifications) return;
  const keep: StaffNotification[] = [];
  let budget = maxStoredNotifications;
  for (const notification of doc.notifications) {
    if (isOpen(notification) || budget > 0) {
      keep.push(notification);
      if (!isOpen(notification)) budget -= 1;
    }
  }
  doc.notifications = keep;
}

/**
 * Evaluates the operational alert rules against the live stores and reconciles
 * the inbox: new conditions create Unread notifications, persisting conditions
 * update in place, cleared conditions auto-resolve. Idempotent — safe to run on
 * every inbox read.
 */
export async function syncNotificationsFromOperations(now = new Date()) {
  const [inventory, appointments, admissions, vitals, aiReviews, opdVisits, labOrders, beds] = await Promise.all([
    listInventoryItems(),
    listAppointments(),
    listIpdAdmissions(),
    listVitals(),
    listAiReviews(),
    listOpdVisits(),
    listLabOrders(),
    listBeds()
  ]);

  const active = evaluateNotificationRules({ inventory, appointments, admissions, vitals, aiReviews, opdVisits, labOrders, beds }, now);

  const doc = await docStore.load();
  const nowIso = now.toISOString();
  const activeSources = new Set(active.map((input) => input.source));
  let dirty = false;

  for (const input of active) {
    const existedOpen = doc.notifications.some((item) => item.source === input.source && isOpen(item));
    const result = applyUpsert(doc, input, nowIso);
    if (!existedOpen || result.updatedAt === nowIso) dirty = true;
  }

  for (const notification of doc.notifications) {
    if (!isOpen(notification)) continue;
    if (!notificationRulePrefixes.some((prefix) => notification.source.startsWith(prefix))) continue;
    if (!activeSources.has(notification.source)) {
      notification.status = "Resolved";
      notification.resolvedAt = nowIso;
      notification.updatedAt = nowIso;
      dirty = true;
    }
  }

  trim(doc);
  if (dirty) await docStore.save(doc);
  return doc.notifications;
}
