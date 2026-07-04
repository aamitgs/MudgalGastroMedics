import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { adjustInventoryQuantity, listInventoryItems } from "@/lib/inventory-store";
import type { OpdVisit } from "@/lib/opd-types";
import { getOpdVisitById } from "@/lib/opd-store";
import type { PharmacyDispenseItem, PharmacyDispenseRecord } from "@/lib/pharmacy-types";

type PharmacyStore = {
  dispenses: PharmacyDispenseRecord[];
};

const docStore = createDocumentStore<PharmacyStore>("pharmacy-dispenses", (parsed) => {
  const doc = parsed as Partial<PharmacyStore> | undefined;
  return { dispenses: Array.isArray(doc?.dispenses) ? (doc.dispenses as PharmacyStore["dispenses"]) : [] };
});






function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function listPharmacyDispenses() {
  const doc = await docStore.load();
  return doc.dispenses;
}

export async function createPharmacyDispense(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const visitId = normalizeText(input.visitId);
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { error: "OPD visit not found." };

  const rawItems = Array.isArray(input.items) ? input.items : [];
  const inventory = (await listInventoryItems());
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
    (await adjustInventoryQuantity(item.inventoryItemId, -item.quantity));
  }

  doc.dispenses.unshift(record);
  await docStore.save(doc);
  return { record };
}

export async function listDispensesForVisit(visit: Pick<OpdVisit, "id">) {
  const doc = await docStore.load();
  return doc.dispenses.filter((record) => record.visitId === visit.id);
}
