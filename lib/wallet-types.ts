import type { InvoicePaymentMethod } from "@/lib/billing-types";

/**
 * The patient advance wallet (Track 5.5, §6) — money taken before it is owed,
 * held against the patient and drawn down as bills are raised.
 *
 * Modelled as an append-only ledger rather than a mutable balance field: a
 * hospital must be able to answer "where did this ₹5,000 go?" months later,
 * and a single number cannot. `balancePaise` on the wallet is a cached running
 * total, and `lib/wallet-calc.ts` can always re-derive it from the entries to
 * prove the two agree.
 *
 * Amounts are integer paise, as everywhere in the billing module.
 */

export type WalletTransactionType = "Deposit" | "Adjustment" | "Refund";

export type WalletTransaction = {
  id: string;
  createdAt: string;
  type: WalletTransactionType;
  /** Always positive — `type` carries the direction, so no entry is ambiguous. */
  amountPaise: number;
  /** How the money physically moved, for Deposit and Refund. Adjustments move nothing. */
  method?: InvoicePaymentMethod;
  reference?: string;
  /** Set on an Adjustment: which bill the advance was drawn down against. */
  invoiceId?: string;
  invoiceNo?: string;
  /** Mandatory on a Refund — money leaving the hospital always states why. */
  reason?: string;
  note?: string;
  recordedBy: string;
  /** Running balance immediately after this entry, so a statement never has to be re-derived to be read. */
  balanceAfterPaise: number;
};

export type PatientWallet = {
  id: string;
  /** Normalised phone — the same key patient lookups use across the app. */
  patientKey: string;
  patientName: string;
  phone: string;
  uhid?: string;
  patientId?: string;
  createdAt: string;
  updatedAt: string;
  balancePaise: number;
  transactions: WalletTransaction[];
};

export const walletTransactionTypes: WalletTransactionType[] = ["Deposit", "Adjustment", "Refund"];
