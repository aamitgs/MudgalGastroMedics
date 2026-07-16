import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import {
  createAppointmentWaitlistEntry,
  listAppointmentWaitlist,
  updateAppointmentWaitlistStatus
} from "@/lib/appointment-waitlist-store";
import type { AppointmentWaitlistStatus } from "@/lib/appointment-waitlist-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { appointmentWaitlistCreateSchema, appointmentWaitlistStatusUpdateSchema } from "@/lib/validation/appointment-waitlist";

// Same "appointments" resource the booking queue already uses — no new RBAC
// resource needed, since whoever triages appointments also manages the waitlist.

export async function GET(request: Request) {
  const auth = await authorize(request, "appointments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, entries: await listAppointmentWaitlist() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = appointmentWaitlistCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const entry = await createAppointmentWaitlistEntry(parsed.data);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "appointment_waitlist.created",
    entityType: "appointment_waitlist",
    entityId: entry.id,
    metadata: { service: entry.service, preferredDate: entry.preferredDate },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, entry });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "appointments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = appointmentWaitlistStatusUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const entry = await updateAppointmentWaitlistStatus(parsed.data.id, parsed.data.status as AppointmentWaitlistStatus);
  if (!entry) {
    return NextResponse.json({ ok: false, error: "Waitlist entry not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "appointment_waitlist.status_updated",
    entityType: "appointment_waitlist",
    entityId: entry.id,
    metadata: { status: entry.status },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, entry });
}
