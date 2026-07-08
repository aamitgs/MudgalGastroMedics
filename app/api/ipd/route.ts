import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { bedStatuses, ipdAdmissionStatuses } from "@/lib/ipd-types";
import type { BedStatus, IpdAdmissionStatus } from "@/lib/ipd-types";
import {
  createIpdAdmission,
  getOccupancyStats,
  listBeds,
  listIpdAdmissions,
  listTransfers,
  listVitals,
  recordVitals,
  setEscalation,
  transferBed,
  updateBed,
  updateIpdAdmission
} from "@/lib/ipd-store";
import { listOpdVisits } from "@/lib/opd-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "beds", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    beds: (await listBeds()),
    admissions: (await listIpdAdmissions()),
    visits: (await listOpdVisits()),
    vitals: (await listVitals()),
    transfers: (await listTransfers()),
    occupancy: (await getOccupancyStats())
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "beds", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const result = (await createIpdAdmission(body));
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ipd.admission.created",
    entityType: "ipd_admission",
    entityId: result.admission.id,
    after: result.admission,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, admission: result.admission, beds: (await listBeds()) });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "admission";

  // Clinical narrative fields (diagnosis, care plan, discharge summary) need
  // patient-record edit rights; bed status, transfers, vitals and escalation
  // are ward operations that nurses hold via beds:edit.
  const touchesClinical =
    type === "admission" &&
    [body.diagnosis, body.carePlan, body.dischargeSummary, body.dietAdvice].some((value) => value !== undefined);
  const auth = await authorize(request, touchesClinical ? "patients" : "beds", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const staffId = auth.context.userId || "Front desk";

  if (type === "bed") {
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" && bedStatuses.includes(body.status as BedStatus) ? body.status as BedStatus : undefined;
    // Cloned: updateBed mutates the same cached in-memory object in place.
    const before = structuredClone((await listBeds()).find((item) => item.id === id) ?? null);
    const bed = (await updateBed({ id, status, notes: typeof body.notes === "string" ? body.notes : undefined }));
    if (!bed) return NextResponse.json({ ok: false, error: "Bed not found." }, { status: 404 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.bed.status_updated",
      entityType: "ipd_bed",
      entityId: bed.id,
      before,
      after: bed,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, bed });
  }

  if (type === "transfer") {
    const admissionId = typeof body.admissionId === "string" ? body.admissionId : "";
    // Cloned: transferBed mutates the same cached in-memory admission in place.
    const before = structuredClone((await listIpdAdmissions()).find((item) => item.id === admissionId) ?? null);
    const result = await transferBed({
      admissionId,
      toBedId: typeof body.toBedId === "string" ? body.toBedId : "",
      reason: typeof body.reason === "string" ? body.reason : "",
      movedBy: staffId
    });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.bed.transferred",
      entityType: "ipd_admission",
      entityId: result.admission.id,
      metadata: { reason: result.transfer.reason },
      before,
      after: result.admission,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, admission: result.admission, transfer: result.transfer, beds: (await listBeds()) });
  }

  if (type === "vitals") {
    // High-frequency clinical telemetry, not a record mutation in the audit
    // sense (P4 scope is Patients/Prescriptions/Billing/Beds) — auditing every
    // reading would drown the trail in noise without a compliance benefit.
    const result = (await recordVitals({ ...body, recordedBy: staffId }));
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, reading: result.reading });
  }

  if (type === "escalate") {
    const id = typeof body.id === "string" ? body.id : "";
    // Cloned: setEscalation mutates the same cached in-memory admission in place.
    const before = structuredClone((await listIpdAdmissions()).find((item) => item.id === id) ?? null);
    const admission = (await setEscalation({
      id,
      escalated: Boolean(body.escalated),
      reason: typeof body.reason === "string" ? body.reason : undefined
    }));
    if (!admission) return NextResponse.json({ ok: false, error: "Admission not found." }, { status: 404 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.escalation.updated",
      entityType: "ipd_admission",
      entityId: admission.id,
      severity: admission.escalated ? "warning" : "info",
      before,
      after: admission,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, admission });
  }

  const status = typeof body.status === "string" && ipdAdmissionStatuses.includes(body.status as IpdAdmissionStatus) ? body.status as IpdAdmissionStatus : undefined;
  const depositAmount = body.depositAmount === undefined ? undefined : Number(body.depositAmount);
  const admissionId = typeof body.id === "string" ? body.id : "";
  // Cloned: updateIpdAdmission mutates the same cached in-memory admission in place.
  const beforeAdmission = structuredClone((await listIpdAdmissions()).find((item) => item.id === admissionId) ?? null);
  const admission = (await updateIpdAdmission({
    id: admissionId,
    status,
    bedId: typeof body.bedId === "string" ? body.bedId : undefined,
    diagnosis: typeof body.diagnosis === "string" ? body.diagnosis : undefined,
    carePlan: typeof body.carePlan === "string" ? body.carePlan : undefined,
    nursingNotes: typeof body.nursingNotes === "string" ? body.nursingNotes : undefined,
    dietAdvice: typeof body.dietAdvice === "string" ? body.dietAdvice : undefined,
    assignedNurse: typeof body.assignedNurse === "string" ? body.assignedNurse : undefined,
    expectedDischargeDate: typeof body.expectedDischargeDate === "string" ? body.expectedDischargeDate : undefined,
    markedForDischarge: typeof body.markedForDischarge === "boolean" ? body.markedForDischarge : undefined,
    depositAmount,
    dischargeSummary: typeof body.dischargeSummary === "string" ? body.dischargeSummary : undefined
  }));

  if (!admission) return NextResponse.json({ ok: false, error: "Admission not found or bed unavailable." }, { status: 404 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ipd.admission.updated",
    entityType: "ipd_admission",
    entityId: admission.id,
    severity: status === "Discharged" || status === "Cancelled" ? "warning" : "info",
    before: beforeAdmission,
    after: admission,
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, admission, beds: (await listBeds()) });
}
