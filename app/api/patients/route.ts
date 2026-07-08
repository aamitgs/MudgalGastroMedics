import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { queryPatients, type PatientSortField, type SortDirection } from "@/lib/patient-query";
import { createPatient, findPatientByPhone, getPatientById, listPatients, updatePatient } from "@/lib/patient-store";
import { patientStatuses } from "@/lib/patient-types";
import type { PatientStatus } from "@/lib/patient-types";

const sortFields: PatientSortField[] = ["name", "uhid", "status", "lastVisitAt", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");

  // Backward compatible: existing callers (Doctor workspace) that pass no
  // pagination params keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, patients: (await listPatients()) });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const allPatients = await listPatients();
  const result = queryPatients(allPatients, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as PatientSortField) ? (sortBy as PatientSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && patientStatuses.includes(status as PatientStatus) ? (status as PatientStatus) : undefined
  });

  // Stats reflect the whole collection, not the current search/filter — an
  // already-loaded reduce, not an extra query, so scoping the page doesn't
  // make these figures cheaper to compute.
  const stats = {
    total: allPatients.length,
    active: allPatients.filter((patient) => patient.status === "Active").length,
    flagged: allPatients.filter((patient) => patient.status === "Flagged").length,
    withAllergies: allPatients.filter((patient) => Boolean(patient.allergies)).length
  };

  return NextResponse.json({ ok: true, ...result, stats });
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

  const forceNew = body.forceNew === true;
  const existingMatch = forceNew ? await findPatientByPhone(phone) : null;

  const patient = (await createPatient(body));
  if (!patient) {
    return NextResponse.json({ ok: false, error: "Unable to create patient." }, { status: 400 });
  }

  // Track 0.3: a deliberate "different person, shared number" decision is
  // clinically significant (two people's records could otherwise be
  // conflated), so it gets its own audit trail distinct from a normal create.
  if (existingMatch) {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "patient.created.duplicate_phone_confirmed",
      entityType: "patient",
      entityId: patient.id,
      severity: "warning",
      metadata: { newPatientUhid: patient.uhid, existingPatientId: existingMatch.id, existingPatientUhid: existingMatch.uhid, phone },
      device: auditRequestMetadata(request)
    });
  } else {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "patient.created",
      entityType: "patient",
      entityId: patient.id,
      after: patient,
      device: auditRequestMetadata(request)
    });
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

  // Snapshot must be cloned: the document store caches records in memory and
  // updatePatient mutates the same object in place, so an unclonded reference
  // would equal `after` by the time the audit diff runs.
  const before = structuredClone(await getPatientById(id));
  const patient = (await updatePatient(body));
  if (!patient) {
    return NextResponse.json({ ok: false, error: "Patient not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "patient.updated",
    entityType: "patient",
    entityId: patient.id,
    severity: status === "Flagged" ? "warning" : "info",
    before,
    after: patient,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, patient });
}
