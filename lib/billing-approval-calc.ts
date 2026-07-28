import {
  ADMIN_APPROVAL_SHARE,
  ADMIN_APPROVAL_THRESHOLD_PAISE,
  type ApprovalDecision,
  type ApprovalKind,
  type ApprovalStage,
  type BillingApproval
} from "@/lib/billing-approval-types";

/**
 * Pure approval-chain rules (Track 5.6) — who must sign, what is still
 * outstanding, and whether a request is settled. Kept free of persistence so
 * the governance rules are directly unit-testable.
 */

/**
 * Which stages a request must clear.
 *
 * Accounts always signs. Admin joins when the money is large in absolute
 * terms, or — for a discount — large relative to the bill: a 90% write-off is
 * a governance question even when the rupees are few.
 *
 * Frozen onto the request when it is raised, so a later price change or part
 * payment can't quietly reduce who had to authorise it.
 */
export function requiredStagesFor(kind: ApprovalKind, amountPaise: number, invoiceTotalPaise: number): ApprovalStage[] {
  const stages: ApprovalStage[] = ["Accounts"];

  const largeAbsolute = amountPaise > ADMIN_APPROVAL_THRESHOLD_PAISE;
  const largeShare = kind === "Discount" && invoiceTotalPaise > 0 && amountPaise / invoiceTotalPaise > ADMIN_APPROVAL_SHARE;
  // Voiding a whole bill is always a two-signature action, whatever it is worth.
  if (largeAbsolute || largeShare || kind === "Cancellation") stages.push("Admin");

  return stages;
}

/** The stage a pending request is currently waiting on, or null once every required stage has signed. */
export function pendingStage(approval: Pick<BillingApproval, "requiredStages" | "decisions">): ApprovalStage | null {
  const approved = new Set(approval.decisions.filter((decision) => decision.decision === "Approved").map((decision) => decision.stage));
  return approval.requiredStages.find((stage) => !approved.has(stage)) ?? null;
}

/** Any rejection ends the request — one refusal is enough, and later stages shouldn't have to re-litigate it. */
export function isRejected(approval: Pick<BillingApproval, "decisions">): boolean {
  return approval.decisions.some((decision) => decision.decision === "Rejected");
}

export function isFullyApproved(approval: Pick<BillingApproval, "requiredStages" | "decisions">): boolean {
  return !isRejected(approval) && pendingStage(approval) === null;
}

export function deriveApprovalStatus(approval: Pick<BillingApproval, "requiredStages" | "decisions">): BillingApproval["status"] {
  if (isRejected(approval)) return "Rejected";
  return isFullyApproved(approval) ? "Approved" : "Pending";
}

export type DecisionCheck = { ok: true; stage: ApprovalStage } | { ok: false; error: string };

/**
 * Whether this actor may record a decision right now.
 *
 * Three rules matter, and none of them is expressible as a permission:
 *
 * 1. Stages are signed in order — you can only sign the one being waited on.
 * 2. The requester may never sign their own request.
 * 3. **One person signs at most one stage.** An Admin holds both stages'
 *    authority (deliberately — they can cover for an absent Accounts), so
 *    without this rule a single admin could provide both signatures and a
 *    two-signature chain would mean nothing. Two signatures must be two people.
 */
export function canDecide(
  approval: Pick<BillingApproval, "status" | "requiredStages" | "decisions" | "requestedBy">,
  actor: { name: string; stages: ApprovalStage[] }
): DecisionCheck {
  if (approval.status !== "Pending") return { ok: false, error: "This request has already been settled." };

  const stage = pendingStage(approval);
  if (!stage) return { ok: false, error: "This request has already been fully approved." };

  if (!actor.stages.includes(stage)) return { ok: false, error: `This request is waiting on ${stage} approval.` };
  if (approval.requestedBy && approval.requestedBy === actor.name) {
    return { ok: false, error: "You raised this request, so you can't also approve it." };
  }
  if (approval.decisions.some((decision) => decision.by === actor.name)) {
    return { ok: false, error: "You have already signed this request — the second signature must come from someone else." };
  }

  return { ok: true, stage };
}

/** Rupee value of a percentage discount, rounded to the paisa and never exceeding the bill. */
export function discountFromPercent(percent: number, invoiceTotalPaise: number): number {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(invoiceTotalPaise, Math.round((invoiceTotalPaise * Math.min(percent, 100)) / 100));
}

/** Short human summary of where a request stands — used in the queue so staff needn't reconstruct it from the decision list. */
export function approvalProgressLabel(approval: Pick<BillingApproval, "status" | "requiredStages" | "decisions">): string {
  if (isRejected(approval)) {
    const rejection = approval.decisions.find((decision) => decision.decision === "Rejected");
    return `Rejected by ${rejection?.stage ?? "an approver"}`;
  }
  const stage = pendingStage(approval);
  if (!stage) return "Fully approved";
  const signed = approval.decisions.filter((decision: ApprovalDecision) => decision.decision === "Approved").length;
  return `Awaiting ${stage} (${signed}/${approval.requiredStages.length} signed)`;
}
