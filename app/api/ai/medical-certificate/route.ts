import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { generateMedicalCertificateDraft } from "@/lib/ai-medical-certificate";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { medicalCertificateDraftSchema } from "@/lib/validation/clinical";

export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = medicalCertificateDraftSchema.safeParse(await request.json().catch(() => ({})));
  const visitId = parsed.success ? parsed.data.visitId : "";
  if (!visitId) {
    return NextResponse.json({ ok: false, error: "A visit id is required." }, { status: 400 });
  }

  const result = await generateMedicalCertificateDraft(visitId);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.medical_certificate.drafted",
    entityType: "opd_visit",
    entityId: visitId,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, draft: result.draft, safetyNote: result.safetyNote });
}
