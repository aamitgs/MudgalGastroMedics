import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getSessionAndUser } from "@/lib/access/guard";
import { listSessionsForUser, revokeAccessSession, revokeAllSessionsForUser } from "@/lib/access/session-store";

/** "Manage my sessions": list and revoke the caller's own logins. */
export async function GET(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });

  const sessions = (await listSessionsForUser(resolved.user.id)).map((session: Awaited<ReturnType<typeof listSessionsForUser>>[number]) => ({
    id: session.id,
    activeRole: session.activeRole,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    ip: session.ip,
    userAgent: session.userAgent,
    current: session.id === resolved.session.id
  }));
  return NextResponse.json({ ok: true, sessions });
}

export async function DELETE(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const all = body.all === true;

  let revokedCount = 0;
  if (all) {
    revokedCount = await revokeAllSessionsForUser(resolved.user.id, resolved.session.id);
  } else if (sessionId) {
    const target = (await listSessionsForUser(resolved.user.id)).find((session: Awaited<ReturnType<typeof listSessionsForUser>>[number]) => session.id === sessionId);
    if (!target) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
    await revokeAccessSession(target.id);
    revokedCount = 1;
  } else {
    return NextResponse.json({ ok: false, error: "Provide sessionId or all:true." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: resolved.session.activeRole,
    actorId: resolved.user.id,
    action: "access.sessions.revoked",
    entityType: "access_user",
    entityId: resolved.user.id,
    metadata: { revokedCount },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, revokedCount });
}
