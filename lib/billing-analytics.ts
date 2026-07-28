import { isLiveInvoice } from "@/lib/billing-calc";
import type { Invoice, InvoicePaymentMethod } from "@/lib/billing-types";

/**
 * Financial reporting over the invoice ledger (Track 5.10, §25/§30).
 *
 * Pure: every figure is derived from invoices passed in, so the numbers a
 * report shows can be reproduced exactly and tested. Nothing here reads a
 * store, and nothing is cached — a revenue figure that can drift from its
 * source is worse than a slow one.
 *
 * Two distinctions run through all of it, and getting them wrong is how
 * hospital reports end up disagreeing with the bank:
 *
 * - **Billed vs collected.** Billed is what was invoiced; collected is money
 *   actually received, net of refunds. They are different numbers and are
 *   never conflated.
 * - **Cancelled invoices count for nothing**, anywhere.
 */

export type DateRange = { from: string; to: string };

/** Payments and refunds are attributed to the day the money moved, not the day the bill was raised. */
export type TenderTotals = Record<InvoicePaymentMethod, number>;

const emptyTenders = (): TenderTotals => ({
  Cash: 0,
  UPI: 0,
  Card: 0,
  "Net Banking": 0,
  Wallet: 0,
  Cheque: 0,
  Insurance: 0,
  Other: 0
});

function inRange(iso: string, range?: DateRange) {
  if (!range) return true;
  const date = iso.slice(0, 10);
  return date >= range.from && date <= range.to;
}

function live(invoices: Invoice[]) {
  return invoices.filter((invoice) => isLiveInvoice(invoice));
}

export type CollectionTotals = {
  collectedPaise: number;
  refundedPaise: number;
  netPaise: number;
  byTender: TenderTotals;
  /** Cash vs everything else (§25) — the split a hospital reconciles against its drawer. */
  cashPaise: number;
  digitalPaise: number;
};

/**
 * Money that actually moved in the window, by tender.
 *
 * A refund is subtracted from the tender it went back out on, so a day that
 * collected ₹5,000 cash and refunded ₹1,000 cash nets ₹4,000 — which is what
 * the drawer will contain.
 */
export function collectionTotals(invoices: Invoice[], range?: DateRange): CollectionTotals {
  const byTender = emptyTenders();
  let collectedPaise = 0;
  let refundedPaise = 0;

  for (const invoice of live(invoices)) {
    for (const payment of invoice.payments) {
      if (!inRange(payment.receivedAt, range)) continue;
      byTender[payment.method] += payment.amountPaise;
      collectedPaise += payment.amountPaise;
    }
    for (const refund of invoice.refunds ?? []) {
      if (!inRange(refund.refundedAt, range)) continue;
      byTender[refund.method] -= refund.amountPaise;
      refundedPaise += refund.amountPaise;
    }
  }

  const cashPaise = byTender.Cash;
  const digitalPaise = collectedPaise - refundedPaise - cashPaise;

  return { collectedPaise, refundedPaise, netPaise: collectedPaise - refundedPaise, byTender, cashPaise, digitalPaise };
}

export type RevenueBreakdown = { key: string; billedPaise: number; collectedPaise: number; invoiceCount: number };

function breakdown(invoices: Invoice[], range: DateRange | undefined, keyOf: (invoice: Invoice) => string): RevenueBreakdown[] {
  const map = new Map<string, RevenueBreakdown>();

  for (const invoice of live(invoices)) {
    if (invoice.status === "Draft") continue;
    if (!inRange(invoice.issuedAt || invoice.createdAt, range)) continue;

    const key = keyOf(invoice) || "Unattributed";
    const entry = map.get(key) ?? { key, billedPaise: 0, collectedPaise: 0, invoiceCount: 0 };
    entry.billedPaise += invoice.totalPaise;
    entry.collectedPaise += invoice.paidPaise;
    entry.invoiceCount += 1;
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) => b.billedPaise - a.billedPaise);
}

export function revenueByDoctor(invoices: Invoice[], range?: DateRange) {
  return breakdown(invoices, range, (invoice) => invoice.doctorName ?? "");
}

export function revenueByDepartment(invoices: Invoice[], range?: DateRange) {
  return breakdown(invoices, range, (invoice) => invoice.department ?? "");
}

/**
 * Revenue by what was actually delivered, from line items rather than whole
 * invoices — a bill mixing an endoscopy with medicines belongs to both.
 */
export function revenueByCategory(invoices: Invoice[], range?: DateRange): RevenueBreakdown[] {
  const map = new Map<string, RevenueBreakdown>();

  for (const invoice of live(invoices)) {
    if (invoice.status === "Draft") continue;
    if (!inRange(invoice.issuedAt || invoice.createdAt, range)) continue;

    for (const line of invoice.lineItems) {
      const key = line.category || "Other";
      const entry = map.get(key) ?? { key, billedPaise: 0, collectedPaise: 0, invoiceCount: 0 };
      entry.billedPaise += line.totalPaise;
      entry.invoiceCount += 1;
      map.set(key, entry);
    }
  }

  return [...map.values()].sort((a, b) => b.billedPaise - a.billedPaise);
}

/** The individual services earning the most — what a hospital actually decides capacity on. */
export function topServices(invoices: Invoice[], range?: DateRange, limit = 10): Array<{ description: string; quantity: number; billedPaise: number }> {
  const map = new Map<string, { description: string; quantity: number; billedPaise: number }>();

  for (const invoice of live(invoices)) {
    if (invoice.status === "Draft") continue;
    if (!inRange(invoice.issuedAt || invoice.createdAt, range)) continue;

    for (const line of invoice.lineItems) {
      // Per-day IPD lines carry their date in the description; group them.
      const description = line.description.replace(/\s+—\s+\d{4}-\d{2}-\d{2}$/, "");
      const entry = map.get(description) ?? { description, quantity: 0, billedPaise: 0 };
      entry.quantity += line.quantity;
      entry.billedPaise += line.totalPaise;
      map.set(description, entry);
    }
  }

  return [...map.values()].sort((a, b) => b.billedPaise - a.billedPaise).slice(0, limit);
}

export type DailyPoint = { date: string; billedPaise: number; collectedPaise: number };

/** Day-by-day billed and collected across the window, including days with no activity so a chart doesn't lie about gaps. */
export function dailyTrend(invoices: Invoice[], range: DateRange): DailyPoint[] {
  const billed = new Map<string, number>();
  const collected = new Map<string, number>();

  for (const invoice of live(invoices)) {
    if (invoice.status !== "Draft" && inRange(invoice.issuedAt || invoice.createdAt, range)) {
      const date = (invoice.issuedAt || invoice.createdAt).slice(0, 10);
      billed.set(date, (billed.get(date) ?? 0) + invoice.totalPaise);
    }
    for (const payment of invoice.payments) {
      if (!inRange(payment.receivedAt, range)) continue;
      const date = payment.receivedAt.slice(0, 10);
      collected.set(date, (collected.get(date) ?? 0) + payment.amountPaise);
    }
    for (const refund of invoice.refunds ?? []) {
      if (!inRange(refund.refundedAt, range)) continue;
      const date = refund.refundedAt.slice(0, 10);
      collected.set(date, (collected.get(date) ?? 0) - refund.amountPaise);
    }
  }

  const points: DailyPoint[] = [];
  const cursor = new Date(`${range.from}T00:00:00.000Z`);
  const last = new Date(`${range.to}T00:00:00.000Z`).getTime();
  while (cursor.getTime() <= last) {
    const date = cursor.toISOString().slice(0, 10);
    points.push({ date, billedPaise: billed.get(date) ?? 0, collectedPaise: collected.get(date) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return points;
}

export type DiscountEntry = { invoiceNo: string; patientName: string; amountPaise: number; reason?: string; date: string };

export function discountReport(invoices: Invoice[], range?: DateRange): DiscountEntry[] {
  return live(invoices)
    .filter((invoice) => invoice.discountPaise > 0 && invoice.status !== "Draft" && inRange(invoice.issuedAt || invoice.createdAt, range))
    .map((invoice) => ({
      invoiceNo: invoice.invoiceNo,
      patientName: invoice.patientName,
      amountPaise: invoice.discountPaise,
      reason: invoice.discountReason,
      date: (invoice.issuedAt || invoice.createdAt).slice(0, 10)
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise);
}

export type RefundEntry = { invoiceNo: string; patientName: string; amountPaise: number; method: string; reason: string; date: string };

export function refundReport(invoices: Invoice[], range?: DateRange): RefundEntry[] {
  return live(invoices)
    .flatMap((invoice) =>
      (invoice.refunds ?? [])
        .filter((refund) => inRange(refund.refundedAt, range))
        .map((refund) => ({
          invoiceNo: invoice.invoiceNo,
          patientName: invoice.patientName,
          amountPaise: refund.amountPaise,
          method: refund.method,
          reason: refund.reason,
          date: refund.refundedAt.slice(0, 10)
        }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type Forecast = {
  daysElapsed: number;
  daysInMonth: number;
  dailyAveragePaise: number;
  monthToDatePaise: number;
  projectedMonthEndPaise: number;
};

/**
 * Straight-line projection of month-end collection from the daily average so
 * far (§30).
 *
 * Deliberately the simplest possible model, and labelled as such: a hospital
 * reading a forecast needs to know it is "this month's average × days
 * remaining", not a black box that might be doing something cleverer. Anything
 * more sophisticated needs seasonality data this system does not yet hold.
 */
export function forecastMonth(invoices: Invoice[], now: Date = new Date()): Forecast {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysElapsed = now.getUTCDate();

  const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  const monthToDatePaise = collectionTotals(invoices, { from, to }).netPaise;

  const dailyAveragePaise = daysElapsed > 0 ? Math.round(monthToDatePaise / daysElapsed) : 0;

  return {
    daysElapsed,
    daysInMonth,
    dailyAveragePaise,
    monthToDatePaise,
    projectedMonthEndPaise: dailyAveragePaise * daysInMonth
  };
}

export type DoctorEarning = {
  doctor: string;
  billedPaise: number;
  collectedPaise: number;
  incentivePercent: number;
  incentivePaise: number;
};

/**
 * Doctor incentive (§30 revenue sharing).
 *
 * Calculated on **collected** revenue, not billed: paying a share of money the
 * hospital has not received turns a doctor's incentive into a loan. Doctors
 * without a configured rate appear with 0%, so they are visible in the report
 * rather than silently missing from it.
 */
export function doctorEarnings(invoices: Invoice[], incentivePercents: Record<string, number>, range?: DateRange): DoctorEarning[] {
  return revenueByDoctor(invoices, range).map((entry) => {
    const incentivePercent = incentivePercents[entry.key] ?? 0;
    return {
      doctor: entry.key,
      billedPaise: entry.billedPaise,
      collectedPaise: entry.collectedPaise,
      incentivePercent,
      incentivePaise: Math.round((entry.collectedPaise * incentivePercent) / 100)
    };
  });
}

/** Everything owed across the ledger right now — not range-scoped, because a debt is not a period. */
export function outstandingTotals(invoices: Invoice[]) {
  const open = live(invoices).filter((invoice) => invoice.status !== "Draft" && invoice.balancePaise > 0);
  return {
    outstandingPaise: open.reduce((sum, invoice) => sum + invoice.balancePaise, 0),
    invoiceCount: open.length,
    patientCount: new Set(open.map((invoice) => invoice.phone)).size
  };
}
