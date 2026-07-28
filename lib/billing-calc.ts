import type { Invoice, InvoiceLineItem, InvoicePayment, InvoiceRefund, InvoiceStatus } from "@/lib/billing-types";

/**
 * Pure money arithmetic for the invoice entity (Track 5.0) — deliberately free
 * of persistence so the totals rules are directly unit-testable, and so the
 * same maths runs on the server and in any future client-side preview.
 *
 * Every amount here is integer paise; see lib/billing-types.ts for why.
 */

/**
 * Parses a rupee amount from either a number or the free-text strings the
 * legacy OPD `estimatedAmount` field holds ("Rs. 1,500", "1500/-", "1500.50").
 * Anything unparseable is 0 rather than NaN — a bill line silently becoming
 * NaN would corrupt every total downstream of it.
 */
export function rupeesToPaise(value: string | number | undefined | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) : 0;
  // Match the first numeric token rather than stripping non-digits, so the "."
  // in a "Rs." prefix can't be read as a decimal point — stripping turns
  // "Rs. 1,500" into ".1500", i.e. fifteen paise.
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

/** Plain rupee string for the legacy `estimatedAmount` field — no symbol, no separators, since `amountValue()` strips them anyway. */
export function paiseToRupeeString(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

/** Display formatting for staff surfaces — matches the existing "Rs. 1,500" convention in the billing table. */
export function formatPaise(paise: number): string {
  const negative = paise < 0;
  const rupees = Math.abs(paise) / 100;
  const body = Number.isInteger(rupees)
    ? rupees.toLocaleString("en-IN")
    : rupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${negative ? "-" : ""}Rs. ${body}`;
}

/** A line's own total: quantity × unit price, less its discount, plus its tax. Never negative. */
export function lineTotalPaise(line: Pick<InvoiceLineItem, "quantity" | "unitPricePaise" | "discountPaise" | "taxPaise">): number {
  const gross = Math.round(line.quantity * line.unitPricePaise);
  return Math.max(0, gross - line.discountPaise + line.taxPaise);
}

export type InvoiceTotals = {
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  paidPaise: number;
  refundedPaise: number;
  balancePaise: number;
  status: InvoiceStatus;
};

/**
 * Derives an invoice's status from what has actually been paid.
 *
 * Cancelled and Draft are never entered or left implicitly: cancellation is an
 * explicit, approved action, and issuing a bill is a deliberate step the
 * billing executive takes after verifying the auto-generated lines. Only the
 * Issued → Partially Paid → Paid progression is money-driven.
 */
export function deriveInvoiceStatus(current: InvoiceStatus, totalPaise: number, paidPaise: number): InvoiceStatus {
  if (current === "Cancelled" || current === "Draft") return current;
  if (paidPaise <= 0) return "Issued";
  if (paidPaise >= totalPaise) return "Paid";
  return "Partially Paid";
}

/**
 * Recomputes every derived money field on an invoice. Callers mutate line
 * items / payments / the invoice-level discount and then run this — totals are
 * never maintained incrementally, so a bad increment can't drift a bill.
 *
 * `balancePaise` is allowed to go negative so an overpayment stays visible as
 * a refund due rather than silently vanishing at zero.
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  payments: InvoicePayment[],
  invoiceDiscountPaise: number,
  currentStatus: InvoiceStatus,
  refunds: InvoiceRefund[] = []
): InvoiceTotals {
  const subtotalPaise = lineItems.reduce((sum, line) => sum + line.totalPaise, 0);
  const taxPaise = lineItems.reduce((sum, line) => sum + line.taxPaise, 0);
  const totalPaise = Math.max(0, subtotalPaise - Math.max(0, invoiceDiscountPaise));
  const collectedPaise = payments.reduce((sum, payment) => sum + payment.amountPaise, 0);
  const refundedPaise = refunds.reduce((sum, refund) => sum + refund.amountPaise, 0);
  // Refunding money re-opens the balance it had settled: the bill is owed
  // again, which is the honest position and what the collection desk must see.
  const paidPaise = collectedPaise - refundedPaise;

  return {
    subtotalPaise,
    taxPaise,
    totalPaise,
    paidPaise,
    refundedPaise,
    balancePaise: totalPaise - paidPaise,
    status: deriveInvoiceStatus(currentStatus, totalPaise, paidPaise)
  };
}

/** Applies freshly calculated totals back onto an invoice, leaving every other field untouched. */
export function withRecalculatedTotals(invoice: Invoice): Invoice {
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.payments, invoice.discountPaise, invoice.status, invoice.refunds ?? []);
  return { ...invoice, ...totals };
}

/**
 * Cancelled invoices carry no money: they must not count toward outstanding,
 * revenue or collections anywhere. Centralised here so every consumer applies
 * the same rule.
 */
export function isLiveInvoice(invoice: Pick<Invoice, "status">): boolean {
  return invoice.status !== "Cancelled";
}

/** What a patient still owes across a set of invoices — drafts excluded, since an unissued bill is not yet a demand for payment. */
export function outstandingPaise(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => isLiveInvoice(invoice) && invoice.status !== "Draft")
    .reduce((sum, invoice) => sum + Math.max(0, invoice.balancePaise), 0);
}
