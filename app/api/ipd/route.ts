import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
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
import { firstZodIssueMessage } from "@/lib/validation/http";
import {
  ipdAdmissionCreateSchema,
  ipdAdmissionUpdateSchema,
  ipdBedUpdateSchema,
  ipdEscalateSchema,
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
    occupancy: (await getOccupancyStats())
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "beds", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = ipdAdmissionCreateSchema.safeParse(await request.json().catch(() => ({})));
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

  // Clinical narrative fields (diagnosis, care plan, discharge summary, diet
  // advice) need patient-record edit rights; plain admission/bed/discharge
  // changes are ward operations that nurses hold via beds:edit.
  const touchesClinical = [parsed.data.diagnosis, parsed.data.carePlan, parsed.data.dischargeSummary, parsed.data.dietAdvice].some(
    (value) => value !== undefined
  );
  const auth = await authorize(request, touchesClinical ? "patients" : "beds", "edit");
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
