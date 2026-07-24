import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { renderPatientEducationPdf } from "@/lib/pdf/render";

export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const visitId = url.searchParams.get("visitId")?.trim();
  const sheet = url.searchParams.get("sheet")?.trim();
  if (!visitId || !sheet) {
    return NextResponse.json({ ok: false, error: "visitId and sheet are required." }, { status: 400 });
  }

  const result = await renderPatientEducationPdf(visitId, sheet);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "pdf.patient_education.generated",
    entityType: "opd_visit",
    entityId: visitId,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok, sheet },
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
