/**
 * The invoice entity the billing module was missing (Track 5.0).
 *
 * Before this, "a bill" was four fields on an OPD visit — billingStatus,
 * estimatedAmount (free text), a single paymentMethod and receiptId — which
 * made itemisation, split payments, part-payment, per-line discounts and any
 * non-OPD charge structurally unrepresentable. Those four fields stay exactly
 * as they are and keep being written (see lib/billing-store.ts), so every
 * existing consumer — the billing table, analytics, reports, the invoice PDF
 * and the patient-summary outstanding figure — is unaffected.
 *
 * Money is integer paise throughout this module. Rupee floats accumulate
 * rounding error across line items and part-payments, and a hospital ledger
 * that does not reconcile to the rupee is a compliance problem rather than a
 * display bug. Conversion happens only at the edges, in lib/billing-calc.ts.
 */

export type InvoiceStatus = "Draft" | "Issued" | "Partially Paid" | "Paid" | "Cancelled";

/** Which clinical/operational module a charge originated from — drives revenue-by-department reporting. */
export type InvoiceSource = "OPD" | "IPD" | "Pharmacy" | "Laboratory" | "Procedure" | "Package" | "Manual";

export type InvoicePaymentMethod =
  | "Cash"
  | "UPI"
  | "Card"
  | "Net Banking"
  | "Wallet"
  | "Cheque"
  | "Insurance"
  | "Other";

export type InvoiceLineItem = {
  id: string;
  source: InvoiceSource;
  /**
   * Id of the originating record (pharmacy dispense, lab order, procedure...).
   * Together with `source` this is the idempotency key: re-syncing a source
   * never adds the same charge twice, which is also the foundation the
   * duplicate-charge check builds on.
   */
  sourceRef?: string;
  description: string;
  /** Revenue category for reporting — e.g. "Consultation", "Endoscopy", "Medicines". */
  category: string;
  quantity: number;
  unitPricePaise: number;
  discountPaise: number;
  taxPaise: number;
  /**
   * Frozen at the moment the line was added. Historical invoices must never
   * re-derive from a price list that has since changed.
   */
  totalPaise: number;
  addedAt: string;
  addedBy: string;
};

export type InvoicePayment = {
  id: string;
  method: InvoicePaymentMethod;
  amountPaise: number;
  /** UPI txn id, cheque number, card auth code — whatever reconciles this tender at day close. */
  reference?: string;
  receivedAt: string;
  receivedBy: string;
  note?: string;
};

/**
 * A charge before it becomes a line item — what callers hand to the store,
 * and what the auto-generation layer (lib/billing-sources.ts) produces.
 * Lives here rather than on the store so pure, client-safe code can build one.
 */
export type InvoiceLineDraft = {
  source: InvoiceSource;
  sourceRef?: string;
  description: string;
  category: string;
  quantity: number;
  unitPricePaise: number;
  discountPaise?: number;
  taxPaise?: number;
};

/**
 * Money returned to the patient against this invoice (Track 5.6, §22).
 * Recorded as its own entry rather than a negative payment: a refund has an
 * approval behind it and a reason of its own, and netting it into the payment
 * list would hide both.
 */
export type InvoiceRefund = {
  id: string;
  amountPaise: number;
  method: InvoicePaymentMethod;
  reason: string;
  refundedAt: string;
  refundedBy: string;
  /** The approval that authorised it — a refund never exists without one. */
  approvalId: string;
};

export type Invoice = {
  id: string;
  /** Human-facing number printed on the invoice; unique per day-sequence. */
  invoiceNo: string;
  createdAt: string;
  updatedAt: string;
  status: InvoiceStatus;
  /**
   * Patient identity is denormalized onto the invoice on purpose: a financial
   * document must stay readable exactly as issued even if the patient record
   * is later corrected or merged.
   */
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  visitId?: string;
  /**
   * The OPD encounter's register number, stamped on at creation for the same
   * reason the patient identity above is. Undefined on IPD bills, and on OPD
   * bills raised before visit numbers existed — those resolve it from the
   * visit at render time instead.
   */
  visitNo?: string;
  admissionId?: string;
  /**
   * The stay's register number, stamped on at creation for the same reason the
   * patient identity above is: a bill must keep citing the admission it was
   * raised for, readable exactly as issued. Undefined on OPD bills, and on IPD
   * bills raised before admission numbers existed — those resolve it from the
   * admission at render time instead.
   */
  admissionNo?: string;
  department?: string;
  doctorName?: string;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  /** Undefined on invoices raised before refunds existed; treated as empty. */
  refunds?: InvoiceRefund[];
  subtotalPaise: number;
  /** Invoice-level discount, applied on top of any per-line discounts. */
  discountPaise: number;
  discountReason?: string;
  taxPaise: number;
  totalPaise: number;
  /** Net of refunds — what the hospital has actually kept. */
  paidPaise: number;
  refundedPaise: number;
  balancePaise: number;
  issuedAt?: string;
  issuedBy?: string;
  /** Cancelled invoices are retained forever — cancellation is a state, never a delete. */
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  notes?: string;
};

export const invoiceStatuses: InvoiceStatus[] = ["Draft", "Issued", "Partially Paid", "Paid", "Cancelled"];

export const invoiceSources: InvoiceSource[] = ["OPD", "IPD", "Pharmacy", "Laboratory", "Procedure", "Package", "Manual"];

export const invoicePaymentMethods: InvoicePaymentMethod[] = [
  "Cash",
  "UPI",
  "Card",
  "Net Banking",
  "Wallet",
  "Cheque",
  "Insurance",
  "Other"
];
