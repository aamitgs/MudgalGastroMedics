import { describe, expect, it } from "vitest";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem, InvoicePayment } from "@/lib/billing-types";
import { billingTotals, detectDuplicateCharges, paymentHistory } from "@/lib/billing-workspace";

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
    totalPaise: 50_000,
    addedAt: "2026-07-27T09:00:00.000Z",
    addedBy: "Reception"
  };
  return { ...base, ...overrides };
}

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return {
    id: "PY-1",
    method: "Cash",
    amountPaise: 50_000,
    receivedAt: "2026-07-27T10:00:00.000Z",
    receivedBy: "Reception",
    ...overrides
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return withRecalculatedTotals({
    id: "INV-1",
    invoiceNo: "MGM-INV-20260727-001",
    createdAt: "2026-07-27T09:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
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

describe("detectDuplicateCharges", () => {
  it("finds nothing on a clean set of bills", () => {
    expect(detectDuplicateCharges([invoice()])).toEqual([]);
  });

  it("flags the same lab order billed on two invoices", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ id: "L1", source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ id: "L2", source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] })
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("same-source");
    expect(warnings[0].invoiceNos).toEqual(["INV-A", "INV-B"]);
  });

  it("does not flag two different tests from two different orders", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9", description: "LFT", category: "Investigations" })] }),
      invoice({ id: "B", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-10", description: "CBC", category: "Investigations" })] })
    ]);
    expect(warnings).toHaveLength(0);
  });

  // Two separate orders for the same test on one day is exactly the case a
  // billing desk should look at before collecting — distinct sourceRefs mean
  // rule 1 stays quiet, so rule 2 has to catch it.
  it("flags the same test ordered twice in a day on two separate orders", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9", description: "LFT", category: "Investigations" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-10", description: "LFT", category: "Investigations" })] })
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].kind).toBe("same-day-service");
  });

  it("catches a hand-entered service billed twice the same day, which carries no sourceRef", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ id: "L1" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ id: "L2" })] })
    ]);
    expect(warnings.some((w) => w.kind === "same-day-service")).toBe(true);
  });

  it("does not treat the same service on different days as a duplicate", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", lineItems: [line({ id: "L1", addedAt: "2026-07-27T09:00:00.000Z" })] }),
      invoice({ id: "B", lineItems: [line({ id: "L2", addedAt: "2026-08-15T09:00:00.000Z" })] })
    ]);
    expect(warnings).toHaveLength(0);
  });

  it("reports one duplicate once rather than twice under two rules", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ id: "L1", source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ id: "L2", source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] })
    ]);
    expect(warnings).toHaveLength(1);
  });

  it("ignores cancelled invoices — a voided bill is not a double charge", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9" })] }),
      invoice({ id: "B", status: "Cancelled", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9" })] })
    ]);
    expect(warnings).toHaveLength(0);
  });

  it("flags two live bills raised against one visit", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", visitId: "OPD-1", lineItems: [line({ id: "L1", description: "A" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", visitId: "OPD-1", lineItems: [line({ id: "L2", description: "B" })] })
    ]);
    expect(warnings.some((w) => w.kind === "duplicate-visit-invoice")).toBe(true);
  });

  it("explains every warning rather than just asserting one", () => {
    const warnings = detectDuplicateCharges([
      invoice({ id: "A", invoiceNo: "INV-A", visitId: "OPD-1", lineItems: [line({ id: "L1", source: "Laboratory", sourceRef: "LAB-9" })] }),
      invoice({ id: "B", invoiceNo: "INV-B", visitId: "OPD-1", lineItems: [line({ id: "L2", source: "Laboratory", sourceRef: "LAB-9" })] })
    ]);
    expect(warnings.length).toBeGreaterThan(0);
    for (const warning of warnings) {
      expect(warning.detail.length).toBeGreaterThan(10);
      expect(warning.invoiceNos.length).toBeGreaterThan(0);
    }
  });
});

describe("paymentHistory", () => {
  it("flattens every tender across bills, newest first", () => {
    const history = paymentHistory([
      invoice({ id: "A", invoiceNo: "INV-A", payments: [payment({ id: "P1", receivedAt: "2026-07-25T10:00:00.000Z" })] }),
      invoice({
        id: "B",
        invoiceNo: "INV-B",
        payments: [payment({ id: "P2", receivedAt: "2026-07-27T10:00:00.000Z", method: "UPI" })]
      })
    ]);
    expect(history.map((entry) => entry.paymentId)).toEqual(["P2", "P1"]);
    expect(history[0].invoiceNo).toBe("INV-B");
  });

  it("excludes payments on a cancelled bill", () => {
    expect(paymentHistory([invoice({ status: "Cancelled", payments: [payment()] })])).toHaveLength(0);
  });
});

describe("billingTotals", () => {
  const invoices = [
    invoice({ id: "A", status: "Issued", lineItems: [line({ totalPaise: 1_00_000 })] }),
    invoice({ id: "B", status: "Partially Paid", lineItems: [line({ totalPaise: 2_00_000 })], payments: [payment({ amountPaise: 50_000 })] }),
    invoice({ id: "C", status: "Draft", lineItems: [line({ totalPaise: 9_00_000 })] }),
    invoice({ id: "D", status: "Cancelled", lineItems: [line({ totalPaise: 9_00_000 })] })
  ];

  it("sums outstanding across issued bills only", () => {
    expect(billingTotals(invoices).outstandingPaise).toBe(1_00_000 + 1_50_000);
  });

  it("excludes drafts from lifetime billed — an unissued bill is not a demand", () => {
    expect(billingTotals(invoices).lifetimeBilledPaise).toBe(3_00_000);
  });

  it("counts collected across live bills", () => {
    expect(billingTotals(invoices).lifetimeCollectedPaise).toBe(50_000);
  });

  it("counts open unpaid bills", () => {
    expect(billingTotals(invoices).openInvoiceCount).toBe(2);
  });
});
