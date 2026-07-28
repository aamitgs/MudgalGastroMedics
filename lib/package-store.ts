import "server-only";
import { addInvoiceLineItems, getInvoiceById } from "@/lib/billing-store";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { expiryFor, findRedeemablePurchase, isExpired, remainingQuantity } from "@/lib/package-calc";
import type { PackageEntitlement, PackagePurchase, PackageStatus, ServicePackage } from "@/lib/package-types";
import { resolveServicePrice } from "@/lib/pricing-calc";
import { getServicePriceByCode, listServicePrices } from "@/lib/pricing-store";

type PackageStore = {
  packages: ServicePackage[];
  purchases: PackagePurchase[];
};

const docStore = createDocumentStore<PackageStore>("service-packages", (parsed) => {
  const doc = parsed as Partial<PackageStore> | undefined;
  return {
    packages: Array.isArray(doc?.packages) ? (doc.packages as PackageStore["packages"]) : [],
    purchases: Array.isArray(doc?.purchases) ? (doc.purchases as PackageStore["purchases"]) : []
  };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCode(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "-");
}

function patientKey(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function listPackages() {
  return (await docStore.load()).packages;
}

export async function getPackageByCode(code: string) {
  const normalized = normalizeCode(code);
  return (await docStore.load()).packages.find((pkg) => pkg.code === normalized) ?? null;
}

export async function listPatientPackages(phone: string) {
  const key = patientKey(phone);
  if (key.length < 6) return [];
  return (await docStore.load()).purchases.filter((purchase) => purchase.patientKey === key);
}

export type PackageInput = {
  code: string;
  name: string;
  description?: string;
  pricePaise: number;
  items: Array<{ priceCode: string; quantity: number }>;
  validityDays?: number;
};

/** Defines a package. Every item must exist in the price master — a package can't include a service the hospital doesn't price. */
export async function createPackage(input: PackageInput): Promise<{ package: ServicePackage } | { error: string }> {
  const doc = await docStore.load();
  const code = normalizeCode(input.code);
  if (!code) return { error: "A package code is required." };
  if (doc.packages.some((pkg) => pkg.code === code)) return { error: `Package code ${code} already exists.` };
  if (!input.items.length) return { error: "A package needs at least one included service." };

  const items = [];
  for (const item of input.items) {
    const service = await getServicePriceByCode(item.priceCode);
    if (!service) return { error: `No service found for price code ${item.priceCode}.` };
    const quantity = Math.max(1, Math.round(item.quantity));
    items.push({ priceCode: service.code, name: service.name, quantity });
  }

  const now = new Date().toISOString();
  const created: ServicePackage = {
    id: generateId("PKG"),
    code,
    name: normalizeText(input.name),
    description: normalizeText(input.description) || undefined,
    pricePaise: Math.max(0, Math.round(input.pricePaise)),
    items,
    validityDays: input.validityDays,
    active: true,
    createdAt: now,
    updatedAt: now
  };

  doc.packages.unshift(created);
  await docStore.save(doc);
  return { package: created };
}

export async function updatePackage(input: { id: string; pricePaise?: number; active?: boolean; validityDays?: number; description?: string }) {
  const doc = await docStore.load();
  const pkg = doc.packages.find((entry) => entry.id === input.id);
  if (!pkg) return { error: "Package not found." };

  if (typeof input.pricePaise === "number" && Number.isFinite(input.pricePaise)) pkg.pricePaise = Math.max(0, Math.round(input.pricePaise));
  if (typeof input.active === "boolean") pkg.active = input.active;
  if (typeof input.validityDays === "number") pkg.validityDays = input.validityDays;
  if (typeof input.description === "string") pkg.description = normalizeText(input.description) || undefined;

  pkg.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return { package: pkg };
}

/**
 * Sells a package onto a bill (§7).
 *
 * Adds a single line at the bundled price — not the individual services —
 * because that is what the patient is buying and what the invoice should say.
 * The entitlements created here are what get drawn down later, so the services
 * themselves appear on future bills at zero rather than being pre-billed now.
 */
export async function sellPackage(input: {
  invoiceId: string;
  packageCode: string;
  actingStaffName: string;
}): Promise<{ purchase: PackagePurchase } | { error: string }> {
  const pkg = await getPackageByCode(input.packageCode);
  if (!pkg) return { error: `No package found for code ${input.packageCode}.` };
  if (!pkg.active) return { error: `${pkg.name} is no longer offered.` };

  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "Cancelled") return { error: "This invoice is cancelled." };
  if (invoice.status === "Paid") return { error: "This invoice is fully paid. Raise a new invoice to sell a package." };

  const doc = await docStore.load();
  // One purchase per package per invoice — re-clicking "add package" should
  // not silently double the patient's entitlements or their bill.
  const existing = doc.purchases.find((purchase) => purchase.invoiceId === invoice.id && purchase.packageId === pkg.id);
  if (existing) return { error: `${pkg.name} is already on this invoice.` };

  const added = await addInvoiceLineItems(
    invoice.id,
    [
      {
        source: "Package",
        sourceRef: `${pkg.code}:${invoice.id}`,
        description: pkg.name,
        category: "Package",
        quantity: 1,
        unitPricePaise: pkg.pricePaise
      }
    ],
    input.actingStaffName
  );
  if ("error" in added) return added;

  const now = new Date();
  const purchase: PackagePurchase = {
    id: generateId("PPU"),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    packageId: pkg.id,
    packageCode: pkg.code,
    packageName: pkg.name,
    patientKey: patientKey(invoice.phone),
    patientName: invoice.patientName,
    phone: invoice.phone,
    uhid: invoice.uhid,
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    pricePaise: pkg.pricePaise,
    purchasedAt: now.toISOString(),
    expiresAt: expiryFor(pkg.validityDays, now),
    status: "Active",
    entitlements: pkg.items.map<PackageEntitlement>((item) => ({
      priceCode: item.priceCode,
      name: item.name,
      includedQuantity: item.quantity,
      usedQuantity: 0,
      redemptions: []
    }))
  };

  doc.purchases.unshift(purchase);
  await docStore.save(doc);
  return { purchase };
}

/**
 * Draws a service from a package instead of charging for it (§30).
 *
 * The service still goes onto the bill — at zero, labelled with the package it
 * came from. A covered service that simply vanishes from the invoice leaves
 * the patient unable to see they received it, and the hospital unable to
 * report on what it delivered.
 */
export async function redeemFromPackage(input: {
  invoiceId: string;
  priceCode: string;
  quantity?: number;
  actingStaffName: string;
}): Promise<{ purchase: PackagePurchase; remaining: number } | { error: string }> {
  const invoice = await getInvoiceById(input.invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "Cancelled" || invoice.status === "Paid") {
    return { error: "This invoice can no longer take charges." };
  }

  const quantity = Math.max(1, Math.round(input.quantity ?? 1));
  const doc = await docStore.load();
  const key = patientKey(invoice.phone);
  const candidates = doc.purchases.filter((purchase) => purchase.patientKey === key);

  const purchase = findRedeemablePurchase(candidates, normalizeCode(input.priceCode), quantity);
  if (!purchase) {
    return { error: "This patient has no package with that service remaining." };
  }

  const entitlement = purchase.entitlements.find((entry) => entry.priceCode === normalizeCode(input.priceCode));
  if (!entitlement || remainingQuantity(entitlement) < quantity) {
    return { error: "Not enough remaining on that package." };
  }

  const service = await getServicePriceByCode(entitlement.priceCode);
  const added = await addInvoiceLineItems(
    invoice.id,
    [
      {
        source: "Package",
        sourceRef: `${purchase.id}:${entitlement.priceCode}:${entitlement.usedQuantity + 1}`,
        description: `${service?.name ?? entitlement.name} — covered by ${purchase.packageName}`,
        category: service?.category ?? "Package",
        quantity,
        unitPricePaise: 0
      }
    ],
    input.actingStaffName
  );
  if ("error" in added) return added;

  entitlement.usedQuantity += quantity;
  entitlement.redemptions.unshift({
    id: generateId("PRD"),
    at: new Date().toISOString(),
    by: normalizeText(input.actingStaffName) || "Unknown",
    quantity,
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo
  });
  purchase.updatedAt = new Date().toISOString();

  await docStore.save(doc);
  return { purchase, remaining: remainingQuantity(entitlement) };
}

/** Marks lapsed purchases as Expired. Derived state is authoritative; this only keeps the stored status honest. */
export async function refreshPackageStatuses(now: Date = new Date()) {
  const doc = await docStore.load();
  let changed = false;
  for (const purchase of doc.purchases) {
    const next: PackageStatus = purchase.status === "Cancelled" ? "Cancelled" : isExpired(purchase, now) ? "Expired" : "Active";
    if (next !== purchase.status) {
      purchase.status = next;
      changed = true;
    }
  }
  if (changed) await docStore.save(doc);
  return doc.purchases;
}

/** List prices for the package's contents, so the saving can be shown against what the parts would cost. */
export async function packageListPrices(pkg: ServicePackage): Promise<Record<string, number>> {
  const services = await listServicePrices();
  return Object.fromEntries(
    pkg.items.map((item) => {
      const service = services.find((entry) => entry.code === item.priceCode);
      return [item.priceCode, service ? resolveServicePrice(service).pricePaise : 0];
    })
  );
}
