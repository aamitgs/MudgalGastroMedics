import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { generatePatientSummary } from "@/lib/ai-summary";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { patientSummaryRequestSchema } from "@/lib/validation/clinical";

export async function POST(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = patientSummaryRequestSchema.safeParse(await request.json().catch(() => ({})));
  const phone = parsed.success ? parsed.data.phone : "";
  if (phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false, error: "A valid patient phone number is required." }, { status: 400 });
  }

  const result = await generatePatientSummary(phone);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.patient_summary.generated",
    entityType: "patient_summary",
    entityId: phone,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, summary: result.summary, safetyNote: result.safetyNote });
}
