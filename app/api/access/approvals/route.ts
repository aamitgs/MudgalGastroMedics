import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { authorize } from "@/lib/access/guard";
import { decideApproval, getApprovalById, listApprovals } from "@/lib/access/approvals-store";
import { revokeAllSessionsForUser } from "@/lib/access/session-store";
import { getAccessUserById, updateAccessUser } from "@/lib/access/user-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { approvalDecisionSchema } from "@/lib/validation/auth";

export async function GET(request: Request) {
  const auth = await authorize(request, "user-management", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only a Super Admin can view approvals." }, { status: 403 });
  }
  return NextResponse.json({ ok: true, approvals: await listApprovals() });
}

/**
 * Second half of the two-person rule: a different Super Admin approves or
 * rejects a pending role change. The requester can never approve their own
 * request; legacy sessions cannot approve because the approver must be a
 * distinct named account.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "user-management", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  if (auth.context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only a Super Admin can decide approvals." }, { status: 403 });
  }

  const parsed = approvalDecisionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { id, decision } = parsed.data;

  const approval = await getApprovalById(id);
  if (!approval || approval.status !== "pending") {
    return NextResponse.json({ ok: false, error: "Pending approval not found." }, { status: 404 });
  }
  if (approval.requestedBy === auth.context.userId) {
    return NextResponse.json(
      { ok: false, error: "The two-person rule requires a different Super Admin to decide this request." },
      { status: 403 }
    );
  }

  const decided = await decideApproval(id, decision, auth.context.userId, auth.context.userName);
  if (!decided) return NextResponse.json({ ok: false, error: "Approval could not be updated." }, { status: 409 });

  if (decision === "approved") {
    const target = await getAccessUserById(approval.targetUserId);
    if (!target) return NextResponse.json({ ok: false, error: "Target user no longer exists." }, { status: 404 });
    await updateAccessUser(target.id, { roles: approval.payload.roles, defaultRole: approval.payload.defaultRole });
    // Force re-login so sessions cannot keep acting under the old role set.
    await revokeAllSessionsForUser(target.id);
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: decision === "approved" ? "access.role_change.approved" : "access.role_change.rejected",
    entityType: "access_user",
    entityId: approval.targetUserId,
    severity: "warning",
    metadata: {
      approvalId: approval.id,
      requestedBy: approval.requestedByName,
      roles: approval.payload.roles
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, approval: decided });
}
