import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { clearSessionCookie, revokeAccessSession } from "@/lib/access/session-store";

export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (resolved) {
    await revokeAccessSession(resolved.session.id);
    await recordAuditEvent({
      actorRole: resolved.session.activeRole,
      actorId: resolved.user.id,
      action: "access.logout",
      entityType: "access_session",
      entityId: resolved.session.id,
      metadata: auditRequestMetadata(request)
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookie());
  return response;
}
