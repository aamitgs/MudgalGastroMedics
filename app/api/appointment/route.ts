import { NextResponse } from "next/server";
import { authorize, getRequestAccessContext } from "@/lib/access/guard";
import { roleHasPermission } from "@/lib/access/matrix";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createAppointment, deleteAppointment, getAppointmentById, listAppointments, updateAppointmentStatus } from "@/lib/appointment-store";
import { offerWaitlistSlot } from "@/lib/appointment-waitlist-store";
import { appointmentStatuses } from "@/lib/appointment-types";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { queryAppointments, type AppointmentSortField, type SortDirection } from "@/lib/appointment-query";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site-data";
import { appointmentCreateSchema, appointmentDeleteSchema, appointmentStatusUpdateSchema } from "@/lib/validation/operations";

async function sendPatientConfirmation(appointment: AppointmentRecord) {
  if (!appointment.email?.includes("@")) return;
  await sendEmail({
    to: appointment.email,
    subject: `Appointment request received — ${site.shortName}`,
    text: `Hi ${appointment.name},\n\nWe've received your appointment request (reference ${appointment.id}) for ${appointment.service}${appointment.date ? ` on ${appointment.date}` : ""}${appointment.timeSlot ? ` (${appointment.timeSlot})` : ""}.\n\nOur reception team will contact you shortly at ${appointment.phone} to confirm. For urgent concerns, call ${site.phone} or WhatsApp ${site.mobile}.\n\n${site.name}`,
    html: `<p>Hi ${appointment.name},</p><p>We've received your appointment request (reference <strong>${appointment.id}</strong>) for <strong>${appointment.service}</strong>${appointment.date ? ` on ${appointment.date}` : ""}${appointment.timeSlot ? ` (${appointment.timeSlot})` : ""}.</p><p>Our reception team will contact you shortly at ${appointment.phone} to confirm. For urgent concerns, call ${site.phone} or WhatsApp ${site.mobile}.</p><p>${site.name}</p>`
  });
}

async function sendHospitalNotification(appointment: AppointmentRecord) {
  const detailLines: [string, string | undefined][] = [
    ["Phone", appointment.phone],
    ["Email", appointment.email],
    ["Appointment for", appointment.service],
    ["Admission reason", appointment.admissionReason],
    ["Insurance / TPA", appointment.insuranceTpa],
    ["Room preference", appointment.roomPreference],
    ["Referred by", appointment.hasReferral ? appointment.referredBy || "Yes, name not provided" : undefined],
    ["Preferred date", appointment.date],
    ["Preferred time", appointment.timeSlot],
    ["Priority", appointment.priority],
    ["Patient type", appointment.patientType],
    ["Preferred contact", appointment.contactMethod],
    ["Symptoms", appointment.symptoms.length ? appointment.symptoms.join(", ") : undefined],
    ["Message", appointment.message]
  ].filter((row): row is [string, string] => Boolean(row[1]));

  await sendEmail({
    to: site.email,
    subject: `New appointment request — ${appointment.name} (${appointment.id})`,
    text: `New appointment request from ${appointment.name}:\n\n${detailLines.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nView in the OS: ${site.url}/admin#module-appointments`,
    html: `<p>New appointment request from <strong>${appointment.name}</strong>:</p><ul>${detailLines.map(([label, value]) => `<li><strong>${label}:</strong> ${value}</li>`).join("")}</ul><p><a href="${site.url}/admin#module-appointments">View in the OS</a></p>`
  });
}

async function sendAppointmentNotifications(appointment: AppointmentRecord) {
  // Sequential, not Promise.all: two simultaneous connections on the same
  // SMTP account can get one silently dropped by the provider.
  await sendHospitalNotification(appointment);
  await sendPatientConfirmation(appointment);
}

const sortFields: AppointmentSortField[] = ["name", "service", "status", "date", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allAppointments = await listAppointments();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, appointments: allAppointments });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const result = queryAppointments(allAppointments, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as AppointmentSortField) ? (sortBy as AppointmentSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && appointmentStatuses.includes(status as AppointmentStatus) ? (status as AppointmentStatus) : undefined
  });

  const stats = {
    total: allAppointments.length,
    new: allAppointments.filter((appointment) => appointment.status === "New").length,
    confirmed: allAppointments.filter((appointment) => appointment.status === "Confirmed").length,
    urgent: allAppointments.filter((appointment) => appointment.priority === "Urgent symptoms").length
  };

  return NextResponse.json({ ok: true, ...result, stats });
}

export async function POST(request: Request) {
  const parsed = appointmentCreateSchema.safeParse(await request.json().catch(() => ({})));
  // A public, unauthenticated endpoint: a malformed-but-valid-JSON body (e.g.
  // a bare array) should read as "nothing filled in", never throw a 500.
  const data = parsed.success ? parsed.data : { name: "", phone: "", service: "" };
  const required = ["name", "phone", "service"] as const;
  const missing = required.filter((field) => !data[field]);

  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }

  const appointment = (await createAppointment(data));

  // Stays open to the public (patient booking form needs zero auth) — but if
  // an authenticated, permitted staff session made this call (the OS's own
  // "New appointment" form reuses this same endpoint rather than a second
  // create path), attribute it to them in the audit trail instead of
  // "patient", and skip the "new request landed" staff notification email
  // since the person who just booked it already knows.
  const access = await getRequestAccessContext(request);
  const staffBooked = access.authenticated && roleHasPermission(access.activeRole, "appointments", "create");

  await recordAuditEvent({
    actorRole: staffBooked ? access.activeRole : "patient",
    actorId: staffBooked ? access.userId : undefined,
    action: staffBooked ? "appointment.staff_booked.created" : "appointment.request.created",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: {
      service: appointment.service,
      hasReportAttachment: Boolean(appointment.report)
    },
    device: auditRequestMetadata(request)
  });

  if (staffBooked) {
    await sendPatientConfirmation(appointment);
  } else {
    await sendAppointmentNotifications(appointment);
  }

  return NextResponse.json({
    ok: true,
    appointment,
    message: staffBooked ? "Appointment booked." : "Appointment request saved for reception review."
  });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = appointmentStatusUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const { id, status } = parsed.success ? parsed.data : { id: "", status: "" };

  if (!id || !appointmentStatuses.includes(status as AppointmentStatus)) {
    return NextResponse.json({ ok: false, error: "Valid id and status are required." }, { status: 400 });
  }

  const appointment = (await updateAppointmentStatus(id, status as AppointmentStatus));
  if (!appointment) {
    return NextResponse.json({ ok: false, error: "Appointment not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "appointment.status.updated",
    entityType: "appointment",
    entityId: appointment.id,
    metadata: { status: appointment.status, service: appointment.service },
    device: auditRequestMetadata(request)
  });

  // A cancelled slot with a real scheduled date is an opening — offer it to
  // the oldest matching waitlisted patient instead of it going to waste.
  // Reception still has to actually contact them (notified via the bell,
  // Track waitlist addon); no SMS/WhatsApp Business API exists yet to do
  // that unattended.
  if (appointment.status === "Cancelled") {
    const offered = await offerWaitlistSlot(appointment);
    if (offered) {
      await recordAuditEvent({
        actorRole: auth.context.activeRole,
        actorId: auth.context.userId,
        action: "appointment_waitlist.offered",
        entityType: "appointment_waitlist",
        entityId: offered.id,
        metadata: { cancelledAppointmentId: appointment.id, service: offered.service },
        device: auditRequestMetadata(request)
      });
    }
  }

  return NextResponse.json({ ok: true, appointment });
}

export async function DELETE(request: Request) {
  // Reserved in the access matrix for admin/super-admin only
  // (appointments: [...readWriteExport, "delete"]) — every other role stops
  // at edit (status changes), never erasure.
  const auth = await authorize(request, "appointments", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = appointmentDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Appointment id is required." }, { status: 400 });

  const before = await getAppointmentById(parsed.data.id);
  const result = await deleteAppointment(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "appointment.deleted",
    entityType: "appointment",
    entityId: parsed.data.id,
    severity: "warning",
    before,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
