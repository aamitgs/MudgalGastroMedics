import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { mfaRateLimit } from "@/lib/access/rate-limit";
import { updateAccessSession } from "@/lib/access/session-store";
import { buildTotpUri, createTotpSecret, verifyTotpCode } from "@/lib/access/totp";
import { updateAccessUser } from "@/lib/access/user-store";

function canSetUp(status: string, totpEnabled: boolean) {
  return status === "mfa-setup-required" || (status === "active" && !totpEnabled);
}

/** Issues a fresh TOTP secret and provisioning URI for the authenticator app. */
export async function GET(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  const { session, user } = resolved;

  if (!canSetUp(session.status, user.totpEnabled)) {
    return NextResponse.json({ ok: false, error: "MFA setup is not available for this session." }, { status: 403 });
  }

  const secret = await createTotpSecret();
  await updateAccessUser(user.id, { totpSecret: secret, totpEnabled: false });
  return NextResponse.json({ ok: true, secret, uri: buildTotpUri(secret, user.username) });
}

/** Confirms the first code from the authenticator app and enables MFA. */
export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  const { session, user } = resolved;

  if (!canSetUp(session.status, user.totpEnabled) || !user.totpSecret) {
    return NextResponse.json({ ok: false, error: "Start MFA setup first." }, { status: 403 });
  }

  const limit = mfaRateLimit(session.id);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  if (!(await verifyTotpCode(user.totpSecret, code))) {
    return NextResponse.json({ ok: false, error: "That code did not match. Check the app and try again." }, { status: 401 });
  }

  await updateAccessUser(user.id, { totpEnabled: true });
  if (session.status === "mfa-setup-required") {
    await updateAccessSession(session.id, { status: "active" });
  }

  await recordAuditEvent({
    actorRole: session.activeRole,
    actorId: user.id,
    action: "access.mfa.enabled",
    entityType: "access_user",
    entityId: user.id,
    metadata: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, status: "active" });
}
