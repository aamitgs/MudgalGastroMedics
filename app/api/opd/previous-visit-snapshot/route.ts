import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { recordPatientRecordAccess } from "@/lib/audit-patient-access";
import { listPatientOpdVisits } from "@/lib/opd-store";

/**
 * Most recent prior (non-cancelled) visit's full clinical snapshot — vitals,
 * diagnosis, prescription, advice/investigations — for the "Compare With
 * Previous Visit" panel (Track: timeline comparison). Distinct from
 * GET /api/opd/previous-prescription (medicines only, for duplication) and
 * GET /api/hospital-os/patient-timeline (a chronological narrative feed
 * across every module, not a structured field-by-field snapshot). Gated on
 * prescriptions:view, same as those two.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone")?.trim() ?? "";
  const excludeVisitId = url.searchParams.get("excludeVisitId")?.trim() ?? "";
  if (!phone) {
    return NextResponse.json({ ok: false, error: "A patient phone number is required." }, { status: 400 });
  }

  await recordPatientRecordAccess(request, auth.context, "previous-visit-snapshot", phone);

  const visits = await listPatientOpdVisits(phone);
  const previous = visits
    .filter((visit) => visit.id !== excludeVisitId && visit.status !== "Cancelled")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!previous) {
    return NextResponse.json({ ok: true, visit: null });
  }

  return NextResponse.json({
    ok: true,
    visit: {
      createdAt: previous.createdAt,
      vitalsBp: previous.vitalsBp,
      vitalsPulse: previous.vitalsPulse,
      vitalsWeight: previous.vitalsWeight,
      vitalsHeight: previous.vitalsHeight,
      vitalsRespiratoryRate: previous.vitalsRespiratoryRate,
      vitalsTemperature: previous.vitalsTemperature,
      vitalsSpo2: previous.vitalsSpo2,
      vitalsBloodSugar: previous.vitalsBloodSugar,
      diagnosis: previous.diagnosis,
      prescriptionItems: previous.prescriptionItems,
      prescription: previous.prescription,
      investigationAdvice: previous.investigationAdvice
    }
  });
}
