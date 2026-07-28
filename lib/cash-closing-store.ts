import "server-only";
import { collectionTotals } from "@/lib/billing-analytics";
import { listInvoices } from "@/lib/billing-store";
import { closingTotals, discountedOnDate, expectedTenders, statusAfterClose } from "@/lib/cash-closing-calc";
import type { CashClosing, TenderCount } from "@/lib/cash-closing-types";
import { closingTenders } from "@/lib/cash-closing-types";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";

type ClosingStore = {
  closings: CashClosing[];
  /** Doctor incentive rates for §30 revenue sharing, keyed by doctor name. */
  doctorIncentivePercents: Record<string, number>;
};

const docStore = createDocumentStore<ClosingStore>("cash-closings", (parsed) => {
  const doc = parsed as Partial<ClosingStore> | undefined;
  return {
    closings: Array.isArray(doc?.closings) ? (doc.closings as ClosingStore["closings"]) : [],
    doctorIncentivePercents:
      doc?.doctorIncentivePercents && typeof doc.doctorIncentivePercents === "object" ? (doc.doctorIncentivePercents as Record<string, number>) : {}
  };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listCashClosings() {
  return (await docStore.load()).closings;
}

export async function getCashClosing(date: string) {
  return (await docStore.load()).closings.find((closing) => closing.date === date) ?? null;
}

export async function doctorIncentivePercents() {
  return (await docStore.load()).doctorIncentivePercents;
}

export async function setDoctorIncentivePercent(doctor: string, percent: number) {
  const doc = await docStore.load();
  const name = normalizeText(doctor);
  if (!name) return { error: "A doctor name is required." };
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return { error: "Enter an incentive percentage between 0 and 100." };

  doc.doctorIncentivePercents[name] = percent;
  await docStore.save(doc);
  return { doctorIncentivePercents: doc.doctorIncentivePercents };
}

/**
 * The day's position as the ledger sees it, whether or not a close exists yet.
 *
 * Always recomputed from invoices: an expected figure cached at the moment a
 * close was opened would miss a payment taken five minutes later, and the
 * whole point is to compare the ledger against the drawer.
 */
export async function cashClosingPreview(date: string) {
  const invoices = await listInvoices();
  const totals = collectionTotals(invoices, { from: date, to: date });
  const existing = await getCashClosing(date);

  return {
    date,
    tenders: expectedTenders(invoices, date),
    refundedPaise: totals.refundedPaise,
    discountedPaise: discountedOnDate(invoices, date),
    collectedPaise: totals.collectedPaise,
    netPaise: totals.netPaise,
    existing
  };
}

export type SubmitClosingInput = {
  date: string;
  openingCashPaise: number;
  counted: Partial<Record<string, number>>;
  notes?: string;
  actingStaffName: string;
};

/**
 * Records a day close. Expected figures are re-derived at submission time from
 * the ledger, so what is stored is a real comparison rather than whatever the
 * screen was showing when it loaded.
 */
export async function submitCashClosing(input: SubmitClosingInput): Promise<{ closing: CashClosing; before: CashClosing | null } | { error: string }> {
  const date = normalizeText(input.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "A close needs a date in YYYY-MM-DD form." };

  const doc = await docStore.load();
  const existing = doc.closings.find((closing) => closing.date === date) ?? null;
  if (existing?.status === "Closed") return { error: `${date} is already closed and approved.` };

  const invoices = await listInvoices();
  const totals = collectionTotals(invoices, { from: date, to: date });

  const tenders: TenderCount[] = closingTenders.map((method) => ({
    method,
    expectedPaise: totals.byTender[method] ?? 0,
    countedPaise: Math.round(input.counted[method] ?? 0)
  }));

  const openingCashPaise = Math.max(0, Math.round(input.openingCashPaise));
  const computed = closingTotals(openingCashPaise, tenders);
  const now = new Date().toISOString();
  const before = existing ? structuredClone(existing) : null;

  const closing: CashClosing = {
    id: existing?.id ?? generateId("CLS"),
    date,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: statusAfterClose(computed.differencePaise),
    openingCashPaise,
    tenders,
    closingCashPaise: computed.closingCashPaise,
    differencePaise: computed.differencePaise,
    refundedPaise: totals.refundedPaise,
    discountedPaise: discountedOnDate(invoices, date),
    notes: normalizeText(input.notes) || undefined,
    closedBy: normalizeText(input.actingStaffName) || "Unknown",
    closedAt: now,
    // A resubmission starts a fresh approval — a previously signed-off
    // discrepancy must not carry over onto different figures.
    approvedBy: undefined,
    approvedAt: undefined,
    approvalNote: undefined
  };

  if (existing) doc.closings[doc.closings.indexOf(existing)] = closing;
  else doc.closings.unshift(closing);

  await docStore.save(doc);
  return { closing, before };
}

/** Supervisor sign-off on a day that did not reconcile. The person who closed it can never approve it. */
export async function approveCashClosing(input: { date: string; note?: string; actingStaffName: string }) {
  const doc = await docStore.load();
  const closing = doc.closings.find((entry) => entry.date === input.date);
  if (!closing) return { error: "No close found for that date." };
  if (closing.status === "Closed") return { error: "That day is already closed." };
  if (closing.status === "Open") return { error: "Submit the close before approving it." };

  const approver = normalizeText(input.actingStaffName) || "Unknown";
  if (closing.closedBy && closing.closedBy === approver) {
    return { error: "You closed this day, so someone else must approve the discrepancy." };
  }

  const before = structuredClone(closing);
  closing.status = "Closed";
  closing.approvedBy = approver;
  closing.approvedAt = new Date().toISOString();
  closing.approvalNote = normalizeText(input.note) || undefined;
  closing.updatedAt = closing.approvedAt;

  await docStore.save(doc);
  return { closing, before };
}
