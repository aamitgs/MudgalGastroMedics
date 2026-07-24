import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listPatientOpdVisits } from "@/lib/opd-store";

/**
 * Most recent prior visit's prescription items for this patient (Track:
 * dynamic prescription builder / medication reconciliation) — excludes the
 * current visit so a doctor duplicating mid-consultation doesn't see the
 * items they're already looking at. Gated on prescriptions:view, same as
 * the medicine-suggestions endpoint: whichever roles can write a
 * prescription can also read the patient's last one.
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

  const visits = await listPatientOpdVisits(phone);
  const previous = visits
    .filter((visit) => visit.id !== excludeVisitId && visit.prescriptionItems?.length)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

  if (!previous) {
    return NextResponse.json({ ok: true, items: [], visitDate: null });
  }

  return NextResponse.json({ ok: true, items: previous.prescriptionItems, visitDate: previous.createdAt });
}
