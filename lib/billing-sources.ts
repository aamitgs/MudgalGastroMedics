import { rupeesToPaise } from "@/lib/billing-calc";
import type { InvoiceLineDraft } from "@/lib/billing-types";
import type { LabOrder } from "@/lib/lab-types";
import type { OpdVisit } from "@/lib/opd-types";
import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";
import { dayTypeFor, isWithinFollowUpWindow, resolveConsultationFee, resolveServicePrice } from "@/lib/pricing-calc";
import type { ConsultationFeeRule, PriceTier, ServicePrice } from "@/lib/pricing-types";
import type { ProcedureSchedule } from "@/lib/procedure-types";

/**
 * Automatic bill generation (Track 5.3) — derives an encounter's charges from
 * what clinically happened, so the billing executive verifies rather than
 * re-types. This is the layer that removes the duplicate data entry the
 * billing brief opens with.
 *
 * Pure by construction: every function takes already-fetched records and
 * returns drafts. Nothing here reads a store, so the rules that decide what a
 * patient is charged are directly unit-testable.
 *
 * Two invariants run through all of it:
 *
 * 1. **Nothing is ever billed twice.** Every draft carries a `sourceRef`
 *    unique to the thing that caused it, and the store skips a
 *    (source, sourceRef) it already holds — so re-running a sync as an
 *    encounter progresses tops up only what is new.
 * 2. **Nothing is ever silently dropped.** Anything deliberately not billed
 *    comes back in `skipped` with a reason, because a charge that vanishes
 *    without explanation is revenue leakage that nobody notices.
 */

export type SkippedCharge = {
  label: string;
  reason: string;
};

export type ChargeHarvest = {
  charges: InvoiceLineDraft[];
  skipped: SkippedCharge[];
};

export type HarvestContext = {
  tier?: PriceTier;
  /** ISO date-times of this patient's earlier visits, used to tell a follow-up from a new consultation. */
  previousVisitAt?: string;
  now?: Date;
  /** The hospital's own holiday dates (ISO), since no programmatic list is authoritative. */
  holidays?: string[];
};

const empty: ChargeHarvest = { charges: [], skipped: [] };

function merge(...harvests: ChargeHarvest[]): ChargeHarvest {
  return {
    charges: harvests.flatMap((harvest) => harvest.charges),
    skipped: harvests.flatMap((harvest) => harvest.skipped)
  };
}

/**
 * The consultation fee for a visit (§3), resolved from the Track 5.1 fee rules.
 *
 * New vs Follow-up is decided by the follow-up rule's own courtesy window
 * rather than by asking the receptionist — the desk shouldn't have to
 * remember when the patient last came in, and it is exactly the kind of
 * judgement that gets a fee wrong under load.
 */
export function consultationCharges(visit: OpdVisit, rules: ConsultationFeeRule[], context: HarvestContext = {}): ChargeHarvest {
  if (visit.status === "Cancelled") return { charges: [], skipped: [{ label: "Consultation", reason: "Visit was cancelled." }] };

  const now = context.now ?? new Date();
  const followUpRule = rules.find((rule) => rule.active && rule.visitType === "Follow-up" && !rule.doctorName);
  const isFollowUp = isWithinFollowUpWindow(context.previousVisitAt, now, followUpRule?.followUpWindowDays);

  const dayType = dayTypeFor(new Date(visit.createdAt), context.holidays);
  const resolved = resolveConsultationFee(rules, {
    doctorName: visit.doctorName,
    visitType: isFollowUp ? "Follow-up" : "New",
    dayType
  });

  if (!resolved) {
    return {
      charges: [],
      skipped: [
        {
          label: "Consultation",
          reason: `No consultation fee is configured for ${isFollowUp ? "a follow-up" : "a new patient"} on a ${dayType.toLowerCase()}.`
        }
      ]
    };
  }

  return {
    charges: [
      {
        source: "OPD",
        sourceRef: `${visit.id}:consultation`,
        description: `Consultation — ${resolved.basisLabel}`,
        category: "Consultation",
        quantity: 1,
        unitPricePaise: resolved.feePaise
      }
    ],
    skipped: []
  };
}

/**
 * Investigations ordered during the consultation (§17).
 *
 * An order already settled at the lab counter is never re-billed — that is
 * the single most likely way a patient pays for the same test twice.
 */
export function labOrderCharges(order: LabOrder, services: ServicePrice[], context: HarvestContext = {}): ChargeHarvest {
  const label = order.tests.length ? order.tests.join(", ") : "Laboratory investigations";

  if (order.status === "Cancelled") return { charges: [], skipped: [{ label, reason: "Lab order was cancelled." }] };
  if (order.paymentStatus === "Paid") return { charges: [], skipped: [{ label, reason: "Already collected at the lab counter." }] };

  const orderAmountPaise = rupeesToPaise(order.amount);
  if (orderAmountPaise > 0) {
    return {
      charges: [
        {
          source: "Laboratory",
          sourceRef: order.id,
          description: label,
          category: "Investigations",
          quantity: 1,
          unitPricePaise: orderAmountPaise
        }
      ],
      skipped: []
    };
  }

  // No amount was entered in Laboratory, so fall back to the price master —
  // one line per test, which also gives the patient an itemised bill rather
  // than one opaque "investigations" figure.
  const charges: InvoiceLineDraft[] = [];
  const skipped: SkippedCharge[] = [];

  for (const test of order.tests) {
    const service = services.find((candidate) => candidate.active && candidate.name.toLowerCase() === test.toLowerCase());
    if (!service) {
      skipped.push({ label: test, reason: "No price is configured for this test, and the lab order has no amount." });
      continue;
    }
    const price = resolveServicePrice(service, { tier: context.tier });
    charges.push({
      source: "Laboratory",
      sourceRef: `${order.id}:${service.code}`,
      description: service.name,
      category: "Investigations",
      quantity: 1,
      unitPricePaise: price.pricePaise,
      taxPaise: price.taxPaise
    });
  }

  if (!charges.length && !skipped.length) {
    skipped.push({ label, reason: "Lab order has no tests and no amount." });
  }

  return { charges, skipped };
}

/**
 * Medicines dispensed against the visit (§16), itemised per medicine.
 *
 * A dispense already paid for at the pharmacy counter is skipped for the same
 * double-charge reason as lab orders. A dispense-level discount is spread
 * across the lines in proportion to their value, with the rounding remainder
 * on the last line, so the invoice total reconciles to the pharmacy total to
 * the paisa.
 */
export function dispenseCharges(dispense: PharmacyDispenseRecord): ChargeHarvest {
  const label = `Pharmacy ${dispense.id}`;

  if (dispense.status === "Cancelled") return { charges: [], skipped: [{ label, reason: "Dispense was cancelled." }] };
  if (dispense.paymentStatus === "Paid") return { charges: [], skipped: [{ label, reason: "Already collected at the pharmacy counter." }] };
  if (!dispense.items.length) return { charges: [], skipped: [{ label, reason: "Dispense has no items." }] };

  const grossPaise = dispense.items.reduce((sum, item) => sum + rupeesToPaise(item.total), 0);
  const discountPaise = Math.min(rupeesToPaise(dispense.discount), grossPaise);

  let allocated = 0;
  const charges = dispense.items.map((item, index) => {
    const itemGross = rupeesToPaise(item.total);
    const isLast = index === dispense.items.length - 1;
    // Last line absorbs the remainder so the parts always sum to the whole.
    const share = isLast ? discountPaise - allocated : grossPaise > 0 ? Math.round((discountPaise * itemGross) / grossPaise) : 0;
    allocated += share;

    return {
      source: "Pharmacy" as const,
      sourceRef: `${dispense.id}:${item.inventoryItemId}`,
      description: `${item.name}${item.unit ? ` (${item.unit})` : ""}`,
      category: "Medicines",
      quantity: item.quantity,
      unitPricePaise: rupeesToPaise(item.unitPrice),
      discountPaise: Math.max(0, share)
    };
  });

  return { charges, skipped: [] };
}

/**
 * Everything a performed procedure costs (§18) — procedure fee, doctor fee,
 * equipment, consumables, sedation, recovery — as separate lines, one per
 * price-master entry linked to the procedure via `procedureSlug`.
 *
 * A procedure that has only been booked is not billed: patients cancel and
 * reschedule, and charging for an endoscopy that never happened is a refund
 * and a complaint, not a billing efficiency.
 */
export function procedureCharges(schedule: ProcedureSchedule, services: ServicePrice[], context: HarvestContext = {}): ChargeHarvest {
  const label = schedule.procedureTitle || schedule.procedureSlug;

  if (schedule.status === "Cancelled") return { charges: [], skipped: [{ label, reason: "Procedure was cancelled." }] };
  if (schedule.status === "Planned") return { charges: [], skipped: [{ label, reason: "Procedure is booked but has not started." }] };

  const linked = services.filter((service) => service.active && service.procedureSlug === schedule.procedureSlug);
  if (!linked.length) {
    return {
      charges: [],
      skipped: [{ label, reason: `No price-list entry is linked to procedure "${schedule.procedureSlug}".` }]
    };
  }

  return {
    charges: linked.map((service) => {
      const price = resolveServicePrice(service, { tier: context.tier, doctorName: schedule.doctor });
      return {
        source: "Procedure" as const,
        sourceRef: `${schedule.id}:${service.code}`,
        description: service.name,
        category: service.category,
        quantity: 1,
        unitPricePaise: price.pricePaise,
        taxPaise: price.taxPaise
      };
    }),
    skipped: []
  };
}

export type EncounterRecords = {
  visit?: OpdVisit;
  labOrders?: LabOrder[];
  dispenses?: PharmacyDispenseRecord[];
  procedures?: ProcedureSchedule[];
};

export type PricingRecords = {
  services: ServicePrice[];
  consultationFees: ConsultationFeeRule[];
};

/**
 * Every charge one encounter has generated, across all four clinical sources.
 * The caller adds these to a Draft invoice; a human still issues it.
 */
export function harvestEncounterCharges(
  records: EncounterRecords,
  pricing: PricingRecords,
  context: HarvestContext = {}
): ChargeHarvest {
  return merge(
    records.visit ? consultationCharges(records.visit, pricing.consultationFees, context) : empty,
    ...(records.labOrders ?? []).map((order) => labOrderCharges(order, pricing.services, context)),
    ...(records.dispenses ?? []).map((dispense) => dispenseCharges(dispense)),
    ...(records.procedures ?? []).map((schedule) => procedureCharges(schedule, pricing.services, context))
  );
}
