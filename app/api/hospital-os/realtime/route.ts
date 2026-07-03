import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, listAuditEvents, recordAuditEvent } from "@/lib/audit-store";
import { auditEventToRealtimeEvent } from "@/lib/hospital-os-data";

const defaultLookbackMs = 5 * 60 * 1000;

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const sinceParam = Number(url.searchParams.get("since") ?? "0");
  const since = Number.isFinite(sinceParam) && sinceParam > 0 ? sinceParam : Date.now() - defaultLookbackMs;

  // Log only the initial connect (no cursor), not every poll tick, so the
  // capped audit store is not flooded by the dashboard's polling loop.
  if (!(Number.isFinite(sinceParam) && sinceParam > 0)) {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "hospital_os.realtime.polled",
      entityType: "hospital_os",
      entityId: "realtime",
      metadata: auditRequestMetadata(request)
    });
  }

  const recentEvents = await listAuditEvents(50);
  const newEvents = recentEvents
    .filter((event) => new Date(event.createdAt).getTime() > since)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const events = newEvents
    .map((event) => auditEventToRealtimeEvent(event))
    .filter((event) => event !== null);

  const latestTimestamp = newEvents.length
    ? new Date(newEvents[newEvents.length - 1].createdAt).getTime()
    : since;

  return NextResponse.json({
    ok: true,
    events,
    nextCursor: latestTimestamp,
    generatedAt: new Date().toISOString()
  });
}
