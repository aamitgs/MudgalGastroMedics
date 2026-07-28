import { describe, expect, it } from "vitest";
import {
  collectionTotals,
  dailyTrend,
  discountReport,
  doctorEarnings,
  forecastMonth,
  outstandingTotals,
  refundReport,
  revenueByCategory,
  revenueByDoctor,
  topServices
} from "@/lib/billing-analytics";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem, InvoicePayment, InvoiceRefund } from "@/lib/billing-types";

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
  return { id: "PY-1", method: "Cash", amountPaise: 50_000, receivedAt: "2026-07-27T10:00:00.000Z", receivedBy: "Reception", ...overrides };
}

function refund(overrides: Partial<InvoiceRefund> = {}): InvoiceRefund {
  return {
    id: "RF-1",
    amountPaise: 10_000,
    method: "Cash",
    reason: "Procedure abandoned",
    refundedAt: "2026-07-27T12:00:00.000Z",
    refundedBy: "Accounts",
    approvalId: "APR-1",
    ...overrides
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return withRecalculatedTotals({
    id: "INV-1",
    invoiceNo: "MGM-INV-20260727-001",
    createdAt: "2026-07-27T09:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
    issuedAt: "2026-07-27T09:00:00.000Z",
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

const DAY = { from: "2026-07-27", to: "2026-07-27" };

describe("collectionTotals", () => {
  it("splits money actually received by tender", () => {
    const totals = collectionTotals(
      [invoice({ payments: [payment({ id: "A", method: "Cash", amountPaise: 30_000 }), payment({ id: "B", method: "UPI", amountPaise: 20_000 })] })],
      DAY
    );
    expect(totals.byTender.Cash).toBe(30_000);
    expect(totals.byTender.UPI).toBe(20_000);
    expect(totals.collectedPaise).toBe(50_000);
  });

  // A refund leaves the same drawer the payment entered, so it must net off
  // that tender or the till will never reconcile.
  it("nets a refund off the tender it went back out on", () => {
    const totals = collectionTotals([invoice({ payments: [payment({ amountPaise: 50_000 })], refunds: [refund({ amountPaise: 10_000 })] })], DAY);
    expect(totals.byTender.Cash).toBe(40_000);
    expect(totals.refundedPaise).toBe(10_000);
    expect(totals.netPaise).toBe(40_000);
  });

  it("separates cash from every digital tender", () => {
    const totals = collectionTotals(
      [invoice({ payments: [payment({ id: "A", method: "Cash", amountPaise: 30_000 }), payment({ id: "B", method: "Card", amountPaise: 70_000 })] })],
      DAY
    );
    expect(totals.cashPaise).toBe(30_000);
    expect(totals.digitalPaise).toBe(70_000);
  });

  it("attributes money to the day it moved, not the day the bill was raised", () => {
    const totals = collectionTotals(
      [invoice({ issuedAt: "2026-07-20T09:00:00.000Z", payments: [payment({ receivedAt: "2026-07-27T10:00:00.000Z" })] })],
      DAY
    );
    expect(totals.collectedPaise).toBe(50_000);
  });

  it("ignores a cancelled invoice entirely", () => {
    expect(collectionTotals([invoice({ status: "Cancelled", payments: [payment()] })], DAY).collectedPaise).toBe(0);
  });
});

describe("revenue breakdowns", () => {
  const invoices = [
    invoice({ id: "A", doctorName: "Dr Mudgal", department: "Gastro", payments: [payment({ amountPaise: 20_000 })] }),
    invoice({ id: "B", doctorName: "Dr Mudgal", department: "Gastro", lineItems: [line({ totalPaise: 1_00_000, category: "Procedure" })] }),
    invoice({ id: "C", doctorName: "Dr Sharma", department: "Hepatology", lineItems: [line({ totalPaise: 30_000 })] }),
    invoice({ id: "D", status: "Draft", doctorName: "Dr Mudgal", lineItems: [line({ totalPaise: 9_00_000 })] })
  ];

  it("groups billed and collected by doctor", () => {
    const rows = revenueByDoctor(invoices, DAY);
    expect(rows[0]).toMatchObject({ key: "Dr Mudgal", billedPaise: 1_50_000, collectedPaise: 20_000, invoiceCount: 2 });
  });

  it("excludes drafts — an unissued bill is not revenue", () => {
    expect(revenueByDoctor(invoices, DAY).find((row) => row.key === "Dr Mudgal")?.billedPaise).toBe(1_50_000);
  });

  it("labels unattributed revenue rather than dropping it", () => {
    const rows = revenueByDoctor([invoice({ doctorName: undefined })], DAY);
    expect(rows[0].key).toBe("Unattributed");
  });

  it("splits a mixed bill across categories", () => {
    const mixed = invoice({
      lineItems: [line({ id: "L1", category: "Procedure", totalPaise: 4_00_000 }), line({ id: "L2", category: "Medicines", totalPaise: 50_000 })]
    });
    const rows = revenueByCategory([mixed], DAY);
    expect(rows.map((row) => row.key)).toEqual(["Procedure", "Medicines"]);
    expect(rows[0].billedPaise).toBe(4_00_000);
  });

  it("groups per-day IPD lines into one service rather than one per date", () => {
    const stay = invoice({
      lineItems: [
        line({ id: "L1", description: "Nursing care — 2026-07-25", category: "Nursing", totalPaise: 50_000 }),
        line({ id: "L2", description: "Nursing care — 2026-07-26", category: "Nursing", totalPaise: 50_000 })
      ]
    });
    const rows = topServices([stay], DAY);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ description: "Nursing care", quantity: 2, billedPaise: 1_00_000 });
  });
});

describe("dailyTrend", () => {
  it("includes days with no activity so a chart doesn't lie about gaps", () => {
    const points = dailyTrend([invoice()], { from: "2026-07-25", to: "2026-07-27" });
    expect(points.map((point) => point.date)).toEqual(["2026-07-25", "2026-07-26", "2026-07-27"]);
    expect(points[0].billedPaise).toBe(0);
    expect(points[2].billedPaise).toBe(50_000);
  });

  it("subtracts refunds from the day they were paid back", () => {
    const points = dailyTrend([invoice({ payments: [payment({ amountPaise: 50_000 })], refunds: [refund({ amountPaise: 20_000 })] })], DAY);
    expect(points[0].collectedPaise).toBe(30_000);
  });
});

describe("discount and refund reports", () => {
  it("lists discounts with their reason", () => {
    const rows = discountReport([invoice({ discountPaise: 10_000, discountReason: "Senior citizen" })], DAY);
    expect(rows[0]).toMatchObject({ amountPaise: 10_000, reason: "Senior citizen" });
  });

  it("lists refunds with method and reason", () => {
    const rows = refundReport([invoice({ payments: [payment()], refunds: [refund()] })], DAY);
    expect(rows[0]).toMatchObject({ amountPaise: 10_000, method: "Cash", reason: "Procedure abandoned" });
  });
});

describe("doctorEarnings", () => {
  const invoices = [invoice({ doctorName: "Dr Mudgal", lineItems: [line({ totalPaise: 1_00_000 })], payments: [payment({ amountPaise: 60_000 })] })];

  // Paying a share of money the hospital hasn't received turns an incentive
  // into a loan.
  it("calculates the incentive on collected revenue, not billed", () => {
    const rows = doctorEarnings(invoices, { "Dr Mudgal": 10 }, DAY);
    expect(rows[0]).toMatchObject({ billedPaise: 1_00_000, collectedPaise: 60_000, incentivePaise: 6_000 });
  });

  it("shows a doctor with no configured rate at 0% rather than omitting them", () => {
    const rows = doctorEarnings(invoices, {}, DAY);
    expect(rows[0]).toMatchObject({ doctor: "Dr Mudgal", incentivePercent: 0, incentivePaise: 0 });
  });
});

describe("forecastMonth", () => {
  it("projects month-end from the daily average so far", () => {
    const now = new Date("2026-07-10T10:00:00.000Z");
    const invoices = [invoice({ payments: [payment({ amountPaise: 1_00_000, receivedAt: "2026-07-05T10:00:00.000Z" })] })];
    const forecast = forecastMonth(invoices, now);
    expect(forecast.daysElapsed).toBe(10);
    expect(forecast.daysInMonth).toBe(31);
    expect(forecast.dailyAveragePaise).toBe(10_000);
    expect(forecast.projectedMonthEndPaise).toBe(3_10_000);
  });

  it("is zero rather than NaN with no collections", () => {
    const forecast = forecastMonth([], new Date("2026-07-10T10:00:00.000Z"));
    expect(forecast.projectedMonthEndPaise).toBe(0);
  });
});

describe("outstandingTotals", () => {
  it("counts open balances, invoices and distinct patients", () => {
    const totals = outstandingTotals([
      invoice({ id: "A", phone: "1111111111" }),
      invoice({ id: "B", phone: "1111111111" }),
      invoice({ id: "C", phone: "2222222222", payments: [payment()] }),
      invoice({ id: "D", status: "Draft" })
    ]);
    expect(totals.outstandingPaise).toBe(1_00_000);
    expect(totals.invoiceCount).toBe(2);
    expect(totals.patientCount).toBe(1);
  });
});
