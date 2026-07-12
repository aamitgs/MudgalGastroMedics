import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { adjustInventoryQuantity, listInventoryItems } from "@/lib/inventory-store";
import type { PurchaseOrderItem, PurchaseOrderRecord, PurchaseOrderStatus } from "@/lib/purchase-order-types";

type PurchaseOrderStore = {
  orders: PurchaseOrderRecord[];
};

const store = createDocumentStore<PurchaseOrderStore>("purchase-orders", (parsed) => {
  const doc = parsed as Partial<PurchaseOrderStore> | undefined;
  return { orders: Array.isArray(doc?.orders) ? (doc.orders as PurchaseOrderRecord[]) : [] };
});

export async function listPurchaseOrders() {
  return (await store.load()).orders;
}

export async function createPurchaseOrder(input: {
  vendor: string;
  notes?: string;
  createdByRole?: string;
  expectedDeliveryDate?: string;
  items: { inventoryItemId: string; quantityOrdered: number; unitCost?: number }[];
}) {
  const inventory = await listInventoryItems();
  const items: PurchaseOrderItem[] = [];

  for (const raw of input.items) {
    const stockItem = inventory.find((entry) => entry.id === raw.inventoryItemId);
    if (!stockItem || raw.quantityOrdered <= 0) continue;
    items.push({
      inventoryItemId: stockItem.id,
      name: stockItem.name,
      unit: stockItem.unit,
      quantityOrdered: raw.quantityOrdered,
      quantityReceived: 0,
      unitCost: raw.unitCost
    });
  }

  if (!items.length) return { error: "Add at least one valid inventory item." };

  const now = new Date().toISOString();
  const record: PurchaseOrderRecord = {
    id: `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: "Draft",
    vendor: input.vendor.trim(),
    items,
    notes: input.notes?.trim(),
    createdByRole: input.createdByRole,
    expectedDeliveryDate: input.expectedDeliveryDate?.trim() || undefined
  };

  const doc = await store.load();
  doc.orders.unshift(record);
  await store.save(doc);
  return { record };
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  const doc = await store.load();
  const order = doc.orders.find((entry) => entry.id === id);
  if (!order) return null;

  const now = new Date().toISOString();
  if (status === "Ordered" && order.status === "Draft") {
    order.orderedAt = now;
  }
  if (status === "Received" && order.status !== "Received") {
    // The one transition with a real side effect: it actually restocks
    // inventory, so each item is only credited once even if this is called
    // again (defensive — the pending amount would already be zero).
    for (const item of order.items) {
      const pending = item.quantityOrdered - item.quantityReceived;
      if (pending > 0) await adjustInventoryQuantity(item.inventoryItemId, pending);
      item.quantityReceived = item.quantityOrdered;
    }
    order.receivedAt = now;
  }

  order.status = status;
  order.updatedAt = now;
  await store.save(doc);
  return order;
}
