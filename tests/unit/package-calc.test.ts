import { describe, expect, it } from "vitest";
import {
  bundleSavingPaise,
  expiryFor,
  findRedeemablePurchase,
  isExpired,
  isRedeemable,
  packageBalance,
  remainingQuantity
} from "@/lib/package-calc";
import type { PackageEntitlement, PackagePurchase, ServicePackage } from "@/lib/package-types";

const NOW = new Date("2026-07-27T10:00:00.000Z");

function entitlement(overrides: Partial<PackageEntitlement> = {}): PackageEntitlement {
  return { priceCode: "ENDO-FU", name: "Endoscopy follow-up", includedQuantity: 10, usedQuantity: 0, redemptions: [], ...overrides };
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
    invoiceId: "INV-1",
    invoiceNo: "MGM-INV-20260701-001",
    pricePaise: 10_00_000,
    purchasedAt: "2026-07-01T00:00:00.000Z",
    status: "Active",
    entitlements: [entitlement()],
    ...overrides
  };
}

describe("remainingQuantity", () => {
  it("reports what is left", () => {
    expect(remainingQuantity({ includedQuantity: 10, usedQuantity: 3 })).toBe(7);
  });

  it("never goes negative, even if over-redeemed somehow", () => {
    expect(remainingQuantity({ includedQuantity: 10, usedQuantity: 12 })).toBe(0);
  });
});

describe("isExpired", () => {
  it("is false for a package that never lapses", () => {
    expect(isExpired({ expiresAt: undefined }, NOW)).toBe(false);
  });

  it("compares against the clock rather than a stored flag", () => {
    expect(isExpired({ expiresAt: "2026-07-01T00:00:00.000Z" }, NOW)).toBe(true);
    expect(isExpired({ expiresAt: "2026-12-31T00:00:00.000Z" }, NOW)).toBe(false);
  });
});

describe("isRedeemable", () => {
  it("accepts an active package with something left", () => {
    expect(isRedeemable(purchase(), NOW)).toBe(true);
  });

  it("rejects a cancelled package", () => {
    expect(isRedeemable(purchase({ status: "Cancelled" }), NOW)).toBe(false);
  });

  it("rejects a lapsed package even when it still has services left", () => {
    expect(isRedeemable(purchase({ expiresAt: "2026-07-01T00:00:00.000Z" }), NOW)).toBe(false);
  });

  it("rejects a fully consumed package", () => {
    expect(isRedeemable(purchase({ entitlements: [entitlement({ usedQuantity: 10 })] }), NOW)).toBe(false);
  });
});

describe("packageBalance", () => {
  it("produces the used/remaining view a counter reads out", () => {
    const balance = packageBalance(purchase({ entitlements: [entitlement({ usedQuantity: 3 })] }), NOW);
    expect(balance.lines[0]).toMatchObject({ included: 10, used: 3, remaining: 7 });
    expect(balance.totalRemaining).toBe(7);
  });

  it("sums remaining across several entitlements", () => {
    const balance = packageBalance(
      purchase({
        entitlements: [
          entitlement({ priceCode: "A", includedQuantity: 5, usedQuantity: 1 }),
          entitlement({ priceCode: "B", includedQuantity: 2, usedQuantity: 2 })
        ]
      }),
      NOW
    );
    expect(balance.totalRemaining).toBe(4);
  });

  it("flags a lapsed package so the balance isn't read out as available", () => {
    expect(packageBalance(purchase({ expiresAt: "2026-07-01T00:00:00.000Z" }), NOW).expired).toBe(true);
  });
});

describe("findRedeemablePurchase", () => {
  // Consuming what expires first is what the patient would want; the opposite
  // silently wastes what they paid for.
  it("draws from the package closest to expiring", () => {
    const soon = purchase({ id: "SOON", expiresAt: "2026-08-01T00:00:00.000Z" });
    const later = purchase({ id: "LATER", expiresAt: "2026-12-01T00:00:00.000Z" });
    expect(findRedeemablePurchase([later, soon], "ENDO-FU", 1, NOW)?.id).toBe("SOON");
  });

  it("prefers an expiring package over one that never lapses", () => {
    const never = purchase({ id: "NEVER" });
    const expiring = purchase({ id: "EXPIRING", expiresAt: "2026-09-01T00:00:00.000Z" });
    expect(findRedeemablePurchase([never, expiring], "ENDO-FU", 1, NOW)?.id).toBe("EXPIRING");
  });

  it("skips packages without enough remaining for the quantity asked", () => {
    const thin = purchase({ id: "THIN", entitlements: [entitlement({ includedQuantity: 2, usedQuantity: 1 })] });
    expect(findRedeemablePurchase([thin], "ENDO-FU", 3, NOW)).toBeNull();
    expect(findRedeemablePurchase([thin], "ENDO-FU", 1, NOW)?.id).toBe("THIN");
  });

  it("ignores a service the package doesn't include", () => {
    expect(findRedeemablePurchase([purchase()], "COLO-FU", 1, NOW)).toBeNull();
  });

  it("returns null when nothing is redeemable", () => {
    expect(findRedeemablePurchase([purchase({ status: "Cancelled" })], "ENDO-FU", 1, NOW)).toBeNull();
  });
});

describe("bundleSavingPaise", () => {
  const pkg: ServicePackage = {
    id: "PKG-1",
    code: "ENDO-PKG",
    name: "Endoscopy Package",
    // Bundled below the sum of its parts — which is the point of a package.
    pricePaise: 5_00_000,
    items: [
      { priceCode: "ENDO", name: "Endoscopy", quantity: 1 },
      { priceCode: "ENDO-FU", name: "Follow-up", quantity: 10 }
    ],
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z"
  };

  it("shows what the parts would have cost separately", () => {
    expect(bundleSavingPaise(pkg, { ENDO: 4_50_000, "ENDO-FU": 20_000 })).toBe(1_50_000);
  });

  it("is zero when the bundle isn't actually cheaper", () => {
    expect(bundleSavingPaise(pkg, { ENDO: 3_00_000, "ENDO-FU": 10_000 })).toBe(0);
  });
});

describe("expiryFor", () => {
  it("adds the validity window to the purchase date", () => {
    expect(expiryFor(30, new Date("2026-07-01T00:00:00.000Z"))).toBe("2026-07-31T00:00:00.000Z");
  });

  it("is undefined for a package that never lapses", () => {
    expect(expiryFor(undefined, NOW)).toBeUndefined();
    expect(expiryFor(0, NOW)).toBeUndefined();
  });
});
