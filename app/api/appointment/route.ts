import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createAppointment, listAppointments, updateAppointmentStatus } from "@/lib/appointment-store";
import { appointmentStatuses } from "@/lib/appointment-types";
import type { AppointmentStatus } from "@/lib/appointment-types";

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    appointments: listAppointments()
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ["name", "phone", "service"];
  const missing = required.filter((field) => !String(body[field] ?? "").trim());

  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }

  const appointment = createAppointment(body);

  await recordAuditEvent({
    actorRole: "patient",
    action: "appointment.request.created",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: {
      service: appointment.service,
      hasReportAttachment: Boolean(appointment.report),
      ...auditRequestMetadata(request)
    }
  });

  return NextResponse.json({
    ok: true,
    appointment,
    message: "Appointment request saved for reception review."
  });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id || !appointmentStatuses.includes(status as AppointmentStatus)) {
    return NextResponse.json({ ok: false, error: "Valid id and status are required." }, { status: 400 });
  }

  const appointment = updateAppointmentStatus(id, status as AppointmentStatus);
  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: "admin",
    action: "appointment.status.updated",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: { status: appointment.status, service: appointment.service, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, appointment });
}
