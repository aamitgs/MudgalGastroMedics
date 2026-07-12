import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { allergyAcknowledgedSchema } from "@/lib/validation/clinical";

/**
 * Records that a prescriber actively reviewed a patient's recorded allergies
 * before prescribing (Clinical Safety, Track 0.1). This is a patient-safety
 * audit event, not a workflow gate — the UI warns and requires acknowledgement
 * but never blocks the clinician.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = allergyAcknowledgedSchema.safeParse(await request.json().catch(() => ({})));
  const { visitId, allergies, reason } = parsed.success ? parsed.data : { visitId: "", allergies: "", reason: "" };
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
    metadata: { allergies, reason: reason || "Not specified" },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
