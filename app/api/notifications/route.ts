import { NextResponse } from "next/server";
import { getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import {
  listNotifications,
  markAllNotificationsRead,
  syncNotificationsFromOperations,
  updateNotificationStatus
} from "@/lib/notification-store";
import { canViewNotificationCategory } from "@/lib/notification-types";
import type { StaffNotification } from "@/lib/notification-types";

/**
 * The inbox is available to every authenticated staff role (like the dashboard
 * itself); per-CATEGORY visibility is derived from the same permission matrix
 * the server enforces everywhere else — see canViewNotificationCategory.
 */
async function requireStaff(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") return null;
  return context;
}

function visibleTo(context: { activeRole: Parameters<typeof canViewNotificationCategory>[0] }) {
  return (notification: StaffNotification) => canViewNotificationCategory(context.activeRole, notification.category);
}

export async function GET(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  // Reconcile rule-driven notifications on read: idempotent, so the inbox is
  // always fresh without a background scheduler.
  const notifications = (await syncNotificationsFromOperations()).filter(visibleTo(context));
  return NextResponse.json({ ok: true, notifications });
}

export async function PATCH(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "read-all") {
    const changed = await markAllNotificationsRead();
    await recordAuditEvent({
      actorRole: context.activeRole,
      actorId: context.userId,
      action: "notification.read_all",
      entityType: "notification",
      entityId: `count:${changed}`,
      metadata: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, changed });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const statusByAction: Record<string, StaffNotification["status"]> = {
    read: "Read",
    resolve: "Resolved",
    archive: "Archived"
  };
  const status = statusByAction[action];
  if (!id || !status) {
    return NextResponse.json({ ok: false, error: "Provide a notification id and an action: read, resolve, archive or read-all." }, { status: 400 });
  }

  const existing = (await listNotifications()).find((item) => item.id === id);
  if (!existing || !canViewNotificationCategory(context.activeRole, existing.category)) {
    return NextResponse.json({ ok: false, error: "Notification not found." }, { status: 404 });
  }

  const notification = await updateNotificationStatus(id, status);
  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: `notification.${action}`,
    entityType: "notification",
    entityId: id,
    metadata: { source: existing.source, category: existing.category, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, notification });
}
