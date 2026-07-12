import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { authorize } from "@/lib/access/guard";
import { isAccessRole, type AccessRole } from "@/lib/access/matrix";
import { generateTempPassword, hashPassword } from "@/lib/access/password";
import { createRoleChangeApproval } from "@/lib/access/approvals-store";
import { revokeAllSessionsForUser } from "@/lib/access/session-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import {
  createAccessUser,
  getAccessUserById,
  listAccessUsers,
  updateAccessUser,
  type AccessUser
} from "@/lib/access/user-store";
import { accessUserCreateSchema, accessUserPatchSchema } from "@/lib/validation/auth";

function publicUser(user: AccessUser) {
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    status: user.status,
    name: user.name,
    username: user.username,
    email: user.email,
    roles: user.roles,
    defaultRole: user.defaultRole,
    mustChangePassword: user.mustChangePassword,
    totpEnabled: user.totpEnabled,
    lastLoginAt: user.lastLoginAt,
    lockedUntil: user.lockedUntil
  };
}

export async function GET(request: Request) {
  const auth = await authorize(request, "user-management", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  return NextResponse.json({ ok: true, users: (await listAccessUsers()).map(publicUser) });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "user-management", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only a Super Admin can create users." }, { status: 403 });
  }

  const parsed = accessUserCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { name, username, email } = parsed.data;
  const roles = parsed.data.roles.filter((role) => isAccessRole(role)) as AccessRole[];
  const defaultRole = parsed.data.defaultRole && isAccessRole(parsed.data.defaultRole) ? parsed.data.defaultRole : roles[0];

  if (!roles.length) {
    return NextResponse.json({ ok: false, error: "name, username and at least one role are required." }, { status: 400 });
  }
  if (roles.includes("super-admin")) {
    return NextResponse.json(
      { ok: false, error: "Super Admin cannot be granted at creation. Create the user, then request the role change so a second Super Admin approves it." },
      { status: 400 }
    );
  }

  const temporaryPassword = generateTempPassword();
  const result = await createAccessUser({
    name,
    username,
    email,
    roles,
    defaultRole,
    passwordHash: hashPassword(temporaryPassword),
    mustChangePassword: true
  });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "access.user.created",
    entityType: "access_user",
    entityId: result.id,
    metadata: { name, username: result.username, roles },
    device: auditRequestMetadata(request)
  });

  // The temporary password is returned exactly once for secure handoff and is
  // never persisted or logged in plaintext.
  return NextResponse.json({ ok: true, user: publicUser(result), temporaryPassword });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "user-management", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only a Super Admin can modify users." }, { status: 403 });
  }

  const parsed = accessUserPatchSchema.safeParse(await request.json().catch(() => ({})));
  const { id, operation } = parsed.success ? parsed.data : { id: "", operation: "" };
  const user = await getAccessUserById(id);
  if (!user) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const audit = (
    action: string,
    metadata: Record<string, unknown> = {},
    change?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  ) =>
    recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action,
      entityType: "access_user",
      entityId: user.id,
      severity: "warning",
      metadata: { targetUser: user.username, ...metadata },
      before: change?.before,
      after: change?.after,
      device: auditRequestMetadata(request)
    });

  if (operation === "suspend") {
    // Offboarding: suspension and session revocation are immediate, never queued.
    if (user.id === auth.context.userId) {
      return NextResponse.json({ ok: false, error: "You cannot suspend your own account." }, { status: 400 });
    }
    await updateAccessUser(user.id, { status: "suspended" });
    const revoked = await revokeAllSessionsForUser(user.id);
    await audit(
      "access.user.suspended",
      { sessionsRevoked: revoked },
      { before: { status: user.status }, after: { status: "suspended" } }
    );
    return NextResponse.json({ ok: true, user: publicUser((await getAccessUserById(user.id))!) });
  }

  if (operation === "reactivate") {
    await updateAccessUser(user.id, { status: "active", failedLoginCount: 0, lockedUntil: undefined });
    await audit(
      "access.user.reactivated",
      {},
      { before: { status: user.status }, after: { status: "active" } }
    );
    return NextResponse.json({ ok: true, user: publicUser((await getAccessUserById(user.id))!) });
  }

  if (operation === "reset-password") {
    const temporaryPassword = generateTempPassword();
    await updateAccessUser(user.id, { passwordHash: hashPassword(temporaryPassword), mustChangePassword: true });
    await revokeAllSessionsForUser(user.id);
    await audit("access.user.password_reset");
    return NextResponse.json({ ok: true, temporaryPassword });
  }

  if (operation === "reset-mfa") {
    await updateAccessUser(user.id, { totpSecret: undefined, totpEnabled: false });
    await revokeAllSessionsForUser(user.id);
    await audit("access.user.mfa_reset");
    return NextResponse.json({ ok: true });
  }

  if (operation === "request-role-change") {
    // Two-person rule: role changes (including any Super Admin grant) are
    // queued for a second, different Super Admin to approve.
    const requestedRoles = parsed.success ? parsed.data.roles : [];
    const requestedDefaultRole = parsed.success ? parsed.data.defaultRole : undefined;
    const roles = requestedRoles.filter((role) => isAccessRole(role)) as AccessRole[];
    const defaultRole = requestedDefaultRole && isAccessRole(requestedDefaultRole) && roles.includes(requestedDefaultRole)
      ? requestedDefaultRole
      : roles[0];
    if (!roles.length) return NextResponse.json({ ok: false, error: "At least one role is required." }, { status: 400 });

    const approval = await createRoleChangeApproval({
      targetUserId: user.id,
      targetUserName: user.name,
      roles,
      defaultRole,
      requestedBy: auth.context.userId,
      requestedByName: auth.context.userName
    });
    await audit(
      "access.role_change.requested",
      { approvalId: approval.id },
      {
        before: { roles: user.roles, defaultRole: user.defaultRole },
        after: { roles, defaultRole }
      }
    );
    return NextResponse.json({ ok: true, approval });
  }

  return NextResponse.json({ ok: false, error: "Unknown operation." }, { status: 400 });
}
