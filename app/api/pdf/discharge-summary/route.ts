import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { renderDischargeSummaryPdf } from "@/lib/pdf/render";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admissionId = new URL(request.url).searchParams.get("admissionId")?.trim();
  if (!admissionId) {
    return NextResponse.json({ ok: false, error: "admissionId is required." }, { status: 400 });
  }

  const result = await renderDischargeSummaryPdf(admissionId);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "pdf.discharge_summary.generated",
    entityType: "ipd_admission",
    entityId: admissionId,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
