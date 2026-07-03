import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { createPatient, listPatients, updatePatient } from "@/lib/patient-store";
import { patientStatuses } from "@/lib/patient-types";
import type { PatientStatus } from "@/lib/patient-types";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, patients: listPatients() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "patients", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name || phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false, error: "Patient name and valid phone are required." }, { status: 400 });
  }

  const patient = createPatient(body);
  if (!patient) {
    return NextResponse.json({ ok: false, error: "Unable to create patient." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, patient });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "patients", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "Patient id is required." }, { status: 400 });
  }

  if (status && !patientStatuses.includes(status as PatientStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid patient status." }, { status: 400 });
  }

  const patient = updatePatient(body);
  if (!patient) {
    return NextResponse.json({ ok: false, error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, patient });
}
