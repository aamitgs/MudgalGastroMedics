import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { breakGlassRoles } from "@/lib/access/matrix";
import { createBreakGlassGrant, getActiveBreakGlassGrant } from "@/lib/access/break-glass-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { breakGlassRequestSchema } from "@/lib/validation/auth";

/**
 * Break-glass emergency access: a doctor asserts a genuine emergency and gains
 * 30 minutes of patient read access outside their normal scope. The grant is a
 * critical audit event for after-the-fact review.
 */
export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  const { session, user } = resolved;

  if (session.status !== "active" || !breakGlassRoles.includes(session.activeRole)) {
    return NextResponse.json({ ok: false, error: "Break-glass access is limited to doctors." }, { status: 403 });
  }

  const parsed = breakGlassRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { reason } = parsed.data;

  const existing = await getActiveBreakGlassGrant(user.id);
  if (existing) {
    return NextResponse.json({ ok: true, grant: { id: existing.id, expiresAt: existing.expiresAt } });
  }

  const grant = await createBreakGlassGrant({ userId: user.id, userName: user.name, reason });

  await recordAuditEvent({
    actorRole: session.activeRole,
    actorId: user.id,
    action: "access.break_glass.granted",
    entityType: "break_glass_grant",
    entityId: grant.id,
    severity: "critical",
    metadata: { reason, expiresAt: grant.expiresAt },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, grant: { id: grant.id, expiresAt: grant.expiresAt } });
}
