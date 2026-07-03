import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { rateLimit, requestIp } from "@/lib/access/rate-limit";
import { createOtpChallenge } from "@/lib/patient-access/challenge-store";
import { isSmsDeliveryConfigured, sendOtpSms } from "@/lib/patient-access/delivery";
import { normalizePatientPhone } from "@/lib/patient-access/identity-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizePatientPhone(typeof body.phone === "string" ? body.phone : "");
  if (phone.length !== 10) {
    return NextResponse.json({ ok: false, error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }

  const ipLimit = rateLimit("patient-otp-ip", requestIp(request), 8, 10 * 60 * 1000);
  const phoneLimit = rateLimit("patient-otp-phone", phone, 3, 10 * 60 * 1000);
  if (!ipLimit.allowed || !phoneLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many code requests. Wait a few minutes and try again." }, { status: 429 });
  }

  const { code } = createOtpChallenge(phone);
  const delivery = await sendOtpSms(phone, code);

  await recordAuditEvent({
    actorRole: "patient",
    action: "patient.otp.requested",
    entityType: "patient_login",
    entityId: phone,
    metadata: { channel: delivery.channel, delivered: delivery.ok, ...auditRequestMetadata(request) }
  });

  if (!delivery.ok) {
    return NextResponse.json({ ok: false, error: "Could not send the SMS right now. Try again shortly." }, { status: 502 });
  }

  const smsConfigured = isSmsDeliveryConfigured();
  if (!smsConfigured && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "SMS login is not available yet. Please contact reception for your records." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    // Surfaced ONLY while SMS delivery is unconfigured outside production, so
    // the portal remains testable before the MSG91 account exists.
    ...(smsConfigured ? {} : { devCode: code })
  });
}
