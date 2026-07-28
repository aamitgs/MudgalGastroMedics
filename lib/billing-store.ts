import "server-only";
import { formatPaise, lineTotalPaise, outstandingPaise, paiseToRupeeString, withRecalculatedTotals } from "@/lib/billing-calc";
import type { Invoice, InvoiceLineDraft, InvoiceLineItem, InvoicePayment, InvoicePaymentMethod } from "@/lib/billing-types";
import { harvestEncounterCharges, type HarvestContext } from "@/lib/billing-sources";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { accrueAdmissionCharges } from "@/lib/ipd-billing";
import { listBeds, listIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { getOpdVisitById, listPatientOpdVisits, updateOpdVisit } from "@/lib/opd-store";
import type { OpdVisit } from "@/lib/opd-types";
import { listDispensesForVisit } from "@/lib/pharmacy-store";
import { listConsultationFeeRules, listServicePrices } from "@/lib/pricing-store";
import { listProcedureSchedules } from "@/lib/procedure-store";

type BillingStore = {
  invoices: Invoice[];
};

const docStore = createDocumentStore<BillingStore>("billing-invoices", (parsed) => {
  const doc = parsed as Partial<BillingStore> | undefined;
  return { invoices: Array.isArray(doc?.invoices) ? (doc.invoices as BillingStore["invoices"]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneKey(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * `MGM-INV-<yyyymmdd>-<nnn>`, sequenced within the day. Deliberately mirrors
 * the existing receipt-id format in lib/opd-store.ts so staff read one
 * numbering convention across both documents.
 */
function createInvoiceNo(invoices: Invoice[]) {
  const today = new Date().toISOString().slice(0, 10);
  const day = today.replaceAll("-", "");
  const todayCount = invoices.filter((invoice) => invoice.createdAt.slice(0, 10) === today).length + 1;
  return `MGM-INV-${day}-${String(todayCount).padStart(3, "0")}`;
}

/**
 * The legacy OPD field only knows five tenders; the invoice supports the eight
 * a hospital actually collects. Bank-rail methods that field has no slot for
 * collapse to "Other" — the precise tender is never lost, it stays on the
 * payment record itself.
 */
function toLegacyPaymentMethod(method: InvoicePaymentMethod): NonNullable<OpdVisit["paymentMethod"]> {
  if (method === "Cash" || method === "UPI" || method === "Card" || method === "Insurance") return method;
  return "Other";
}

/** The tender that settled most of the bill — what the single-value legacy field should show for a split payment. */
function primaryPaymentMethod(payments: InvoicePayment[]): InvoicePaymentMethod | undefined {
  if (!payments.length) return undefined;
  return payments.reduce((largest, payment) => (payment.amountPaise > largest.amountPaise ? payment : largest)).method;
}

/**
 * Keeps the four legacy OPD billing fields in step with the invoice, so the
 * billing table, analytics, reports, the invoice PDF and the patient-summary
 * outstanding figure all keep working unchanged while the invoice becomes the
 * real record. Write-through, never read-back: the invoice is the source of
 * truth from here on.
 */
async function syncVisitBilling(invoice: Invoice) {
  if (!invoice.visitId) return;

  const billingStatus: OpdVisit["billingStatus"] =
    invoice.status === "Paid" ? "Paid" : invoice.status === "Draft" || invoice.status === "Cancelled" ? "Not Started" : "Estimate Shared";
  const method = primaryPaymentMethod(invoice.payments);

  await updateOpdVisit({
    id: invoice.visitId,
    billingStatus,
    estimatedAmount: invoice.status === "Cancelled" ? "" : paiseToRupeeString(invoice.totalPaise),
    paymentMethod: method ? toLegacyPaymentMethod(method) : undefined
  });
}

export async function listInvoices() {
  return (await docStore.load()).invoices;
}

export async function getInvoiceById(id: string) {
  return (await docStore.load()).invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function listPatientInvoices(phone: string) {
  const key = normalizePhoneKey(phone);
  if (key.length < 6) return [];
  return (await docStore.load()).invoices.filter((invoice) => normalizePhoneKey(invoice.phone) === key);
}

export async function listInvoicesForVisit(visitId: string) {
  return (await docStore.load()).invoices.filter((invoice) => invoice.visitId === visitId);
}

/** What the patient still owes across every issued, uncancelled invoice. */
export async function patientOutstandingPaise(phone: string) {
  return outstandingPaise(await listPatientInvoices(phone));
}

function buildLineItem(input: InvoiceLineDraft, actor: string): InvoiceLineItem {
  const quantity = Number.isFinite(input.quantity) && input.quantity > 0 ? input.quantity : 1;
  const unitPricePaise = Math.max(0, Math.round(input.unitPricePaise));
  const discountPaise = Math.max(0, Math.round(input.discountPaise ?? 0));
  const taxPaise = Math.max(0, Math.round(input.taxPaise ?? 0));

  return {
    id: generateId("LN"),
    source: input.source,
    sourceRef: input.sourceRef || undefined,
    description: input.description,
    category: input.category,
    quantity,
    unitPricePaise,
    discountPaise,
    taxPaise,
    totalPaise: lineTotalPaise({ quantity, unitPricePaise, discountPaise, taxPaise }),
    addedAt: new Date().toISOString(),
    addedBy: actor
  };
}

export type CreateInvoiceInput = {
  visitId?: string;
  patientName?: string;
  phone?: string;
  patientId?: string;
  uhid?: string;
  admissionId?: string;
  department?: string;
  doctorName?: string;
  lineItems?: InvoiceLineDraft[];
  notes?: string;
  actingStaffName: string;
};

/**
 * Creates a Draft invoice. Drafts exist so the billing executive verifies
 * auto-generated lines before the bill becomes a demand for payment — nothing
 * is ever issued to a patient without a human confirming it.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<{ invoice: Invoice } | { error: string }> {
  const doc = await docStore.load();
  const now = new Date().toISOString();

  let patientName = normalizeText(input.patientName);
  let phone = normalizeText(input.phone);
  let patientId = normalizeText(input.patientId) || undefined;
  let uhid = normalizeText(input.uhid) || undefined;
  let department = normalizeText(input.department) || undefined;
  let doctorName = normalizeText(input.doctorName) || undefined;
  const visitId = normalizeText(input.visitId) || undefined;

  if (visitId) {
    const visit = await getOpdVisitById(visitId);
    if (!visit) return { error: "OPD visit not found." };

    // One live bill per visit: a second invoice against the same encounter is
    // the most common way a patient gets charged twice for one consultation.
    const existing = doc.invoices.find((invoice) => invoice.visitId === visitId && invoice.status !== "Cancelled");
    if (existing) return { error: `This visit already has invoice ${existing.invoiceNo}. Add charges to it instead of creating a second bill.` };

    patientName = patientName || visit.patientName;
    phone = phone || visit.phone;
    patientId = patientId ?? visit.patientId;
    uhid = uhid ?? visit.uhid;
    department = department ?? visit.service;
    doctorName = doctorName ?? visit.doctorName;
  }

  const admissionId = normalizeText(input.admissionId) || undefined;
  if (admissionId && (!patientName || !phone)) {
    const admission = (await listIpdAdmissions()).find((entry) => entry.id === admissionId);
    if (!admission) return { error: "Admission not found." };
    patientName = patientName || admission.patientName;
    phone = phone || admission.phone;
    patientId = patientId ?? admission.patientId;
    uhid = uhid ?? admission.uhid;
    department = department ?? `IPD — ${admission.ward}`;
    doctorName = doctorName ?? admission.admittingDoctor;
  }

  if (!patientName) return { error: "Patient name is required." };
  if (!phone) return { error: "Patient phone is required." };

  const actor = normalizeText(input.actingStaffName) || "Unknown";
  const lineItems = (input.lineItems ?? []).map((line) => buildLineItem(line, actor));

  const invoice = withRecalculatedTotals({
    id: generateId("INV"),
    invoiceNo: createInvoiceNo(doc.invoices),
    createdAt: now,
    updatedAt: now,
    status: "Draft",
    patientId,
    uhid,
    patientName,
    phone,
    visitId,
    admissionId,
    department,
    doctorName,
    lineItems,
    payments: [],
    refunds: [],
    subtotalPaise: 0,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: 0,
    paidPaise: 0,
    refundedPaise: 0,
    balancePaise: 0,
    notes: normalizeText(input.notes) || undefined
  });

  doc.invoices.unshift(invoice);
  await docStore.save(doc);
  return { invoice };
}

async function mutateInvoice(
  id: string,
  mutate: (invoice: Invoice) => { error: string } | undefined
): Promise<{ invoice: Invoice; before: Invoice } | { error: string }> {
  const doc = await docStore.load();
  const index = doc.invoices.findIndex((invoice) => invoice.id === id);
  if (index === -1) return { error: "Invoice not found." };

  const before = structuredClone(doc.invoices[index]);
  const failure = mutate(doc.invoices[index]);
  if (failure) return failure;

  doc.invoices[index] = withRecalculatedTotals(doc.invoices[index]);
  doc.invoices[index].updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return { invoice: doc.invoices[index], before };
}

/**
 * Adds charges to an invoice. Lines carrying a `sourceRef` are idempotent —
 * re-running a source sync (pharmacy dispense, lab order, procedure) tops up
 * only what is genuinely new, so an auto-generated bill can be refreshed
 * safely as an encounter progresses.
 */
export async function addInvoiceLineItems(id: string, lines: InvoiceLineDraft[], actingStaffName: string) {
  const actor = normalizeText(actingStaffName) || "Unknown";
  let skipped = 0;

  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled and can't be changed." };
    if (invoice.status === "Paid") return { error: "This invoice is fully paid. Raise a new invoice for additional charges." };

    for (const line of lines) {
      const duplicate =
        line.sourceRef && invoice.lineItems.some((existing) => existing.source === line.source && existing.sourceRef === line.sourceRef);
      if (duplicate) {
        skipped += 1;
        continue;
      }
      invoice.lineItems.push(buildLineItem(line, actor));
    }
    return undefined;
  });

  if ("error" in result) return result;
  return { ...result, skipped };
}

export async function removeInvoiceLineItem(id: string, lineItemId: string) {
  return mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled and can't be changed." };
    if (invoice.paidPaise > 0) return { error: "Payments have been collected against this invoice. Cancel it and re-bill instead of editing charges." };
    const index = invoice.lineItems.findIndex((line) => line.id === lineItemId);
    if (index === -1) return { error: "Charge not found on this invoice." };
    invoice.lineItems.splice(index, 1);
    return undefined;
  });
}

/** Draft → Issued. The bill becomes a demand for payment and its charges are frozen for payment collection. */
export async function issueInvoice(id: string, actingStaffName: string) {
  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled." };
    if (invoice.status !== "Draft") return { error: "This invoice has already been issued." };
    if (!invoice.lineItems.length) return { error: "Add at least one charge before issuing this invoice." };
    invoice.status = "Issued";
    invoice.issuedAt = new Date().toISOString();
    invoice.issuedBy = normalizeText(actingStaffName) || "Unknown";
    return undefined;
  });

  if (!("error" in result)) await syncVisitBilling(result.invoice);
  return result;
}

export type RecordPaymentInput = {
  method: InvoicePaymentMethod;
  amountPaise: number;
  reference?: string;
  note?: string;
  actingStaffName: string;
};

/**
 * Records one tender against an invoice. Multiple calls are how a split
 * payment (part cash, part UPI) and an instalment are both represented — the
 * invoice keeps every tender rather than one collapsed payment method.
 */
export async function recordInvoicePayment(id: string, input: RecordPaymentInput) {
  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled and can't take payments." };
    if (invoice.status === "Draft") return { error: "Issue this invoice before collecting payment against it." };
    if (invoice.status === "Paid") return { error: "This invoice is already fully paid." };

    const amountPaise = Math.round(input.amountPaise);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) return { error: "Enter a payment amount greater than zero." };
    // Overpayment is rejected rather than parked: until the advance wallet
    // exists there is nowhere for surplus money to legitimately sit.
    if (amountPaise > invoice.balancePaise) {
      return { error: `That is more than the ${formatPaise(invoice.balancePaise)} still outstanding on this invoice.` };
    }

    invoice.payments.push({
      id: generateId("PY"),
      method: input.method,
      amountPaise,
      reference: normalizeText(input.reference) || undefined,
      receivedAt: new Date().toISOString(),
      receivedBy: normalizeText(input.actingStaffName) || "Unknown",
      note: normalizeText(input.note) || undefined
    });
    return undefined;
  });

  if (!("error" in result)) await syncVisitBilling(result.invoice);
  return result;
}

/**
 * Cancels an invoice. Invoices are never deleted — a cancelled bill stays in
 * the ledger with its reason and approver, because a financial document that
 * can vanish is not auditable.
 */
export async function cancelInvoice(id: string, reason: string, actingStaffName: string) {
  const trimmedReason = normalizeText(reason);
  if (!trimmedReason) return { error: "A cancellation reason is required." };

  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is already cancelled." };
    // Money already collected has to go back through the refund workflow
    // first; cancelling around it would leave the cash unaccounted for.
    if (invoice.paidPaise > 0) return { error: "Refund the payments collected against this invoice before cancelling it." };
    invoice.status = "Cancelled";
    invoice.cancelledAt = new Date().toISOString();
    invoice.cancelledBy = normalizeText(actingStaffName) || "Unknown";
    invoice.cancelReason = trimmedReason;
    return undefined;
  });

  if (!("error" in result)) await syncVisitBilling(result.invoice);
  return result;
}

/**
 * Gathers every charge the encounter behind this invoice has generated and
 * adds whatever is not already on it (Track 5.3).
 *
 * Deliberately additive and repeatable rather than a one-shot generation at
 * invoice creation: an encounter accretes charges over hours — labs get
 * ordered, medicines dispensed, a procedure performed — so the billing desk
 * re-syncs when the patient comes to pay, and only genuinely new charges land.
 *
 * Returns what was skipped and why alongside the invoice, so nothing is
 * silently omitted from a bill.
 */
export async function syncInvoiceCharges(id: string, actingStaffName: string, context: HarvestContext = {}) {
  const invoice = await getInvoiceById(id);
  if (!invoice) return { error: "Invoice not found." };
  if (!invoice.visitId) return { error: "This invoice isn't linked to a visit, so there are no clinical charges to pull." };

  const visit = await getOpdVisitById(invoice.visitId);
  if (!visit) return { error: "The visit behind this invoice no longer exists." };

  const [allLabOrders, dispenses, allProcedures, services, consultationFees, priorVisits] = await Promise.all([
    listLabOrders(),
    listDispensesForVisit(visit),
    listProcedureSchedules(),
    listServicePrices(),
    listConsultationFeeRules(),
    listPatientOpdVisits(visit.phone)
  ]);

  // The most recent *earlier* visit is what decides new vs follow-up.
  const previousVisitAt = priorVisits
    .filter((candidate) => candidate.id !== visit.id && candidate.status !== "Cancelled" && candidate.createdAt < visit.createdAt)
    .map((candidate) => candidate.createdAt)
    .sort()
    .pop();

  const harvest = harvestEncounterCharges(
    {
      visit,
      labOrders: allLabOrders.filter((order) => order.visitId === visit.id),
      dispenses,
      procedures: allProcedures.filter((schedule) => schedule.visitId === visit.id)
    },
    { services, consultationFees },
    { ...context, previousVisitAt }
  );

  const result = await addInvoiceLineItems(id, harvest.charges, actingStaffName);
  if ("error" in result) return result;

  const addedCount = result.invoice.lineItems.length - result.before.lineItems.length;
  return { ...result, added: addedCount, alreadyBilled: result.skipped, skipped: harvest.skipped };
}

/**
 * Records an approved refund against a bill (Track 5.6, §22). Never deletes
 * anything: the payment that was collected stays on the record and the refund
 * sits beside it, so the invoice tells the whole story of money in and out.
 *
 * Only reachable from an approved request — `approvalId` is required, which
 * makes an unapproved refund structurally impossible rather than merely
 * discouraged.
 */
export async function recordInvoiceRefund(
  id: string,
  input: { amountPaise: number; method: InvoicePaymentMethod; reason: string; approvalId: string; actingStaffName: string }
) {
  const reason = normalizeText(input.reason);
  if (!reason) return { error: "A refund reason is required." };
  if (!input.approvalId) return { error: "A refund needs an approved request behind it." };

  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled." };

    const amountPaise = Math.round(input.amountPaise);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) return { error: "Enter a refund amount greater than zero." };
    // Only money actually collected can go back out.
    if (amountPaise > invoice.paidPaise) {
      return { error: `Only ${formatPaise(invoice.paidPaise)} has been collected on this invoice.` };
    }

    invoice.refunds = [
      ...(invoice.refunds ?? []),
      {
        id: generateId("RFD"),
        amountPaise,
        method: input.method,
        reason,
        refundedAt: new Date().toISOString(),
        refundedBy: normalizeText(input.actingStaffName) || "Unknown",
        approvalId: input.approvalId
      }
    ];
    return undefined;
  });

  if (!("error" in result)) await syncVisitBilling(result.invoice);
  return result;
}

/**
 * Accrues an inpatient stay onto its bill (Track 5.9, §4).
 *
 * Safe to run repeatedly — every day of stay carries its own `sourceRef`, so a
 * mid-stay interim bill and a final discharge bill are the same operation run
 * at different times, and only genuinely new days land.
 */
export async function syncAdmissionCharges(id: string, actingStaffName: string, context: HarvestContext = {}) {
  const invoice = await getInvoiceById(id);
  if (!invoice) return { error: "Invoice not found." };
  if (!invoice.admissionId) return { error: "This invoice isn't linked to an admission, so there are no stay charges to accrue." };

  const [admissions, beds, services] = await Promise.all([listIpdAdmissions(), listBeds(), listServicePrices()]);
  const admission = admissions.find((entry) => entry.id === invoice.admissionId);
  if (!admission) return { error: "The admission behind this invoice no longer exists." };

  const accrual = accrueAdmissionCharges(admission, beds.find((bed) => bed.id === admission.bedId) ?? null, services, { tier: context.tier });

  const result = await addInvoiceLineItems(id, accrual.charges, actingStaffName);
  if ("error" in result) return result;

  const addedCount = result.invoice.lineItems.length - result.before.lineItems.length;
  return { ...result, added: addedCount, alreadyBilled: result.skipped, skipped: accrual.skipped, daysCharged: accrual.daysCharged };
}

/** Invoice-level discount. Approval routing lands in a later track; the reason is mandatory from day one. */
export async function setInvoiceDiscount(id: string, discountPaise: number, reason: string) {
  const trimmedReason = normalizeText(reason);
  const result = await mutateInvoice(id, (invoice) => {
    if (invoice.status === "Cancelled") return { error: "This invoice is cancelled and can't be changed." };
    if (invoice.status === "Paid") return { error: "This invoice is fully paid — a discount now would need a refund instead." };

    const amount = Math.max(0, Math.round(discountPaise));
    if (amount > 0 && !trimmedReason) return { error: "A discount reason is required." };
    if (amount > invoice.subtotalPaise) return { error: "A discount can't exceed the bill total." };
    if (invoice.subtotalPaise - amount < invoice.paidPaise) {
      // Discounting below what has already been collected would create a
      // negative balance the refund workflow doesn't exist to handle yet.
      return { error: `That discount would take the bill below the ${formatPaise(invoice.paidPaise)} already collected.` };
    }

    invoice.discountPaise = amount;
    invoice.discountReason = amount > 0 ? trimmedReason : undefined;
    return undefined;
  });

  if (!("error" in result)) await syncVisitBilling(result.invoice);
  return result;
}
