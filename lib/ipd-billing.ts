import { rupeesToPaise } from "@/lib/billing-calc";
import type { InvoiceLineDraft } from "@/lib/billing-types";
import type { HospitalBed, IpdAdmission } from "@/lib/ipd-types";
import { resolveServicePrice } from "@/lib/pricing-calc";
import type { PriceTier, ServicePrice } from "@/lib/pricing-types";

/**
 * Daily accrual for an inpatient stay (Track 5.9, §4).
 *
 * An admission generates charges by the day rather than at a moment, which is
 * why IPD billing goes wrong so often: a bill raised on discharge has to
 * reconstruct a week of bed, nursing, rounds and diet from memory. Here every
 * day of the stay produces its own line, with a `sourceRef` unique to
 * (admission, date, charge) — so accruing repeatedly during a stay is safe and
 * an interim bill is just an accrual taken early.
 *
 * Pure by construction: takes the admission, its bed and the price list, and
 * returns drafts. The day-counting rule lives in exactly one place below.
 */

export type IpdAccrual = {
  charges: InvoiceLineDraft[];
  skipped: Array<{ label: string; reason: string }>;
  /** Calendar days charged, for the interim-bill summary the desk reads out. */
  daysCharged: number;
};

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

/**
 * The calendar dates an admission is charged for.
 *
 * **Charging rule:** every calendar date occupied, counting both the admission
 * day and the discharge day, minimum one day. This is the common Indian
 * hospital convention and the single place it is decided — a hospital wanting
 * 24-hour blocks or a free discharge day changes this function and nothing else.
 */
export function stayDates(admission: Pick<IpdAdmission, "createdAt" | "dischargedAt">, now: Date = new Date()): string[] {
  const start = new Date(admission.createdAt);
  const endSource = admission.dischargedAt ? new Date(admission.dischargedAt) : now;
  // A future-dated or malformed discharge must never produce a negative stay.
  const end = endSource.getTime() < start.getTime() ? start : endSource;

  const dates: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

  while (cursor.getTime() <= last) {
    dates.push(isoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates.length ? dates : [isoDate(start)];
}

/** Whether an IPD charge applies to this ward. An empty or absent ward list means every ward. */
function appliesToWard(service: ServicePrice, ward: string): boolean {
  if (!service.ipdWards || service.ipdWards.length === 0) return true;
  return service.ipdWards.includes(ward);
}

export type AccrualContext = {
  now?: Date;
  tier?: PriceTier;
};

/**
 * Every charge an admission has accrued so far: the one-off admission charges,
 * the bed at its own nightly rate, and each daily service the ward levies.
 *
 * Pharmacy, laboratory and procedures during the stay are **not** duplicated
 * here — they already flow through `harvestEncounterCharges` against the
 * admission's visit (Track 5.3), and billing them twice is exactly what the
 * `sourceRef` scheme exists to prevent.
 */
export function accrueAdmissionCharges(
  admission: IpdAdmission,
  bed: HospitalBed | null,
  services: ServicePrice[],
  context: AccrualContext = {}
): IpdAccrual {
  const charges: InvoiceLineDraft[] = [];
  const skipped: IpdAccrual["skipped"] = [];

  if (admission.status === "Cancelled") {
    return { charges: [], skipped: [{ label: "Admission", reason: "Admission was cancelled." }], daysCharged: 0 };
  }

  const active = services.filter((service) => service.active);
  const dates = stayDates(admission, context.now);

  // One-off admission charges.
  for (const service of active.filter((entry) => entry.ipdAdmissionCharge && appliesToWard(entry, admission.ward))) {
    const price = resolveServicePrice(service, { tier: context.tier, doctorName: admission.admittingDoctor });
    charges.push({
      source: "IPD",
      sourceRef: `${admission.id}:admission:${service.code}`,
      description: service.name,
      category: service.category,
      quantity: 1,
      unitPricePaise: price.pricePaise,
      taxPaise: price.taxPaise
    });
  }

  // Bed charge, from the bed's own nightly rate rather than the price list —
  // the ward already maintains it, and a second copy would drift.
  const bedRatePaise = rupeesToPaise(bed?.dailyRate ?? 0);
  if (bedRatePaise > 0) {
    for (const date of dates) {
      charges.push({
        source: "IPD",
        sourceRef: `${admission.id}:${date}:bed`,
        description: `${admission.ward} bed ${admission.bedLabel} — ${date}`,
        category: "Room",
        quantity: 1,
        unitPricePaise: bedRatePaise
      });
    }
  } else {
    skipped.push({
      label: `${admission.ward} bed ${admission.bedLabel}`,
      reason: "No daily rate is set on this bed, so no bed charge was raised."
    });
  }

  // Daily ward services: nursing, doctor rounds, diet.
  const daily = active.filter((service) => service.ipdDaily && appliesToWard(service, admission.ward));
  if (!daily.length) {
    skipped.push({
      label: `${admission.ward} daily charges`,
      reason: "No nursing, rounds or diet charges are configured for this ward."
    });
  }

  for (const date of dates) {
    for (const service of daily) {
      const price = resolveServicePrice(service, { tier: context.tier, doctorName: admission.admittingDoctor });
      charges.push({
        source: "IPD",
        sourceRef: `${admission.id}:${date}:${service.code}`,
        description: `${service.name} — ${date}`,
        category: service.category,
        quantity: 1,
        unitPricePaise: price.pricePaise,
        taxPaise: price.taxPaise
      });
    }
  }

  return { charges, skipped, daysCharged: dates.length };
}
