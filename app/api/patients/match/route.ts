import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { findPatientByPhone } from "@/lib/patient-store";

/**
 * Duplicate-patient detection at registration (Clinical Safety, Track 0.3).
 * Returns an existing patient matched by phone so the registration form can
 * warn staff *before* they submit — the store merges on phone match, so a
 * "new" registration silently updates the existing record. Surfacing this
 * prevents duplicate records and wrong-patient edits (e.g. a shared number).
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const phone = new URL(request.url).searchParams.get("phone")?.trim() ?? "";
  if (phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: true, match: null });
  }

  const patient = await findPatientByPhone(phone);
  if (!patient) return NextResponse.json({ ok: true, match: null });

  return NextResponse.json({
    ok: true,
    match: { id: patient.id, uhid: patient.uhid, name: patient.name, phone: patient.phone }
  });
}
