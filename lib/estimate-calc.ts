import type { InvoiceLineItem } from "@/lib/billing-types";
import type { Estimate, EstimateStatus } from "@/lib/estimate-types";

/**
 * Pure estimate arithmetic and lifecycle rules (Track 5.7). Separate from
 * lib/billing-calc.ts because an estimate has no payments — conflating the two
 * would mean an estimate could appear "paid".
 */

export type EstimateTotals = {
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
};

export function calculateEstimateTotals(lineItems: InvoiceLineItem[], discountPaise: number): EstimateTotals {
  const subtotalPaise = lineItems.reduce((sum, line) => sum + line.totalPaise, 0);
  const clampedDiscount = Math.min(Math.max(0, Math.round(discountPaise)), subtotalPaise);
  return { subtotalPaise, discountPaise: clampedDiscount, totalPaise: subtotalPaise - clampedDiscount };
}

/** A quote past its validity date is stale — prices move, and honouring an old number is a decision, not a default. */
export function isStale(estimate: Pick<Estimate, "validUntil">, now: Date = new Date()): boolean {
  if (!estimate.validUntil) return false;
  return new Date(estimate.validUntil).getTime() < now.getTime();
}

/**
 * The status a viewer should see. Expiry is derived rather than stored, so an
 * estimate cannot read "Shared" months later purely because no job expired it.
 * Settled states are never re-derived.
 */
export function effectiveStatus(estimate: Estimate, now: Date = new Date()): EstimateStatus {
  if (estimate.status === "Converted" || estimate.status === "Declined" || estimate.status === "Draft") return estimate.status;
  if (isStale(estimate, now)) return "Expired";
  return estimate.status;
}

/**
 * Whether this estimate can become a bill.
 *
 * Requires acceptance: converting an unaccepted quote would bill a patient for
 * something they never agreed to, which is the exact failure an estimate
 * exists to prevent. A stale-but-accepted estimate is still convertible — the
 * patient agreed, and re-quoting a patient who already said yes is friction
 * for its own sake.
 */
export function canConvert(estimate: Estimate): { ok: true } | { ok: false; error: string } {
  if (estimate.status === "Converted") return { ok: false, error: `Already converted to ${estimate.convertedInvoiceNo ?? "an invoice"}.` };
  if (estimate.status === "Declined") return { ok: false, error: "The patient declined this estimate." };
  if (estimate.status !== "Accepted") return { ok: false, error: "Record the patient's acceptance before converting this estimate to a bill." };
  if (!estimate.lineItems.length) return { ok: false, error: "This estimate has no items." };
  return { ok: true };
}
