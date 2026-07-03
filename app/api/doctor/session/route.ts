import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { clearDoctorSessionCookie, createDoctorSessionCookie, isValidDoctorPasscode } from "@/lib/doctor-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const passcode = typeof body.passcode === "string" ? body.passcode : "";

  if (!isValidDoctorPasscode(passcode)) {
    await recordAuditEvent({
      actorRole: "doctor",
      action: "doctor.login.failed",
      entityType: "session",
      entityId: "doctor-session",
      severity: "warning",
      metadata: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: "Invalid doctor passcode." }, { status: 401 });
  }

  await recordAuditEvent({
    actorRole: "doctor",
    action: "doctor.login.success",
    entityType: "session",
    entityId: "doctor-session",
    metadata: auditRequestMetadata(request)
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(createDoctorSessionCookie());
  return response;
}

export async function DELETE(request: Request) {
  await recordAuditEvent({
    actorRole: "doctor",
    action: "doctor.logout",
    entityType: "session",
    entityId: "doctor-session",
    metadata: auditRequestMetadata(request)
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearDoctorSessionCookie());
  return response;
}
