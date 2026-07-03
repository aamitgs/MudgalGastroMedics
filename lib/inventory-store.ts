import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { InventoryCategory, InventoryItem } from "@/lib/inventory-types";

type InventoryStore = {
  items: InventoryItem[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmInventoryStore?: InventoryStore;
};

const storeFile = join(process.cwd(), ".data", "inventory.json");

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

function readItemsFromDisk(): InventoryItem[] {
  try {
    if (!existsSync(storeFile)) return starterItems;
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<InventoryStore>;
    return Array.isArray(parsed.items) ? parsed.items : starterItems;
  } catch {
    return starterItems;
  }
}

function writeItemsToDisk(items: InventoryItem[]) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify({ items }, null, 2));
}

function getStore() {
  globalStore.__mgmInventoryStore ??= { items: readItemsFromDisk() };
  return globalStore.__mgmInventoryStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function listInventoryItems() {
  return getStore().items;
}

export function upsertInventoryItem(input: Record<string, unknown>) {
  const id = normalizeText(input.id) || `INV-${Date.now().toString(36).toUpperCase()}`;
  const existing = getStore().items.find((item) => item.id === id);
  const now = new Date().toISOString();

  const item: InventoryItem = {
    id,
    name: normalizeText(input.name) || existing?.name || "Unnamed item",
    category: (normalizeText(input.category) as InventoryCategory) || existing?.category || "Consumable",
    quantity: normalizeNumber(input.quantity, existing?.quantity ?? 0),
    reorderLevel: normalizeNumber(input.reorderLevel, existing?.reorderLevel ?? 0),
    unit: normalizeText(input.unit) || existing?.unit || "pcs",
    vendor: normalizeText(input.vendor) || existing?.vendor || "",
    lastUpdatedAt: now
  };

  if (existing) {
    Object.assign(existing, item);
  } else {
    getStore().items.unshift(item);
  }

  writeItemsToDisk(getStore().items);
  return item;
}

export function adjustInventoryQuantity(id: string, delta: number) {
  const item = getStore().items.find((entry) => entry.id === id);
  if (!item) return null;
  item.quantity = Math.max(0, item.quantity + delta);
  item.lastUpdatedAt = new Date().toISOString();
  writeItemsToDisk(getStore().items);
  return item;
}
