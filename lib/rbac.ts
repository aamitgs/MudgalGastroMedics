import "server-only";

import { getAdminStaffIdFromCookie, hasAdminCookie } from "@/lib/admin-auth";
import { getAccessContext } from "@/lib/access/guard";
import { roleHasPermission, type AccessRole } from "@/lib/access/matrix";
import { getStaffById } from "@/lib/hr-store";
import type { StaffMember, StaffPermission } from "@/lib/hr-types";

export type AuthContext = {
  authenticated: boolean;
  staff: StaffMember | null;
  permissions: StaffPermission[];
};

/**
 * Bridges the data-driven access matrix (lib/access/matrix.ts) onto the legacy
 * StaffPermission strings still used by the CMS/HMS modules, so RBAC sessions
 * and the legacy admin cookie flow through one permission model.
 */
function permissionsForAccessRole(role: AccessRole): StaffPermission[] {
  if (role === "super-admin") return ["hms:admin"];
  const permissions: StaffPermission[] = [];
  if (roleHasPermission(role, "cms", "view")) permissions.push("cms:read");
  if (roleHasPermission(role, "cms", "edit")) permissions.push("cms:write", "cms:publish");
  if (roleHasPermission(role, "reports", "view")) permissions.push("reports:read");
  if (roleHasPermission(role, "prescriptions", "edit")) permissions.push("clinical:write");
  if (roleHasPermission(role, "billing", "edit")) permissions.push("billing:write");
  if (roleHasPermission(role, "pharmacy-inventory", "edit")) permissions.push("inventory:write");
  return permissions;
}

export async function getAdminAuthContext(request: Request): Promise<AuthContext> {
  const cookieHeader = request.headers.get("cookie");

  if (hasAdminCookie(cookieHeader)) {
    const staffId = getAdminStaffIdFromCookie(cookieHeader) || "STF-ADMIN-001";
    const staff = (await getStaffById(staffId)) ?? (await getStaffById("STF-ADMIN-001"));
    return {
      authenticated: true,
      staff,
      permissions: staff?.permissions ?? []
    };
  }

  const context = await getAccessContext(cookieHeader);
  if (context.authenticated && !context.legacy) {
    return {
      authenticated: true,
      staff: null,
      permissions: permissionsForAccessRole(context.activeRole)
    };
  }

  return { authenticated: false, staff: null, permissions: [] };
}

export function hasPermission(context: AuthContext, permission: StaffPermission) {
  return context.permissions.includes(permission) || context.permissions.includes("hms:admin");
}

export function requirePermission(context: AuthContext, permission: StaffPermission) {
  if (!context.authenticated) return { ok: false as const, status: 401, error: "Admin login required." };
  if (!hasPermission(context, permission)) return { ok: false as const, status: 403, error: "Permission denied." };
  return { ok: true as const };
}
