import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { mfaRateLimit } from "@/lib/access/rate-limit";
import { updateAccessSession } from "@/lib/access/session-store";
import { verifyTotpCode } from "@/lib/access/totp";

export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  const { session, user } = resolved;

  if (session.status !== "mfa-pending" || !user.totpSecret || !user.totpEnabled) {
    return NextResponse.json({ ok: false, error: "No MFA challenge is pending for this session." }, { status: 403 });
  }

  const limit = mfaRateLimit(session.id);
  if (!limit.allowed) {
    await recordAuditEvent({
      actorRole: session.activeRole,
      actorId: user.id,
      action: "access.mfa.rate_limited",
      entityType: "access_session",
      entityId: session.id,
      severity: "warning",
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  if (!(await verifyTotpCode(user.totpSecret, code))) {
    return NextResponse.json({ ok: false, error: "That code did not match. Check the app and try again." }, { status: 401 });
  }

  await updateAccessSession(session.id, { status: "active" });

  await recordAuditEvent({
    actorRole: session.activeRole,
    actorId: user.id,
    action: "access.mfa.verified",
    entityType: "access_session",
    entityId: session.id,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, status: "active" });
}
