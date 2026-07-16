import "server-only";

import { getAdminStaffIdFromCookie, hasAdminCookie } from "@/lib/admin-auth";
import { hasDoctorCookie } from "@/lib/doctor-auth";
import { getStaffById } from "@/lib/hr-store";
import type { StaffRole } from "@/lib/hr-types";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import type { AccessAction, AccessResource, AccessRole } from "@/lib/access/matrix";
import { breakGlassResources, breakGlassRoles, roleHasPermission } from "@/lib/access/matrix";
import { getAccessUserById } from "@/lib/access/user-store";
import { getSessionByToken, getSessionTokenFromCookieHeader, isElevated, type AccessSession } from "@/lib/access/session-store";
import { getActiveBreakGlassGrant, recordBreakGlassUse } from "@/lib/access/break-glass-store";

export type AccessContext = {
  authenticated: boolean;
  userId: string;
  userName: string;
  roles: AccessRole[];
  activeRole: AccessRole;
  elevated: boolean;
  sessionId?: string;
  session?: AccessSession;
  /** True when this context came from the legacy admin/doctor cookie rather than an RBAC session. */
  legacy: boolean;
  /** Set when the current request was allowed via a break-glass grant. */
  breakGlassGrantId?: string;
};

const unauthenticated: AccessContext = {
  authenticated: false,
  userId: "",
  userName: "",
  roles: [],
  activeRole: "patient",
  elevated: false,
  legacy: false
};

/**
 * Maps a legacy hr-store StaffRole onto the closest RBAC AccessRole for the
 * legacy admin-cookie login (app/api/admin/session). Returns null for a role
 * with no safe RBAC equivalent (e.g. Housekeeping) so the caller fails closed
 * instead of guessing broad access.
 */
function accessRoleForStaffRole(role: StaffRole): AccessRole | null {
  switch (role) {
    case "Admin":
      return "super-admin";
    case "Doctor":
      return "main-doctor";
    case "Nurse":
      return "nurse";
    case "Reception":
      return "reception";
    case "Pharmacy":
      return "pharmacist";
    case "Lab":
    case "Technician":
      return "lab-technician";
    default:
      return null;
  }
}

/**
 * Resolves the caller's identity from either the new RBAC session cookie or
 * the legacy cookies. The legacy admin cookie is scoped to the specific staff
 * member it was issued to (via accessRoleForStaffRole) — it does NOT grant
 * blanket super-admin the way it used to; that was a privilege-escalation gap
 * (a Reception-role legacy login had de facto super-admin on every
 * authorize()-gated route). The legacy doctor passcode still maps to
 * main-doctor, since that cookie has no per-staff identity to look up.
 */
export async function getAccessContext(cookieHeader: string | null): Promise<AccessContext> {
  const sessionToken = getSessionTokenFromCookieHeader(cookieHeader);
  const session = await getSessionByToken(sessionToken);
  if (session && session.status === "active") {
    const user = await getAccessUserById(session.userId);
    if (user && user.status === "active") {
      return {
        authenticated: true,
        userId: user.id,
        userName: user.name,
        roles: user.roles,
        activeRole: session.activeRole,
        elevated: isElevated(session),
        sessionId: session.id,
        session,
        legacy: false
      };
    }
  }

  if (hasAdminCookie(cookieHeader)) {
    const staffId = getAdminStaffIdFromCookie(cookieHeader) || "STF-ADMIN-001";
    const staff = await getStaffById(staffId);
    const role = staff && staff.status === "Active" ? accessRoleForStaffRole(staff.role) : null;
    if (staff && role) {
      return {
        authenticated: true,
        userId: staffId,
        userName: staff.name,
        roles: [role],
        activeRole: role,
        elevated: false,
        legacy: true
      };
    }
  }

  if (hasDoctorCookie(cookieHeader)) {
    return {
      authenticated: true,
      userId: "legacy-doctor",
      userName: "Legacy doctor session",
      roles: ["main-doctor"],
      activeRole: "main-doctor",
      elevated: false,
      legacy: true
    };
  }

  return unauthenticated;
}

export function getRequestAccessContext(request: Request) {
  return getAccessContext(request.headers.get("cookie"));
}

/**
 * Resolves the session/user pair regardless of session status. Used only by
 * the auth flow routes themselves (MFA challenge, forced password change),
 * which must operate on sessions that are not yet "active".
 */
export async function getSessionAndUser(request: Request) {
  const token = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
  const session = await getSessionByToken(token);
  if (!session) return null;
  const user = await getAccessUserById(session.userId);
  if (!user || user.status !== "active") return null;
  return { session, user };
}

export type AuthorizeResult =
  | { ok: true; context: AccessContext }
  | { ok: false; status: 401 | 403; error: string };

/**
 * The single server-side permission check. Permissions are evaluated against
 * the session's ACTIVE role (that is the point of role selection at login and
 * deliberate elevation) — holding a role in the background grants nothing
 * until the user switches into it.
 */
export async function authorize(
  request: Request,
  resource: AccessResource,
  action: AccessAction
): Promise<AuthorizeResult> {
  const context = await getRequestAccessContext(request);

  if (!context.authenticated) {
    return { ok: false, status: 401, error: "Staff login required." };
  }

  if (context.activeRole === "super-admin") {
    // Super Admin bypasses the matrix, but exercises of power beyond what a
    // plain Admin could do are individually logged so elevated-mode activity
    // stays distinguishable from routine operations.
    if (action !== "view" && !roleHasPermission("admin", resource, action)) {
      await recordAuditEvent({
        actorRole: "super-admin",
        actorId: context.userId,
        action: "access.superadmin.bypass",
        entityType: "permission",
        entityId: `${resource}:${action}`,
        severity: "info",
        metadata: { elevated: context.elevated, legacy: context.legacy },
        device: auditRequestMetadata(request)
      });
    }
    return { ok: true, context };
  }

  if (roleHasPermission(context.activeRole, resource, action)) {
    return { ok: true, context };
  }

  // Break-glass: emergency, time-boxed clinical READ access for doctors.
  if (action === "view" && breakGlassResources.includes(resource) && breakGlassRoles.includes(context.activeRole)) {
    const grant = await getActiveBreakGlassGrant(context.userId);
    if (grant) {
      await recordBreakGlassUse(grant.id);
      await recordAuditEvent({
        actorRole: context.activeRole,
        actorId: context.userId,
        action: "access.break_glass.used",
        entityType: "permission",
        entityId: `${resource}:${action}`,
        severity: "critical",
        metadata: { grantId: grant.id, reason: grant.reason },
        device: auditRequestMetadata(request)
      });
      return { ok: true, context: { ...context, breakGlassGrantId: grant.id } };
    }
  }

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "auth.denied",
    entityType: "permission",
    entityId: `${resource}:${action}`,
    severity: "warning",
    metadata: { roles: context.roles },
    device: auditRequestMetadata(request)
  });

  return { ok: false, status: 403, error: "Your role does not permit this action." };
}
