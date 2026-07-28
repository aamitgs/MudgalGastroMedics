/**
 * Service packages and the entitlements a patient holds after buying one
 * (Track 5.7, §7 and §30's package-balance tracking).
 *
 * A package is a priced bundle of services from the master list, not a new
 * pricing mechanism: its contents are `priceCode`s, so a package can never
 * drift from what those services actually are. What it adds is a *bundled
 * price* and, crucially, **entitlements** — the "10 endoscopy follow-ups, 3
 * used, 7 remaining" a patient will ask about at the counter.
 *
 * Redemptions are recorded individually rather than as a counter, because
 * "used 3" is only trustworthy if the hospital can say which three.
 */

export type PackageStatus = "Active" | "Expired" | "Cancelled";

export type PackageItem = {
  /** Price-master code for the included service — the package never re-prices anything itself. */
  priceCode: string;
  /** Denormalised so a package reads without a lookup, and stays readable if the service is later retired. */
  name: string;
  /** How many times this service is included. The "10 follow-ups" of §30. */
  quantity: number;
};

export type ServicePackage = {
  id: string;
  code: string;
  name: string;
  description?: string;
  /** What the bundle costs — normally less than the sum of its parts, which is the point of a package. */
  pricePaise: number;
  items: PackageItem[];
  /** Days from purchase before unused entitlements lapse. Undefined means they never expire. */
  validityDays?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PackageRedemption = {
  id: string;
  at: string;
  by: string;
  quantity: number;
  /** The bill the redeemed service appeared on, so a used entitlement is traceable to a real encounter. */
  invoiceId?: string;
  invoiceNo?: string;
  note?: string;
};

export type PackageEntitlement = {
  priceCode: string;
  name: string;
  includedQuantity: number;
  usedQuantity: number;
  redemptions: PackageRedemption[];
};

export type PackagePurchase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  packageId: string;
  packageCode: string;
  packageName: string;
  /** Normalised phone — the same key every other patient lookup uses. */
  patientKey: string;
  patientName: string;
  phone: string;
  uhid?: string;
  /** The bill the package was sold on. A package always has a paid-for origin. */
  invoiceId: string;
  invoiceNo: string;
  pricePaise: number;
  purchasedAt: string;
  expiresAt?: string;
  status: PackageStatus;
  entitlements: PackageEntitlement[];
};

export const packageStatuses: PackageStatus[] = ["Active", "Expired", "Cancelled"];
