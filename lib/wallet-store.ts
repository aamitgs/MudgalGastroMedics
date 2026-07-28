import "server-only";
import { formatPaise } from "@/lib/billing-calc";
import { getInvoiceById, recordInvoicePayment } from "@/lib/billing-store";
import type { InvoicePaymentMethod } from "@/lib/billing-types";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { applicableAdvancePaise, deriveWalletBalancePaise } from "@/lib/wallet-calc";
import type { PatientWallet, WalletTransaction, WalletTransactionType } from "@/lib/wallet-types";

type WalletStore = {
  wallets: PatientWallet[];
};

const docStore = createDocumentStore<WalletStore>("patient-wallets", (parsed) => {
  const doc = parsed as Partial<WalletStore> | undefined;
  return { wallets: Array.isArray(doc?.wallets) ? (doc.wallets as WalletStore["wallets"]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function walletKey(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function listWallets() {
  return (await docStore.load()).wallets;
}

export async function getWallet(phone: string): Promise<PatientWallet | null> {
  const key = walletKey(phone);
  if (key.length < 6) return null;
  return (await docStore.load()).wallets.find((wallet) => wallet.patientKey === key) ?? null;
}

/** Balance only, for callers that just need the number (patient summary, workspace). */
export async function walletBalancePaise(phone: string) {
  return (await getWallet(phone))?.balancePaise ?? 0;
}

type LedgerEntry = {
  type: WalletTransactionType;
  amountPaise: number;
  method?: InvoicePaymentMethod;
  reference?: string;
  invoiceId?: string;
  invoiceNo?: string;
  reason?: string;
  note?: string;
  recordedBy: string;
};

/**
 * Appends one entry and updates the cached balance. The running balance is
 * stamped onto the entry itself so a statement reads without recomputation,
 * and `deriveWalletBalancePaise` can always audit the cached total against it.
 */
function appendEntry(wallet: PatientWallet, entry: LedgerEntry): WalletTransaction {
  const amountPaise = Math.max(0, Math.round(entry.amountPaise));
  const delta = entry.type === "Deposit" ? amountPaise : -amountPaise;
  const balanceAfterPaise = wallet.balancePaise + delta;

  const transaction: WalletTransaction = {
    id: generateId("WLT"),
    createdAt: new Date().toISOString(),
    type: entry.type,
    amountPaise,
    method: entry.method,
    reference: normalizeText(entry.reference) || undefined,
    invoiceId: entry.invoiceId,
    invoiceNo: entry.invoiceNo,
    reason: normalizeText(entry.reason) || undefined,
    note: normalizeText(entry.note) || undefined,
    recordedBy: normalizeText(entry.recordedBy) || "Unknown",
    balanceAfterPaise
  };

  wallet.transactions.unshift(transaction);
  wallet.balancePaise = balanceAfterPaise;
  wallet.updatedAt = transaction.createdAt;
  return transaction;
}

export type DepositInput = {
  phone: string;
  patientName: string;
  uhid?: string;
  patientId?: string;
  amountPaise: number;
  method: InvoicePaymentMethod;
  reference?: string;
  note?: string;
  actingStaffName: string;
};

/** Takes money before it is owed. Creates the wallet on first deposit — there is no separate "open a wallet" step to forget. */
export async function depositToWallet(input: DepositInput): Promise<{ wallet: PatientWallet; transaction: WalletTransaction } | { error: string }> {
  const key = walletKey(input.phone);
  if (key.length < 6) return { error: "A valid patient phone number is required." };

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return { error: "Enter a deposit amount greater than zero." };

  const doc = await docStore.load();
  let wallet = doc.wallets.find((entry) => entry.patientKey === key);

  if (!wallet) {
    const now = new Date().toISOString();
    wallet = {
      id: generateId("WAL"),
      patientKey: key,
      patientName: normalizeText(input.patientName) || "Unknown",
      phone: normalizeText(input.phone),
      uhid: normalizeText(input.uhid) || undefined,
      patientId: normalizeText(input.patientId) || undefined,
      createdAt: now,
      updatedAt: now,
      balancePaise: 0,
      transactions: []
    };
    doc.wallets.unshift(wallet);
  }

  const transaction = appendEntry(wallet, {
    type: "Deposit",
    amountPaise,
    method: input.method,
    reference: input.reference,
    note: input.note,
    recordedBy: input.actingStaffName
  });

  await docStore.save(doc);
  return { wallet, transaction };
}

/**
 * Draws advance down against a bill (§30 advance adjustment).
 *
 * Implemented as a real `Wallet` payment on the invoice rather than a special
 * case, so totals, status, the legacy OPD write-through and the payment
 * history all behave exactly as they do for cash — an advance that settles a
 * bill is a payment, and modelling it as anything else would leave it out of
 * every report that matters.
 *
 * The invoice write happens first: if it fails the wallet is never debited,
 * which is the safe direction to fail in.
 */
export async function applyAdvanceToInvoice(input: {
  invoiceId: string;
  /** Omitted means "as much as helps" — the lesser of the wallet balance and what the bill still owes. */
  amountPaise?: number;
  /**
   * Whose wallet to draw from. Defaults to the invoice's own patient; a
   * different phone is only ever passed by the family-billing path
   * (Track 5.11), which checks the two are in the same family first.
   */
  fromPhone?: string;
  actingStaffName: string;
}): Promise<{ wallet: PatientWallet; transaction: WalletTransaction; appliedPaise: number } | { error: string }> {
  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) return { error: "Invoice not found." };

  const wallet = await getWallet(input.fromPhone || invoice.phone);
  if (!wallet || wallet.balancePaise <= 0) return { error: "This patient has no advance balance to apply." };
  if (invoice.status === "Draft") return { error: "Issue this invoice before applying an advance to it." };
  if (invoice.status === "Cancelled") return { error: "This invoice is cancelled." };
  if (invoice.balancePaise <= 0) return { error: "This invoice is already settled." };

  const requested = input.amountPaise === undefined ? wallet.balancePaise : Math.round(input.amountPaise);
  const appliedPaise = applicableAdvancePaise(Math.min(wallet.balancePaise, requested), invoice.balancePaise);
  if (appliedPaise <= 0) return { error: "Enter an amount greater than zero." };
  if (requested > wallet.balancePaise) {
    return { error: `Only ${formatPaise(wallet.balancePaise)} of advance is available.` };
  }

  const payment = await recordInvoicePayment(input.invoiceId, {
    method: "Wallet",
    amountPaise: appliedPaise,
    reference: wallet.id,
    note: "Advance adjustment",
    actingStaffName: input.actingStaffName
  });
  if ("error" in payment) return payment;

  const doc = await docStore.load();
  const stored = doc.wallets.find((entry) => entry.patientKey === wallet.patientKey);
  if (!stored) return { error: "Wallet not found." };

  const transaction = appendEntry(stored, {
    type: "Adjustment",
    amountPaise: appliedPaise,
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    note:
      input.fromPhone && input.fromPhone.replace(/\D/g, "") !== invoice.phone.replace(/\D/g, "")
        ? `Applied to ${invoice.invoiceNo} for ${invoice.patientName}`
        : `Applied to ${invoice.invoiceNo}`,
    recordedBy: input.actingStaffName
  });

  await docStore.save(doc);
  return { wallet: stored, transaction, appliedPaise };
}

/** Returns unused advance. Money leaving the hospital always carries a reason and an actor. */
export async function refundWalletBalance(input: {
  phone: string;
  amountPaise: number;
  method: InvoicePaymentMethod;
  reason: string;
  reference?: string;
  actingStaffName: string;
}): Promise<{ wallet: PatientWallet; transaction: WalletTransaction } | { error: string }> {
  const reason = normalizeText(input.reason);
  if (!reason) return { error: "A refund reason is required." };

  const doc = await docStore.load();
  const key = walletKey(input.phone);
  const wallet = doc.wallets.find((entry) => entry.patientKey === key);
  if (!wallet) return { error: "This patient has no advance wallet." };

  const amountPaise = Math.round(input.amountPaise);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return { error: "Enter a refund amount greater than zero." };
  if (amountPaise > wallet.balancePaise) {
    return { error: `Only ${formatPaise(wallet.balancePaise)} of advance remains.` };
  }

  const transaction = appendEntry(wallet, {
    type: "Refund",
    amountPaise,
    method: input.method,
    reference: input.reference,
    reason,
    recordedBy: input.actingStaffName
  });

  await docStore.save(doc);
  return { wallet, transaction };
}

/**
 * Whether the cached balance still matches the ledger behind it. Exposed so a
 * reconciliation check can assert it rather than trusting the cached number.
 */
export async function walletReconciles(phone: string) {
  const wallet = await getWallet(phone);
  if (!wallet) return true;
  return wallet.balancePaise === deriveWalletBalancePaise(wallet.transactions);
}
