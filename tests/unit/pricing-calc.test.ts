import { describe, expect, it } from "vitest";
import { dayTypeFor, isWithinFollowUpWindow, resolveConsultationFee, resolveServicePrice } from "@/lib/pricing-calc";
import type { ConsultationFeeRule, ServicePrice } from "@/lib/pricing-types";

function service(overrides: Partial<ServicePrice> = {}): ServicePrice {
  return {
    id: "SVC-1",
    code: "ENDO-UGI",
    name: "Upper GI Endoscopy",
    category: "Procedure",
    basePricePaise: 4_50_000,
    active: true,
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
    revisions: [],
    ...overrides
  };
}

function feeRule(overrides: Partial<ConsultationFeeRule> = {}): ConsultationFeeRule {
  return {
    id: "FEE-1",
    visitType: "New",
    feePaise: 50_000,
    active: true,
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
    ...overrides
  };
}

describe("resolveServicePrice", () => {
  it("uses the standard rate when nothing more specific is configured", () => {
    const resolved = resolveServicePrice(service());
    expect(resolved.pricePaise).toBe(4_50_000);
    expect(resolved.basis).toBe("standard");
  });

  it("applies a payer-tier rate", () => {
    const resolved = resolveServicePrice(service({ tierPricesPaise: { Corporate: 3_80_000 } }), { tier: "Corporate" });
    expect(resolved.pricePaise).toBe(3_80_000);
    expect(resolved.basisLabel).toBe("Corporate rate");
  });

  it("falls back to standard when the tier has no negotiated rate, rather than billing zero", () => {
    const resolved = resolveServicePrice(service({ tierPricesPaise: { Corporate: 3_80_000 } }), { tier: "Insurance" });
    expect(resolved.pricePaise).toBe(4_50_000);
    expect(resolved.basis).toBe("standard");
  });

  it("lets a doctor-specific rate beat the tier rate", () => {
    const resolved = resolveServicePrice(
      service({ tierPricesPaise: { Corporate: 3_80_000 }, doctorPricesPaise: { "Dr Mudgal": 5_00_000 } }),
      { tier: "Corporate", doctorName: "Dr Mudgal" }
    );
    expect(resolved.pricePaise).toBe(5_00_000);
    expect(resolved.basis).toBe("doctor");
    expect(resolved.basisLabel).toBe("Dr Mudgal rate");
  });

  it("ignores a doctor override belonging to a different doctor", () => {
    const resolved = resolveServicePrice(service({ doctorPricesPaise: { "Dr Mudgal": 5_00_000 } }), { doctorName: "Dr Sharma" });
    expect(resolved.pricePaise).toBe(4_50_000);
  });

  it("computes tax on the resolved price, not the standard price", () => {
    const resolved = resolveServicePrice(service({ taxPercent: 5, tierPricesPaise: { Corporate: 4_00_000 } }), { tier: "Corporate" });
    expect(resolved.pricePaise).toBe(4_00_000);
    expect(resolved.taxPaise).toBe(20_000);
    expect(resolved.totalPaise).toBe(4_20_000);
  });

  it("charges no tax by default — most clinical services are exempt", () => {
    expect(resolveServicePrice(service()).taxPaise).toBe(0);
  });
});

describe("resolveConsultationFee", () => {
  const rules = [
    feeRule({ id: "F-DEFAULT-NEW", visitType: "New", feePaise: 50_000 }),
    feeRule({ id: "F-DEFAULT-FU", visitType: "Follow-up", feePaise: 20_000, followUpWindowDays: 14 }),
    feeRule({ id: "F-DEFAULT-NEW-WKND", visitType: "New", dayType: "Weekend", feePaise: 70_000 }),
    feeRule({ id: "F-DOC-NEW", doctorName: "Dr Mudgal", visitType: "New", feePaise: 80_000 }),
    feeRule({ id: "F-EMERGENCY", visitType: "Emergency", feePaise: 1_50_000 })
  ];

  it("matches the hospital default when the doctor has no rate of their own", () => {
    expect(resolveConsultationFee(rules, { visitType: "New", doctorName: "Dr Sharma" })?.rule.id).toBe("F-DEFAULT-NEW");
  });

  it("prefers a doctor-specific rule over a day-specific one — who is consulting outranks when", () => {
    const resolved = resolveConsultationFee(rules, { visitType: "New", doctorName: "Dr Mudgal", dayType: "Weekend" });
    expect(resolved?.rule.id).toBe("F-DOC-NEW");
    expect(resolved?.feePaise).toBe(80_000);
  });

  it("applies the weekend rate for a doctor with no rule of their own", () => {
    const resolved = resolveConsultationFee(rules, { visitType: "New", doctorName: "Dr Sharma", dayType: "Weekend" });
    expect(resolved?.rule.id).toBe("F-DEFAULT-NEW-WKND");
    expect(resolved?.feePaise).toBe(70_000);
  });

  it("explains which rule produced the fee", () => {
    expect(resolveConsultationFee(rules, { visitType: "New", dayType: "Weekend" })?.basisLabel).toBe("Hospital default · New · Weekend");
    expect(resolveConsultationFee(rules, { visitType: "New", doctorName: "Dr Mudgal" })?.basisLabel).toBe("Dr Mudgal · New");
  });

  it("charges the follow-up rate for a follow-up", () => {
    expect(resolveConsultationFee(rules, { visitType: "Follow-up" })?.feePaise).toBe(20_000);
  });

  it("skips inactive rules", () => {
    const withRetired = [feeRule({ id: "F-OLD", visitType: "Teleconsultation", feePaise: 30_000, active: false })];
    expect(resolveConsultationFee(withRetired, { visitType: "Teleconsultation" })).toBeNull();
  });

  it("returns null rather than guessing when nothing is configured", () => {
    expect(resolveConsultationFee(rules, { visitType: "Teleconsultation" })).toBeNull();
  });
});

describe("dayTypeFor", () => {
  it("classifies weekends", () => {
    expect(dayTypeFor(new Date("2026-07-25T10:00:00.000Z"))).toBe("Weekend"); // Saturday
    expect(dayTypeFor(new Date("2026-07-26T10:00:00.000Z"))).toBe("Weekend"); // Sunday
    expect(dayTypeFor(new Date("2026-07-27T10:00:00.000Z"))).toBe("Weekday"); // Monday
  });

  it("lets the hospital's own holiday list override a weekday", () => {
    expect(dayTypeFor(new Date("2026-07-27T10:00:00.000Z"), ["2026-07-27"])).toBe("Holiday");
  });
});

describe("isWithinFollowUpWindow", () => {
  const now = new Date("2026-07-27T10:00:00.000Z");

  it("counts a revisit inside the window", () => {
    expect(isWithinFollowUpWindow("2026-07-20T10:00:00.000Z", now, 14)).toBe(true);
  });

  it("excludes a revisit past the window", () => {
    expect(isWithinFollowUpWindow("2026-06-01T10:00:00.000Z", now, 14)).toBe(false);
  });

  it("is false with no previous visit or no configured window", () => {
    expect(isWithinFollowUpWindow(undefined, now, 14)).toBe(false);
    expect(isWithinFollowUpWindow("2026-07-20T10:00:00.000Z", now, undefined)).toBe(false);
    expect(isWithinFollowUpWindow("2026-07-20T10:00:00.000Z", now, 0)).toBe(false);
  });

  it("is false for an unparseable date rather than throwing mid-bill", () => {
    expect(isWithinFollowUpWindow("not-a-date", now, 14)).toBe(false);
  });
});
