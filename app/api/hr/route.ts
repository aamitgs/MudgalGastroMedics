import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import type { AttendanceStatus, StaffMember, StaffPermission, StaffRole, StaffStatus } from "@/lib/hr-types";
import { createAttendance, createStaff, listAttendance, listStaff, updateAttendance, updateStaff } from "@/lib/hr-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { attendanceCreateSchema, attendanceUpdateSchema, staffCreateSchema, staffUpdateSchema } from "@/lib/validation/hr";

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
