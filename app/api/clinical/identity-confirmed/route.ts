import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { identityConfirmedSchema } from "@/lib/validation/clinical";

/**
 * Records that a prescriber positively identified the patient (name + phone)
 * before writing clinical notes, prescriptions, advice or follow-up for a
 * visit (Clinical Safety, Track 0.6). A patient-safety audit event, not a
 * workflow gate against the server — the UI enforces the one-time-per-visit
 * confirmation before unlocking those fields.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = identityConfirmedSchema.safeParse(await request.json().catch(() => ({})));
  const { visitId, patientName, phone } = parsed.success ? parsed.data : { visitId: "", patientName: "", phone: "" };
  if (!visitId || !patientName || !phone) {
    return NextResponse.json({ ok: false, error: "visitId, patientName and phone are required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical.identity.confirmed",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "info",
    metadata: { patientName, phone },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
