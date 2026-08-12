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
  /**
   * This dispense's own register number — PHA-2026-00001 — issued once and
   * never reissued. One visit can be dispensed against more than once, so the
   * encounter's number cannot identify a single dispense. Optional until
   * scripts/backfill-register-numbers.mjs has run.
   */
  dispenseNo?: string;
  createdAt: string;
  updatedAt: string;
  status: PharmacyDispenseStatus;
  visitId: string;
  /** The encounter this dispense came out of, denormalized like the patient identity below. */
  visitNo?: string;
  /** The originating visit's queue position that day — repeats afterwards; dispenseNo is this record's identity. */
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
