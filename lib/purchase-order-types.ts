export type PurchaseOrderStatus = "Draft" | "Ordered" | "Received" | "Cancelled";

export type PurchaseOrderItem = {
  inventoryItemId: string;
  name: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost?: number;
};

export type PurchaseOrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: PurchaseOrderStatus;
  vendor: string;
  items: PurchaseOrderItem[];
  notes?: string;
  orderedAt?: string;
  receivedAt?: string;
  createdByRole?: string;
  /** ISO date (YYYY-MM-DD). When set and status is still "Ordered" past this date, the order is flagged overdue. */
  expectedDeliveryDate?: string;
};

export const purchaseOrderStatuses: PurchaseOrderStatus[] = ["Draft", "Ordered", "Received", "Cancelled"];

/** Only an Ordered (not yet Received/Cancelled) order with a past expected delivery date counts as overdue. */
export function isPurchaseOrderOverdue(order: Pick<PurchaseOrderRecord, "status" | "expectedDeliveryDate">, now = new Date()) {
  if (order.status !== "Ordered" || !order.expectedDeliveryDate) return false;
  const expected = new Date(`${order.expectedDeliveryDate}T23:59:59`);
  return !Number.isNaN(expected.getTime()) && expected.getTime() < now.getTime();
}
