import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import type { BedStatus, HospitalWard, IpdAdmissionStatus } from "@/lib/ipd-types";
import {
  createBed,
  createIpdAdmission,
  createMedicationOrder,
  deleteBed,
  discontinueMedicationOrder,
  getOccupancyStats,
  listBeds,
  listIpdAdmissions,
  listMedicationAdministrations,
  listMedicationOrders,
  listTransfers,
  listVitals,
  recordMedicationAdministration,
  recordVitals,
  setEscalation,
  transferBed,
  updateBed,
  updateIpdAdmission
} from "@/lib/ipd-store";
import { listOpdVisits } from "@/lib/opd-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import {
  ipdAdmissionCreateSchema,
  ipdAdmissionUpdateSchema,
  ipdBedCreateSchema,
  ipdBedDeleteSchema,
  ipdBedUpdateSchema,
  ipdEscalateSchema,
  ipdMedicationAdministrationSchema,
  ipdMedicationOrderCreateSchema,
  ipdMedicationOrderDiscontinueSchema,
  ipdTransferSchema,
  ipdVitalsSchema
} from "@/lib/validation/ipd";

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
    medicationOrders: (await listMedicationOrders()),
    medicationAdministrations: (await listMedicationAdministrations()),
    occupancy: (await getOccupancyStats())
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.type === "bed") {
    const parsed = ipdBedCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    // Adding physical bed inventory is a facilities decision, not a routine
    // ward-status update — gated on beds:create (super-admin/admin/reception
    // hold it; clinical roles hold only view/edit on this resource).
    const auth = await authorize(request, "beds", "create");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const result = await createBed(parsed.data as { ward: HospitalWard; label: string; dailyRate: number; notes?: string });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.bed.created",
      entityType: "ipd_bed",
      entityId: result.bed.id,
      after: result.bed,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, bed: result.bed, beds: (await listBeds()) });
  }

  const auth = await authorize(request, "beds", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = ipdAdmissionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const result = (await createIpdAdmission(parsed.data));
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

export async function DELETE(request: Request) {
  const parsed = ipdBedDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  // Retiring bed inventory is a step up from beds:create — restricted to
  // beds:delete, which only super-admin holds by default.
  const auth = await authorize(request, "beds", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const before = structuredClone((await listBeds()).find((item) => item.id === parsed.data.id) ?? null);
  const result = await deleteBed(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ipd.bed.removed",
    entityType: "ipd_bed",
    entityId: result.bed.id,
    severity: "warning",
    before,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, beds: (await listBeds()) });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "admission";

  if (type === "bed") {
    const parsed = ipdBedUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const auth = await authorize(request, "beds", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    // Cloned: updateBed mutates the same cached in-memory object in place.
    const before = structuredClone((await listBeds()).find((item) => item.id === parsed.data.id) ?? null);
    const bed = (await updateBed(parsed.data as { id: string; status?: BedStatus; notes?: string }));
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
    const parsed = ipdTransferSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const auth = await authorize(request, "beds", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const staffId = auth.context.userId || "Front desk";

    // Cloned: transferBed mutates the same cached in-memory admission in place.
    const before = structuredClone((await listIpdAdmissions()).find((item) => item.id === parsed.data.admissionId) ?? null);
    const result = await transferBed({ ...parsed.data, movedBy: staffId });
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
    const parsed = ipdVitalsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const auth = await authorize(request, "beds", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const staffId = auth.context.userId || "Front desk";

    // High-frequency clinical telemetry, not a record mutation in the audit
    // sense (P4 scope is Patients/Prescriptions/Billing/Beds) — auditing every
    // reading would drown the trail in noise without a compliance benefit.
    const result = (await recordVitals({ ...parsed.data, recordedBy: staffId }));
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, reading: result.reading });
  }

  if (type === "medication-order") {
    const parsed = ipdMedicationOrderCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    // The order itself is a prescribing decision (what to give) — nurses hold
    // only prescriptions:view, matching Track 0's "doctors prescribe, nurses
    // administer" split; recording that a dose was actually given is the
    // separate medication-administration action below, gated on beds:edit.
    const auth = await authorize(request, "prescriptions", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const result = await createMedicationOrder({ ...parsed.data, createdBy: auth.context.userName || auth.context.activeRole });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.medication_order.created",
      entityType: "medication_order",
      entityId: result.order.id,
      severity: "warning",
      after: result.order,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, order: result.order });
  }

  if (type === "medication-order-discontinue") {
    const parsed = ipdMedicationOrderDiscontinueSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const auth = await authorize(request, "prescriptions", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    const order = await discontinueMedicationOrder(parsed.data.id);
    if (!order) return NextResponse.json({ ok: false, error: "Medication order not found." }, { status: 404 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ipd.medication_order.discontinued",
      entityType: "medication_order",
      entityId: order.id,
      severity: "warning",
      after: order,
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, order });
  }

  if (type === "medication-administration") {
    const parsed = ipdMedicationAdministrationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    // Bedside nursing action against an existing order — same permission as
    // vitals/ward-round entries, not a fresh prescribing decision.
    const auth = await authorize(request, "beds", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    const staffName = auth.context.userName || auth.context.activeRole;

    const result = await recordMedicationAdministration({ ...parsed.data, administeredBy: staffName });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    // Missed/refused doses are clinically significant deviations from the
    // order — audited distinctly from a routine "given as scheduled" entry.
    if (result.record.status !== "Given") {
      await recordAuditEvent({
        actorRole: auth.context.activeRole,
        actorId: auth.context.userId,
        action: "ipd.medication_administration.exception",
        entityType: "medication_administration",
        entityId: result.record.id,
        severity: "warning",
        metadata: { status: result.record.status },
        device: auditRequestMetadata(request)
      });
    }

    return NextResponse.json({ ok: true, record: result.record });
  }

  if (type === "escalate") {
    const parsed = ipdEscalateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const auth = await authorize(request, "beds", "edit");
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

    // Cloned: setEscalation mutates the same cached in-memory admission in place.
    const before = structuredClone((await listIpdAdmissions()).find((item) => item.id === parsed.data.id) ?? null);
    const admission = (await setEscalation(parsed.data));
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

  const parsed = ipdAdmissionUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  // Clinical narrative fields (diagnosis, care plan, discharge summary) need
  // patient-record edit rights; diet advice is gated on its own narrow
  // resource so a Dietitian can write it without gaining broader
  // patients:edit; plain admission/bed/discharge changes are ward operations
  // that nurses hold via beds:edit.
  const touchesClinical = [parsed.data.diagnosis, parsed.data.carePlan, parsed.data.dischargeSummary].some((value) => value !== undefined);
  const touchesDietAdvice = parsed.data.dietAdvice !== undefined;
  const auth = await authorize(request, touchesClinical ? "patients" : touchesDietAdvice ? "diet-plans" : "beds", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const { status } = parsed.data;
  // Cloned: updateIpdAdmission mutates the same cached in-memory admission in place.
  const beforeAdmission = structuredClone((await listIpdAdmissions()).find((item) => item.id === parsed.data.id) ?? null);
  const admission = (await updateIpdAdmission(parsed.data as { id: string; status?: IpdAdmissionStatus }));

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
