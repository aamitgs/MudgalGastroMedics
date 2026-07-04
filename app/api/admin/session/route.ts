import { NextResponse } from "next/server";
import { clearAdminSessionCookie, clearAdminStaffCookie, createAdminSessionCookie, createAdminStaffCookie, isValidAdminPasscode } from "@/lib/admin-auth";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getStaffById } from "@/lib/hr-store";
import { authenticateStaffUser } from "@/lib/staff-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const passcode = typeof body.passcode === "string" ? body.passcode : "";
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const requestedStaffId = typeof body.staffId === "string" ? body.staffId : "STF-ADMIN-001";
  const credentialStaff = username && password ? await authenticateStaffUser(username, password) : null;
  const passcodeStaff = !credentialStaff && passcode && isValidAdminPasscode(passcode) ? (await getStaffById(requestedStaffId)) ?? (await getStaffById("STF-ADMIN-001")) : null;
  const staff = credentialStaff ?? passcodeStaff;

  if (!staff) {
    await recordAuditEvent({
      actorRole: "admin",
      action: "admin.login.failed",
      entityType: "session",
      entityId: "admin-session",
      severity: "warning",
      metadata: { username: username || "passcode", ...auditRequestMetadata(request) }
    });
    return NextResponse.json({ ok: false, error: "Invalid staff credentials." }, { status: 401 });
  }

  await recordAuditEvent({
    actorRole: "admin",
    actorId: staff?.id,
    action: "admin.login.success",
    entityType: "session",
    entityId: "admin-session",
    metadata: { staffName: staff?.name, role: staff?.role, ...auditRequestMetadata(request) }
  });

  const response = NextResponse.json({ ok: true, staff });
  response.cookies.set(createAdminSessionCookie(staff?.id));
  response.cookies.set(createAdminStaffCookie(staff?.id));
  return response;
}

export async function DELETE(request: Request) {
  await recordAuditEvent({
    actorRole: "admin",
    action: "admin.logout",
    entityType: "session",
    entityId: "admin-session",
    metadata: auditRequestMetadata(request)
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAdminSessionCookie());
  response.cookies.set(clearAdminStaffCookie());
  return response;
}
