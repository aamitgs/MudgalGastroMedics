import "server-only";

import { canViewAdminModule } from "@/lib/access/admin-modules";
import { getAccessContext, type AccessContext } from "@/lib/access/guard";

type ReadonlyCookieStore = {
  getAll(): Array<{ name: string; value: string }>;
};

/** Resolves the access context inside a server component, from cookies(). */
export async function accessContextFromCookieStore(cookieStore: ReadonlyCookieStore): Promise<AccessContext> {
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  return getAccessContext(cookieHeader || null);
}

/** Any authenticated staff role may open the admin shell; APIs enforce per-module rights. */
export function canOpenAdminShell(context: AccessContext) {
  return context.authenticated && context.activeRole !== "patient";
}

export function canOpenDoctorWorkspace(context: AccessContext) {
  return (
    context.authenticated &&
    (context.activeRole === "main-doctor" || context.activeRole === "duty-doctor" || context.activeRole === "super-admin")
  );
}

/**
 * Per-module route gate (Phase 0 of the Hospital OS routing migration —
 * docs/build-roadmap.md): same admin shell + same per-module resource check
 * `visibleAdminModules` already uses for the sidebar list, just applied
 * server-side to a single dedicated route instead of filtering a full list.
 */
export function canOpenModule(context: AccessContext, moduleId: string) {
  return canOpenAdminShell(context) && canViewAdminModule(context.activeRole, moduleId);
}
