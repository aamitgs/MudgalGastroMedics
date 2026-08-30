import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { createAppointment, getAppointmentById } from "@/lib/appointment-store";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { canMarkVisitPaid } from "@/lib/billing-query";
import { queryOpdVisits, type OpdSortField, type SortDirection } from "@/lib/opd-query";
import { createOpdVisit, deleteOpdVisit, getOpdVisitById, listOpdVisits, updateOpdVisit } from "@/lib/opd-store";
import { opdVisitStatuses } from "@/lib/opd-types";
import type { OpdVisitStatus } from "@/lib/opd-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { opdVisitCreateSchema, opdVisitDeleteSchema, opdVisitUpdateSchema } from "@/lib/validation/opd";

const sortFields: OpdSortField[] = ["patientName", "token", "status", "service", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allVisits = await listOpdVisits();

  // Backward compatible: existing callers (Billing, Doctor Portal,
  // Appointments) that pass no pagination params keep getting the full flat
  // list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, visits: allVisits });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const excludeStatus = params.get("excludeStatus");

  const result = queryOpdVisits(allVisits, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as OpdSortField) ? (sortBy as OpdSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && opdVisitStatuses.includes(status as OpdVisitStatus) ? (status as OpdVisitStatus) : undefined,
    excludeStatus: excludeStatus && opdVisitStatuses.includes(excludeStatus as OpdVisitStatus) ? (excludeStatus as OpdVisitStatus) : undefined
  });

  const stats = {
    waiting: allVisits.filter((visit) => visit.status === "Waiting").length,
    inConsultation: allVisits.filter((visit) => visit.status === "In Consultation").length,
    completed: allVisits.filter((visit) => visit.status === "Completed").length,
    paid: allVisits.filter((visit) => visit.billingStatus === "Paid").length
  };

  return NextResponse.json({ ok: true, ...result, stats });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "appointments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = opdVisitCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  let appointment = parsed.data.appointmentId ? await getAppointmentById(parsed.data.appointmentId) : null;

  if (!appointment && !parsed.data.appointmentId) {
    // Walk-in consultation started directly by clinical/reception staff — an
    // internal Appointment record still backs the OPD visit (frozen data
    // model), but skips the public "request received" emails: nobody is
    // waiting to hear back, the patient is already in front of the doctor.
    appointment = await createAppointment({
      name: parsed.data.patientName,
      phone: parsed.data.phone,
      service: parsed.data.service,
      symptoms: parsed.data.symptoms ?? [],
      priority: parsed.data.priority || "Routine"
    });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "appointment.walkin.created",
      entityType: "appointment",
      entityId: appointment.id,
      after: appointment,
      device: auditRequestMetadata(request)
    });
  }

  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  const visit = (await createOpdVisit(appointment, { medicoLegal: parsed.data.medicoLegal }));

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "opd.visit.created",
    entityType: "opd_visit",
    entityId: visit.id,
    after: visit,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, visit });
}

export async function PATCH(request: Request) {
  const parsed = opdVisitUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const {
    id, status, billingStatus, estimatedAmount, paymentMethod, notes,
    presentingComplaints, history, vitalsBp, vitalsPulse, vitalsWeight, vitalsHeight, vitalsRespiratoryRate, vitalsTemperature, vitalsSpo2, vitalsBloodSugar,
    generalExamination, perAbdomen, priorInvestigation,
    clinicalNote, diagnosis, diagnosisIcd10Code, diagnosisIcd10Label, investigationAdvice, prescription, prescriptionItems, advice, followUpDate,
    referralTo, referralLetter, certificateNote, refundAction, refundReason, refundAmount
  } = parsed.data;

  // Field-level enforcement: clinical fields need prescription rights, billing
  // fields need billing rights, and plain queue/status changes (including
  // vitals — Reception records these before the doctor sees the patient,
  // and Reception has no prescriptions right) only need appointment rights.
  const touchesClinical = [
    presentingComplaints, history, generalExamination, perAbdomen, priorInvestigation,
    clinicalNote, diagnosis, diagnosisIcd10Code, investigationAdvice, prescription, prescriptionItems, advice, followUpDate, referralTo, referralLetter, certificateNote
  ].some((value) => value !== undefined);
  const touchesBilling = [billingStatus, estimatedAmount, paymentMethod].some((value) => value !== undefined) || Boolean(refundAction);
  const auth = await authorize(
    request,
    touchesClinical ? "prescriptions" : touchesBilling ? "billing" : "appointments",
    "edit"
  );
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // Cloned: the document store caches records in memory and updateOpdVisit
  // mutates the same object in place, so an uncloned reference would equal
  // `after` by the time the audit diff runs.
  const before = structuredClone(await getOpdVisitById(id));

  // Cross-field rule, so it cannot live in the Zod schema: whether this update
  // is legal depends on the amount already stored on the visit. The invoice
  // path (billing-store's syncVisitBilling) always sends an amount alongside
  // Paid, so it is unaffected.
  if (before && billingStatus === "Paid" && !canMarkVisitPaid(before.estimatedAmount, estimatedAmount)) {
    return NextResponse.json(
      { ok: false, error: "Record the amount collected before marking this visit paid." },
      { status: 400 }
    );
  }

  const visit = (await updateOpdVisit({
    id,
    status: status as OpdVisitStatus | undefined,
    billingStatus,
    estimatedAmount,
    paymentMethod,
    notes,
    presentingComplaints,
    history,
    vitalsBp,
    vitalsPulse,
    vitalsWeight,
    vitalsHeight,
    vitalsRespiratoryRate,
    vitalsTemperature,
    vitalsSpo2,
    vitalsBloodSugar,
    generalExamination,
    perAbdomen,
    priorInvestigation,
    clinicalNote,
    diagnosis,
    diagnosisIcd10Code,
    diagnosisIcd10Label,
    investigationAdvice,
    prescription,
    prescriptionItems,
    advice,
    followUpDate,
    referralTo,
    referralLetter,
    certificateNote,
    actingDoctorName: touchesClinical ? auth.context.userName : undefined,
    refundAction,
    refundReason,
    refundAmount,
    actingStaffName: refundAction ? auth.context.userName || auth.context.activeRole : undefined
  }));

  if (!visit) {
    return NextResponse.json({ ok: false, error: "Visit not found." }, { status: 404 });
  }

  // Prescriptions and billing are the clinically/financially sensitive edges
  // of this route, so each gets its own action name distinct from a plain
  // queue/status change — matching the field-level authorization split above.
  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: touchesClinical
      ? "opd.prescription.updated"
      : refundAction === "request"
        ? "opd.refund.requested"
        : refundAction === "complete"
          ? "opd.refund.completed"
          : touchesBilling
            ? "opd.billing.updated"
            : "opd.visit.updated",
    entityType: "opd_visit",
    entityId: visit.id,
    severity: touchesClinical || refundAction ? "warning" : "info",
    before,
    after: visit,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, visit });
}

export async function DELETE(request: Request) {
  // OPD has no RBAC resource of its own — queue/status actions authorize
  // against "appointments" everywhere else in this route too (GET/POST above,
  // and PATCH's non-clinical/non-billing branch), so delete follows the same
  // appointments:delete grant (admin/super-admin only) rather than inventing
  // a new resource.
  const auth = await authorize(request, "appointments", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = opdVisitDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Visit id is required." }, { status: 400 });

  const before = await getOpdVisitById(parsed.data.id);
  const result = await deleteOpdVisit(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "opd.visit.deleted",
    entityType: "opd_visit",
    entityId: parsed.data.id,
    severity: "warning",
    before,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
