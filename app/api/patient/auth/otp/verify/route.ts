import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rateLimit, requestIp } from "@/lib/access/rate-limit";
import { verifyOtpChallenge } from "@/lib/patient-access/challenge-store";
import { ensurePatientIdentity, normalizePatientPhone, recordPatientLoginSuccess } from "@/lib/patient-access/identity-store";
import { buildPatientSessionCookie, createPatientSession } from "@/lib/patient-access/session-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizePatientPhone(typeof body.phone === "string" ? body.phone : "");
  const code = typeof body.code === "string" ? body.code : "";
  if (phone.length !== 10 || !code) {
    return NextResponse.json({ ok: false, error: "Phone number and code are required." }, { status: 400 });
  }

  const limit = rateLimit("patient-otp-verify", requestIp(request), 15, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const result = await verifyOtpChallenge(phone, code);
  if (!result.ok) {
    await recordAuditEvent({
      actorRole: "patient",
      action: "patient.otp.failed",
      entityType: "patient_login",
      entityId: phone,
      severity: "warning",
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  const identity = await ensurePatientIdentity(result.phone);
  await recordPatientLoginSuccess(identity.id);
  const meta = auditRequestMetadata(request);
  const { token } = await createPatientSession({ identityId: identity.id, phone: identity.phone, ip: meta.ip, userAgent: meta.userAgent });

  await recordAuditEvent({
    actorRole: "patient",
    actorId: identity.id,
    action: "patient.otp.verified",
    entityType: "patient_login",
    entityId: identity.phone,
    device: meta
  });

  const response = NextResponse.json({ ok: true, phone: identity.phone, hasEmail: Boolean(identity.email) });
  response.cookies.set(buildPatientSessionCookie(token));
  return response;
}
