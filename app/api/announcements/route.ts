import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createNotification } from "@/lib/notification-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { announcementCreateSchema } from "@/lib/validation/announcements";

/**
 * Hospital-wide announcements (Track 4.11) — rides on the existing
 * notification inbox (Track 2.4) rather than a new surface: posting one
 * just creates a StaffNotification in the "Announcement" category, which
 * every authenticated role can see (categoryResource maps it to `null`,
 * same as Emergency) but only an admin-permission role can create. No
 * separate GET route — announcements are read via the existing
 * /api/notifications endpoint alongside everything else.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = announcementCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const source = `announcement:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
  const notification = await createNotification({
    source,
    category: "Announcement",
    priority: parsed.data.priority,
    title: parsed.data.title,
    detail: parsed.data.detail
  });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "announcement.posted",
    entityType: "notification",
    entityId: notification.id,
    metadata: { title: notification.title, priority: notification.priority },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, notification });
}
