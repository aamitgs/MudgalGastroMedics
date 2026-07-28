import type {
  ConsultationDayType,
  ConsultationFeeRule,
  ConsultationVisitType,
  PriceTier,
  ServicePrice
} from "@/lib/pricing-types";

/**
 * Pure price resolution for Track 5.1 — kept free of persistence so the
 * precedence rules are directly unit-testable, and so a billing screen can
 * preview a price without a round-trip.
 *
 * The resolution order is deliberately most-specific-wins, and every resolved
 * price reports which rule produced it: a billing executive challenged on an
 * amount must be able to see *why* it is that amount, not just what it is.
 */

export type PriceContext = {
  tier?: PriceTier;
  doctorName?: string;
};

export type ResolvedPrice = {
  /** Price before tax, after whichever override applied. */
  pricePaise: number;
  taxPaise: number;
  totalPaise: number;
  /** Which rule set the price — shown to staff so the number is explainable. */
  basis: "doctor" | "tier" | "standard";
  basisLabel: string;
};

/**
 * Resolves what a service costs for this payer and doctor.
 *
 * Precedence: a doctor-specific rate beats a payer-tier rate, which beats the
 * standard rate. A doctor override is the narrowest, most deliberate thing
 * anyone can configure, so it wins outright.
 */
export function resolveServicePrice(service: ServicePrice, context: PriceContext = {}): ResolvedPrice {
  const doctorPrice = context.doctorName ? service.doctorPricesPaise?.[context.doctorName] : undefined;
  const tier = context.tier ?? "Standard";
  const tierPrice = tier === "Standard" ? undefined : service.tierPricesPaise?.[tier];

  let pricePaise = service.basePricePaise;
  let basis: ResolvedPrice["basis"] = "standard";
  let basisLabel = "Standard rate";

  if (typeof doctorPrice === "number") {
    pricePaise = doctorPrice;
    basis = "doctor";
    basisLabel = `${context.doctorName} rate`;
  } else if (typeof tierPrice === "number") {
    pricePaise = tierPrice;
    basis = "tier";
    basisLabel = `${tier} rate`;
  }

  pricePaise = Math.max(0, Math.round(pricePaise));
  const taxPaise = Math.max(0, Math.round((pricePaise * (service.taxPercent ?? 0)) / 100));

  return { pricePaise, taxPaise, totalPaise: pricePaise + taxPaise, basis, basisLabel };
}

export type ConsultationFeeContext = {
  doctorName?: string;
  visitType: ConsultationVisitType;
  dayType?: ConsultationDayType;
};

export type ResolvedConsultationFee = {
  feePaise: number;
  rule: ConsultationFeeRule;
  /** Why this fee applied — e.g. "Dr Mudgal · Follow-up · Weekend". */
  basisLabel: string;
};

/**
 * Scores how specifically a rule matches, so the best match wins rather than
 * whichever happens to be first in the list. A doctor-specific rule outranks a
 * day-specific one: who is consulting matters more to the fee than when.
 */
function ruleScore(rule: ConsultationFeeRule, context: ConsultationFeeContext): number | null {
  if (!rule.active) return null;
  if (rule.visitType !== context.visitType) return null;
  if (rule.doctorName && rule.doctorName !== context.doctorName) return null;
  if (rule.dayType && context.dayType && rule.dayType !== context.dayType) return null;
  // A day-specific rule can't satisfy a request that didn't say which day it is.
  if (rule.dayType && !context.dayType) return null;

  return (rule.doctorName ? 2 : 0) + (rule.dayType ? 1 : 0);
}

export function resolveConsultationFee(
  rules: ConsultationFeeRule[],
  context: ConsultationFeeContext
): ResolvedConsultationFee | null {
  let best: { rule: ConsultationFeeRule; score: number } | null = null;

  for (const rule of rules) {
    const score = ruleScore(rule, context);
    if (score === null) continue;
    if (!best || score > best.score) best = { rule, score };
  }

  if (!best) return null;

  const parts = [best.rule.doctorName ?? "Hospital default", best.rule.visitType];
  if (best.rule.dayType) parts.push(best.rule.dayType);

  return { feePaise: best.rule.feePaise, rule: best.rule, basisLabel: parts.join(" · ") };
}

/**
 * Which day-rate applies to a date. Holidays are supplied by the caller as
 * ISO dates — there is no reliable programmatic list of Indian hospital
 * holidays, and the hospital decides its own anyway.
 */
export function dayTypeFor(date: Date, holidayDates: string[] = []): ConsultationDayType {
  const iso = date.toISOString().slice(0, 10);
  if (holidayDates.includes(iso)) return "Holiday";
  const day = date.getDay();
  return day === 0 || day === 6 ? "Weekend" : "Weekday";
}

/**
 * Whether a revisit still falls inside the doctor's follow-up courtesy window.
 * Callers use this to pick between the New and Follow-up visit type before
 * resolving the fee — the window lives on the Follow-up rule itself.
 */
export function isWithinFollowUpWindow(lastVisitIso: string | undefined, now: Date, windowDays: number | undefined): boolean {
  if (!lastVisitIso || !windowDays || windowDays <= 0) return false;
  const last = new Date(lastVisitIso).getTime();
  if (!Number.isFinite(last)) return false;
  const elapsedDays = (now.getTime() - last) / 86_400_000;
  return elapsedDays >= 0 && elapsedDays <= windowDays;
}
