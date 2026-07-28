import { describe, expect, it } from "vitest";
import type { InvoiceLineItem } from "@/lib/billing-types";
import { calculateEstimateTotals, canConvert, effectiveStatus, isStale } from "@/lib/estimate-calc";
import type { Estimate } from "@/lib/estimate-types";

const NOW = new Date("2026-07-27T10:00:00.000Z");

function line(totalPaise: number): InvoiceLineItem {
  return {
    id: `EL-${totalPaise}`,
    source: "Procedure",
    description: "Upper GI Endoscopy",
    category: "Procedure",
    quantity: 1,
    unitPricePaise: totalPaise,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise,
    addedAt: "2026-07-27T09:00:00.000Z",
    addedBy: "Reception"
  };
}

function estimate(overrides: Partial<Estimate> = {}): Estimate {
  return {
    id: "EST-1",
    estimateNo: "MGM-EST-20260727-001",
    createdAt: "2026-07-27T09:00:00.000Z",
    updatedAt: "2026-07-27T09:00:00.000Z",
    status: "Accepted",
    patientName: "Asha Verma",
    phone: "9876543210",
    lineItems: [line(4_50_000)],
    subtotalPaise: 4_50_000,
    discountPaise: 0,
    totalPaise: 4_50_000,
    createdBy: "Reception",
    ...overrides
  };
}

describe("calculateEstimateTotals", () => {
  it("sums the lines and applies the discount", () => {
    const totals = calculateEstimateTotals([line(4_50_000), line(50_000)], 50_000);
    expect(totals.subtotalPaise).toBe(5_00_000);
    expect(totals.totalPaise).toBe(4_50_000);
  });

  it("clamps a discount larger than the quote rather than going negative", () => {
    const totals = calculateEstimateTotals([line(1_00_000)], 9_00_000);
    expect(totals.discountPaise).toBe(1_00_000);
    expect(totals.totalPaise).toBe(0);
  });

  it("handles an empty quote", () => {
    expect(calculateEstimateTotals([], 0)).toEqual({ subtotalPaise: 0, discountPaise: 0, totalPaise: 0 });
  });
});

describe("isStale / effectiveStatus", () => {
  it("never expires a quote with no validity date", () => {
    expect(isStale({ validUntil: undefined }, NOW)).toBe(false);
  });

  // Derived, so a quote can't read "Shared" months later purely because no job ran.
  it("derives Expired from the clock", () => {
    expect(effectiveStatus(estimate({ status: "Shared", validUntil: "2026-07-01T00:00:00.000Z" }), NOW)).toBe("Expired");
    expect(effectiveStatus(estimate({ status: "Shared", validUntil: "2026-12-01T00:00:00.000Z" }), NOW)).toBe("Shared");
  });

  it("never re-derives a settled estimate", () => {
    expect(effectiveStatus(estimate({ status: "Converted", validUntil: "2026-07-01T00:00:00.000Z" }), NOW)).toBe("Converted");
    expect(effectiveStatus(estimate({ status: "Declined", validUntil: "2026-07-01T00:00:00.000Z" }), NOW)).toBe("Declined");
  });

  it("leaves a draft alone — an unshared quote can't go stale on the patient", () => {
    expect(effectiveStatus(estimate({ status: "Draft", validUntil: "2026-07-01T00:00:00.000Z" }), NOW)).toBe("Draft");
  });
});

describe("canConvert", () => {
  it("allows an accepted estimate through", () => {
    expect(canConvert(estimate())).toEqual({ ok: true });
  });

  // Converting an unaccepted quote bills a patient for something they never
  // agreed to — the exact failure an estimate exists to prevent.
  it("refuses anything the patient has not accepted", () => {
    for (const status of ["Draft", "Shared", "Expired"] as const) {
      const result = canConvert(estimate({ status }));
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.error).toMatch(/acceptance/i);
    }
  });

  it("refuses a declined estimate", () => {
    const result = canConvert(estimate({ status: "Declined" }));
    expect(result.ok === false && result.error).toMatch(/declined/i);
  });

  it("refuses to convert twice, naming the bill it already became", () => {
    const result = canConvert(estimate({ status: "Converted", convertedInvoiceNo: "MGM-INV-20260727-009" }));
    expect(result.ok === false && result.error).toMatch(/MGM-INV-20260727-009/);
  });

  it("refuses an empty quote", () => {
    expect(canConvert(estimate({ lineItems: [] })).ok).toBe(false);
  });
});
