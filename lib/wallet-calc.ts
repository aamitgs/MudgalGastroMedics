import type { WalletTransaction } from "@/lib/wallet-types";

/**
 * Pure wallet arithmetic (Track 5.5). Kept free of persistence so the ledger
 * rules are directly unit-testable, and so the stored balance can always be
 * checked against the entries that produced it.
 */

/** Signed effect of one entry on the balance: deposits add, adjustments and refunds draw down. */
export function transactionDeltaPaise(transaction: Pick<WalletTransaction, "type" | "amountPaise">): number {
  const amount = Math.max(0, Math.round(transaction.amountPaise));
  return transaction.type === "Deposit" ? amount : -amount;
}

/** Re-derives the balance from the ledger — the check that the cached total has not drifted. */
export function deriveWalletBalancePaise(transactions: WalletTransaction[]): number {
  return transactions.reduce((balance, transaction) => balance + transactionDeltaPaise(transaction), 0);
}

/**
 * How much advance can be put toward a bill: never more than the wallet
 * holds, never more than the bill still owes.
 *
 * Capping at the bill's balance is the important half — over-applying would
 * turn an advance into an overpayment on one invoice while the patient's other
 * bills stayed unpaid, which is exactly the confusion a wallet exists to avoid.
 */
export function applicableAdvancePaise(walletBalancePaise: number, invoiceBalancePaise: number): number {
  return Math.max(0, Math.min(Math.round(walletBalancePaise), Math.round(invoiceBalancePaise)));
}

export type WalletSummary = {
  balancePaise: number;
  depositedPaise: number;
  adjustedPaise: number;
  refundedPaise: number;
  transactionCount: number;
};

export function summariseWallet(transactions: WalletTransaction[]): WalletSummary {
  const totalFor = (type: WalletTransaction["type"]) =>
    transactions.filter((entry) => entry.type === type).reduce((sum, entry) => sum + Math.max(0, entry.amountPaise), 0);

  return {
    balancePaise: deriveWalletBalancePaise(transactions),
    depositedPaise: totalFor("Deposit"),
    adjustedPaise: totalFor("Adjustment"),
    refundedPaise: totalFor("Refund"),
    transactionCount: transactions.length
  };
}
