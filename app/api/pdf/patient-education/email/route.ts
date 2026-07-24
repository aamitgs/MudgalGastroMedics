import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { sendEmail } from "@/lib/email";
import { getOpdVisitById } from "@/lib/opd-store";
import { findPatientByPhone, getPatientById } from "@/lib/patient-store";
import { getPatientEducationSheet } from "@/lib/patient-education-sheets";
import { renderPatientEducationPdf } from "@/lib/pdf/render";
import { site } from "@/lib/site-data";
import { firstZodIssueMessage } from "@/lib/validation/http";

const emailSheetSchema = z.object({
  visitId: z.string().trim().min(1, "visitId is required."),
  sheet: z.string().trim().min(1, "sheet is required.")
});

/**
 * Emails an education sheet to the patient's own address on file — looked
 * up server-side from the visit's patient record, never taken from the
 * request body, same trust boundary as the table-export self-email route.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = emailSheetSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { visitId, sheet: sheetKey } = parsed.data;

  const visit = await getOpdVisitById(visitId);
  if (!visit) return NextResponse.json({ ok: false, error: "Visit not found." }, { status: 404 });

  const sheet = getPatientEducationSheet(sheetKey);
  if (!sheet) return NextResponse.json({ ok: false, error: "Unknown education sheet." }, { status: 404 });

  const patient = visit.patientId ? await getPatientById(visit.patientId) : await findPatientByPhone(visit.phone);
  if (!patient?.email) {
    return NextResponse.json({ ok: false, error: "No email address on file for this patient." }, { status: 400 });
  }

  const result = await renderPatientEducationPdf(visitId, sheetKey);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const sent = await sendEmail({
    to: patient.email,
    subject: `${sheet.title} — ${site.name}`,
    text: `Dear ${visit.patientName},\n\nPlease find attached "${sheet.title}" from your recent visit to ${site.name}.\n\nThis is general guidance — your doctor's specific instructions always take priority.\n\n${site.name}`,
    attachments: [{ filename: result.filename, content: result.buffer, contentType: "application/pdf" }]
  });
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: "Unable to send email. Please try again." }, { status: 502 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "pdf.patient_education.emailed",
    entityType: "opd_visit",
    entityId: visitId,
    severity: "info",
    metadata: { sheet: sheetKey, recipient: patient.email },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, sentTo: patient.email });
}
