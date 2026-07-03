import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listAuditEvents } from "@/lib/audit-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "audit-logs", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 250);

  return NextResponse.json({
    ok: true,
    events: await listAuditEvents(Number.isFinite(limit) ? limit : 250)
  });
}
