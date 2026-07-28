import { isLiveInvoice } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";

/**
 * Accounting export (Track 5.11, §30 "ERP Integration Ready").
 *
 * Emits **double-entry vouchers**, not a flat invoice dump. Tally, Busy, Zoho
 * Books, SAP and Oracle all disagree about field names and import formats, but
 * they all agree about debits and credits — so the durable thing to export is
 * the accounting shape, which any of them can be mapped onto without this
 * module knowing which one.
 *
 * Pure and unit-testable: an export that silently drops a voucher is a
 * reconciliation failure discovered weeks later by an accountant.
 */

export type VoucherType = "Sales" | "Receipt" | "Credit Note";

export type VoucherEntry = {
  /** Ledger name in accounting terms, not billing terms. */
  ledger: string;
  debitPaise: number;
  creditPaise: number;
};

export type Voucher = {
  voucherType: VoucherType;
  /** Stable reference so a re-export updates rather than duplicates. */
  reference: string;
  date: string;
  party: string;
  narration: string;
  entries: VoucherEntry[];
};

/** Revenue ledger for a charge category, so an accountant sees "Procedure Income" rather than "Procedure". */
function incomeLedger(category: string) {
  return `${category} Income`;
}

/**
 * One sales voucher per issued invoice, plus a receipt voucher per payment and
 * a credit note per refund.
 *
 * Cancelled invoices are excluded entirely — they were never revenue, and a
 * reversing entry for a bill that never counted would be noise in the books.
 */
export function invoiceVouchers(invoice: Invoice): Voucher[] {
  if (!isLiveInvoice(invoice) || invoice.status === "Draft") return [];

  const vouchers: Voucher[] = [];
  const date = (invoice.issuedAt || invoice.createdAt).slice(0, 10);

  // Sales: debit the patient (a receivable), credit each revenue head.
  const incomeByLedger = new Map<string, number>();
  for (const line of invoice.lineItems) {
    const ledger = incomeLedger(line.category || "Other");
    incomeByLedger.set(ledger, (incomeByLedger.get(ledger) ?? 0) + line.totalPaise);
  }

  const salesEntries: VoucherEntry[] = [{ ledger: `Sundry Debtors — ${invoice.patientName}`, debitPaise: invoice.totalPaise, creditPaise: 0 }];
  for (const [ledger, amountPaise] of incomeByLedger) {
    salesEntries.push({ ledger, debitPaise: 0, creditPaise: amountPaise });
  }
  // A discount is a real expense head, not a smaller sale — accountants need
  // to see what was given away.
  if (invoice.discountPaise > 0) {
    salesEntries.push({ ledger: "Discount Allowed", debitPaise: invoice.discountPaise, creditPaise: 0 });
  }

  vouchers.push({
    voucherType: "Sales",
    reference: invoice.invoiceNo,
    date,
    party: invoice.patientName,
    narration: `Invoice ${invoice.invoiceNo}${invoice.department ? ` · ${invoice.department}` : ""}`,
    entries: salesEntries
  });

  for (const payment of invoice.payments) {
    vouchers.push({
      voucherType: "Receipt",
      reference: `${invoice.invoiceNo}/R/${payment.id}`,
      date: payment.receivedAt.slice(0, 10),
      party: invoice.patientName,
      narration: `${payment.method} against ${invoice.invoiceNo}${payment.reference ? ` · ${payment.reference}` : ""}`,
      entries: [
        { ledger: `${payment.method} Account`, debitPaise: payment.amountPaise, creditPaise: 0 },
        { ledger: `Sundry Debtors — ${invoice.patientName}`, debitPaise: 0, creditPaise: payment.amountPaise }
      ]
    });
  }

  for (const refund of invoice.refunds ?? []) {
    vouchers.push({
      voucherType: "Credit Note",
      reference: `${invoice.invoiceNo}/CN/${refund.id}`,
      date: refund.refundedAt.slice(0, 10),
      party: invoice.patientName,
      narration: `Refund against ${invoice.invoiceNo} — ${refund.reason}`,
      entries: [
        { ledger: `Sundry Debtors — ${invoice.patientName}`, debitPaise: refund.amountPaise, creditPaise: 0 },
        { ledger: `${refund.method} Account`, debitPaise: 0, creditPaise: refund.amountPaise }
      ]
    });
  }

  return vouchers;
}

export function exportVouchers(invoices: Invoice[], range?: { from: string; to: string }): Voucher[] {
  return invoices
    .flatMap(invoiceVouchers)
    .filter((voucher) => !range || (voucher.date >= range.from && voucher.date <= range.to))
    .sort((a, b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
}

/** Every voucher must balance. Exposed so an export can assert it rather than trusting it. */
export function voucherBalances(voucher: Voucher): boolean {
  const debit = voucher.entries.reduce((sum, entry) => sum + entry.debitPaise, 0);
  const credit = voucher.entries.reduce((sum, entry) => sum + entry.creditPaise, 0);
  return debit === credit;
}

export const voucherCsvHeaders = ["Date", "Voucher Type", "Reference", "Party", "Ledger", "Debit", "Credit", "Narration"];

/** Flat CSV rows — the shape every accounting package can import, whatever else it wants. */
export function voucherCsvRows(vouchers: Voucher[]): string[][] {
  return vouchers.flatMap((voucher) =>
    voucher.entries.map((entry) => [
      voucher.date,
      voucher.voucherType,
      voucher.reference,
      voucher.party,
      entry.ledger,
      entry.debitPaise ? (entry.debitPaise / 100).toFixed(2) : "",
      entry.creditPaise ? (entry.creditPaise / 100).toFixed(2) : "",
      voucher.narration
    ])
  );
}
