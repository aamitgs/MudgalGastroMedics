import type { AccessResource, AccessRole } from "@/lib/access/matrix";
import { roleHasPermission } from "@/lib/access/matrix";

/** Standard notification categories (Master Prompt P4). */
export type NotificationCategory =
  | "Clinical"
  | "Laboratory"
  | "Pharmacy"
  | "Billing"
  | "Administrative"
  | "System"
  | "Emergency"
  | "Management";

export type NotificationPriority = "Normal" | "High" | "Critical";

/**
 * Shared team-inbox lifecycle: Unread means nobody has seen it yet, Read means
 * seen but still open, Resolved means the underlying condition was handled (or
 * stopped firing), Archived means dismissed from the working view. Statuses are
 * hospital-wide, not per-user — this is an operations inbox, not personal mail.
 */
export type NotificationStatus = "Unread" | "Read" | "Resolved" | "Archived";

export type StaffNotification = {
  id: string;
  createdAt: string;
  updatedAt: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  /** Explainability requirement: always says WHY this fired. */
  detail: string;
  /** Deep link into the module that can act on it. */
  href?: string;
  /**
   * Stable rule identity (e.g. "low-stock:INV-123"): the sync upserts by source
   * so a persisting condition updates one notification instead of stacking
   * duplicates, and auto-resolves it when the condition clears.
   */
  source: string;
  resolvedAt?: string;
};

export const notificationCategories: NotificationCategory[] = [
  "Emergency",
  "Clinical",
  "Laboratory",
  "Pharmacy",
  "Billing",
  "Administrative",
  "System",
  "Management"
];

/**
 * Which permission gates visibility of each category. Derived from the same
 * matrix the server enforces — no separate audience config to drift.
 * Emergency is visible to every authenticated staff role by design.
 */
const categoryResource: Record<NotificationCategory, AccessResource | null> = {
  Emergency: null,
  Clinical: "patients",
  Laboratory: "lab-orders",
  Pharmacy: "pharmacy-inventory",
  Billing: "billing",
  Administrative: "system-settings",
  System: "system-settings",
  Management: "reports"
};

export function canViewNotificationCategory(role: AccessRole, category: NotificationCategory): boolean {
  const resource = categoryResource[category];
  if (!resource) return true;
  if (role === "super-admin") return true;
  return roleHasPermission(role, resource, "view");
}
