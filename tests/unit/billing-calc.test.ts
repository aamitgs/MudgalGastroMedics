import { describe, expect, it } from "vitest";
import {
  calculateInvoiceTotals,
  deriveInvoiceStatus,
  formatPaise,
  lineTotalPaise,
  outstandingPaise,
  paiseToRupeeString,
  rupeesToPaise,
  withRecalculatedTotals
} from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem, InvoicePayment } from "@/lib/billing-types";

function line(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  const base = {
    id: "LN-1",
    source: "OPD" as const,
    description: "Consultation",
    category: "Consultation",
    quantity: 1,
    unitPricePaise: 50_000,
    discountPaise: 0,
    taxPaise: 0,
    addedAt: "2026-07-27T00:00:00.000Z",
    addedBy: "Reception",
    ...overrides
  };
  return { ...base, totalPaise: overrides.totalPaise ?? lineTotalPaise(base) };
}

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return {
    id: "PY-1",
    method: "Cash",
    amountPaise: 50_000,
    receivedAt: "2026-07-27T00:00:00.000Z",
    receivedBy: "Reception",
    ...overrides
  };
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

describe("rupeesToPaise", () => {
  it("converts numbers and plain strings", () => {
    expect(rupeesToPaise(500)).toBe(50_000);
    expect(rupeesToPaise("500")).toBe(50_000);
    expect(rupeesToPaise("1500.50")).toBe(150_050);
  });

  it("parses the formatted free text the legacy estimatedAmount field holds", () => {
    expect(rupeesToPaise("Rs. 1,500")).toBe(150_000);
    expect(rupeesToPaise("1500/-")).toBe(150_000);
  });

  it("falls back to 0 rather than NaN, so one bad line can't corrupt a bill total", () => {
    expect(rupeesToPaise(undefined)).toBe(0);
    expect(rupeesToPaise("")).toBe(0);
    expect(rupeesToPaise("abc")).toBe(0);
    expect(rupeesToPaise(Number.NaN)).toBe(0);
  });

  it("round-trips through the legacy rupee string format", () => {
    expect(paiseToRupeeString(rupeesToPaise("1500"))).toBe("1500");
    expect(paiseToRupeeString(rupeesToPaise("1500.50"))).toBe("1500.50");
  });
});

describe("formatPaise", () => {
  it("uses the Indian grouping the billing table already shows", () => {
    expect(formatPaise(150_000)).toBe("Rs. 1,500");
    expect(formatPaise(12_50_000)).toBe("Rs. 12,500");
    expect(formatPaise(150_050)).toBe("Rs. 1,500.50");
  });

  it("keeps a negative (over-collected) amount visible", () => {
    expect(formatPaise(-50_000)).toBe("-Rs. 500");
  });
});

describe("lineTotalPaise", () => {
  it("multiplies quantity by unit price, then applies the line discount and tax", () => {
    expect(lineTotalPaise({ quantity: 3, unitPricePaise: 20_000, discountPaise: 10_000, taxPaise: 5_000 })).toBe(55_000);
  });

  it("never goes negative when a discount exceeds the line value", () => {
    expect(lineTotalPaise({ quantity: 1, unitPricePaise: 10_000, discountPaise: 99_000, taxPaise: 0 })).toBe(0);
  });
});

describe("calculateInvoiceTotals", () => {
  const lines = [line({ id: "LN-1", unitPricePaise: 50_000 }), line({ id: "LN-2", description: "Endoscopy", quantity: 1, unitPricePaise: 4_50_000 })];

  it("sums line totals and applies the invoice-level discount", () => {
    const totals = calculateInvoiceTotals(lines, [], 50_000, "Issued");
    expect(totals.subtotalPaise).toBe(5_00_000);
    expect(totals.totalPaise).toBe(4_50_000);
    expect(totals.balancePaise).toBe(4_50_000);
    expect(totals.status).toBe("Issued");
  });

  it("sums a split payment across tenders and marks the bill paid only when it clears", () => {
    const split = [
      payment({ id: "PY-1", method: "Cash", amountPaise: 50_000 }),
      payment({ id: "PY-2", method: "UPI", amountPaise: 1_00_000 }),
      payment({ id: "PY-3", method: "Card", amountPaise: 50_000 })
    ];

    const partial = calculateInvoiceTotals(lines, split, 0, "Issued");
    expect(partial.paidPaise).toBe(2_00_000);
    expect(partial.balancePaise).toBe(3_00_000);
    expect(partial.status).toBe("Partially Paid");

    const cleared = calculateInvoiceTotals(lines, [...split, payment({ id: "PY-4", method: "UPI", amountPaise: 3_00_000 })], 0, "Issued");
    expect(cleared.balancePaise).toBe(0);
    expect(cleared.status).toBe("Paid");
  });

  it("keeps an overpayment visible as a negative balance instead of clamping it away", () => {
    const totals = calculateInvoiceTotals([line()], [payment({ amountPaise: 60_000 })], 0, "Issued");
    expect(totals.balancePaise).toBe(-10_000);
    expect(totals.status).toBe("Paid");
  });

  it("treats a discount larger than the bill as a full write-off, not a negative total", () => {
    const totals = calculateInvoiceTotals([line()], [], 99_00_000, "Issued");
    expect(totals.totalPaise).toBe(0);
  });
});

describe("deriveInvoiceStatus", () => {
  it("never moves a cancelled or draft invoice implicitly", () => {
    expect(deriveInvoiceStatus("Cancelled", 50_000, 50_000)).toBe("Cancelled");
    expect(deriveInvoiceStatus("Draft", 50_000, 0)).toBe("Draft");
  });

  it("walks Issued through to Paid as money arrives", () => {
    expect(deriveInvoiceStatus("Issued", 50_000, 0)).toBe("Issued");
    expect(deriveInvoiceStatus("Issued", 50_000, 20_000)).toBe("Partially Paid");
    expect(deriveInvoiceStatus("Partially Paid", 50_000, 50_000)).toBe("Paid");
  });

  it("reverts to Issued if the only payment is reversed", () => {
    expect(deriveInvoiceStatus("Partially Paid", 50_000, 0)).toBe("Issued");
  });
});

describe("outstandingPaise", () => {
  it("counts only issued, uncancelled balances", () => {
    const invoices = [
      invoice({ id: "INV-1", status: "Issued" }),
      invoice({ id: "INV-2", status: "Draft" }),
      invoice({ id: "INV-3", status: "Cancelled" }),
      invoice({ id: "INV-4", status: "Partially Paid", payments: [payment({ amountPaise: 20_000 })] })
    ];

    // INV-1 owes 500, INV-4 owes 300; the draft and the cancelled bill owe nothing.
    expect(outstandingPaise(invoices)).toBe(80_000);
  });

  it("ignores an over-collected invoice rather than reducing what other bills owe", () => {
    const invoices = [invoice({ id: "INV-1", status: "Issued" }), invoice({ id: "INV-2", payments: [payment({ amountPaise: 70_000 })] })];
    expect(outstandingPaise(invoices)).toBe(50_000);
  });
});
