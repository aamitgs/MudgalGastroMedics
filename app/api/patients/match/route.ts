import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { recordPatientRecordAccess } from "@/lib/audit-patient-access";
import { findPatientByPhone } from "@/lib/patient-store";

/**
 * Duplicate-patient detection at registration (Clinical Safety, Track 0.3) —
 * also reused by the Appointments staff booking form (Reception unified
 * booking) so reception sees the same "existing patient found" context
 * before booking, not just before registering. Returns an existing patient
 * matched by phone so the form can warn staff *before* they submit — the
 * store merges on phone match, so a "new" registration/booking silently
 * updates the existing record. Surfacing this prevents duplicate records and
 * wrong-patient edits (e.g. a shared number). age/gender/bloodGroup/allergies
 * are included so booking can show useful context inline without a second
 * lookup or navigating to the patient's own record.
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

  // Audited only once a patient was actually matched. This endpoint fires
  // while staff type a phone number, so logging every call would record
  // thousands of lookups that disclosed nothing and bury the entries that
  // did. The auditable event is the disclosure — this response carries the
  // patient's allergies and blood group — not the keystroke.
  await recordPatientRecordAccess(request, auth.context, "identity-match", patient.phone);

  return NextResponse.json({
    ok: true,
    match: {
      id: patient.id,
      uhid: patient.uhid,
      name: patient.name,
      phone: patient.phone,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies
    }
  });
}
