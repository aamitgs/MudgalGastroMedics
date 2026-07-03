import { NextResponse } from "next/server";
import { getRequestAccessContext, getSessionAndUser } from "@/lib/access/guard";
import { roleMeta, rolePermissions } from "@/lib/access/matrix";
import { isElevated } from "@/lib/access/session-store";

export async function GET(request: Request) {
  const resolved = getSessionAndUser(request);
  if (!resolved) {
    // Legacy admin/doctor cookies have no RBAC session but still map to a role.
    const legacy = getRequestAccessContext(request);
    if (legacy.authenticated && legacy.legacy) {
      return NextResponse.json({
        ok: true,
        authenticated: true,
        status: "active",
        legacy: true,
        user: { id: legacy.userId, name: legacy.userName, username: legacy.userId, roles: legacy.roles, defaultRole: legacy.activeRole, totpEnabled: false },
        activeRole: legacy.activeRole,
        elevated: false,
        landing: roleMeta[legacy.activeRole].landing,
        permissions: rolePermissions[legacy.activeRole]
      });
    }
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }
  const { session, user } = resolved;
  return NextResponse.json({
    ok: true,
    authenticated: true,
    status: session.status,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      roles: user.roles,
      defaultRole: user.defaultRole,
      totpEnabled: user.totpEnabled
    },
    activeRole: session.activeRole,
    elevated: isElevated(session),
    landing: roleMeta[session.activeRole].landing,
    permissions: rolePermissions[session.activeRole]
  });
}
