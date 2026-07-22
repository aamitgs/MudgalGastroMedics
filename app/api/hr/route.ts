import { NextResponse } from "next/server";
import { authorize, getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { listAutomationTasks } from "@/lib/automation-store";
import type { AttendanceStatus, StaffMember, StaffPermission, StaffRole, StaffStatus } from "@/lib/hr-types";
import { createAttendance, createStaff, deleteAttendance, deleteStaff, listAttendance, listStaff, updateAttendance, updateStaff } from "@/lib/hr-store";
import { legacyCredentialStaffIds } from "@/lib/staff-auth";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { attendanceCreateSchema, attendanceUpdateSchema, staffCreateSchema, staffDeleteSchema, staffUpdateSchema } from "@/lib/validation/hr";

/** Hardcoded legacy-session identity — never deletable regardless of status, or the doctor cookie degrades to a synthetic session (lib/access/guard.ts:111-128). */
const LEGACY_DOCTOR_STAFF_ID = "STF-DOCTOR-001";

export async function GET(request: Request) {
  const auth = await authorize(request, "hr-records", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    staff: await listStaff(),
    attendance: await listAttendance()
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "hr-records", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "staff";

  if (mode === "attendance") {
    const parsed = attendanceCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const result = await createAttendance(parsed.data);
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, attendance: result.attendance });
  }

  const parsed = staffCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const result = await createStaff(parsed.data);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, staffMember: result.staff });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "hr-records", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "staff";

  if (mode === "attendance") {
    const parsed = attendanceUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
    const attendance = await updateAttendance(parsed.data as { id: string; status?: AttendanceStatus; checkIn?: string; checkOut?: string; notes?: string });
    if (!attendance) return NextResponse.json({ ok: false, error: "Attendance record not found." }, { status: 404 });
    return NextResponse.json({ ok: true, attendance });
  }

  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const staffMember = await updateStaff(
    parsed.data as {
      id: string;
      status?: StaffStatus;
      role?: StaffRole;
      permissions?: StaffPermission[];
      shift?: StaffMember["shift"];
      department?: string;
      phone?: string;
      email?: string;
      salary?: number;
      emergencyContact?: string;
      notes?: string;
    }
  );
  if (!staffMember) return NextResponse.json({ ok: false, error: "Staff member not found." }, { status: 404 });
  return NextResponse.json({ ok: true, staffMember });
}

export async function DELETE(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });
  // The "hr" role already holds hr-records:delete in the access matrix (a
  // pre-existing, previously-unused grant) — deliberately NOT using
  // authorize(request, "hr-records", "delete") here, since that would let HR
  // staff delete records too. This is reserved to admin/super-admin only.
  if (context.activeRole !== "admin" && context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only an admin can delete HR records." }, { status: 403 });
  }

  const parsed = staffDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  if (parsed.data.mode === "attendance") {
    const result = await deleteAttendance(parsed.data.id);
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: context.activeRole,
      actorId: context.userId,
      action: "hr.attendance.deleted",
      entityType: "attendance",
      entityId: parsed.data.id,
      severity: "warning",
      before: result.attendance,
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true });
  }

  // Never delete a staff record a legacy cookie session resolves its
  // identity to — STF-ADMIN-001/STF-RECEPTION-001 (username+password logins)
  // or STF-DOCTOR-001 (the doctor passcode) — doing so wouldn't crash login,
  // but it would silently strip a real identity down to a synthetic one.
  const protectedIds = new Set([...legacyCredentialStaffIds(), LEGACY_DOCTOR_STAFF_ID]);
  if (protectedIds.has(parsed.data.id)) {
    return NextResponse.json({ ok: false, error: "This staff record backs a legacy login and can't be deleted." }, { status: 400 });
  }

  const ownsAutomationTask = (await listAutomationTasks()).some((task) => task.ownerStaffId === parsed.data.id);
  if (ownsAutomationTask) {
    return NextResponse.json({ ok: false, error: "This staff member owns automation tasks and can't be deleted. Reassign their tasks first." }, { status: 400 });
  }

  const result = await deleteStaff(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "hr.staff.deleted",
    entityType: "staff",
    entityId: parsed.data.id,
    severity: "warning",
    before: result.staff,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
