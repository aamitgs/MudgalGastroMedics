import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { cdsRecommendationSchema } from "@/lib/validation/clinical";

/**
 * Records that a prescriber dismissed a Clinical Decision Support recommendation
 * (docs/clinical-decision-support.md). CDS is advisory and never blocks the
 * clinician; this is the audit trail for a dismissed recommendation ("log
 * overrides"), not a workflow gate.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = cdsRecommendationSchema.safeParse(await request.json().catch(() => ({})));
  const { visitId, ruleId, category, reason } = parsed.success
    ? parsed.data
    : { visitId: "", ruleId: "", category: "", reason: "" };
  if (!visitId || !ruleId) {
    return NextResponse.json({ ok: false, error: "visitId and ruleId are required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical.cds.dismissed",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "info",
    metadata: { ruleId, category: category || "Not specified", reason: reason || "Not specified" },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
