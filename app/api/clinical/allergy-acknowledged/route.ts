import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";

/**
 * Records that a prescriber actively reviewed a patient's recorded allergies
 * before prescribing (Clinical Safety, Track 0.1). This is a patient-safety
 * audit event, not a workflow gate — the UI warns and requires acknowledgement
 * but never blocks the clinician.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const visitId = typeof body.visitId === "string" ? body.visitId.trim() : "";
  const allergies = typeof body.allergies === "string" ? body.allergies.trim() : "";
  if (!visitId || !allergies) {
    return NextResponse.json({ ok: false, error: "visitId and allergies are required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical.allergy.acknowledged",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "info",
    metadata: { allergies, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true });
}
