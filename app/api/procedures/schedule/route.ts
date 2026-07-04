import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { getPublicProcedures } from "@/lib/cms-public";
import { listOpdVisits } from "@/lib/opd-store";
import { createProcedureSchedule, listProcedureSchedules, updateProcedureSchedule } from "@/lib/procedure-store";
import { procedureScheduleStatuses } from "@/lib/procedure-types";
import type { ProcedureScheduleStatus } from "@/lib/procedure-types";

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    schedules: (await listProcedureSchedules()),
    visits: (await listOpdVisits()),
    procedures: await getPublicProcedures()
  });
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
