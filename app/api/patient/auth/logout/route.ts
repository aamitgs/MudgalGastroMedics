import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { clearPatientSessionCookie, getPatientSessionFromRequest, revokePatientSession } from "@/lib/patient-access/session-store";

export async function POST(request: Request) {
  const session = getPatientSessionFromRequest(request);
  if (session) {
    revokePatientSession(session.id);
    await recordAuditEvent({
      actorRole: "patient",
      actorId: session.identityId,
      action: "patient.logout",
      entityType: "patient_login",
      entityId: session.phone,
      metadata: auditRequestMetadata(request)
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearPatientSessionCookie());
  return response;
}
