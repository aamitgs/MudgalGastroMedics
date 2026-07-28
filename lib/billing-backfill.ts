import { amountValue } from "@/lib/billing-query";
import type { Invoice, InvoicePaymentMethod } from "@/lib/billing-types";
import type { OpdVisit } from "@/lib/opd-types";

/**
 * Backfill plan: legacy OPD billing → invoices (Track 5 addendum).
 *
 * The legacy `AdminBillingSummary` still exists because it is the only view of
 * visits billed before the invoice entity did. Retiring it means converting
 * that history, and this decides what to convert — deliberately as a pure
 * planning function so the rules can be tested and, more importantly, so the
 * plan can be *reviewed before anything is written*. These are financial
 * records; a backfill that guesses is worse than one that refuses.
 *
 * Three principles:
 *
 * 1. **Never invent an amount.** A visit marked Paid with no amount recorded
 *    is reported for a human to resolve, not converted at zero.
 * 2. **Never convert twice.** Anything already carrying an invoice is skipped,
 *    so the backfill is safe to re-run.
 * 3. **Reconstruct only what was recorded.** A legacy visit holds one amount
 *    and one payment method — so it becomes one line and, if it was paid, one
 *    payment. No detail is fabricated to make the invoice look richer.
 */

export type BackfillAction = {
  visitId: string;
  token: string;
  patientName: string;
  phone: string;
  /** What the invoice will hold. */
  amountPaise: number;
  description: string;
  /** Issued with a payment, or issued and still owing. */
  paid: boolean;
  method?: InvoicePaymentMethod;
  paidAt?: string;
  receiptId?: string;
};

export type BackfillSkip = {
  visitId: string;
  token: string;
  reason: string;
  /** True when a human needs to look at it, rather than it being routinely irrelevant. */
  needsAttention: boolean;
};

export type BackfillPlan = {
  convert: BackfillAction[];
  skip: BackfillSkip[];
  totalPaise: number;
};

/** The legacy field only ever held these five; anything else is treated as Other. */
function toMethod(value: OpdVisit["paymentMethod"]): InvoicePaymentMethod {
  if (value === "Cash" || value === "UPI" || value === "Card" || value === "Insurance") return value;
  return "Other";
}

/** A visit has a billing footprint if anything financial was ever recorded against it. */
export function hasBillingFootprint(visit: OpdVisit): boolean {
  return (
    visit.billingStatus !== "Not Started" ||
    amountValue(visit.estimatedAmount) > 0 ||
    Boolean(visit.receiptId) ||
    Boolean(visit.paidAt) ||
    Boolean(visit.refundStatus)
  );
}

export function planBackfill(visits: OpdVisit[], invoices: Invoice[]): BackfillPlan {
  const invoicedVisitIds = new Set(invoices.map((invoice) => invoice.visitId).filter(Boolean) as string[]);

  const convert: BackfillAction[] = [];
  const skip: BackfillSkip[] = [];

  for (const visit of visits) {
    if (invoicedVisitIds.has(visit.id)) {
      skip.push({ visitId: visit.id, token: visit.token, reason: "Already has an invoice.", needsAttention: false });
      continue;
    }

    if (!hasBillingFootprint(visit)) {
      skip.push({ visitId: visit.id, token: visit.token, reason: "Nothing financial was ever recorded.", needsAttention: false });
      continue;
    }

    const amountPaise = Math.round(amountValue(visit.estimatedAmount) * 100);
    const paid = visit.billingStatus === "Paid";

    if (amountPaise <= 0) {
      // Refusing here is the point: a Paid visit with no amount is a real
      // record gap, and converting it at zero would bury that permanently.
      skip.push({
        visitId: visit.id,
        token: visit.token,
        reason: paid || visit.receiptId ? "Marked paid but no amount was recorded — needs a human." : "No amount recorded.",
        needsAttention: paid || Boolean(visit.receiptId)
      });
      continue;
    }

    if (visit.refundStatus) {
      // Legacy refunds have no approval behind them, and Track 5.6 makes an
      // approval structurally required. Converting one would either forge an
      // approval or drop the refund.
      skip.push({
        visitId: visit.id,
        token: visit.token,
        reason: `Legacy refund (${visit.refundStatus}) has no approval record to carry across — needs a human.`,
        needsAttention: true
      });
      continue;
    }

    convert.push({
      visitId: visit.id,
      token: visit.token,
      patientName: visit.patientName,
      phone: visit.phone,
      amountPaise,
      description: visit.service?.trim() || "Consultation",
      paid,
      method: paid ? toMethod(visit.paymentMethod) : undefined,
      paidAt: paid ? visit.paidAt || visit.createdAt : undefined,
      receiptId: visit.receiptId || undefined
    });
  }

  return { convert, skip, totalPaise: convert.reduce((sum, action) => sum + action.amountPaise, 0) };
}

/** What a reviewer needs to see first: the cases the plan refuses to decide. */
export function attentionItems(plan: BackfillPlan): BackfillSkip[] {
  return plan.skip.filter((entry) => entry.needsAttention);
}
