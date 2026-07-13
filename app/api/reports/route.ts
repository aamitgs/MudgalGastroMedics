import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { createAdminReport } from "@/lib/reports";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { reportRangeQuerySchema } from "@/lib/validation/reports";

export async function GET(request: Request) {
  const auth = await authorize(request, "reports", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = reportRangeQuerySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    doctor: url.searchParams.get("doctor") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const range = parsed.data.from && parsed.data.to ? { from: parsed.data.from, to: parsed.data.to } : undefined;
  return NextResponse.json({ ok: true, report: await createAdminReport(range, parsed.data.doctor) });
}
