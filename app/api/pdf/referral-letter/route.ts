import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { renderReferralLetterPdf } from "@/lib/pdf/render";

export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const visitId = new URL(request.url).searchParams.get("visitId")?.trim();
  if (!visitId) {
    return NextResponse.json({ ok: false, error: "visitId is required." }, { status: 400 });
  }

  const result = await renderReferralLetterPdf(visitId);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "pdf.referral_letter.generated",
    entityType: "opd_visit",
    entityId: visitId,
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
