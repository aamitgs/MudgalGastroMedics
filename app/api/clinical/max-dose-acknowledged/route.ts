import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { maxDoseAcknowledgedSchema } from "@/lib/validation/clinical";

/**
 * Records that a prescriber actively reviewed a detected maximum-daily-dose
 * exceedance before prescribing (Clinical Safety — item-12 quartet). A patient-
 * safety audit event, not a workflow gate — the UI warns and requires
 * acknowledgement but never blocks the clinician.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = maxDoseAcknowledgedSchema.safeParse(await request.json().catch(() => ({})));
  const { visitId, drug, dailyDose, maxDose, reason } = parsed.success
    ? parsed.data
    : { visitId: "", drug: "", dailyDose: "", maxDose: "", reason: "" };
  if (!visitId || !drug) {
    return NextResponse.json({ ok: false, error: "visitId and drug are required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical.maxdose.acknowledged",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "warning",
    metadata: { drug, dailyDose: dailyDose || "Not specified", maxDose: maxDose || "Not specified", reason: reason || "Not specified" },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
