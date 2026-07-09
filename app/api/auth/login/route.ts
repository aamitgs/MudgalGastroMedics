import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { isAccessRole, mfaMandatoryRoles, roleMeta } from "@/lib/access/matrix";
import type { AccessRole } from "@/lib/access/matrix";
import { verifyPassword } from "@/lib/access/password";
import { loginRateLimit } from "@/lib/access/rate-limit";
import {
  getAccessUserByUsername,
  isUserLockedOut,
  recordLoginFailure,
  recordLoginSuccess,
  type AccessUser
} from "@/lib/access/user-store";
import { buildSessionCookie, createAccessSession, type AccessSessionStatus } from "@/lib/access/session-store";

const genericError = "Invalid username or password.";

function requiresMfa(user: AccessUser) {
  return user.roles.some((role) => mfaMandatoryRoles.includes(role));
}

function initialSessionStatus(user: AccessUser): AccessSessionStatus {
  if (user.mustChangePassword) return "password-change-required";
  if (user.totpEnabled) return "mfa-pending";
  if (requiresMfa(user)) return "mfa-setup-required";
  return "active";
}

export async function POST(request: Request) {
  const limit = loginRateLimit(request);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many login attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const requestedRole = typeof body.role === "string" ? body.role : "";

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }

  const user = await getAccessUserByUsername(username);

  const auditFailure = (reason: string) =>
    recordAuditEvent({
      actorRole: "system",
      action: "access.login.failed",
      entityType: "access_user",
      entityId: user?.id ?? username,
      severity: "warning",
      metadata: { reason, username },
      device: auditRequestMetadata(request)
    });

  if (!user || user.status !== "active") {
    await auditFailure(user ? "suspended" : "unknown-user");
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }

  if (isUserLockedOut(user)) {
    await auditFailure("locked-out");
    return NextResponse.json(
      { ok: false, error: "Account temporarily locked after repeated failed attempts. Try again later." },
      { status: 429 }
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    await recordLoginFailure(user.id);
    await auditFailure("bad-password");
    return NextResponse.json({ ok: false, error: genericError }, { status: 401 });
  }

  let activeRole: AccessRole = user.defaultRole;
  if (requestedRole) {
    if (!isAccessRole(requestedRole) || !user.roles.includes(requestedRole)) {
      await auditFailure("role-not-held");
      return NextResponse.json(
        { ok: false, error: "You do not hold the selected role. Choose one of your assigned roles." },
        { status: 403 }
      );
    }
    activeRole = requestedRole;
  }

  await recordLoginSuccess(user.id);
  const status = initialSessionStatus(user);
  const { token, session } = await createAccessSession({
    userId: user.id,
    activeRole,
    status,
    ip: auditRequestMetadata(request).ip,
    userAgent: auditRequestMetadata(request).userAgent
  });

  await recordAuditEvent({
    actorRole: activeRole,
    actorId: user.id,
    action: activeRole === "super-admin" ? "access.login.super_admin" : "access.login",
    entityType: "access_session",
    entityId: session.id,
    severity: activeRole === "super-admin" ? "warning" : "info",
    metadata: { status },
    device: auditRequestMetadata(request)
  });

  const response = NextResponse.json({
    ok: true,
    status,
    landing: roleMeta[activeRole].landing,
    user: { name: user.name, roles: user.roles, activeRole }
  });
  response.cookies.set(buildSessionCookie(token));
  return response;
}
