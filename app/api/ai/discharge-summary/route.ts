import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { generateDischargeSummaryDraft } from "@/lib/ai-discharge-summary";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { dischargeSummaryDraftSchema } from "@/lib/validation/clinical";

export async function POST(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = dischargeSummaryDraftSchema.safeParse(await request.json().catch(() => ({})));
  const admissionId = parsed.success ? parsed.data.admissionId : "";
  if (!admissionId) {
    return NextResponse.json({ ok: false, error: "An admission id is required." }, { status: 400 });
  }

  const result = await generateDischargeSummaryDraft(admissionId);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.discharge_summary.drafted",
    entityType: "ipd_admission",
    entityId: admissionId,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, draft: result.draft, safetyNote: result.safetyNote });
}
