import { describe, expect, it } from "vitest";
import { recommendations } from "@/lib/billing-assistant";
import { withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineItem, InvoicePayment } from "@/lib/billing-types";
import type { InsuranceClaim } from "@/lib/finance-types";
import type { PackagePurchase } from "@/lib/package-types";
import type { PatientWallet } from "@/lib/wallet-types";

const NOW = new Date("2026-07-28T10:00:00.000Z");

function line(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    id: "LN-1",
    source: "OPD",
    description: "Consultation",
    category: "Consultation",
    quantity: 1,
    unitPricePaise: 50_000,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 50_000,
    addedAt: "2026-07-28T09:00:00.000Z",
    addedBy: "Reception",
    ...overrides
  };
}

function payment(overrides: Partial<InvoicePayment> = {}): InvoicePayment {
  return { id: "PY-1", method: "Cash", amountPaise: 20_000, receivedAt: "2026-07-28T10:00:00.000Z", receivedBy: "Reception", ...overrides };
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

function wallet(balancePaise: number): PatientWallet {
  return {
    id: "WAL-1",
    patientKey: "9876543210",
    patientName: "Asha Verma",
    phone: "9876543210",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    balancePaise,
    transactions: []
  };
}

function purchase(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "PPU-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    packageId: "PKG-1",
    packageCode: "ENDO-PKG",
    packageName: "Endoscopy Package",
    patientKey: "9876543210",
    patientName: "Asha Verma",
    phone: "9876543210",
    invoiceId: "INV-0",
    invoiceNo: "MGM-INV-20260701-001",
    pricePaise: 6_00_000,
    purchasedAt: "2026-07-01T00:00:00.000Z",
    status: "Active",
    entitlements: [{ priceCode: "ENDO-FU", name: "Endoscopy follow-up", includedQuantity: 10, usedQuantity: 3, redemptions: [] }],
    ...overrides
  };
}

function claim(overrides: Partial<InsuranceClaim> = {}): InsuranceClaim {
  return {
    id: "CLM-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    patientName: "Asha Verma",
    phone: "9876543210",
    insurer: "Star Health",
    requestedAmount: 5000,
    approvedAmount: 4000,
    settledAmount: 0,
    status: "Approved",
    ...overrides
  };
}

describe("recommendations", () => {
  it("says nothing about a clean, settled bill", () => {
    const settled = invoice({ payments: [payment({ amountPaise: 50_000 })] });
    expect(recommendations({ invoice: settled, invoices: [settled], now: NOW })).toEqual([]);
  });

  // The single most common way a hospital loses money it has already spent.
  it("flags a clinical charge the sync could not bill", () => {
    const found = recommendations({
      invoice: invoice(),
      invoices: [invoice()],
      skippedCharges: [{ label: "Upper GI Endoscopy", reason: "No price-list entry is linked to procedure \"ercp\"." }],
      now: NOW
    });
    expect(found.some((entry) => entry.kind === "unbilled-charges")).toBe(true);
  });

  it("does not nag about a charge that was skipped because it was already collected", () => {
    const found = recommendations({
      invoice: invoice(),
      invoices: [invoice()],
      skippedCharges: [{ label: "CBC", reason: "Already collected at the lab counter." }],
      now: NOW
    });
    expect(found.some((entry) => entry.kind === "unbilled-charges")).toBe(false);
  });

  it("reuses the workspace's duplicate detection so the two can never disagree", () => {
    const a = invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] });
    const b = invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9", description: "LFT" })] });
    const found = recommendations({ invoice: a, invoices: [a, b], now: NOW });
    expect(found.some((entry) => entry.kind === "duplicate-charge")).toBe(true);
  });

  it("spots a service being charged for that the patient's package already covers", () => {
    const charged = invoice({ lineItems: [line({ description: "Endoscopy follow-up", unitPricePaise: 30_000, totalPaise: 30_000 })] });
    const found = recommendations({ invoice: charged, invoices: [charged], packages: [purchase()], now: NOW });
    const hit = found.find((entry) => entry.kind === "package-available");
    expect(hit).toBeDefined();
    expect(hit?.detail).toContain("7 remaining");
  });

  it("ignores an expired package", () => {
    const charged = invoice({ lineItems: [line({ description: "Endoscopy follow-up", unitPricePaise: 30_000, totalPaise: 30_000 })] });
    const expired = purchase({ expiresAt: "2026-01-01T00:00:00.000Z" });
    expect(recommendations({ invoice: charged, invoices: [charged], packages: [expired], now: NOW }).some((e) => e.kind === "package-available")).toBe(false);
  });

  it("points out advance sitting unused while a bill is owed", () => {
    const found = recommendations({ invoice: invoice(), invoices: [invoice()], wallet: wallet(2_00_000), now: NOW });
    const hit = found.find((entry) => entry.kind === "advance-available");
    expect(hit?.amountPaise).toBe(50_000);
  });

  it("does not suggest an advance against a draft", () => {
    const draft = invoice({ status: "Draft" });
    expect(recommendations({ invoice: draft, invoices: [draft], wallet: wallet(2_00_000), now: NOW }).some((e) => e.kind === "advance-available")).toBe(false);
  });

  it("warns before collecting from a patient with approved unsettled insurance", () => {
    const found = recommendations({ invoice: invoice(), invoices: [invoice()], insuranceClaims: [claim()], now: NOW });
    expect(found.some((entry) => entry.kind === "insurance-available")).toBe(true);
  });

  it("ignores a fully settled claim", () => {
    const settled = claim({ settledAmount: 4000, status: "Settled" });
    expect(recommendations({ invoice: invoice(), invoices: [invoice()], insuranceClaims: [settled], now: NOW }).some((e) => e.kind === "insurance-available")).toBe(false);
  });

  it("surfaces older unpaid bills while the patient is at the counter", () => {
    const current = invoice({ id: "A", invoiceNo: "INV-A" });
    const older = invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ totalPaise: 1_00_000 })] });
    const found = recommendations({ invoice: current, invoices: [current, older], now: NOW });
    expect(found.find((entry) => entry.kind === "outstanding-balance")?.amountPaise).toBe(1_00_000);
  });

  it("flags a draft that has sat unissued — revenue existing only in the system", () => {
    const stale = invoice({ id: "D", status: "Draft", createdAt: "2026-07-20T09:00:00.000Z" });
    expect(recommendations({ invoices: [stale], now: NOW }).some((entry) => entry.kind === "unissued-draft")).toBe(true);
  });

  it("does not flag a draft raised today", () => {
    const fresh = invoice({ id: "D", status: "Draft", createdAt: "2026-07-28T09:00:00.000Z" });
    expect(recommendations({ invoices: [fresh], now: NOW }).some((entry) => entry.kind === "unissued-draft")).toBe(false);
  });

  it("puts warnings before actions so the costly things are read first", () => {
    const a = invoice({ id: "A", invoiceNo: "INV-A", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9" })] });
    const b = invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ source: "Laboratory", sourceRef: "LAB-9" })] });
    const found = recommendations({ invoice: a, invoices: [a, b], wallet: wallet(2_00_000), now: NOW });
    expect(found[0].severity).toBe("warning");
  });

  // Every recommendation must be checkable by the clerk acting on it.
  it("always states the figures behind what it says", () => {
    const a = invoice({ id: "A", invoiceNo: "INV-A" });
    const older = invoice({ id: "B", invoiceNo: "INV-B", lineItems: [line({ totalPaise: 1_00_000 })] });
    const found = recommendations({ invoice: a, invoices: [a, older], wallet: wallet(2_00_000), insuranceClaims: [claim()], now: NOW });
    expect(found.length).toBeGreaterThan(0);
    for (const entry of found) {
      expect(entry.detail.length).toBeGreaterThan(10);
      expect(entry.title.length).toBeGreaterThan(5);
    }
  });
});
