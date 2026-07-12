import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createFeedback } from "@/lib/feedback-store";
import { getPatientSessionFromRequest } from "@/lib/patient-access/session-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { patientFeedbackCreateSchema } from "@/lib/validation/feedback";

export async function POST(request: Request) {
  // Scoped to the verified patient session — visitId ownership is checked
  // server-side in createFeedback, never inferred from the request body.
  const session = await getPatientSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in with your mobile number to submit feedback." }, { status: 401 });
  }

  const parsed = patientFeedbackCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const result = await createFeedback({ ...parsed.data, phone: session.phone });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: "patient",
    actorId: session.identityId,
    action: "patient.feedback.submitted",
    entityType: "patient_feedback",
    entityId: result.entry.id,
    metadata: { rating: result.entry.rating, visitId: result.entry.visitId },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, entry: result.entry });
}
