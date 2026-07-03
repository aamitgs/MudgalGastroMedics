import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { listIpdAdmissions } from "@/lib/ipd-store";
import { getOpdVisitById } from "@/lib/opd-store";
import type { AccountEntry, AccountEntryType, InsuranceClaim, InsuranceClaimStatus } from "@/lib/finance-types";

type FinanceStore = {
  claims: InsuranceClaim[];
  entries: AccountEntry[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmFinanceStore?: FinanceStore;
};

const storeFile = join(process.cwd(), ".data", "finance.json");

function readStoreFromDisk(): FinanceStore {
  try {
    if (!existsSync(storeFile)) return { claims: [], entries: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<FinanceStore>;
    return {
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : []
    };
  } catch {
    return { claims: [], entries: [] };
  }
}

function writeStoreToDisk(store: FinanceStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmFinanceStore ??= readStoreFromDisk();
  return globalStore.__mgmFinanceStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function listInsuranceClaims() {
  return getStore().claims;
}

export function listPatientInsuranceClaims(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return getStore().claims.filter((claim) => {
    const claimPhone = claim.phone.replace(/\D/g, "");
    return claimPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(claimPhone);
  });
}

export function listAccountEntries() {
  return getStore().entries;
}

export function createInsuranceClaim(input: Record<string, unknown>) {
  const admissionId = normalizeText(input.admissionId);
  const visitId = normalizeText(input.visitId);
  const admission = admissionId ? listIpdAdmissions().find((item) => item.id === admissionId) : null;
  const visit = visitId ? getOpdVisitById(visitId) : null;
  const source = admission || visit;
  if (!source) return { error: "Select an IPD admission or OPD visit." };

  const insurer = normalizeText(input.insurer);
  if (!insurer) return { error: "Insurer is required." };

  const now = new Date().toISOString();
  const claim: InsuranceClaim = {
    id: `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    admissionId: admission?.id,
    visitId: visit?.id || admission?.visitId,
    patientId: source.patientId,
    uhid: source.uhid,
    patientName: source.patientName,
    phone: source.phone,
    insurer,
    tpa: normalizeText(input.tpa),
    policyNumber: normalizeText(input.policyNumber),
    claimNumber: normalizeText(input.claimNumber),
    requestedAmount: normalizeNumber(input.requestedAmount),
    approvedAmount: normalizeNumber(input.approvedAmount),
    settledAmount: normalizeNumber(input.settledAmount),
    status: "Draft",
    documents: normalizeText(input.documents),
    notes: normalizeText(input.notes)
  };

  getStore().claims.unshift(claim);
  writeStoreToDisk(getStore());
  return { claim };
}

export function updateInsuranceClaim(input: {
  id: string;
  status?: InsuranceClaimStatus;
  requestedAmount?: number;
  approvedAmount?: number;
  settledAmount?: number;
  claimNumber?: string;
  documents?: string;
  notes?: string;
}) {
  const claim = getStore().claims.find((item) => item.id === input.id);
  if (!claim) return null;
  if (input.status) claim.status = input.status;
  if (typeof input.requestedAmount === "number" && Number.isFinite(input.requestedAmount)) claim.requestedAmount = input.requestedAmount;
  if (typeof input.approvedAmount === "number" && Number.isFinite(input.approvedAmount)) claim.approvedAmount = input.approvedAmount;
  if (typeof input.settledAmount === "number" && Number.isFinite(input.settledAmount)) claim.settledAmount = input.settledAmount;
  if (typeof input.claimNumber === "string") claim.claimNumber = input.claimNumber.trim();
  if (typeof input.documents === "string") claim.documents = input.documents.trim();
  if (typeof input.notes === "string") claim.notes = input.notes.trim();
  claim.updatedAt = new Date().toISOString();
  writeStoreToDisk(getStore());
  return claim;
}

export function createAccountEntry(input: Record<string, unknown>) {
  const amount = normalizeNumber(input.amount);
  const category = normalizeText(input.category);
  if (!category || amount <= 0) return { error: "Category and valid amount are required." };

  const now = new Date().toISOString();
  const entry: AccountEntry = {
    id: `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    date: normalizeText(input.date) || now.slice(0, 10),
    type: normalizeText(input.type) as AccountEntryType || "Expense",
    category,
    amount,
    method: normalizeText(input.method) as AccountEntry["method"] || "Cash",
    reference: normalizeText(input.reference),
    party: normalizeText(input.party),
    notes: normalizeText(input.notes)
  };

  getStore().entries.unshift(entry);
  writeStoreToDisk(getStore());
  return { entry };
}
