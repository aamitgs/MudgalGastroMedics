import "server-only";
import type { AccessRole } from "@/lib/access/matrix";
import { approvalStageRoles } from "@/lib/access/matrix";
import {
  canDecide,
  deriveApprovalStatus,
  discountFromPercent,
  requiredStagesFor
} from "@/lib/billing-approval-calc";
import type { ApprovalKind, ApprovalStage, BillingApproval, DiscountType } from "@/lib/billing-approval-types";
import { formatPaise } from "@/lib/billing-calc";
import { cancelInvoice, getInvoiceById, recordInvoiceRefund, setInvoiceDiscount } from "@/lib/billing-store";
import type { InvoicePaymentMethod } from "@/lib/billing-types";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

type ApprovalStore = {
  approvals: BillingApproval[];
};

const docStore = createDocumentStore<ApprovalStore>("billing-approvals", (parsed) => {
  const doc = parsed as Partial<ApprovalStore> | undefined;
  return { approvals: Array.isArray(doc?.approvals) ? (doc.approvals as ApprovalStore["approvals"]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Which sign-off stages a role may give. Derived from the matrix so the chain and the permission model can't drift apart. */
export function stagesForRole(role: AccessRole): ApprovalStage[] {
  return (Object.keys(approvalStageRoles) as ApprovalStage[]).filter((stage) => approvalStageRoles[stage].includes(role));
}

export async function listApprovals() {
  return (await docStore.load()).approvals;
}

export async function getApprovalById(id: string) {
  return (await docStore.load()).approvals.find((approval) => approval.id === id) ?? null;
}

export async function listApprovalsForInvoice(invoiceId: string) {
  return (await docStore.load()).approvals.filter((approval) => approval.invoiceId === invoiceId);
}

export type RequestApprovalInput = {
  kind: ApprovalKind;
  invoiceId: string;
  reason: string;
  /** Discount or refund amount in paise. Ignored for a cancellation, which always voids the whole bill. */
  amountPaise?: number;
  discountType?: DiscountType;
  discountPercent?: number;
  refundMethod?: InvoicePaymentMethod;
  requestedBy: string;
  requestedByRole: string;
};

/**
 * Raises a request. Nothing happens to the bill yet — that is the point: the
 * person who wants the concession and the people who authorise it are
 * deliberately different steps, and the effect only runs once the chain
 * clears.
 */
export async function requestApproval(input: RequestApprovalInput): Promise<{ approval: BillingApproval } | { error: string }> {
  const reason = normalizeText(input.reason);
  if (!reason) return { error: "A reason is required." };

  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "Cancelled") return { error: "This invoice is already cancelled." };
  if (invoice.status === "Draft") return { error: "Issue this invoice before requesting a discount, refund or cancellation." };

  let amountPaise: number;
  if (input.kind === "Cancellation") {
    amountPaise = invoice.totalPaise;
  } else if (input.kind === "Discount") {
    amountPaise =
      input.discountPercent !== undefined
        ? discountFromPercent(input.discountPercent, invoice.totalPaise)
        : Math.max(0, Math.round(input.amountPaise ?? 0));
    if (amountPaise <= 0) return { error: "Enter a discount greater than zero." };
    if (amountPaise > invoice.subtotalPaise) return { error: "A discount can't exceed the bill total." };
  } else {
    amountPaise = Math.max(0, Math.round(input.amountPaise ?? 0));
    if (amountPaise <= 0) return { error: "Enter a refund amount greater than zero." };
    if (amountPaise > invoice.paidPaise) {
      return { error: `Only ${formatPaise(invoice.paidPaise)} has been collected on this invoice.` };
    }
  }

  const doc = await docStore.load();

  // One live request per bill per kind: two pending discounts on one invoice
  // would let a second approval silently overwrite the first.
  const openRequest = doc.approvals.find(
    (approval) => approval.invoiceId === invoice.id && approval.kind === input.kind && approval.status === "Pending"
  );
  if (openRequest) return { error: `A ${input.kind.toLowerCase()} request for this invoice is already awaiting approval.` };

  const now = new Date().toISOString();
  const approval: BillingApproval = {
    id: generateId("APR"),
    createdAt: now,
    updatedAt: now,
    kind: input.kind,
    status: "Pending",
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    patientName: invoice.patientName,
    phone: invoice.phone,
    amountPaise,
    reason,
    discountType: input.discountType,
    discountPercent: input.discountPercent,
    refundMethod: input.refundMethod,
    requestedBy: normalizeText(input.requestedBy) || "Unknown",
    requestedByRole: input.requestedByRole,
    requestedAt: now,
    requiredStages: requiredStagesFor(input.kind, amountPaise, invoice.totalPaise),
    decisions: []
  };

  doc.approvals.unshift(approval);
  await docStore.save(doc);
  return { approval };
}

/** Runs the approved effect. Called only once every required stage has signed. */
async function applyApprovedEffect(approval: BillingApproval, actingStaffName: string): Promise<{ error: string } | undefined> {
  if (approval.kind === "Discount") {
    const result = await setInvoiceDiscount(approval.invoiceId, approval.amountPaise, approval.reason);
    return "error" in result ? { error: result.error } : undefined;
  }

  if (approval.kind === "Cancellation") {
    const result = await cancelInvoice(approval.invoiceId, approval.reason, actingStaffName);
    return "error" in result ? { error: result.error } : undefined;
  }

  const result = await recordInvoiceRefund(approval.invoiceId, {
    amountPaise: approval.amountPaise,
    method: approval.refundMethod ?? "Cash",
    reason: approval.reason,
    approvalId: approval.id,
    actingStaffName
  });
  return "error" in result ? { error: result.error } : undefined;
}

export type DecideInput = {
  id: string;
  decision: "Approved" | "Rejected";
  note?: string;
  actorName: string;
  actorRole: AccessRole;
};

/**
 * Records one stage's decision, and — once the last required stage signs —
 * runs the effect immediately.
 *
 * Auto-applying on final approval is deliberate: a separate "now actually do
 * it" step is a queue of approved-but-unapplied requests waiting to be
 * forgotten, and the approval *is* the authorisation. If the effect fails, the
 * request keeps its approval and records `applyError` so it surfaces as stuck
 * rather than silently doing nothing.
 */
export async function decideApproval(input: DecideInput): Promise<{ approval: BillingApproval; before: BillingApproval } | { error: string }> {
  const doc = await docStore.load();
  const index = doc.approvals.findIndex((approval) => approval.id === input.id);
  if (index === -1) return { error: "Approval request not found." };

  const before = structuredClone(doc.approvals[index]);
  const approval = doc.approvals[index];
  const actorStages = stagesForRole(input.actorRole);

  const check = canDecide(approval, { name: input.actorName, stages: actorStages });
  if (!check.ok) return { error: check.error };

  approval.decisions.push({
    stage: check.stage,
    decision: input.decision,
    by: input.actorName,
    role: input.actorRole,
    at: new Date().toISOString(),
    note: normalizeText(input.note) || undefined
  });
  approval.status = deriveApprovalStatus(approval);
  approval.updatedAt = new Date().toISOString();

  if (approval.status === "Approved") {
    const failure = await applyApprovedEffect(approval, input.actorName);
    if (failure) {
      approval.applyError = failure.error;
    } else {
      approval.applyError = undefined;
      approval.appliedAt = new Date().toISOString();
      approval.appliedBy = input.actorName;
    }
  }

  await docStore.save(doc);
  return { approval, before };
}
