import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { interactionAcknowledgedSchema } from "@/lib/validation/clinical";

/**
 * Records that a prescriber actively reviewed a detected high-risk drug–drug
 * interaction before prescribing (Clinical Safety, Track 0.5). A patient-safety
 * audit event, not a workflow gate — the UI warns and requires acknowledgement
 * but never blocks the clinician.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = interactionAcknowledgedSchema.safeParse(await request.json().catch(() => ({})));
  const { visitId, drugA, drugB, reason } = parsed.success ? parsed.data : { visitId: "", drugA: "", drugB: "", reason: "" };
  if (!visitId || !drugA || !drugB) {
    return NextResponse.json({ ok: false, error: "visitId, drugA and drugB are required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical.interaction.acknowledged",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "warning",
    metadata: { drugA, drugB, reason: reason || "Not specified" },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
