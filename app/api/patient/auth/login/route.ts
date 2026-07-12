import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { verifyPassword } from "@/lib/access/password";
import { rateLimit, requestIp } from "@/lib/access/rate-limit";
import {
  getPatientIdentityByEmail,
  isPatientLockedOut,
  recordPatientLoginFailure,
  recordPatientLoginSuccess
} from "@/lib/patient-access/identity-store";
import { buildPatientSessionCookie, createPatientSession } from "@/lib/patient-access/session-store";
import { patientLoginSchema } from "@/lib/validation/patient-auth";

const genericError = "Invalid email or password.";

export async function POST(request: Request) {
  const limit = rateLimit("patient-login", requestIp(request), 10, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = patientLoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }
  const { email, password } = parsed.data;

  const identity = await getPatientIdentityByEmail(email);
  if (!identity?.passwordHash || isPatientLockedOut(identity)) {
    await recordAuditEvent({
      actorRole: "patient",
      action: "patient.login.failed",
      entityType: "patient_login",
      entityId: identity?.phone ?? email,
      severity: "warning",
      metadata: { reason: identity ? "locked-or-no-password" : "unknown-email" },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }

  if (!verifyPassword(password, identity.passwordHash)) {
    await recordPatientLoginFailure(identity.id);
    await recordAuditEvent({
      actorRole: "patient",
      actorId: identity.id,
      action: "patient.login.failed",
      entityType: "patient_login",
      entityId: identity.phone,
      severity: "warning",
      metadata: { reason: "bad-password" },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }

  await recordPatientLoginSuccess(identity.id);
  const meta = auditRequestMetadata(request);
  const { token } = await createPatientSession({ identityId: identity.id, phone: identity.phone, ip: meta.ip, userAgent: meta.userAgent });

  await recordAuditEvent({
    actorRole: "patient",
    actorId: identity.id,
    action: "patient.login",
    entityType: "patient_login",
    entityId: identity.phone,
    device: meta
  });

  const response = NextResponse.json({ ok: true, phone: identity.phone, hasEmail: true });
  response.cookies.set(buildPatientSessionCookie(token));
  return response;
}
