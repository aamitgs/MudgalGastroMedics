import type { InvoicePaymentMethod } from "@/lib/billing-types";

/**
 * The billing approval chain (Track 5.6, §10/§22/§23).
 *
 * One entity covers discounts, refunds and cancellations rather than three
 * parallel workflows: they differ only in what they do once approved, and the
 * governance question — who may authorise money leaving or not arriving — is
 * identical for all three. Converging them means one queue for Accounts to
 * work, one audit shape, and one place the rules live.
 *
 * A request is never self-approved. The person who raises it is recorded
 * separately from every person who signs it off, which is the entire point of
 * an approval chain.
 */

export type ApprovalKind = "Discount" | "Refund" | "Cancellation";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

/** The sign-off stages, in the order they must be cleared. */
export type ApprovalStage = "Accounts" | "Admin";

/** §10's discount vocabulary. Percentage and Fixed Amount describe *how* it was calculated; the rest describe *why* it was given. */
export type DiscountType =
  | "Percentage"
  | "Fixed Amount"
  | "Senior Citizen"
  | "Employee"
  | "Referral"
  | "Promotional"
  | "Corporate"
  | "Insurance Adjustment";

export type ApprovalDecision = {
  stage: ApprovalStage;
  decision: "Approved" | "Rejected";
  by: string;
  role: string;
  at: string;
  note?: string;
};

export type BillingApproval = {
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  invoiceId: string;
  invoiceNo: string;
  patientName: string;
  phone: string;
  /** Discount or refund amount; for a cancellation, the invoice total being voided. */
  amountPaise: number;
  reason: string;
  discountType?: DiscountType;
  /** Set when the discount was expressed as a percentage, so the bill can explain how the amount was reached. */
  discountPercent?: number;
  refundMethod?: InvoicePaymentMethod;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  /** Which stages this request must clear, decided by amount at request time and frozen thereafter. */
  requiredStages: ApprovalStage[];
  decisions: ApprovalDecision[];
  /** Set when the approved effect actually ran — approval and execution are recorded separately. */
  appliedAt?: string;
  appliedBy?: string;
  /** Populated if applying the approved effect failed, so a stuck request is visible rather than silent. */
  applyError?: string;
};

export const approvalKinds: ApprovalKind[] = ["Discount", "Refund", "Cancellation"];
export const approvalStages: ApprovalStage[] = ["Accounts", "Admin"];
export const approvalStatuses: ApprovalStatus[] = ["Pending", "Approved", "Rejected"];
export const discountTypes: DiscountType[] = [
  "Percentage",
  "Fixed Amount",
  "Senior Citizen",
  "Employee",
  "Referral",
  "Promotional",
  "Corporate",
  "Insurance Adjustment"
];

/**
 * Above this, a request needs Admin sign-off on top of Accounts — the
 * "Admin (if required)" in §10's chain. Set at a level where routine
 * concessions (senior-citizen consultation waivers, small roundings) clear
 * with one signature, while anything a patient would notice on a bill needs
 * two.
 */
export const ADMIN_APPROVAL_THRESHOLD_PAISE = 2_00_000;

/**
 * A discount worth more than this share of the bill needs Admin sign-off
 * regardless of its absolute size — a 90% write-off on a small bill is a
 * governance question even though the rupees are few.
 */
export const ADMIN_APPROVAL_SHARE = 0.5;
