import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { attendanceStatuses, staffPermissions, staffRoles, staffStatuses } from "@/lib/hr-types";
import type { AttendanceStatus, StaffMember, StaffPermission, StaffRole, StaffStatus } from "@/lib/hr-types";
import { createAttendance, createStaff, listAttendance, listStaff, updateAttendance, updateStaff } from "@/lib/hr-store";

const shifts: StaffMember["shift"][] = ["Morning", "Evening", "Night", "General"];

export async function GET(request: Request) {
  const auth = await authorize(request, "hr-records", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    staff: listStaff(),
    attendance: listAttendance()
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "hr-records", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "staff";

  if (mode === "attendance") {
    const status = typeof body.status === "string" && attendanceStatuses.includes(body.status as AttendanceStatus) ? body.status : "Present";
    const result = createAttendance({ ...body, status });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, attendance: result.attendance });
  }

  const role = typeof body.role === "string" && staffRoles.includes(body.role as StaffRole) ? body.role : "Admin";
  const shift = typeof body.shift === "string" && shifts.includes(body.shift as StaffMember["shift"]) ? body.shift : "General";
  const result = createStaff({ ...body, role, shift });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, staffMember: result.staff });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "hr-records", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "staff";
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "Record id is required." }, { status: 400 });

  if (mode === "attendance") {
    const status = typeof body.status === "string" && attendanceStatuses.includes(body.status as AttendanceStatus) ? body.status as AttendanceStatus : undefined;
    const attendance = updateAttendance({
      id,
      status,
      checkIn: typeof body.checkIn === "string" ? body.checkIn : undefined,
      checkOut: typeof body.checkOut === "string" ? body.checkOut : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined
    });
    if (!attendance) return NextResponse.json({ ok: false, error: "Attendance record not found." }, { status: 404 });
    return NextResponse.json({ ok: true, attendance });
  }

  const status = typeof body.status === "string" && staffStatuses.includes(body.status as StaffStatus) ? body.status as StaffStatus : undefined;
  const role = typeof body.role === "string" && staffRoles.includes(body.role as StaffRole) ? body.role as StaffRole : undefined;
  const shift = typeof body.shift === "string" && shifts.includes(body.shift as StaffMember["shift"]) ? body.shift as StaffMember["shift"] : undefined;
  const permissions = Array.isArray(body.permissions)
    ? body.permissions.filter((item: unknown): item is StaffPermission => staffPermissions.includes(String(item) as StaffPermission))
    : undefined;
  const staffMember = updateStaff({
    id,
    status,
    role,
    permissions,
    shift,
    department: typeof body.department === "string" ? body.department : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    salary: body.salary === undefined ? undefined : Number(body.salary),
    emergencyContact: typeof body.emergencyContact === "string" ? body.emergencyContact : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined
  });
  if (!staffMember) return NextResponse.json({ ok: false, error: "Staff member not found." }, { status: 404 });
  return NextResponse.json({ ok: true, staffMember });
}
