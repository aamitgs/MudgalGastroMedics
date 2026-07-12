import { NextResponse } from "next/server";
import { getRequestAccessContext } from "@/lib/access/guard";
import { listAuditEvents } from "@/lib/audit-store";

/**
 * A doctor's own recent activity — not the hospital-wide audit log
 * (app/api/audit/route.ts, deliberately super-admin-only). Self-scoped to
 * the caller's own actorId, so it doesn't need the audit-logs permission at
 * all: seeing your own recent actions is safe regardless of who else can
 * see the full cross-hospital trail.
 */
export async function GET(request: Request) {
  const context = await getRequestAccessContext(request);
  const isDoctor = context.activeRole === "main-doctor" || context.activeRole === "duty-doctor" || context.activeRole === "super-admin";
  if (!context.authenticated || !isDoctor) {
    return NextResponse.json({ ok: false, error: "Doctor login required." }, { status: 401 });
  }

  const recent = (await listAuditEvents(250)).filter((event) => event.actorId === context.userId).slice(0, 15);
  return NextResponse.json({ ok: true, events: recent });
}
