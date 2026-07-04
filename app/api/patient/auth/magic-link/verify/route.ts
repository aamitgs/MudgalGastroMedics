import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rateLimit, requestIp } from "@/lib/access/rate-limit";
import { verifyMagicLinkChallenge } from "@/lib/patient-access/challenge-store";
import { ensurePatientIdentity, recordPatientLoginSuccess } from "@/lib/patient-access/identity-store";
import { buildPatientSessionCookie, createPatientSession } from "@/lib/patient-access/session-store";

export async function POST(request: Request) {
  const limit = rateLimit("patient-magic-verify", requestIp(request), 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "Sign-in token is required." }, { status: 400 });
  }

  const result = await verifyMagicLinkChallenge(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  const identity = await ensurePatientIdentity(result.phone);
  await recordPatientLoginSuccess(identity.id);
  const meta = auditRequestMetadata(request);
  const { token: sessionToken } = await createPatientSession({
    identityId: identity.id,
    phone: identity.phone,
    ip: meta.ip,
    userAgent: meta.userAgent
  });

  await recordAuditEvent({
    actorRole: "patient",
    actorId: identity.id,
    action: "patient.magic_link.used",
    entityType: "patient_login",
    entityId: identity.phone,
    metadata: meta
  });

  const response = NextResponse.json({ ok: true, phone: identity.phone, hasEmail: Boolean(identity.email) });
  response.cookies.set(buildPatientSessionCookie(sessionToken));
  return response;
}
