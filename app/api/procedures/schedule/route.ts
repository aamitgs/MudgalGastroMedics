import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { getPublicProcedures } from "@/lib/cms-public";
import { listOpdVisits } from "@/lib/opd-store";
import { createProcedureSchedule, listProcedureSchedules, updateProcedureSchedule } from "@/lib/procedure-store";
import { queryProcedureSchedules, type ProcedureScheduleSortField, type SortDirection } from "@/lib/procedure-schedule-query";
import { procedureScheduleStatuses } from "@/lib/procedure-types";
import type { ProcedureScheduleStatus } from "@/lib/procedure-types";

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

  const body = await request.json().catch(() => ({}));
  const result = (await createProcedureSchedule(body));
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, schedule: result.schedule });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : undefined;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Procedure schedule id is required." }, { status: 400 });
  }

  if (status && !procedureScheduleStatuses.includes(status as ProcedureScheduleStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid procedure status." }, { status: 400 });
  }

  const schedule = (await updateProcedureSchedule({
    id,
    status: status as ProcedureScheduleStatus | undefined,
    checklist: body.checklist && typeof body.checklist === "object" ? body.checklist : undefined,
    findings: typeof body.findings === "string" ? body.findings : undefined,
    complications: typeof body.complications === "string" ? body.complications : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
    scheduledDate: typeof body.scheduledDate === "string" ? body.scheduledDate : undefined,
    scheduledTime: typeof body.scheduledTime === "string" ? body.scheduledTime : undefined,
    room: typeof body.room === "string" ? body.room : undefined,
    doctor: typeof body.doctor === "string" ? body.doctor : undefined,
    anesthesiaPlan: typeof body.anesthesiaPlan === "string" ? body.anesthesiaPlan : undefined
  }));

  if (!schedule) {
    return NextResponse.json({ ok: false, error: "Procedure schedule not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, schedule });
}
