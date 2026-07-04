import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { createAdminReport } from "@/lib/reports";

export async function GET(request: Request) {
  const auth = await authorize(request, "reports", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, report: await createAdminReport() });
}
