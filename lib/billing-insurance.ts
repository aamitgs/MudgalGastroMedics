import "server-only";
import { formatPaise } from "@/lib/billing-calc";
import { getInvoiceById, recordInvoicePayment } from "@/lib/billing-store";
import { listInsuranceClaims, updateInsuranceClaim } from "@/lib/finance-store";
import type { InsuranceClaim } from "@/lib/finance-types";

/**
 * Links insurance claims to the bills they pay (Track 5.11, §19).
 *
 * The claim entity already existed with insurer, TPA, pre-auth status and
 * requested/approved/settled amounts — what was missing was any connection to
 * an actual invoice, so a settled claim never reduced anyone's balance and the
 * two halves of the same money lived in different screens.
 *
 * A settlement is recorded as a real `Insurance` payment on the invoice, for
 * the same reason an advance is (Track 5.5): it *is* a payment, and modelling
 * it as anything else keeps it out of collections, day close and every report.
 */

export type ClaimSettlementInput = {
  claimId: string;
  invoiceId: string;
  /** Rupees settled by the insurer for this bill. */
  amountPaise: number;
  reference?: string;
  actingStaffName: string;
};

/** Claims for a patient that still have approved cover the hospital has not collected. */
export function unsettledCover(claims: InsuranceClaim[]) {
  return claims
    .filter((claim) => claim.status === "Approved" || claim.status === "Submitted")
    .map((claim) => ({ claim, remainingPaise: Math.round((claim.approvedAmount - claim.settledAmount) * 100) }))
    .filter((entry) => entry.remainingPaise > 0);
}

export async function settleClaimAgainstInvoice(
  input: ClaimSettlementInput
): Promise<{ claim: InsuranceClaim; invoiceNo: string; settledPaise: number } | { error: string }> {
  const claims = await listInsuranceClaims();
  const claim = claims.find((entry) => entry.id === input.claimId);
  if (!claim) return { error: "Insurance claim not found." };
  if (claim.status === "Rejected") return { error: "This claim was rejected, so there is nothing to settle." };

  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "Draft") return { error: "Issue this invoice before settling insurance against it." };
  if (invoice.status === "Cancelled") return { error: "This invoice is cancelled." };

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return { error: "Enter a settlement amount greater than zero." };

  const remainingPaise = Math.round((claim.approvedAmount - claim.settledAmount) * 100);
  if (amountPaise > remainingPaise) {
    return { error: `Only ${formatPaise(remainingPaise)} of approved cover remains on this claim.` };
  }
  if (amountPaise > invoice.balancePaise) {
    return { error: `That is more than the ${formatPaise(invoice.balancePaise)} outstanding on this bill.` };
  }

  // The invoice is credited first: if that fails the claim is untouched, which
  // is the safe direction — an over-settled claim would understate what the
  // insurer still owes.
  const payment = await recordInvoicePayment(input.invoiceId, {
    method: "Insurance",
    amountPaise,
    reference: input.reference || claim.claimNumber || claim.id,
    note: `${claim.insurer}${claim.tpa ? ` via ${claim.tpa}` : ""}`,
    actingStaffName: input.actingStaffName
  });
  if ("error" in payment) return payment;

  const settledAmount = claim.settledAmount + amountPaise / 100;
  const updated = await updateInsuranceClaim({
    id: claim.id,
    settledAmount,
    // Fully settled claims close themselves; a part settlement stays open,
    // because the insurer still owes the rest.
    status: settledAmount >= claim.approvedAmount ? "Settled" : claim.status,
    notes: [claim.notes, `Settled ${formatPaise(amountPaise)} against ${invoice.invoiceNo}`].filter(Boolean).join(" · ")
  });
  if (!updated) return { error: "Unable to update the claim." };

  return { claim: updated, invoiceNo: invoice.invoiceNo, settledPaise: amountPaise };
}
