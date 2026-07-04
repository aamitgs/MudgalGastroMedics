import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { mfaMandatoryRoles } from "@/lib/access/matrix";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/access/password";
import { accountMutationRateLimit } from "@/lib/access/rate-limit";
import { revokeAllSessionsForUser, updateAccessSession, type AccessSessionStatus } from "@/lib/access/session-store";
import { updateAccessUser } from "@/lib/access/user-store";

export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }
  const { session, user } = resolved;

  if (session.status !== "active" && session.status !== "password-change-required") {
    return NextResponse.json({ ok: false, error: "Complete the current login step first." }, { status: 403 });
  }

  const limit = accountMutationRateLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 401 });
  }

  const validation = validatePassword(newPassword, { username: user.username, name: user.name });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }
  if (verifyPassword(newPassword, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "New password must differ from the current password." }, { status: 400 });
  }

  const wasForced = session.status === "password-change-required";
  await updateAccessUser(user.id, { passwordHash: hashPassword(newPassword), mustChangePassword: false });
  await revokeAllSessionsForUser(user.id, session.id);

  let nextStatus: AccessSessionStatus = "active";
  if (wasForced) {
    if (user.totpEnabled) nextStatus = "mfa-pending";
    else if (user.roles.some((role) => mfaMandatoryRoles.includes(role))) nextStatus = "mfa-setup-required";
    await updateAccessSession(session.id, { status: nextStatus });
  }

  await recordAuditEvent({
    actorRole: session.activeRole,
    actorId: user.id,
    action: "access.password.changed",
    entityType: "access_user",
    entityId: user.id,
    metadata: { forced: wasForced, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
