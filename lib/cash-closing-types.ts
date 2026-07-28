import type { InvoicePaymentMethod } from "@/lib/billing-types";

/**
 * Daily cash closing (Track 5.10, §24).
 *
 * The point of a day close is to compare two independently produced numbers:
 * what the ledger says was collected, and what the drawer actually holds. So
 * `expected` is always **derived** from the invoice ledger and never entered,
 * while `counted` is always **entered** and never derived. A close where one
 * is copied from the other proves nothing.
 *
 * A mismatch does not block the close — the money is already whatever it is,
 * and a desk that cannot close its till will start not closing it. It requires
 * a supervisor to sign off, which is the control that actually works.
 */

export type CashClosingStatus = "Open" | "Closed" | "Awaiting Approval";

export type TenderCount = {
  method: InvoicePaymentMethod;
  /** From the ledger: payments received that day less refunds paid back on it. */
  expectedPaise: number;
  /** What the person closing actually counted or reconciled. */
  countedPaise: number;
};

export type CashClosing = {
  id: string;
  /** The business date being closed, `YYYY-MM-DD`. One close per date. */
  date: string;
  createdAt: string;
  updatedAt: string;
  status: CashClosingStatus;
  /** Cash carried into the drawer at the start of the day. */
  openingCashPaise: number;
  tenders: TenderCount[];
  /** Derived: opening + counted cash movement. What should be handed over. */
  closingCashPaise: number;
  /** counted − expected, across all tenders. Negative means short. */
  differencePaise: number;
  /** Context for the day, taken from the ledger rather than typed. */
  refundedPaise: number;
  discountedPaise: number;
  notes?: string;
  closedBy?: string;
  closedAt?: string;
  /** Required only when the day did not reconcile. */
  approvedBy?: string;
  approvedAt?: string;
  approvalNote?: string;
};

export const cashClosingStatuses: CashClosingStatus[] = ["Open", "Closed", "Awaiting Approval"];

/** Tenders a day close accounts for. Wallet is excluded: it moves no money at close — an advance was already banked when it was taken. */
export const closingTenders: InvoicePaymentMethod[] = ["Cash", "UPI", "Card", "Net Banking", "Cheque", "Insurance", "Other"];
