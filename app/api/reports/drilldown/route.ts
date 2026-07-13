import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { getDrilldownRecords } from "@/lib/report-drilldown";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { drilldownQuerySchema } from "@/lib/validation/reports";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = await authorize(request, "reports", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = drilldownQuerySchema.safeParse({
    metric: url.searchParams.get("metric") ?? "",
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    doctor: url.searchParams.get("doctor") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const range = {
    from: parsed.data.from ?? todayKey(),
    to: parsed.data.to ?? todayKey()
  };

  const result = await getDrilldownRecords(parsed.data.metric, range, parsed.data.doctor);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Unknown metric." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...result });
}
