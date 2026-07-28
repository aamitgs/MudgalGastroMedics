import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { computeAuditChanges } from "@/lib/audit-diff";
import { approvalProgressLabel, pendingStage } from "@/lib/billing-approval-calc";
import { decideApproval, listApprovals, listApprovalsForInvoice, requestApproval, stagesForRole } from "@/lib/billing-approval-store";
import { rupeesToPaise } from "@/lib/billing-calc";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { approvalDecisionSchema, approvalRequestSchema } from "@/lib/validation/billing-approvals";

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const invoiceId = params.get("invoiceId");
  const all = invoiceId ? await listApprovalsForInvoice(invoiceId) : await listApprovals();
  const pendingOnly = params.get("pendingOnly") === "true";
  const approvals = pendingOnly ? all.filter((approval) => approval.status === "Pending") : all;

  // The viewer's own signing stages travel with the list so the queue can show
  // which rows they can actually act on, rather than offering buttons that 403.
  return NextResponse.json({
    ok: true,
    approvals: approvals.map((approval) => ({
      ...approval,
      progressLabel: approvalProgressLabel(approval),
      awaitingStage: pendingStage(approval)
    })),
    actorStages: stagesForRole(auth.context.activeRole),
    actorName: auth.context.userName || auth.context.activeRole
  });
}

/** Raising a request needs the adjustments grant — the same one that used to permit acting directly. */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = approvalRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  const result = await requestApproval({
    kind: body.kind,
    invoiceId: body.invoiceId,
    reason: body.reason,
    amountPaise: body.amount === undefined ? undefined : rupeesToPaise(body.amount),
    discountPercent: body.percent,
    discountType: body.discountType,
    refundMethod: body.refundMethod,
    requestedBy: auth.context.userName || auth.context.activeRole,
    requestedByRole: auth.context.activeRole
  });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Invoice not found." ? 404 : 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.approval.requested",
    entityType: "billing-approval",
    entityId: result.approval.id,
    after: result.approval,
    metadata: {
      kind: result.approval.kind,
      invoiceNo: result.approval.invoiceNo,
      amountPaise: result.approval.amountPaise,
      requiredStages: result.approval.requiredStages,
      reason: result.approval.reason
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, approval: result.approval });
}

/**
 * Records a sign-off. Authorisation is two-part: the `billing-adjustments`
 * permission gets you to the queue, and `approvalStageRoles` decides which
 * stage you may actually sign — which is why an approver's role, not just
 * their permission, is checked in the store.
 */
export async function PATCH(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = approvalDecisionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  const result = await decideApproval({
    id: body.id,
    decision: body.decision,
    note: body.note,
    actorName: auth.context.userName || auth.context.activeRole,
    actorRole: auth.context.activeRole
  });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Approval request not found." ? 404 : 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: body.decision === "Approved" ? "billing.approval.approved" : "billing.approval.rejected",
    entityType: "billing-approval",
    entityId: result.approval.id,
    severity: "warning",
    changes: computeAuditChanges(result.before, result.approval),
    metadata: {
      kind: result.approval.kind,
      invoiceNo: result.approval.invoiceNo,
      amountPaise: result.approval.amountPaise,
      status: result.approval.status,
      applied: Boolean(result.approval.appliedAt),
      applyError: result.approval.applyError
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({
    ok: true,
    approval: { ...result.approval, progressLabel: approvalProgressLabel(result.approval), awaitingStage: pendingStage(result.approval) }
  });
}
