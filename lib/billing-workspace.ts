import { isLiveInvoice, outstandingPaise } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem } from "@/lib/billing-types";

/**
 * The patient-level financial picture behind the unified billing workspace
 * (Track 5.4), plus the duplicate-charge detection of §21.
 *
 * Pure: takes already-fetched records and assembles a view model, so the rules
 * that decide "this looks like a double charge" are unit-testable and identical
 * wherever they run.
 */

export type PaymentHistoryEntry = {
  invoiceId: string;
  invoiceNo: string;
  paymentId: string;
  method: string;
  amountPaise: number;
  reference?: string;
  receivedAt: string;
  receivedBy: string;
};

export type DuplicateWarningKind = "same-source" | "same-day-service" | "duplicate-visit-invoice";

export type DuplicateWarning = {
  kind: DuplicateWarningKind;
  /** What appears to be duplicated, in the words the bill uses. */
  label: string;
  /** Why this fired — alerts must be explainable, never just "duplicate detected". */
  detail: string;
  invoiceNos: string[];
  amountPaise: number;
};

function liveInvoices(invoices: Invoice[]) {
  return invoices.filter((invoice) => isLiveInvoice(invoice));
}

/**
 * Charges that look like they have been billed more than once across a
 * patient's live invoices.
 *
 * Advisory, never blocking (Part 8: warn, don't obstruct) — a patient can
 * legitimately have two endoscopies in a month, and a billing desk that has to
 * fight the software to record that will start working around it. The desk
 * confirms; the system explains.
 */
export function detectDuplicateCharges(invoices: Invoice[]): DuplicateWarning[] {
  const live = liveInvoices(invoices);
  const warnings: DuplicateWarning[] = [];

  // 1. The same originating record billed on two different invoices. The
  //    store already prevents this within one invoice; across invoices it
  //    means the same lab order or dispense got pulled onto two bills.
  const bySourceRef = new Map<string, Array<{ invoice: Invoice; line: InvoiceLineItem }>>();
  for (const invoice of live) {
    for (const line of invoice.lineItems) {
      if (!line.sourceRef) continue;
      const key = `${line.source}:${line.sourceRef}`;
      const bucket = bySourceRef.get(key) ?? [];
      bucket.push({ invoice, line });
      bySourceRef.set(key, bucket);
    }
  }

  for (const [, bucket] of bySourceRef) {
    const distinctInvoices = new Set(bucket.map((entry) => entry.invoice.id));
    if (distinctInvoices.size < 2) continue;
    warnings.push({
      kind: "same-source",
      label: bucket[0].line.description,
      detail: `The same ${bucket[0].line.source.toLowerCase()} record is billed on ${distinctInvoices.size} invoices.`,
      invoiceNos: [...new Set(bucket.map((entry) => entry.invoice.invoiceNo))],
      amountPaise: bucket[0].line.totalPaise
    });
  }

  // 2. The same service billed twice on the same day. Catches hand-entered
  //    charges, which carry no sourceRef and so slip past the check above —
  //    the classic "consultation charged twice" complaint.
  const byDayService = new Map<string, Array<{ invoice: Invoice; line: InvoiceLineItem }>>();
  for (const invoice of live) {
    for (const line of invoice.lineItems) {
      const key = `${line.addedAt.slice(0, 10)}|${line.category.toLowerCase()}|${line.description.trim().toLowerCase()}`;
      const bucket = byDayService.get(key) ?? [];
      bucket.push({ invoice, line });
      byDayService.set(key, bucket);
    }
  }

  for (const [key, bucket] of byDayService) {
    if (bucket.length < 2) continue;
    // Already reported by the stronger sourceRef check — don't warn twice
    // about one thing, which is how staff learn to ignore warnings.
    const refs = bucket.map((entry) => entry.line.sourceRef).filter(Boolean);
    if (refs.length === bucket.length && new Set(refs).size === 1) continue;

    warnings.push({
      kind: "same-day-service",
      label: bucket[0].line.description,
      detail: `Billed ${bucket.length} times on ${key.slice(0, 10)}.`,
      invoiceNos: [...new Set(bucket.map((entry) => entry.invoice.invoiceNo))],
      amountPaise: bucket.reduce((sum, entry) => sum + entry.line.totalPaise, 0)
    });
  }

  // 3. Two live invoices against one visit. The store guards creation, but a
  //    bill raised before that guard existed would still be sitting here.
  const byVisit = new Map<string, Invoice[]>();
  for (const invoice of live) {
    if (!invoice.visitId) continue;
    byVisit.set(invoice.visitId, [...(byVisit.get(invoice.visitId) ?? []), invoice]);
  }

  for (const [, group] of byVisit) {
    if (group.length < 2) continue;
    warnings.push({
      kind: "duplicate-visit-invoice",
      label: "Two open bills for one visit",
      detail: "This visit has more than one live invoice. Cancel whichever is wrong before collecting.",
      invoiceNos: group.map((invoice) => invoice.invoiceNo),
      amountPaise: group.reduce((sum, invoice) => sum + invoice.totalPaise, 0)
    });
  }

  return warnings;
}

/** Every tender the patient has ever paid, newest first — the §30 payment timeline's financial half. */
export function paymentHistory(invoices: Invoice[]): PaymentHistoryEntry[] {
  return liveInvoices(invoices)
    .flatMap((invoice) =>
      invoice.payments.map((payment) => ({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        paymentId: payment.id,
        method: payment.method,
        amountPaise: payment.amountPaise,
        reference: payment.reference,
        receivedAt: payment.receivedAt,
        receivedBy: payment.receivedBy
      }))
    )
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export type BillingTotals = {
  outstandingPaise: number;
  lifetimeBilledPaise: number;
  lifetimeCollectedPaise: number;
  openInvoiceCount: number;
};

export function billingTotals(invoices: Invoice[]): BillingTotals {
  const live = liveInvoices(invoices);
  return {
    outstandingPaise: outstandingPaise(invoices),
    lifetimeBilledPaise: live.filter((invoice) => invoice.status !== "Draft").reduce((sum, invoice) => sum + invoice.totalPaise, 0),
    lifetimeCollectedPaise: live.reduce((sum, invoice) => sum + invoice.paidPaise, 0),
    openInvoiceCount: live.filter((invoice) => invoice.status !== "Draft" && invoice.balancePaise > 0).length
  };
}
