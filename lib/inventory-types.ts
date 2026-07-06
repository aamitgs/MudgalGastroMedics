export type InventoryCategory = "Medicine" | "Consumable" | "Procedure Kit" | "Equipment";

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  reorderLevel: number;
  unit: string;
  vendor?: string;
  /** Supplier batch reference for recall traceability (P4). */
  batchNumber?: string;
  /** Manufacturer lot reference for recall traceability (P4). */
  lotNumber?: string;
  /** ISO date (YYYY-MM-DD). Drives expiry monitoring — expired stock must never be dispensed. */
  expiryDate?: string;
  lastUpdatedAt: string;
};

export const inventoryCategories: InventoryCategory[] = ["Medicine", "Consumable", "Procedure Kit", "Equipment"];

/** Window in which stock counts as "expiring soon" for alerts (Track 0.8). */
export const inventoryExpirySoonDays = 30;

export type InventoryExpiryStatus = "expired" | "expiring-soon" | null;

/**
 * Explainable expiry classification for one item: expired when the expiry date
 * has passed (the whole expiry day still counts as usable), expiring-soon within
 * the alert window. Items without an expiry date are never flagged.
 */
export function inventoryExpiryStatus(item: Pick<InventoryItem, "expiryDate">, now = new Date()): InventoryExpiryStatus {
  if (!item.expiryDate) return null;
  const expiry = new Date(`${item.expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return null;
  if (expiry.getTime() < now.getTime()) return "expired";
  // Day-granular window: anything expiring on or before the cutoff DAY counts,
  // regardless of time of day — how pharmacy staff actually read expiry dates.
  const soonCutoff = new Date(now.getTime() + inventoryExpirySoonDays * 24 * 60 * 60 * 1000);
  soonCutoff.setHours(23, 59, 59, 999);
  return expiry.getTime() <= soonCutoff.getTime() ? "expiring-soon" : null;
}
