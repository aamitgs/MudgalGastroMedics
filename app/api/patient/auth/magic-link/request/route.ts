import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rateLimit, requestIp } from "@/lib/access/rate-limit";
import { createMagicLinkChallenge } from "@/lib/patient-access/challenge-store";
import { sendMagicLinkEmail } from "@/lib/patient-access/delivery";
import { getPatientIdentityByEmail } from "@/lib/patient-access/identity-store";
import { site } from "@/lib/site-data";
import { magicLinkRequestSchema } from "@/lib/validation/patient-auth";

export async function POST(request: Request) {
  const limit = rateLimit("patient-magic-link", requestIp(request), 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests. Wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = magicLinkRequestSchema.safeParse(await request.json().catch(() => ({})));
  const email = parsed.success ? parsed.data.email : "";
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  // Anti-enumeration: the response is identical whether or not the email is
  // registered; a link is only actually generated for known identities.
  const identity = await getPatientIdentityByEmail(email);
  if (identity) {
    const { token } = await createMagicLinkChallenge(identity.phone);
    const link = `${site.url}/portal?loginToken=${token}`;
    await sendMagicLinkEmail(email, link);
    await recordAuditEvent({
      actorRole: "patient",
      actorId: identity.id,
      action: "patient.magic_link.requested",
      entityType: "patient_login",
      entityId: identity.phone,
      device: auditRequestMetadata(request)
    });
  }

  return NextResponse.json({ ok: true, message: "If that email is registered, a sign-in link has been sent." });
}
