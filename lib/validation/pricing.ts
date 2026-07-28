import { z } from "zod";
import { consultationDayTypes, consultationVisitTypes, priceTiers, serviceCategories } from "@/lib/pricing-types";

/**
 * Server-side validation for the master price list (Track 5.1). Prices cross
 * the wire in rupees — the unit staff type — and the route converts to paise,
 * the same boundary the invoice routes use.
 */

const rupeeAmount = z.coerce.number({ error: "Enter a valid amount." }).min(0, "A price can't be negative.").finite("Enter a valid amount.");

const tierPrices = z.partialRecord(z.enum(priceTiers), rupeeAmount).optional();
const doctorPrices = z.record(z.string().trim().min(1), rupeeAmount).optional();

export const servicePriceCreateSchema = z.object({
  code: z.string({ error: "A service code is required." }).trim().min(1, "A service code is required."),
  name: z.string({ error: "A service name is required." }).trim().min(1, "A service name is required."),
  category: z.enum(serviceCategories, { error: "Select a service category." }),
  basePrice: rupeeAmount,
  tierPrices,
  doctorPrices,
  taxPercent: z.coerce.number().min(0, "Tax can't be negative.").max(100, "Tax can't exceed 100%.").optional(),
  /** Links this price to a bookable procedure so performing one bills it automatically (Track 5.3). */
  procedureSlug: z.string().trim().optional(),
  ipdDaily: z.boolean().optional(),
  ipdAdmissionCharge: z.boolean().optional(),
  ipdWards: z.array(z.string().trim()).optional()
});

export const servicePriceUpdateSchema = z.object({
  id: z.string({ error: "Service id is required." }).trim().min(1, "Service id is required."),
  name: z.string().trim().min(1).optional(),
  category: z.enum(serviceCategories).optional(),
  basePrice: rupeeAmount.optional(),
  tierPrices,
  doctorPrices,
  taxPercent: z.coerce.number().min(0).max(100).optional(),
  procedureSlug: z.string().trim().optional(),
  ipdDaily: z.boolean().optional(),
  ipdAdmissionCharge: z.boolean().optional(),
  ipdWards: z.array(z.string().trim()).optional(),
  active: z.boolean().optional(),
  reason: z.string().trim().optional()
});

export const consultationFeeCreateSchema = z.object({
  doctorName: z.string().trim().optional(),
  visitType: z.enum(consultationVisitTypes, { error: "Select a visit type." }),
  dayType: z.enum(consultationDayTypes).optional(),
  fee: rupeeAmount,
  followUpWindowDays: z.coerce.number().int("Enter whole days.").min(0).max(365).optional()
});

export const consultationFeeUpdateSchema = z.object({
  id: z.string({ error: "Fee rule id is required." }).trim().min(1, "Fee rule id is required."),
  fee: rupeeAmount.optional(),
  followUpWindowDays: z.coerce.number().int("Enter whole days.").min(0).max(365).optional(),
  active: z.boolean().optional()
});

/** POST and PATCH each serve both the service list and the fee rules, discriminated on `kind`. */
export const pricingCreateSchema = z.discriminatedUnion("kind", [
  servicePriceCreateSchema.extend({ kind: z.literal("service") }),
  consultationFeeCreateSchema.extend({ kind: z.literal("consultation-fee") })
]);

export const pricingUpdateSchema = z.discriminatedUnion("kind", [
  servicePriceUpdateSchema.extend({ kind: z.literal("service") }),
  consultationFeeUpdateSchema.extend({ kind: z.literal("consultation-fee") })
]);

export type PricingCreateInput = z.infer<typeof pricingCreateSchema>;
export type PricingUpdateInput = z.infer<typeof pricingUpdateSchema>;
