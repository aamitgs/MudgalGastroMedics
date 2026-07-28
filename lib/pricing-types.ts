/**
 * The hospital's single master price list and consultation fee rules
 * (Track 5.1). Before this, every bill amount was hand-typed, so the same
 * service cost whatever the person at the desk remembered it costing.
 *
 * Historical invoices are unaffected by price changes by construction: an
 * invoice line freezes its own `totalPaise` when the charge is added
 * (lib/billing-types.ts), so this list only ever supplies the number for the
 * *next* bill. Past bills are never recomputed from it.
 *
 * Amounts are integer paise, matching the invoice module.
 */

export type ServiceCategory =
  | "Consultation"
  | "Procedure"
  | "Investigation"
  | "Room"
  | "Nursing"
  | "Medicines"
  | "Consumables"
  | "Package"
  | "Other";

/**
 * Payer-class rates. "Standard" is the cash/self-pay price held in
 * `basePricePaise`; the rest are overrides only where a tie-up actually
 * differs, so an empty override means "same as standard" rather than free.
 */
export type PriceTier = "Standard" | "Corporate" | "Insurance" | "Promotional";

/** One append-only price revision, so an old invoice's amount can always be explained. */
export type PriceRevision = {
  at: string;
  by: string;
  fromPaise: number;
  toPaise: number;
  reason: string;
};

export type ServicePrice = {
  id: string;
  /** Short stable handle used when adding a charge — e.g. "CONS-NEW", "ENDO-UGI". */
  code: string;
  name: string;
  category: ServiceCategory;
  /** The standard self-pay rate. Tier and doctor overrides are applied on top. */
  basePricePaise: number;
  tierPricesPaise?: Partial<Record<PriceTier, number>>;
  /** Doctor-specific rates, keyed by doctor name — the most specific override there is. */
  doctorPricesPaise?: Record<string, number>;
  /** Percent, applied to the resolved price when the charge is added. Most clinical services are exempt; default 0. */
  taxPercent?: number;
  /**
   * Links this service to a scheduled procedure (`ProcedureSchedule.procedureSlug`),
   * so performing one automatically bills every component priced against it —
   * procedure fee, doctor fee, sedation, consumables, recovery (Track 5.3).
   *
   * Deliberately held here rather than as amount fields on the schedule
   * itself: a price belongs to the master list once, not copied onto every
   * procedure ever booked.
   */
  procedureSlug?: string;
  /**
   * Accrues once per day of an IPD stay — nursing, doctor rounds, diet
   * (Track 5.9). Same reasoning as `procedureSlug`: the schedule of what a
   * ward charges daily belongs in the master list, not duplicated onto every
   * admission.
   */
  ipdDaily?: boolean;
  /** Charged once on admission rather than per day. */
  ipdAdmissionCharge?: boolean;
  /** Restricts an IPD charge to specific wards; empty or absent means every ward. */
  ipdWards?: string[];
  /** Retired services stay in the list so historical invoices remain explainable — they just stop being offerable. */
  active: boolean;
  createdAt: string;
  updatedAt: string;
  revisions: PriceRevision[];
};

export type ConsultationVisitType = "New" | "Follow-up" | "Emergency" | "Teleconsultation";

export type ConsultationDayType = "Weekday" | "Weekend" | "Holiday";

/**
 * A consultation fee for one (doctor, visit type, day type) combination.
 * `doctorName` undefined means the hospital-wide default — the fallback used
 * when a doctor has no rate of their own.
 */
export type ConsultationFeeRule = {
  id: string;
  doctorName?: string;
  visitType: ConsultationVisitType;
  /** Undefined means "any day" — a rule that applies unless a day-specific one exists. */
  dayType?: ConsultationDayType;
  feePaise: number;
  /**
   * A revisit within this many days of the last visit is billed as a
   * Follow-up rather than New. Only meaningful on Follow-up rules; the
   * hospital's standard courtesy window.
   */
  followUpWindowDays?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const serviceCategories: ServiceCategory[] = [
  "Consultation",
  "Procedure",
  "Investigation",
  "Room",
  "Nursing",
  "Medicines",
  "Consumables",
  "Package",
  "Other"
];

export const priceTiers: PriceTier[] = ["Standard", "Corporate", "Insurance", "Promotional"];

export const consultationVisitTypes: ConsultationVisitType[] = ["New", "Follow-up", "Emergency", "Teleconsultation"];

export const consultationDayTypes: ConsultationDayType[] = ["Weekday", "Weekend", "Holiday"];
