import type { PackageEntitlement, PackagePurchase, ServicePackage } from "@/lib/package-types";

/**
 * Pure package arithmetic (Track 5.7) — what remains, what has lapsed, and
 * whether a service can be drawn from a package instead of charged.
 *
 * Free of persistence so the entitlement rules are directly unit-testable: a
 * patient disputing "you said I had seven left" is answered by these rules,
 * so they need to be provably right.
 */

export function remainingQuantity(entitlement: Pick<PackageEntitlement, "includedQuantity" | "usedQuantity">): number {
  return Math.max(0, entitlement.includedQuantity - entitlement.usedQuantity);
}

/**
 * Whether a purchase has lapsed. Expiry is evaluated against the clock rather
 * than stored as a flag, so a package cannot sit "Active" simply because no
 * job ran to expire it.
 */
export function isExpired(purchase: Pick<PackagePurchase, "expiresAt">, now: Date = new Date()): boolean {
  if (!purchase.expiresAt) return false;
  return new Date(purchase.expiresAt).getTime() < now.getTime();
}

/** A purchase that can still be drawn against: not cancelled, not lapsed, and with something left. */
export function isRedeemable(purchase: PackagePurchase, now: Date = new Date()): boolean {
  if (purchase.status === "Cancelled") return false;
  if (isExpired(purchase, now)) return false;
  return purchase.entitlements.some((entitlement) => remainingQuantity(entitlement) > 0);
}

export type PackageBalance = {
  purchaseId: string;
  packageName: string;
  expiresAt?: string;
  expired: boolean;
  lines: Array<{ priceCode: string; name: string; included: number; used: number; remaining: number }>;
  totalRemaining: number;
};

/** The "used 3, remaining 7" view a counter reads out to the patient. */
export function packageBalance(purchase: PackagePurchase, now: Date = new Date()): PackageBalance {
  const lines = purchase.entitlements.map((entitlement) => ({
    priceCode: entitlement.priceCode,
    name: entitlement.name,
    included: entitlement.includedQuantity,
    used: entitlement.usedQuantity,
    remaining: remainingQuantity(entitlement)
  }));

  return {
    purchaseId: purchase.id,
    packageName: purchase.packageName,
    expiresAt: purchase.expiresAt,
    expired: isExpired(purchase, now),
    lines,
    totalRemaining: lines.reduce((sum, line) => sum + line.remaining, 0)
  };
}

/**
 * Finds a purchase this service can be drawn from, oldest first.
 *
 * Oldest-first matters: consuming the entitlement closest to expiring is what
 * a patient would want, and the opposite silently wastes what they paid for.
 */
export function findRedeemablePurchase(
  purchases: PackagePurchase[],
  priceCode: string,
  quantity = 1,
  now: Date = new Date()
): PackagePurchase | null {
  const candidates = purchases
    .filter((purchase) => isRedeemable(purchase, now))
    .filter((purchase) =>
      purchase.entitlements.some((entitlement) => entitlement.priceCode === priceCode && remainingQuantity(entitlement) >= quantity)
    )
    .sort((a, b) => {
      // Soonest to expire first; never-expiring packages come last.
      if (a.expiresAt && b.expiresAt) return a.expiresAt.localeCompare(b.expiresAt);
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return a.purchasedAt.localeCompare(b.purchasedAt);
    });

  return candidates[0] ?? null;
}

/** What a package's contents would have cost individually — used to show the saving, which is why a patient buys one. */
export function bundleSavingPaise(pkg: ServicePackage, unitPricesPaise: Record<string, number>): number {
  const listValue = pkg.items.reduce((sum, item) => sum + (unitPricesPaise[item.priceCode] ?? 0) * item.quantity, 0);
  return Math.max(0, listValue - pkg.pricePaise);
}

/** Expiry date for a purchase made now, or undefined for a package that never lapses. */
export function expiryFor(validityDays: number | undefined, purchasedAt: Date): string | undefined {
  if (!validityDays || validityDays <= 0) return undefined;
  return new Date(purchasedAt.getTime() + validityDays * 86_400_000).toISOString();
}
