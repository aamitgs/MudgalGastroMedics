import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { isAccessRole } from "@/lib/access/matrix";
import { verifyPassword } from "@/lib/access/password";
import { accountMutationRateLimit } from "@/lib/access/rate-limit";
import { dropElevation, grantElevation, updateAccessSession } from "@/lib/access/session-store";

/**
 * Switches the session's active role. Switching into Super Admin is the
 * deliberate "elevated mode": it requires password re-authentication, is
 * time-boxed (30 minutes), and is audited distinctly so a dual-role user's
 * clinical and system-level actions stay separable.
 */
export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  const { session, user } = resolved;

  if (session.status !== "active") {
    return NextResponse.json({ ok: false, error: "Complete the current login step first." }, { status: 403 });
  }

  const limit = accountMutationRateLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const role = typeof body.role === "string" ? body.role : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!isAccessRole(role) || !user.roles.includes(role)) {
    return NextResponse.json({ ok: false, error: "You do not hold that role." }, { status: 403 });
  }
  if (role === session.activeRole) {
    return NextResponse.json({ ok: true, activeRole: role });
  }

  if (role === "super-admin") {
    if (!verifyPassword(password, user.passwordHash)) {
      await recordAuditEvent({
        actorRole: session.activeRole,
        actorId: user.id,
        action: "access.elevation.denied",
        entityType: "access_session",
        entityId: session.id,
        severity: "warning",
        metadata: { reason: "bad-password", ...auditRequestMetadata(request) }
      });
      return NextResponse.json({ ok: false, error: "Password confirmation failed." }, { status: 401 });
    }
    const fromRole = session.activeRole;
    await grantElevation(session.id, fromRole);
    await recordAuditEvent({
      actorRole: "super-admin",
      actorId: user.id,
      action: "access.elevated",
      entityType: "access_session",
      entityId: session.id,
      severity: "warning",
      metadata: { from: fromRole, expiresInMinutes: 30, ...auditRequestMetadata(request) }
    });
    return NextResponse.json({ ok: true, activeRole: "super-admin", elevated: true });
  }

  const previousRole = session.activeRole;
  await updateAccessSession(session.id, { activeRole: role, elevatedUntil: undefined, preElevationRole: undefined });
  await recordAuditEvent({
    actorRole: role,
    actorId: user.id,
    action: "access.role_switched",
    entityType: "access_session",
    entityId: session.id,
    metadata: { from: previousRole, to: role, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, activeRole: role });
}

/** Drops elevation back to the pre-elevation role. */
export async function DELETE(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });

  const session = await dropElevation(resolved.session.id);
  await recordAuditEvent({
    actorRole: session?.activeRole ?? resolved.session.activeRole,
    actorId: resolved.user.id,
    action: "access.elevation.dropped",
    entityType: "access_session",
    entityId: resolved.session.id,
    metadata: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, activeRole: session?.activeRole });
}
