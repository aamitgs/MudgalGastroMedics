import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { adjustInventoryQuantity, listInventoryItems } from "@/lib/inventory-store";
import type { OpdVisit } from "@/lib/opd-types";
import { getOpdVisitById } from "@/lib/opd-store";
import type { PharmacyDispenseItem, PharmacyDispenseRecord } from "@/lib/pharmacy-types";

type PharmacyStore = {
  dispenses: PharmacyDispenseRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmPharmacyStore?: PharmacyStore;
};

const storeFile = join(process.cwd(), ".data", "pharmacy-dispenses.json");

function readStoreFromDisk(): PharmacyStore {
  try {
    if (!existsSync(storeFile)) return { dispenses: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<PharmacyStore>;
    return { dispenses: Array.isArray(parsed.dispenses) ? parsed.dispenses : [] };
  } catch {
    return { dispenses: [] };
  }
}

function writeStoreToDisk(store: PharmacyStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmPharmacyStore ??= readStoreFromDisk();
  return globalStore.__mgmPharmacyStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function listPharmacyDispenses() {
  return getStore().dispenses;
}

export function createPharmacyDispense(input: Record<string, unknown>) {
  const visitId = normalizeText(input.visitId);
  const visit = getOpdVisitById(visitId);
  if (!visit) return { error: "OPD visit not found." };

  const rawItems = Array.isArray(input.items) ? input.items : [];
  const inventory = listInventoryItems();
  const items: PharmacyDispenseItem[] = [];

  for (const rawItem of rawItems) {
    const entry = rawItem as Record<string, unknown>;
    const inventoryItemId = normalizeText(entry.inventoryItemId);
    const quantity = normalizeNumber(entry.quantity);
    const unitPrice = normalizeNumber(entry.unitPrice);
    if (!inventoryItemId || quantity <= 0) continue;

    const stockItem = inventory.find((item) => item.id === inventoryItemId);
    if (!stockItem) return { error: `Inventory item not found: ${inventoryItemId}` };
    if (stockItem.quantity < quantity) return { error: `${stockItem.name} has only ${stockItem.quantity} ${stockItem.unit} available.` };

    items.push({
      inventoryItemId,
      name: stockItem.name,
      quantity,
      unit: stockItem.unit,
      unitPrice,
      total: quantity * unitPrice
    });
  }

  if (!items.length) return { error: "Add at least one dispense item." };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = normalizeNumber(input.discount);
  const total = Math.max(0, subtotal - discount);
  const now = new Date().toISOString();
  const record: PharmacyDispenseRecord = {
    id: `PH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: "Dispensed",
    visitId: visit.id,
    token: visit.token,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    service: visit.service,
    items,
    subtotal,
    discount,
    total,
    paymentStatus: normalizeText(input.paymentStatus) === "Paid" ? "Paid" : "Unpaid",
    paymentMethod: normalizeText(input.paymentMethod) as PharmacyDispenseRecord["paymentMethod"],
    notes: normalizeText(input.notes)
  };

  for (const item of items) {
    adjustInventoryQuantity(item.inventoryItemId, -item.quantity);
  }

  getStore().dispenses.unshift(record);
  writeStoreToDisk(getStore());
  return { record };
}

export function listDispensesForVisit(visit: Pick<OpdVisit, "id">) {
  return getStore().dispenses.filter((record) => record.visitId === visit.id);
}
