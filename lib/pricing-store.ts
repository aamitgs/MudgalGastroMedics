import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type {
  ConsultationFeeRule,
  PriceTier,
  ServiceCategory,
  ServicePrice
} from "@/lib/pricing-types";

type PricingStore = {
  services: ServicePrice[];
  consultationFees: ConsultationFeeRule[];
};

const docStore = createDocumentStore<PricingStore>("pricing-master", (parsed) => {
  const doc = parsed as Partial<PricingStore> | undefined;
  return {
    services: Array.isArray(doc?.services) ? (doc.services as PricingStore["services"]) : [],
    consultationFees: Array.isArray(doc?.consultationFees) ? (doc.consultationFees as PricingStore["consultationFees"]) : []
  };
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Codes are the stable handle billing uses, so they're normalised to one shape rather than trusted as typed. */
function normalizeCode(value: unknown) {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "-");
}

export async function listServicePrices() {
  return (await docStore.load()).services;
}

export async function listActiveServicePrices() {
  return (await docStore.load()).services.filter((service) => service.active);
}

export async function getServicePriceByCode(code: string) {
  const normalized = normalizeCode(code);
  return (await docStore.load()).services.find((service) => service.code === normalized) ?? null;
}

export async function listConsultationFeeRules() {
  return (await docStore.load()).consultationFees;
}

export type ServicePriceInput = {
  code: string;
  name: string;
  category: ServiceCategory;
  basePricePaise: number;
  tierPricesPaise?: Partial<Record<PriceTier, number>>;
  doctorPricesPaise?: Record<string, number>;
  taxPercent?: number;
  procedureSlug?: string;
  ipdDaily?: boolean;
  ipdAdmissionCharge?: boolean;
  ipdWards?: string[];
};

export async function createServicePrice(input: ServicePriceInput): Promise<{ service: ServicePrice } | { error: string }> {
  const doc = await docStore.load();
  const code = normalizeCode(input.code);
  if (!code) return { error: "A service code is required." };
  if (doc.services.some((service) => service.code === code)) {
    return { error: `Service code ${code} already exists. Edit that service instead of adding a duplicate.` };
  }

  const now = new Date().toISOString();
  const service: ServicePrice = {
    id: generateId("SVC"),
    code,
    name: normalizeText(input.name),
    category: input.category,
    basePricePaise: Math.max(0, Math.round(input.basePricePaise)),
    tierPricesPaise: input.tierPricesPaise,
    doctorPricesPaise: input.doctorPricesPaise,
    taxPercent: input.taxPercent,
    procedureSlug: normalizeText(input.procedureSlug) || undefined,
    ipdDaily: input.ipdDaily,
    ipdAdmissionCharge: input.ipdAdmissionCharge,
    ipdWards: input.ipdWards,
    active: true,
    createdAt: now,
    updatedAt: now,
    revisions: []
  };

  doc.services.unshift(service);
  await docStore.save(doc);
  return { service };
}

export type ServicePriceUpdate = {
  id: string;
  name?: string;
  category?: ServiceCategory;
  basePricePaise?: number;
  tierPricesPaise?: Partial<Record<PriceTier, number>>;
  doctorPricesPaise?: Record<string, number>;
  taxPercent?: number;
  procedureSlug?: string;
  ipdDaily?: boolean;
  ipdAdmissionCharge?: boolean;
  ipdWards?: string[];
  active?: boolean;
  /** Mandatory whenever the base price actually moves. */
  reason?: string;
  actingStaffName: string;
};

/**
 * Edits a service. A base-price change is recorded as an append-only revision
 * with its reason — the audit trail says who changed it, this says why, and
 * both survive on the service itself so the answer travels with the record.
 *
 * Bills already raised are untouched: invoice lines froze their own totals
 * when the charge was added.
 */
export async function updateServicePrice(input: ServicePriceUpdate): Promise<{ service: ServicePrice; before: ServicePrice } | { error: string }> {
  const doc = await docStore.load();
  const index = doc.services.findIndex((service) => service.id === input.id);
  if (index === -1) return { error: "Service not found." };

  const before = structuredClone(doc.services[index]);
  const service = doc.services[index];

  if (typeof input.basePricePaise === "number" && Number.isFinite(input.basePricePaise)) {
    const next = Math.max(0, Math.round(input.basePricePaise));
    if (next !== service.basePricePaise) {
      const reason = normalizeText(input.reason);
      if (!reason) return { error: "A reason is required when changing a price." };
      service.revisions.push({
        at: new Date().toISOString(),
        by: normalizeText(input.actingStaffName) || "Unknown",
        fromPaise: service.basePricePaise,
        toPaise: next,
        reason
      });
      service.basePricePaise = next;
    }
  }

  if (typeof input.name === "string") service.name = normalizeText(input.name);
  if (input.category) service.category = input.category;
  if (input.tierPricesPaise) service.tierPricesPaise = input.tierPricesPaise;
  if (input.doctorPricesPaise) service.doctorPricesPaise = input.doctorPricesPaise;
  if (typeof input.taxPercent === "number") service.taxPercent = input.taxPercent;
  if (typeof input.procedureSlug === "string") service.procedureSlug = normalizeText(input.procedureSlug) || undefined;
  if (typeof input.ipdDaily === "boolean") service.ipdDaily = input.ipdDaily;
  if (typeof input.ipdAdmissionCharge === "boolean") service.ipdAdmissionCharge = input.ipdAdmissionCharge;
  if (Array.isArray(input.ipdWards)) service.ipdWards = input.ipdWards;
  if (typeof input.active === "boolean") service.active = input.active;

  service.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return { service, before };
}

export type ConsultationFeeRuleInput = {
  doctorName?: string;
  visitType: ConsultationFeeRule["visitType"];
  dayType?: ConsultationFeeRule["dayType"];
  feePaise: number;
  followUpWindowDays?: number;
};

export async function createConsultationFeeRule(input: ConsultationFeeRuleInput): Promise<{ rule: ConsultationFeeRule } | { error: string }> {
  const doc = await docStore.load();
  const doctorName = normalizeText(input.doctorName) || undefined;

  // One rule per (doctor, visit type, day type): two rules for the same
  // combination would make the fee depend on list order, which is exactly the
  // ambiguity a master price list exists to remove.
  const clash = doc.consultationFees.find(
    (rule) => rule.doctorName === doctorName && rule.visitType === input.visitType && rule.dayType === input.dayType
  );
  if (clash) return { error: "A fee rule already exists for that doctor, visit type and day. Edit it instead." };

  const now = new Date().toISOString();
  const rule: ConsultationFeeRule = {
    id: generateId("FEE"),
    doctorName,
    visitType: input.visitType,
    dayType: input.dayType,
    feePaise: Math.max(0, Math.round(input.feePaise)),
    followUpWindowDays: input.followUpWindowDays,
    active: true,
    createdAt: now,
    updatedAt: now
  };

  doc.consultationFees.unshift(rule);
  await docStore.save(doc);
  return { rule };
}

export async function updateConsultationFeeRule(input: {
  id: string;
  feePaise?: number;
  followUpWindowDays?: number;
  active?: boolean;
}): Promise<{ rule: ConsultationFeeRule; before: ConsultationFeeRule } | { error: string }> {
  const doc = await docStore.load();
  const index = doc.consultationFees.findIndex((rule) => rule.id === input.id);
  if (index === -1) return { error: "Fee rule not found." };

  const before = structuredClone(doc.consultationFees[index]);
  const rule = doc.consultationFees[index];

  if (typeof input.feePaise === "number" && Number.isFinite(input.feePaise)) rule.feePaise = Math.max(0, Math.round(input.feePaise));
  if (typeof input.followUpWindowDays === "number") rule.followUpWindowDays = input.followUpWindowDays;
  if (typeof input.active === "boolean") rule.active = input.active;

  rule.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return { rule, before };
}
