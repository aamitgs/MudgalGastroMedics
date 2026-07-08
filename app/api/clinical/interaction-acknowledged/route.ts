import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";

/**
 * Records that a prescriber actively reviewed a detected high-risk drug–drug
 * interaction before prescribing (Clinical Safety, Track 0.5). A patient-safety
 * audit event, not a workflow gate — the UI warns and requires acknowledgement
 * but never blocks the clinician.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const visitId = typeof body.visitId === "string" ? body.visitId.trim() : "";
  const drugA = typeof body.drugA === "string" ? body.drugA.trim() : "";
  const drugB = typeof body.drugB === "string" ? body.drugB.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
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
