import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import type { InventoryCategory, InventoryItem } from "@/lib/inventory-types";

type InventoryStore = {
  items: InventoryItem[];
};



const starterItems: InventoryItem[] = [
  {
    id: "INV-ENDO-GLOVES",
    name: "Examination Gloves",
    category: "Consumable",
    quantity: 120,
    reorderLevel: 50,
    unit: "pairs",
    vendor: "Local medical supplier",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "INV-ENDO-BIOPSY",
    name: "Biopsy Forceps",
    category: "Procedure Kit",
    quantity: 18,
    reorderLevel: 10,
    unit: "pcs",
    vendor: "Endoscopy supplier",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "INV-PHARM-PPI",
    name: "PPI Tablets",
    category: "Medicine",
    quantity: 80,
    reorderLevel: 30,
    unit: "strips",
    vendor: "Pharmacy stock",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "INV-ERCP-GUIDEWIRE",
    name: "ERCP Guidewire",
    category: "Procedure Kit",
    quantity: 6,
    reorderLevel: 8,
    unit: "pcs",
    vendor: "ERCP supplier",
    lastUpdatedAt: new Date().toISOString()
  }
];

const docStore = createDocumentStore<InventoryStore>("inventory", (parsed) => {
  const doc = parsed as Partial<InventoryStore> | undefined;
  return { items: Array.isArray(doc?.items) ? (doc.items as InventoryItem[]) : starterItems };
});





function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Accepts YYYY-MM-DD only; anything else is treated as "no expiry recorded". */
function normalizeIsoDate(value: unknown) {
  const text = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  return Number.isNaN(new Date(`${text}T00:00:00`).getTime()) ? "" : text;
}

export async function listInventoryItems() {
  return (await docStore.load()).items;
}

export async function upsertInventoryItem(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const id = normalizeText(input.id) || `INV-${Date.now().toString(36).toUpperCase()}`;
  const existing = doc.items.find((item) => item.id === id);
  const now = new Date().toISOString();

  const item: InventoryItem = {
    id,
    name: normalizeText(input.name) || existing?.name || "Unnamed item",
    category: (normalizeText(input.category) as InventoryCategory) || existing?.category || "Consumable",
    quantity: normalizeNumber(input.quantity, existing?.quantity ?? 0),
    reorderLevel: normalizeNumber(input.reorderLevel, existing?.reorderLevel ?? 0),
    unit: normalizeText(input.unit) || existing?.unit || "pcs",
    vendor: normalizeText(input.vendor) || existing?.vendor || "",
    genericName: normalizeText(input.genericName) || existing?.genericName || undefined,
    dosageForm: normalizeText(input.dosageForm) || existing?.dosageForm || undefined,
    manufacturer: normalizeText(input.manufacturer) || existing?.manufacturer || undefined,
    batchNumber: normalizeText(input.batchNumber) || existing?.batchNumber || undefined,
    lotNumber: normalizeText(input.lotNumber) || existing?.lotNumber || undefined,
    expiryDate: normalizeIsoDate(input.expiryDate) || existing?.expiryDate || undefined,
    lastUpdatedAt: now
  };

  if (existing) {
    Object.assign(existing, item);
  } else {
    doc.items.unshift(item);
  }

  await docStore.save(doc);
  return item;
}

export async function adjustInventoryQuantity(id: string, delta: number) {
  const doc = await docStore.load();
  const item = doc.items.find((entry) => entry.id === id);
  if (!item) return null;
  item.quantity = Math.max(0, item.quantity + delta);
  item.lastUpdatedAt = new Date().toISOString();
  await docStore.save(doc);
  return item;
}
