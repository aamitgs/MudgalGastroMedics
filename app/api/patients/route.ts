import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listPatientAppointments } from "@/lib/appointment-store";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { listPatientIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { queryPatients, type PatientSortField, type SortDirection } from "@/lib/patient-query";
import { createPatient, deletePatient, findPatientByPhone, getPatientById, listPatients, updatePatient } from "@/lib/patient-store";
import { patientStatuses } from "@/lib/patient-types";
import type { PatientStatus } from "@/lib/patient-types";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { patientCreateSchema, patientDeleteSchema, patientUpdateSchema } from "@/lib/validation/patients";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

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

  const parsed = patientCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { phone, forceNew } = parsed.data;
  const existingMatch = forceNew ? await findPatientByPhone(phone) : null;

  const patient = (await createPatient(parsed.data));
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
  const parsed = patientUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  // Diet plan writes are gated on their own narrow resource (the Dietitian
  // role holds diet-plans:edit but not patients:edit) — everything else on
  // this record needs the broader patients:edit a Dietitian never has.
  const touchesOtherFields = [
    parsed.data.status,
    parsed.data.name,
    parsed.data.phone,
    parsed.data.alternatePhone,
    parsed.data.email,
    parsed.data.age,
    parsed.data.gender,
    parsed.data.bloodGroup,
    parsed.data.address,
    parsed.data.city,
    parsed.data.emergencyContact,
    parsed.data.allergies,
    parsed.data.chronicConditions,
    parsed.data.currentMedicines,
    parsed.data.notes
  ].some((value) => value !== undefined);
  const touchesDietPlanOnly = parsed.data.dietPlan !== undefined && !touchesOtherFields;
  const auth = await authorize(request, touchesDietPlanOnly ? "diet-plans" : "patients", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { id, status } = parsed.data;

  // Snapshot must be cloned: the document store caches records in memory and
  // updatePatient mutates the same object in place, so an unclonded reference
  // would equal `after` by the time the audit diff runs.
  const before = structuredClone(await getPatientById(id));
  const patient = (await updatePatient(parsed.data));
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

export async function DELETE(request: Request) {
  // Reserved in the access matrix for admin/super-admin only
  // (patients: [...readWriteExport, "delete"]) — every other role stops at
  // edit (e.g. marking a record Inactive), never erasure.
  const auth = await authorize(request, "patients", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = patientDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Patient id is required." }, { status: 400 });

  const patient = await getPatientById(parsed.data.id);
  if (!patient) return NextResponse.json({ ok: false, error: "Patient not found." }, { status: 404 });

  // Cross-store safety check: only ever removes a patient with zero real
  // activity anywhere else in the system. A Cancelled appointment/visit never
  // happened, so it doesn't count — this is the same "didn't happen" carve-out
  // deleteAppointment already applies, just checked across every store a
  // patient's history can live in instead of one. Anything else recorded
  // against this patient blocks the delete; mark them Inactive instead.
  const key = normalizePhone(patient.phone);
  const [appointments, visits, admissions, allLabOrders, allDispenses] = await Promise.all([
    listPatientAppointments(patient.phone),
    listPatientOpdVisits(patient.phone),
    listPatientIpdAdmissions(patient.phone),
    listLabOrders(),
    listPharmacyDispenses()
  ]);
  const hasActivity =
    appointments.some((appointment) => appointment.status !== "Cancelled") ||
    // A visit stays real activity even once Cancelled if money moved on it —
    // same billing/refund footprint check deleteOpdVisit applies to itself.
    visits.some(
      (visit) => visit.status !== "Cancelled" || visit.billingStatus !== "Not Started" || visit.paidAt || visit.receiptId || visit.refundStatus
    ) ||
    admissions.length > 0 ||
    allLabOrders.some((order) => normalizePhone(order.phone) === key && order.status !== "Cancelled") ||
    allDispenses.some((record) => normalizePhone(record.phone) === key && record.status !== "Cancelled");

  if (hasActivity) {
    return NextResponse.json(
      { ok: false, error: "This patient has appointment, visit, admission, lab or pharmacy history and can't be deleted. Mark the record Inactive instead." },
      { status: 400 }
    );
  }

  const result = await deletePatient(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "patient.deleted",
    entityType: "patient",
    entityId: parsed.data.id,
    severity: "warning",
    before: patient,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
