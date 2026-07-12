import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { hashPassword, validatePassword } from "@/lib/access/password";
import { getPatientIdentityByEmail, getPatientIdentityById, updatePatientIdentity } from "@/lib/patient-access/identity-store";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { patientProfileUpdateSchema } from "@/lib/validation/patient-auth";

/** Lets a signed-in patient attach an email + password, enabling email login and magic links. */
export async function POST(request: Request) {
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }
  const identity = await getPatientIdentityById(session.identityId);
  if (!identity) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  const parsed = patientProfileUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const { email, password } = parsed.success ? parsed.data : { email: "", password: "" };

  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  const existing = await getPatientIdentityByEmail(email);
  if (existing && existing.id !== identity.id) {
    return NextResponse.json({ ok: false, error: "That email is already linked to another account." }, { status: 409 });
  }

  const validation = validatePassword(password, { username: email });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  await updatePatientIdentity(identity.id, { email, passwordHash: hashPassword(password) });

  await recordAuditEvent({
    actorRole: "patient",
    actorId: identity.id,
    action: "patient.profile.updated",
    entityType: "patient_login",
    entityId: identity.phone,
    metadata: { emailSet: true },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, hasEmail: true });
}
