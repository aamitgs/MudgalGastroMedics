import { describe, expect, it } from "vitest";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import { exportVouchers, invoiceVouchers, voucherBalances, voucherCsvRows } from "@/lib/billing-erp-export";
import type { Invoice, InvoiceLineItem, InvoicePayment, InvoiceRefund } from "@/lib/billing-types";

function line(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    id: "LN-1",
    source: "Procedure",
    description: "Upper GI Endoscopy",
    category: "Procedure",
    quantity: 1,
    unitPricePaise: 4_50_000,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 4_50_000,
    addedAt: "2026-07-28T09:00:00.000Z",
    addedBy: "Reception",
    ...overrides
  };
}

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return { id: "PY-1", method: "Cash", amountPaise: 2_00_000, receivedAt: "2026-07-28T10:00:00.000Z", receivedBy: "Reception", ...overrides };
}

function refund(overrides: Partial<InvoiceRefund> = {}): InvoiceRefund {
  return {
    id: "RF-1",
    amountPaise: 50_000,
    method: "Cash",
    reason: "Procedure abandoned",
    refundedAt: "2026-07-28T12:00:00.000Z",
    refundedBy: "Accounts",
    approvalId: "APR-1",
    ...overrides
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return withRecalculatedTotals({
    id: "INV-1",
    invoiceNo: "MGM-INV-20260728-001",
    createdAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-07-28T09:00:00.000Z",
    issuedAt: "2026-07-28T09:00:00.000Z",
    status: "Issued",
    patientName: "Asha Verma",
    phone: "9876543210",
    lineItems: [line()],
    payments: [],
    subtotalPaise: 0,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 0,
    paidPaise: 0,
    refundedPaise: 0,
    balancePaise: 0,
    ...overrides
  });
}

describe("invoiceVouchers", () => {
  it("emits a sales voucher debiting the patient and crediting revenue", () => {
    const [sales] = invoiceVouchers(invoice());
    expect(sales.voucherType).toBe("Sales");
    expect(sales.entries[0]).toMatchObject({ ledger: "Sundry Debtors — Asha Verma", debitPaise: 4_50_000 });
    expect(sales.entries.some((entry) => entry.ledger === "Procedure Income" && entry.creditPaise === 4_50_000)).toBe(true);
  });

  it("groups revenue by category into separate ledgers", () => {
    const mixed = invoice({
      lineItems: [line({ id: "L1" }), line({ id: "L2", category: "Medicines", description: "Pantoprazole", totalPaise: 12_000 })]
    });
    const [sales] = invoiceVouchers(mixed);
    expect(sales.entries.filter((entry) => entry.creditPaise > 0).map((entry) => entry.ledger).sort()).toEqual([
      "Medicines Income",
      "Procedure Income"
    ]);
  });

  // A discount is money given away, not a smaller sale — accountants need it
  // as its own head.
  it("posts a discount to its own expense ledger", () => {
    const discounted = invoice({ discountPaise: 50_000, discountReason: "Senior citizen" });
    const [sales] = invoiceVouchers(discounted);
    expect(sales.entries.some((entry) => entry.ledger === "Discount Allowed" && entry.debitPaise === 50_000)).toBe(true);
  });

  it("emits a receipt voucher per payment, crediting the receivable", () => {
    const vouchers = invoiceVouchers(invoice({ payments: [payment(), payment({ id: "PY-2", method: "UPI", amountPaise: 1_00_000 })] }));
    const receipts = vouchers.filter((voucher) => voucher.voucherType === "Receipt");
    expect(receipts).toHaveLength(2);
    expect(receipts[0].entries[0].ledger).toBe("Cash Account");
    expect(receipts[1].entries[0].ledger).toBe("UPI Account");
  });

  it("emits a credit note for a refund", () => {
    const vouchers = invoiceVouchers(invoice({ payments: [payment()], refunds: [refund()] }));
    const note = vouchers.find((voucher) => voucher.voucherType === "Credit Note");
    expect(note?.narration).toContain("Procedure abandoned");
    expect(note?.entries.some((entry) => entry.ledger === "Cash Account" && entry.creditPaise === 50_000)).toBe(true);
  });

  it("exports nothing for a draft — an unissued bill is not revenue", () => {
    expect(invoiceVouchers(invoice({ status: "Draft" }))).toEqual([]);
  });

  // A reversing entry for a bill that never counted is noise in the books.
  it("exports nothing for a cancelled invoice", () => {
    expect(invoiceVouchers(invoice({ status: "Cancelled" }))).toEqual([]);
  });

  it("uses stable references so a re-export updates rather than duplicates", () => {
    const first = invoiceVouchers(invoice({ payments: [payment()] })).map((voucher) => voucher.reference);
    const second = invoiceVouchers(invoice({ payments: [payment()] })).map((voucher) => voucher.reference);
    expect(second).toEqual(first);
  });
});

describe("voucherBalances", () => {
  it("every emitted voucher balances", () => {
    const vouchers = invoiceVouchers(
      invoice({ discountPaise: 50_000, discountReason: "Senior citizen", payments: [payment()], refunds: [refund()] })
    );
    expect(vouchers.length).toBeGreaterThan(0);
    for (const voucher of vouchers) expect(voucherBalances(voucher)).toBe(true);
  });
});

describe("exportVouchers", () => {
  it("sorts by date then reference so an import is deterministic", () => {
    const older = invoice({ id: "A", invoiceNo: "INV-A", issuedAt: "2026-07-20T09:00:00.000Z" });
    const newer = invoice({ id: "B", invoiceNo: "INV-B", issuedAt: "2026-07-28T09:00:00.000Z" });
    expect(exportVouchers([newer, older]).map((voucher) => voucher.reference)).toEqual(["INV-A", "INV-B"]);
  });

  it("respects a date range", () => {
    const older = invoice({ id: "A", invoiceNo: "INV-A", issuedAt: "2026-07-20T09:00:00.000Z" });
    const newer = invoice({ id: "B", invoiceNo: "INV-B", issuedAt: "2026-07-28T09:00:00.000Z" });
    expect(exportVouchers([older, newer], { from: "2026-07-25", to: "2026-07-31" }).map((v) => v.reference)).toEqual(["INV-B"]);
  });
});

describe("voucherCsvRows", () => {
  it("flattens to one row per ledger entry, in rupees", () => {
    const rows = voucherCsvRows(invoiceVouchers(invoice()));
    expect(rows[0][4]).toBe("Sundry Debtors — Asha Verma");
    expect(rows[0][5]).toBe("4500.00");
    expect(rows[0][6]).toBe("");
  });
});
