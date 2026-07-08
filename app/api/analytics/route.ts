import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { createAnalyticsSnapshot } from "@/lib/analytics";
import { analyticsQuerySchema } from "@/lib/validation/reports";
import { firstZodIssueMessage } from "@/lib/validation/http";

export async function GET(request: Request) {
  const auth = await authorize(request, "reports", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = analyticsQuerySchema.safeParse({ days: url.searchParams.get("days") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, analytics: await createAnalyticsSnapshot(parsed.data.days) });
}
