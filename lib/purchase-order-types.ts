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
};

export const purchaseOrderStatuses: PurchaseOrderStatus[] = ["Draft", "Ordered", "Received", "Cancelled"];
