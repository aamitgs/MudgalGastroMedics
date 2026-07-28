import { describe, expect, it } from "vitest";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem, InvoicePayment } from "@/lib/billing-types";
import { invoiceExportRow, invoiceStats, queryInvoices } from "@/lib/invoice-query";

function line(totalPaise: number): InvoiceLineItem {
  return {
    id: `LN-${totalPaise}`,
    source: "OPD",
    description: "Consultation",
    category: "Consultation",
    quantity: 1,
    unitPricePaise: totalPaise,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise,
    addedAt: "2026-07-27T00:00:00.000Z",
    addedBy: "Reception"
  };
}

function payment(amountPaise: number, receivedAt: string): InvoicePayment {
  return { id: `PY-${amountPaise}-${receivedAt}`, method: "Cash", amountPaise, receivedAt, receivedBy: "Reception" };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return withRecalculatedTotals({
    id: "INV-1",
    invoiceNo: "MGM-INV-20260727-001",
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
    status: "Issued",
    patientName: "Asha Verma",
    phone: "9876543210",
    lineItems: [line(50_000)],
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

const ledger: Invoice[] = [
  invoice({ id: "I1", invoiceNo: "MGM-INV-20260727-001", patientName: "Charlie", uhid: "MGM-2026-00001", createdAt: "2026-07-25T09:00:00.000Z" }),
  invoice({
    id: "I2",
    invoiceNo: "MGM-INV-20260727-002",
    patientName: "Alice",
    phone: "9123456789",
    lineItems: [line(2_00_000)],
    payments: [payment(50_000, "2026-07-27T10:00:00.000Z")],
    status: "Partially Paid",
    createdAt: "2026-07-26T09:00:00.000Z"
  }),
  invoice({
    id: "I3",
    invoiceNo: "MGM-INV-20260727-003",
    patientName: "Bob",
    lineItems: [line(1_00_000)],
    payments: [payment(1_00_000, "2026-07-27T11:00:00.000Z")],
    status: "Paid",
    createdAt: "2026-07-27T09:00:00.000Z"
  }),
  invoice({ id: "I4", invoiceNo: "MGM-INV-20260727-004", patientName: "Dev", status: "Draft", createdAt: "2026-07-27T10:00:00.000Z" }),
  invoice({ id: "I5", invoiceNo: "MGM-INV-20260727-005", patientName: "Esha", status: "Cancelled", createdAt: "2026-07-27T11:00:00.000Z" })
];

describe("queryInvoices", () => {
  it("paginates and reports total/pageCount", () => {
    const result = queryInvoices(ledger, { page: 0, pageSize: 2 });
    expect(result.invoices).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.pageCount).toBe(3);
  });

  it("clamps a page index past the end instead of returning nothing", () => {
    const result = queryInvoices(ledger, { page: 99, pageSize: 2 });
    expect(result.page).toBe(2);
    expect(result.invoices).toHaveLength(1);
  });

  it("caps page size so one request can't ask for the whole ledger", () => {
    expect(queryInvoices(ledger, { page: 0, pageSize: 5000 }).pageSize).toBe(100);
  });

  it("filters by status", () => {
    const result = queryInvoices(ledger, { page: 0, pageSize: 25, status: "Paid" });
    expect(result.invoices.map((i) => i.id)).toEqual(["I3"]);
  });

  it("outstandingOnly excludes settled, draft and cancelled invoices", () => {
    const result = queryInvoices(ledger, { page: 0, pageSize: 25, outstandingOnly: true });
    expect(result.invoices.map((i) => i.id).sort()).toEqual(["I1", "I2"]);
  });

  it("searches invoice number, patient, UHID and phone — whichever the patient volunteers", () => {
    expect(queryInvoices(ledger, { page: 0, pageSize: 25, query: "20260727-002" }).invoices.map((i) => i.id)).toEqual(["I2"]);
    expect(queryInvoices(ledger, { page: 0, pageSize: 25, query: "alice" }).invoices.map((i) => i.id)).toEqual(["I2"]);
    expect(queryInvoices(ledger, { page: 0, pageSize: 25, query: "MGM-2026-00001" }).invoices.map((i) => i.id)).toEqual(["I1"]);
    expect(queryInvoices(ledger, { page: 0, pageSize: 25, query: "9123456789" }).invoices.map((i) => i.id)).toEqual(["I2"]);
  });

  it("defaults to newest first", () => {
    expect(queryInvoices(ledger, { page: 0, pageSize: 25 }).invoices[0].id).toBe("I5");
  });

  it("sorts numerically on money fields, not lexically", () => {
    const byBalance = queryInvoices(ledger, { page: 0, pageSize: 25, sortBy: "balancePaise", sortDir: "desc" });
    expect(byBalance.invoices[0].balancePaise).toBe(1_50_000);
  });

  it("sorts by patient name", () => {
    const result = queryInvoices(ledger, { page: 0, pageSize: 25, sortBy: "patientName", sortDir: "asc" });
    expect(result.invoices[0].patientName).toBe("Alice");
  });
});

describe("invoiceStats", () => {
  const stats = invoiceStats(ledger, "2026-07-27");

  it("counts outstanding across issued and part-paid bills only", () => {
    // I1 owes 500, I2 owes 1500. I3 settled, I4 draft, I5 cancelled.
    expect(stats.outstandingPaise).toBe(2_00_000);
    expect(stats.awaitingPaymentCount).toBe(2);
  });

  it("sums today's collections across every tender", () => {
    expect(stats.collectedTodayPaise).toBe(1_50_000);
  });

  it("excludes payments taken on another day", () => {
    expect(invoiceStats(ledger, "2026-07-28").collectedTodayPaise).toBe(0);
  });

  it("counts drafts separately — an unissued bill is not yet money owed", () => {
    expect(stats.draftCount).toBe(1);
  });

  it("ignores cancelled invoices entirely", () => {
    const withBigCancelled = [...ledger, invoice({ id: "I6", status: "Cancelled", lineItems: [line(99_00_000)] })];
    expect(invoiceStats(withBigCancelled, "2026-07-27").outstandingPaise).toBe(stats.outstandingPaise);
  });
});

describe("invoiceExportRow", () => {
  it("exports money as rupees, not paise, for spreadsheet readers", () => {
    const row = invoiceExportRow(ledger[1]);
    expect(row).toContain("Rs. 2,000");
    expect(row).toContain("Rs. 500");
    expect(row).toContain("Rs. 1,500");
  });
});
