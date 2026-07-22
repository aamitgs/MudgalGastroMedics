import { NextResponse } from "next/server";
import { clearAdminSessionCookie, clearAdminStaffCookie, createAdminSessionCookie, createAdminStaffCookie, isValidAdminPasscode } from "@/lib/admin-auth";
import { accessRoleForStaffRole } from "@/lib/access/guard";
import { roleMeta } from "@/lib/access/matrix";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getStaffById } from "@/lib/hr-store";
import { authenticateStaffUser } from "@/lib/staff-auth";
import { adminSessionLoginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = adminSessionLoginSchema.safeParse(await request.json().catch(() => ({})));
  const { passcode, username, password, staffId: requestedStaffId } = parsed.success
    ? parsed.data
    : { passcode: "", username: "", password: "", staffId: "STF-ADMIN-001" };
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
      metadata: { username: username || "passcode" },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: false, error: "Invalid staff credentials." }, { status: 401 });
  }

  await recordAuditEvent({
    actorRole: "admin",
    actorId: staff?.id,
    action: "admin.login.success",
    entityType: "session",
    entityId: "admin-session",
    metadata: { staffName: staff?.name, role: staff?.role },
    device: auditRequestMetadata(request)
  });

  // Same role-keyed landing the primary RBAC login already returns
  // (app/api/auth/login) — this legacy cookie path just never carried it, so
  // every role fell through to a page reload of whatever the generic
  // dashboard route resolves to, doctors included.
  const accessRole = accessRoleForStaffRole(staff.role);
  const landing = accessRole ? roleMeta[accessRole].landing : "/mudgalgastromedics-os";

  const response = NextResponse.json({ ok: true, staff, landing });
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
    device: auditRequestMetadata(request)
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAdminSessionCookie());
  response.cookies.set(clearAdminStaffCookie());
  return response;
}
