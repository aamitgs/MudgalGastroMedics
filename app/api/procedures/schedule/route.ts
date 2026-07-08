import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getPublicProcedures } from "@/lib/cms-public";
import { listOpdVisits } from "@/lib/opd-store";
import { createProcedureSchedule, getProcedureScheduleById, listProcedureSchedules, updateProcedureSchedule } from "@/lib/procedure-store";
import { queryProcedureSchedules, type ProcedureScheduleSortField, type SortDirection } from "@/lib/procedure-schedule-query";
import { procedureScheduleStatuses } from "@/lib/procedure-types";
import type { ProcedureScheduleStatus } from "@/lib/procedure-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { procedureScheduleCreateSchema, procedureScheduleUpdateSchema } from "@/lib/validation/procedures";

const sortFields: ProcedureScheduleSortField[] = ["patientName", "procedureTitle", "room", "status", "scheduledDate", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allSchedules = await listProcedureSchedules();
  const visits = await listOpdVisits();
  const procedures = await getPublicProcedures();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, schedules: allSchedules, visits, procedures });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const result = queryProcedureSchedules(allSchedules, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as ProcedureScheduleSortField) ? (sortBy as ProcedureScheduleSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && procedureScheduleStatuses.includes(status as ProcedureScheduleStatus) ? (status as ProcedureScheduleStatus) : undefined
  });

  return NextResponse.json({ ok: true, ...result, visits, procedures });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "appointments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = procedureScheduleCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const result = (await createProcedureSchedule(parsed.data));
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, schedule: result.schedule });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = procedureScheduleUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  // Cloned: the document store mutates the found record in place, so an
  // uncloned reference would already reflect updateProcedureSchedule's
  // change by the time the consent-audit comparison below runs.
  const before = structuredClone(await getProcedureScheduleById(parsed.data.id));
  const result = (await updateProcedureSchedule({ ...parsed.data, status: parsed.data.status as ProcedureScheduleStatus | undefined }));

  if (!result) {
    return NextResponse.json({ ok: false, error: "Procedure schedule not found." }, { status: 404 });
  }
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  // Consent is a legal/regulatory requirement, not a routine checklist tick
  // (Track 0.7) — audited as its own action distinct from the other 7 plain
  // checklist items, which stay unaudited housekeeping.
  if (parsed.data.checklist?.consent === true && before?.checklist.consent !== true) {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "procedure.consent.recorded",
      entityType: "procedure_schedule",
      entityId: result.id,
      severity: "warning",
      metadata: { patientName: result.patientName, procedureTitle: result.procedureTitle },
      device: auditRequestMetadata(request)
    });
  }

  return NextResponse.json({ ok: true, schedule: result });
}
