import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { getOpdVisitById } from "@/lib/opd-store";
import type { ExternalReferral, ExternalReferralStatus, ExternalReferralType } from "@/lib/external-referral-types";

type ExternalReferralStore = {
  referrals: ExternalReferral[];
};

const docStore = createDocumentStore<ExternalReferralStore>("external-referrals", (parsed) => {
  const doc = parsed as Partial<ExternalReferralStore> | undefined;
  return { referrals: Array.isArray(doc?.referrals) ? (doc.referrals as ExternalReferralStore["referrals"]) : [] };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function listExternalReferrals() {
  const doc = await docStore.load();
  return doc.referrals;
}

export async function getExternalReferralById(id: string) {
  const doc = await docStore.load();
  return doc.referrals.find((item) => item.id === id) ?? null;
}

export async function createExternalReferral(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const visitId = normalizeText(input.visitId);
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { error: "OPD visit not found." };

  const type = normalizeText(input.type) === "Pathology" ? "Pathology" : "Radiology";
  const testName = normalizeText(input.testName);
  if (!testName) return { error: "A test/scan name is required." };

  const now = new Date().toISOString();
  const referral: ExternalReferral = {
    id: `EXT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    visitId: visit.id,
    token: visit.token,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    type: type as ExternalReferralType,
    testName,
    facilityName: normalizeText(input.facilityName),
    priority: normalizeText(input.priority) === "Urgent" ? "Urgent" : "Routine",
    status: "Ordered",
    resultSummary: "",
    amount: normalizeNumber(input.amount),
    paymentStatus: normalizeText(input.paymentStatus) === "Paid" ? "Paid" : "Unpaid",
    notes: normalizeText(input.notes)
  };

  doc.referrals.unshift(referral);
  await docStore.save(doc);
  return { referral };
}

export async function updateExternalReferral(input: {
  id: string;
  status?: ExternalReferralStatus;
  facilityName?: string;
  resultSummary?: string;
  paymentStatus?: ExternalReferral["paymentStatus"];
  amount?: number;
  notes?: string;
  /** Reviewing doctor's judgment call — force-mark (or unmark) the result as critical. */
  criticalManual?: boolean;
  /** Doctor sign-off on a critical result; recorded, and clears the active alert. */
  acknowledgeCriticalBy?: string;
}) {
  const doc = await docStore.load();
  const referral = doc.referrals.find((item) => item.id === input.id);
  if (!referral) return null;

  if (input.status) referral.status = input.status;
  if (typeof input.facilityName === "string") referral.facilityName = input.facilityName.trim();
  if (typeof input.resultSummary === "string") referral.resultSummary = input.resultSummary.trim();
  if (input.paymentStatus) referral.paymentStatus = input.paymentStatus;
  if (typeof input.amount === "number" && Number.isFinite(input.amount)) referral.amount = input.amount;
  if (typeof input.notes === "string") referral.notes = input.notes.trim();

  if (typeof input.criticalManual === "boolean") {
    referral.criticalFlag = input.criticalManual || undefined;
    referral.criticalReasons = input.criticalManual ? ["Marked critical by reviewing doctor."] : undefined;
    if (!input.criticalManual) {
      referral.criticalAcknowledgedBy = undefined;
      referral.criticalAcknowledgedAt = undefined;
    }
  }

  if (input.acknowledgeCriticalBy && referral.criticalFlag) {
    referral.criticalAcknowledgedBy = input.acknowledgeCriticalBy;
    referral.criticalAcknowledgedAt = new Date().toISOString();
  }

  referral.updatedAt = new Date().toISOString();

  await docStore.save(doc);
  return referral;
}
