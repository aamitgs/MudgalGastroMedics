import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { authorize } from "@/lib/access/guard";
import type { AccessRole } from "@/lib/access/matrix";
import { generateTempPassword, hashPassword } from "@/lib/access/password";
import { createAccessUser, getAccessUserByUsername } from "@/lib/access/user-store";

/**
 * One-time launch-team seeding (idempotent: existing usernames are skipped).
 *
 * This is the deliberate bootstrap exception to the "no Super Admin grant
 * without a second approver" rule — it can only run from an existing
 * Super Admin session, every created account is audited, and temporary
 * passwords are returned exactly once in the response, never persisted.
 *
 * Insurance Coordinator was merged into Billing / Accounts at launch
 * (confirmed decision) — no separate seat is seeded.
 */
const launchTeam: Array<{
  name: string;
  username: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
}> = [
  {
    // Dual roles confirmed intentional at launch, including breadth across
    // operations: Super Admin + Admin + Pharmacist + Billing + HR.
    name: "Amit Sharma",
    username: "amit.sharma",
    roles: ["super-admin", "admin", "pharmacist", "billing-accounts", "hr"],
    defaultRole: "admin"
  },
  {
    // One account, two roles; defaults to the clinical workspace. Super Admin
    // is a deliberate elevated mode (password re-auth, 30-minute window).
    name: "Dr. Deepak Kumar Sharma",
    username: "deepak.sharma",
    roles: ["super-admin", "main-doctor"],
    defaultRole: "main-doctor"
  },
  { name: "HS Sharma", username: "hs.sharma", roles: ["super-admin"], defaultRole: "super-admin" },
  { name: "Jasvinder", username: "jasvinder", roles: ["admin", "billing-accounts"], defaultRole: "admin" },
  { name: "Dr. Dusyant", username: "dusyant", roles: ["duty-doctor"], defaultRole: "duty-doctor" },
  { name: "Abhay Sharma", username: "abhay.sharma", roles: ["nurse"], defaultRole: "nurse" },
  { name: "Avinash", username: "avinash", roles: ["reception"], defaultRole: "reception" },
  { name: "CP", username: "cp", roles: ["lab-technician"], defaultRole: "lab-technician" },
  { name: "Sharma (HR)", username: "sharma.hr", roles: ["hr"], defaultRole: "hr" },
  { name: "Amit Arela", username: "amit.arela", roles: ["pro"], defaultRole: "pro" },
  { name: "Akash", username: "akash", roles: ["pro"], defaultRole: "pro" }
];

export async function POST(request: Request) {
  const auth = await authorize(request, "user-management", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only a Super Admin can seed the launch team." }, { status: 403 });
  }

  const created: Array<{ name: string; username: string; roles: AccessRole[]; temporaryPassword: string }> = [];
  const skipped: string[] = [];

  for (const member of launchTeam) {
    if (getAccessUserByUsername(member.username)) {
      skipped.push(member.username);
      continue;
    }
    const temporaryPassword = generateTempPassword();
    const result = createAccessUser({
      name: member.name,
      username: member.username,
      roles: member.roles,
      defaultRole: member.defaultRole,
      passwordHash: hashPassword(temporaryPassword),
      mustChangePassword: true
    });
    if ("error" in result) {
      skipped.push(`${member.username} (${result.error})`);
      continue;
    }
    created.push({ name: member.name, username: member.username, roles: member.roles, temporaryPassword });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "access.user.seeded",
      entityType: "access_user",
      entityId: result.id,
      severity: "warning",
      metadata: { name: member.name, username: member.username, roles: member.roles, ...auditRequestMetadata(request) }
    });
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    skipped,
    // Plaintext temporary passwords appear only in this one response for
    // secure handoff. Distribute individually, then discard the output.
    credentials: created
  });
}
