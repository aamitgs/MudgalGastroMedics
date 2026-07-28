import { z } from "zod";
import { acceptanceMethods } from "@/lib/estimate-types";
import { invoiceSources } from "@/lib/billing-types";

/** Server-side validation for packages and estimates (Track 5.7). Amounts cross the wire in rupees. */

const rupeeAmount = z.coerce.number({ error: "Enter a valid amount." }).min(0, "Amount can't be negative.").finite("Enter a valid amount.");

export const packageCreateSchema = z.object({
  code: z.string({ error: "A package code is required." }).trim().min(1, "A package code is required."),
  name: z.string({ error: "A package name is required." }).trim().min(1, "A package name is required."),
  description: z.string().trim().optional(),
  price: rupeeAmount,
  items: z
    .array(
      z.object({
        priceCode: z.string().trim().min(1, "Each item needs a price code."),
        quantity: z.coerce.number().int("Whole services only.").positive("Quantity must be at least 1.")
      })
    )
    .min(1, "A package needs at least one included service."),
  validityDays: z.coerce.number().int("Whole days only.").min(0).max(3650).optional()
});

export const packageUpdateSchema = z.object({
  id: z.string().trim().min(1, "Package id is required."),
  price: rupeeAmount.optional(),
  active: z.boolean().optional(),
  validityDays: z.coerce.number().int().min(0).max(3650).optional(),
  description: z.string().trim().optional()
});

export const packageActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sell"),
    invoiceId: z.string().trim().min(1, "Invoice id is required."),
    packageCode: z.string().trim().min(1, "Select a package.")
  }),
  z.object({
    action: z.literal("redeem"),
    invoiceId: z.string().trim().min(1, "Invoice id is required."),
    priceCode: z.string().trim().min(1, "Select the service to draw from the package."),
    quantity: z.coerce.number().int().positive().optional()
  })
]);

const estimateLineSchema = z.object({
  source: z.enum(invoiceSources).optional(),
  description: z.string({ error: "Each line needs a description." }).trim().min(1, "Each line needs a description."),
  category: z.string().trim().min(1, "Each line needs a category."),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  unitPrice: rupeeAmount,
  discount: rupeeAmount.optional(),
  tax: rupeeAmount.optional()
});

export const estimateCreateSchema = z.object({
  patientName: z.string({ error: "Patient name is required." }).trim().min(1, "Patient name is required."),
  phone: z.string({ error: "Patient phone is required." }).trim().min(6, "A valid patient phone is required."),
  uhid: z.string().trim().optional(),
  patientId: z.string().trim().optional(),
  visitId: z.string().trim().optional(),
  department: z.string().trim().optional(),
  doctorName: z.string().trim().optional(),
  lineItems: z.array(estimateLineSchema).min(1, "Add at least one item to the estimate."),
  discount: rupeeAmount.optional(),
  validUntil: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export const estimateActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("share"), id: z.string().trim().min(1, "Estimate id is required.") }),
  z.object({
    action: z.literal("accept"),
    id: z.string().trim().min(1, "Estimate id is required."),
    patientSignatureName: z.string({ error: "Record the patient's name." }).trim().min(1, "Record the patient's name."),
    method: z.enum(acceptanceMethods, { error: "How was acceptance taken?" })
  }),
  z.object({
    action: z.literal("decline"),
    id: z.string().trim().min(1, "Estimate id is required."),
    reason: z.string({ error: "A reason is required." }).trim().min(1, "A reason is required.")
  }),
  z.object({ action: z.literal("convert"), id: z.string().trim().min(1, "Estimate id is required.") })
]);

export type PackageCreateInput = z.infer<typeof packageCreateSchema>;
export type PackageActionInput = z.infer<typeof packageActionSchema>;
export type EstimateCreateInput = z.infer<typeof estimateCreateSchema>;
export type EstimateActionInput = z.infer<typeof estimateActionSchema>;
