export type PharmacyDispenseStatus = "Draft" | "Dispensed" | "Cancelled";

export type PharmacyDispenseItem = {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type PharmacyDispenseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: PharmacyDispenseStatus;
  visitId: string;
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  service: string;
  items: PharmacyDispenseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: "Unpaid" | "Paid";
  paymentMethod?: "Cash" | "UPI" | "Card" | "Insurance" | "Other";
  notes?: string;
};

export const pharmacyDispenseStatuses: PharmacyDispenseStatus[] = ["Draft", "Dispensed", "Cancelled"];
