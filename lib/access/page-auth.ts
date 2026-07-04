import "server-only";

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
