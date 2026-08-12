export type LabOrderStatus = "Ordered" | "Sample Collected" | "Processing" | "Result Ready" | "Delivered" | "Cancelled";

export type LabOrderPriority = "Routine" | "Urgent";

export type LabPaymentStatus = "Unpaid" | "Paid";

export type LabOrder = {
  id: string;
  /**
   * This order's own register number — LAB-2026-00001 — issued once and never
   * reissued. A visit can raise several lab orders, so the encounter's number
   * cannot identify one of them; this is what goes on a sample and what a tech
   * quotes back. Optional until scripts/backfill-register-numbers.mjs has run.
   */
  orderNo?: string;
  createdAt: string;
  updatedAt: string;
  visitId: string;
  /** The encounter this order came out of, denormalized like the patient identity below. */
  visitNo?: string;
  /** The originating visit's queue position on the day it was ordered — same-day useful, repeats after that. Superseded by orderNo as this order's identity. */
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  service: string;
  tests: string[];
  priority: LabOrderPriority;
  status: LabOrderStatus;
  sampleType?: string;
  resultSummary?: string;
  reportReference?: string;
  amount?: number;
  paymentStatus: LabPaymentStatus;
  notes?: string;
  /** Critical (panic) result flag — Track 0.2. Set by threshold rules or laboratory judgment. */
  criticalFlag?: boolean;
  /** Explainability: why this result is critical (threshold sentences or the manual note). */
  criticalReasons?: string[];
  criticalSource?: "threshold" | "manual";
  /** Doctor sign-off that the critical result was seen; clears the alert, stays on record. */
  criticalAcknowledgedBy?: string;
  criticalAcknowledgedAt?: string;
};

export const labOrderStatuses: LabOrderStatus[] = ["Ordered", "Sample Collected", "Processing", "Result Ready", "Delivered", "Cancelled"];
export const labOrderPriorities: LabOrderPriority[] = ["Routine", "Urgent"];
export const labPaymentStatuses: LabPaymentStatus[] = ["Unpaid", "Paid"];

export const commonLabTests = [
  "CBC",
  "LFT",
  "KFT",
  "PT/INR",
  "Viral Markers",
  "HBsAg",
  "Anti-HCV",
  "Amylase / Lipase",
  "Stool Occult Blood",
  "CRP",
  "Blood Sugar",
  "Thyroid Profile"
];
