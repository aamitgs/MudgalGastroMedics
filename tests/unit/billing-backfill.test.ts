import { describe, expect, it } from "vitest";
import { attentionItems, hasBillingFootprint, planBackfill } from "@/lib/billing-backfill";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice } from "@/lib/billing-types";
import type { OpdVisit } from "@/lib/opd-types";

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "MGM-001",
    appointmentId: "APT-1",
    createdAt: "2026-01-10T09:00:00.000Z",
    status: "Completed",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consultation",
    symptoms: [],
    billingStatus: "Not Started",
    ...overrides
  };
}

function invoice(visitId: string): Invoice {
  return withRecalculatedTotals({
    id: `INV-${visitId}`,
    invoiceNo: "MGM-INV-20260110-001",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
    status: "Issued",
    patientName: "Asha Verma",
    phone: "9876543210",
    visitId,
    lineItems: [],
    payments: [],
    subtotalPaise: 0,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 0,
    paidPaise: 0,
    refundedPaise: 0,
    balancePaise: 0
  });
}

describe("hasBillingFootprint", () => {
  it("is false for a visit nothing financial ever touched", () => {
    expect(hasBillingFootprint(visit())).toBe(false);
  });

  it("is true once any financial field is set", () => {
    expect(hasBillingFootprint(visit({ billingStatus: "Paid" }))).toBe(true);
    expect(hasBillingFootprint(visit({ estimatedAmount: "500" }))).toBe(true);
    expect(hasBillingFootprint(visit({ receiptId: "MGM-R-20260110-001" }))).toBe(true);
    expect(hasBillingFootprint(visit({ refundStatus: "Requested" }))).toBe(true);
  });
});

describe("planBackfill", () => {
  it("converts a paid legacy visit into one line and one payment", () => {
    const plan = planBackfill(
      [visit({ billingStatus: "Paid", estimatedAmount: "1500", paymentMethod: "UPI", paidAt: "2026-01-10T10:00:00.000Z", receiptId: "R-1" })],
      []
    );
    expect(plan.convert).toHaveLength(1);
    expect(plan.convert[0]).toMatchObject({
      amountPaise: 150_000,
      paid: true,
      method: "UPI",
      receiptId: "R-1",
      description: "Gastro consultation"
    });
    expect(plan.totalPaise).toBe(150_000);
  });

  it("converts an unpaid estimate as issued and still owing", () => {
    const plan = planBackfill([visit({ billingStatus: "Estimate Shared", estimatedAmount: "800" })], []);
    expect(plan.convert[0]).toMatchObject({ amountPaise: 80_000, paid: false });
    expect(plan.convert[0].method).toBeUndefined();
  });

  it("parses a formatted legacy amount rather than reading it as paise", () => {
    const plan = planBackfill([visit({ billingStatus: "Paid", estimatedAmount: "Rs. 1,500" })], []);
    expect(plan.convert[0].amountPaise).toBe(150_000);
  });

  it("maps a legacy method the invoice has no slot for onto Other", () => {
    const plan = planBackfill([visit({ billingStatus: "Paid", estimatedAmount: "500", paymentMethod: "Other" })], []);
    expect(plan.convert[0].method).toBe("Other");
  });

  // Re-running must be safe: this is the property that makes a backfill
  // recoverable if it is interrupted.
  it("never converts a visit that already has an invoice", () => {
    const paid = visit({ billingStatus: "Paid", estimatedAmount: "1500" });
    const plan = planBackfill([paid], [invoice(paid.id)]);
    expect(plan.convert).toHaveLength(0);
    expect(plan.skip[0].reason).toMatch(/already has an invoice/i);
    expect(plan.skip[0].needsAttention).toBe(false);
  });

  it("ignores visits nothing financial ever touched, without flagging them", () => {
    const plan = planBackfill([visit()], []);
    expect(plan.convert).toHaveLength(0);
    expect(attentionItems(plan)).toHaveLength(0);
  });

  // The rule that matters most: converting at zero would bury a real record
  // gap permanently.
  it("refuses to invent an amount for a visit marked paid without one", () => {
    const plan = planBackfill([visit({ billingStatus: "Paid", receiptId: "R-9" })], []);
    expect(plan.convert).toHaveLength(0);
    expect(attentionItems(plan)).toHaveLength(1);
    expect(attentionItems(plan)[0].reason).toMatch(/needs a human/i);
  });

  it("refuses a legacy refund, which has no approval record to carry across", () => {
    const plan = planBackfill([visit({ billingStatus: "Paid", estimatedAmount: "1500", refundStatus: "Refunded" })], []);
    expect(plan.convert).toHaveLength(0);
    expect(attentionItems(plan)[0].reason).toMatch(/no approval record/i);
  });

  it("separates what it refuses to decide from what is routinely irrelevant", () => {
    const plan = planBackfill(
      [
        visit({ id: "A", billingStatus: "Paid", estimatedAmount: "1000" }),
        visit({ id: "B" }),
        visit({ id: "C", billingStatus: "Paid", receiptId: "R-1" })
      ],
      []
    );
    expect(plan.convert.map((entry) => entry.visitId)).toEqual(["A"]);
    expect(plan.skip).toHaveLength(2);
    expect(attentionItems(plan).map((entry) => entry.visitId)).toEqual(["C"]);
  });

  it("totals only what it will actually create", () => {
    const plan = planBackfill(
      [
        visit({ id: "A", billingStatus: "Paid", estimatedAmount: "1000" }),
        visit({ id: "B", billingStatus: "Paid", estimatedAmount: "500" }),
        visit({ id: "C", billingStatus: "Paid", receiptId: "R-1" })
      ],
      []
    );
    expect(plan.totalPaise).toBe(150_000);
  });

  it("falls back to a sensible description when the visit has no service", () => {
    const plan = planBackfill([visit({ billingStatus: "Paid", estimatedAmount: "500", service: "  " })], []);
    expect(plan.convert[0].description).toBe("Consultation");
  });
});
