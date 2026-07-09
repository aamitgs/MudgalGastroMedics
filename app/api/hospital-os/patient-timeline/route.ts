import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { buildPatientTimeline } from "@/lib/clinical/patient-timeline";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim() ?? "";
  if (phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false, error: "A valid patient phone number is required." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "hospital_os.patient_timeline.viewed",
    entityType: "patient",
    entityId: phone.replace(/\D/g, "").slice(-10),
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, events: await buildPatientTimeline(phone) });
}
