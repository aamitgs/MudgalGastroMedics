import { collectionTotals, discountReport } from "@/lib/billing-analytics";
import type { Invoice } from "@/lib/billing-types";
import type { CashClosing, CashClosingStatus, TenderCount } from "@/lib/cash-closing-types";
import { closingTenders } from "@/lib/cash-closing-types";

/**
 * Pure day-close arithmetic (Track 5.10, §24). Kept free of persistence so the
 * reconciliation rules — the whole point of a close — are directly testable.
 */

/** What the ledger says each tender took on a date. Always derived; never typed by the person closing. */
export function expectedTenders(invoices: Invoice[], date: string): TenderCount[] {
  const totals = collectionTotals(invoices, { from: date, to: date });
  return closingTenders.map((method) => ({ method, expectedPaise: totals.byTender[method] ?? 0, countedPaise: 0 }));
}

export type ClosingTotals = {
  expectedPaise: number;
  countedPaise: number;
  differencePaise: number;
  closingCashPaise: number;
  reconciled: boolean;
};

/**
 * Totals for a close.
 *
 * `closingCashPaise` is opening cash plus the cash actually counted as taken —
 * what should physically be handed over — and deliberately uses the counted
 * figure, not the expected one, because it describes the drawer rather than
 * the ledger.
 */
export function closingTotals(openingCashPaise: number, tenders: TenderCount[]): ClosingTotals {
  const expectedPaise = tenders.reduce((sum, tender) => sum + tender.expectedPaise, 0);
  const countedPaise = tenders.reduce((sum, tender) => sum + tender.countedPaise, 0);
  const countedCash = tenders.find((tender) => tender.method === "Cash")?.countedPaise ?? 0;
  const differencePaise = countedPaise - expectedPaise;

  return {
    expectedPaise,
    countedPaise,
    differencePaise,
    closingCashPaise: openingCashPaise + countedCash,
    reconciled: differencePaise === 0
  };
}

/** Per-tender variances, so a discrepancy points at which till to recount rather than just "the day is short". */
export function tenderVariances(tenders: TenderCount[]) {
  return tenders
    .map((tender) => ({ ...tender, differencePaise: tender.countedPaise - tender.expectedPaise }))
    .filter((tender) => tender.differencePaise !== 0);
}

/**
 * Where a close lands when it is submitted.
 *
 * A reconciled day closes outright. A day that does not reconcile is not
 * blocked — the money is already whatever it is — but it cannot reach Closed
 * without a supervisor, which is the control that actually works.
 */
export function statusAfterClose(differencePaise: number): CashClosingStatus {
  return differencePaise === 0 ? "Closed" : "Awaiting Approval";
}

export function requiresApproval(closing: Pick<CashClosing, "differencePaise">): boolean {
  return closing.differencePaise !== 0;
}

/** Discounts given on a date — context for the close, taken from the ledger rather than typed. */
export function discountedOnDate(invoices: Invoice[], date: string): number {
  return discountReport(invoices, { from: date, to: date }).reduce((sum, entry) => sum + entry.amountPaise, 0);
}
