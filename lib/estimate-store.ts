import "server-only";
import { lineTotalPaise } from "@/lib/billing-calc";
import { addInvoiceLineItems, createInvoice, listInvoicesForVisit } from "@/lib/billing-store";
import type { InvoiceLineDraft, InvoiceLineItem } from "@/lib/billing-types";
import { createDocumentStore } from "@/lib/document-store";
import { calculateEstimateTotals, canConvert, effectiveStatus } from "@/lib/estimate-calc";
import type { AcceptanceMethod, Estimate } from "@/lib/estimate-types";
import { generateId } from "@/lib/id";

type EstimateStore = {
  estimates: Estimate[];
};

const docStore = createDocumentStore<EstimateStore>("billing-estimates", (parsed) => {
  const doc = parsed as Partial<EstimateStore> | undefined;
  return { estimates: Array.isArray(doc?.estimates) ? (doc.estimates as EstimateStore["estimates"]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function patientKey(phone: string) {
  return phone.replace(/\D/g, "");
}

/** `MGM-EST-<yyyymmdd>-<nnn>`, matching the invoice and receipt numbering staff already read. */
function createEstimateNo(estimates: Estimate[]) {
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = estimates.filter((estimate) => estimate.createdAt.slice(0, 10) === today).length + 1;
  return `MGM-EST-${today.replaceAll("-", "")}-${String(todayCount).padStart(3, "0")}`;
}

function withTotals(estimate: Estimate): Estimate {
  return { ...estimate, ...calculateEstimateTotals(estimate.lineItems, estimate.discountPaise) };
}

export async function listEstimates() {
  return (await docStore.load()).estimates;
}

export async function getEstimateById(id: string) {
  return (await docStore.load()).estimates.find((estimate) => estimate.id === id) ?? null;
}

export async function listPatientEstimates(phone: string) {
  const key = patientKey(phone);
  if (key.length < 6) return [];
  return (await docStore.load()).estimates.filter((estimate) => patientKey(estimate.phone) === key);
}

function buildLine(input: InvoiceLineDraft, actor: string): InvoiceLineItem {
  const quantity = Number.isFinite(input.quantity) && input.quantity > 0 ? input.quantity : 1;
  const unitPricePaise = Math.max(0, Math.round(input.unitPricePaise));
  const discountPaise = Math.max(0, Math.round(input.discountPaise ?? 0));
  const taxPaise = Math.max(0, Math.round(input.taxPaise ?? 0));

  return {
    id: generateId("EL"),
    source: input.source,
    sourceRef: input.sourceRef,
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

export type CreateEstimateInput = {
  patientName: string;
  phone: string;
  uhid?: string;
  patientId?: string;
  visitId?: string;
  department?: string;
  doctorName?: string;
  lineItems: InvoiceLineDraft[];
  discountPaise?: number;
  validUntil?: string;
  notes?: string;
  actingStaffName: string;
};

export async function createEstimate(input: CreateEstimateInput): Promise<{ estimate: Estimate } | { error: string }> {
  if (!normalizeText(input.patientName)) return { error: "Patient name is required." };
  if (!normalizeText(input.phone)) return { error: "Patient phone is required." };
  if (!input.lineItems.length) return { error: "Add at least one item to the estimate." };

  const doc = await docStore.load();
  const actor = normalizeText(input.actingStaffName) || "Unknown";
  const now = new Date().toISOString();

  const estimate = withTotals({
    id: generateId("EST"),
    estimateNo: createEstimateNo(doc.estimates),
    createdAt: now,
    updatedAt: now,
    status: "Draft",
    patientName: normalizeText(input.patientName),
    phone: normalizeText(input.phone),
    uhid: normalizeText(input.uhid) || undefined,
    patientId: normalizeText(input.patientId) || undefined,
    visitId: normalizeText(input.visitId) || undefined,
    department: normalizeText(input.department) || undefined,
    doctorName: normalizeText(input.doctorName) || undefined,
    lineItems: input.lineItems.map((line) => buildLine(line, actor)),
    subtotalPaise: 0,
    discountPaise: Math.max(0, Math.round(input.discountPaise ?? 0)),
    totalPaise: 0,
    validUntil: normalizeText(input.validUntil) || undefined,
    notes: normalizeText(input.notes) || undefined,
    createdBy: actor
  });

  doc.estimates.unshift(estimate);
  await docStore.save(doc);
  return { estimate };
}

async function mutate(id: string, apply: (estimate: Estimate) => { error: string } | undefined) {
  const doc = await docStore.load();
  const index = doc.estimates.findIndex((estimate) => estimate.id === id);
  if (index === -1) return { error: "Estimate not found." };

  const before = structuredClone(doc.estimates[index]);
  const failure = apply(doc.estimates[index]);
  if (failure) return failure;

  doc.estimates[index] = withTotals(doc.estimates[index]);
  doc.estimates[index].updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return { estimate: doc.estimates[index], before };
}

/** Marks the quote as given to the patient — the point from which they can accept it. */
export async function shareEstimate(id: string) {
  return mutate(id, (estimate) => {
    if (estimate.status === "Converted") return { error: "This estimate has already been billed." };
    if (estimate.status === "Declined") return { error: "The patient declined this estimate." };
    estimate.status = "Shared";
    estimate.sharedAt ||= new Date().toISOString();
    return undefined;
  });
}

/**
 * Records the patient's acceptance (§30 "Patient Approval, Digital Signature").
 *
 * The patient's own name is required: it is the acceptance record, and an
 * acceptance nobody can attribute is not one. This is deliberately not
 * presented as a cryptographic signature.
 */
export async function acceptEstimate(input: {
  id: string;
  patientSignatureName: string;
  method: AcceptanceMethod;
  actingStaffName: string;
}) {
  const signature = normalizeText(input.patientSignatureName);
  if (!signature) return { error: "Record the patient's name as given, as the acceptance record." };

  return mutate(input.id, (estimate) => {
    if (estimate.status === "Converted") return { error: "This estimate has already been billed." };
    if (estimate.status === "Declined") return { error: "The patient declined this estimate." };
    estimate.status = "Accepted";
    estimate.acceptedAt = new Date().toISOString();
    estimate.acceptedBy = normalizeText(input.actingStaffName) || "Unknown";
    estimate.acceptanceMethod = input.method;
    estimate.patientSignatureName = signature;
    return undefined;
  });
}

export async function declineEstimate(id: string, reason: string) {
  const trimmed = normalizeText(reason);
  if (!trimmed) return { error: "A reason is required." };

  return mutate(id, (estimate) => {
    if (estimate.status === "Converted") return { error: "This estimate has already been billed." };
    estimate.status = "Declined";
    estimate.declinedAt = new Date().toISOString();
    estimate.declineReason = trimmed;
    return undefined;
  });
}

/**
 * Turns an accepted estimate into a real Draft invoice, carrying the quoted
 * lines and discount across unchanged — so what was quoted and what is billed
 * are provably the same numbers.
 *
 * The invoice is created before the estimate is marked Converted: if invoice
 * creation fails the estimate stays convertible, which is the safe direction.
 */
export async function convertEstimateToInvoice(input: { id: string; actingStaffName: string }) {
  const estimate = await getEstimateById(input.id);
  if (!estimate) return { error: "Estimate not found." };

  const allowed = canConvert({ ...estimate, status: effectiveStatus(estimate) });
  if (!allowed.ok) return { error: allowed.error };

  const lineItems = estimate.lineItems.map((line) => ({
    source: line.source,
    sourceRef: line.sourceRef,
    description: line.description,
    category: line.category,
    quantity: line.quantity,
    unitPricePaise: line.unitPricePaise,
    discountPaise: line.discountPaise,
    taxPaise: line.taxPaise
  }));

  // The visit may already have a live bill (Track 5.0 allows only one). Adding
  // the quoted lines to it is what a billing desk would do anyway — raising a
  // second invoice for one encounter is the duplicate-billing case that
  // invariant exists to prevent.
  if (estimate.visitId) {
    const existing = (await listInvoicesForVisit(estimate.visitId)).find((invoice) => invoice.status !== "Cancelled");
    if (existing) {
      const added = await addInvoiceLineItems(existing.id, lineItems, input.actingStaffName);
      if ("error" in added) return added;

      const merged = await mutate(input.id, (entry) => {
        entry.status = "Converted";
        entry.convertedInvoiceId = added.invoice.id;
        entry.convertedInvoiceNo = added.invoice.invoiceNo;
        entry.convertedAt = new Date().toISOString();
        return undefined;
      });
      if ("error" in merged) return merged;
      return { estimate: merged.estimate, invoice: added.invoice };
    }
  }

  const created = await createInvoice({
    visitId: estimate.visitId,
    patientName: estimate.patientName,
    phone: estimate.phone,
    uhid: estimate.uhid,
    patientId: estimate.patientId,
    department: estimate.department,
    doctorName: estimate.doctorName,
    lineItems,
    notes: `Converted from estimate ${estimate.estimateNo}`,
    actingStaffName: input.actingStaffName
  });
  if ("error" in created) return created;

  const updated = await mutate(input.id, (entry) => {
    entry.status = "Converted";
    entry.convertedInvoiceId = created.invoice.id;
    entry.convertedInvoiceNo = created.invoice.invoiceNo;
    entry.convertedAt = new Date().toISOString();
    return undefined;
  });
  if ("error" in updated) return updated;

  return { estimate: updated.estimate, invoice: created.invoice };
}
