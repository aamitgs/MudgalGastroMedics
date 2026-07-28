import { describe, expect, it } from "vitest";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoicePayment } from "@/lib/billing-types";
import { closingTotals, expectedTenders, requiresApproval, statusAfterClose, tenderVariances } from "@/lib/cash-closing-calc";
import type { TenderCount } from "@/lib/cash-closing-types";

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return { id: "PY-1", method: "Cash", amountPaise: 50_000, receivedAt: "2026-07-27T10:00:00.000Z", receivedBy: "Reception", ...overrides };
}

function invoice(payments: InvoicePayment[]): Invoice {
  return withRecalculatedTotals({
    id: "INV-1",
    invoiceNo: "MGM-INV-20260727-001",
    createdAt: "2026-07-27T09:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
    issuedAt: "2026-07-27T09:00:00.000Z",
    status: "Issued",
    patientName: "Asha Verma",
    phone: "9876543210",
    lineItems: [],
    payments,
    subtotalPaise: 0,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 0,
    paidPaise: 0,
    refundedPaise: 0,
    balancePaise: 0
  });
}

function tenders(overrides: Array<Partial<TenderCount>> = []): TenderCount[] {
  const base: TenderCount[] = [
    { method: "Cash", expectedPaise: 50_000, countedPaise: 50_000 },
    { method: "UPI", expectedPaise: 30_000, countedPaise: 30_000 }
  ];
  return base.map((tender, index) => ({ ...tender, ...overrides[index] }));
}

describe("expectedTenders", () => {
  it("derives each tender from the ledger, never from input", () => {
    const rows = expectedTenders([invoice([payment({ method: "Cash", amountPaise: 40_000 }), payment({ id: "B", method: "UPI", amountPaise: 25_000 })])], "2026-07-27");
    expect(rows.find((row) => row.method === "Cash")?.expectedPaise).toBe(40_000);
    expect(rows.find((row) => row.method === "UPI")?.expectedPaise).toBe(25_000);
  });

  it("starts every counted figure at zero — counting is a human act", () => {
    expect(expectedTenders([invoice([payment()])], "2026-07-27").every((row) => row.countedPaise === 0)).toBe(true);
  });

  it("excludes Wallet: an advance was banked when it was taken, not at close", () => {
    expect(expectedTenders([], "2026-07-27").some((row) => row.method === "Wallet")).toBe(false);
  });

  it("reports zero for a day with no activity rather than omitting the tender", () => {
    const rows = expectedTenders([invoice([payment()])], "2026-07-28");
    expect(rows.every((row) => row.expectedPaise === 0)).toBe(true);
  });
});

describe("closingTotals", () => {
  it("reconciles when counted matches expected", () => {
    const totals = closingTotals(1_00_000, tenders());
    expect(totals.differencePaise).toBe(0);
    expect(totals.reconciled).toBe(true);
  });

  it("reports a shortfall as negative", () => {
    const totals = closingTotals(0, tenders([{ countedPaise: 45_000 }]));
    expect(totals.differencePaise).toBe(-5_000);
    expect(totals.reconciled).toBe(false);
  });

  it("reports an excess as positive", () => {
    const totals = closingTotals(0, tenders([{ countedPaise: 55_000 }]));
    expect(totals.differencePaise).toBe(5_000);
  });

  // Closing cash describes the drawer, so it uses what was counted — using the
  // expected figure would make the handover number a restatement of the ledger.
  it("builds closing cash from opening plus counted cash, not expected", () => {
    const totals = closingTotals(1_00_000, tenders([{ countedPaise: 45_000 }]));
    expect(totals.closingCashPaise).toBe(1_45_000);
  });

  it("counts only cash toward the drawer, not digital tenders", () => {
    const totals = closingTotals(0, tenders());
    expect(totals.closingCashPaise).toBe(50_000);
  });
});

describe("tenderVariances", () => {
  it("points at which till to recount rather than just saying the day is short", () => {
    const variances = tenderVariances(tenders([{ countedPaise: 45_000 }, { countedPaise: 30_000 }]));
    expect(variances).toHaveLength(1);
    expect(variances[0]).toMatchObject({ method: "Cash", differencePaise: -5_000 });
  });

  it("is empty on a clean day", () => {
    expect(tenderVariances(tenders())).toHaveLength(0);
  });
});

describe("statusAfterClose", () => {
  it("closes a reconciled day outright", () => {
    expect(statusAfterClose(0)).toBe("Closed");
  });

  // The money is already whatever it is; a desk that can't close its till
  // will start not closing it.
  it("routes any discrepancy to supervisor approval rather than blocking", () => {
    expect(statusAfterClose(-5_000)).toBe("Awaiting Approval");
    expect(statusAfterClose(5_000)).toBe("Awaiting Approval");
  });

  it("agrees with requiresApproval", () => {
    expect(requiresApproval({ differencePaise: 0 })).toBe(false);
    expect(requiresApproval({ differencePaise: -1 })).toBe(true);
  });
});
