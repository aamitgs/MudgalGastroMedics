import { z } from "zod";
import { invoicePaymentMethods, invoiceSources } from "@/lib/billing-types";
import { priceTiers } from "@/lib/pricing-types";

/**
 * Server-side validation for the invoice entity (Track 5.0).
 *
 * Amounts cross the wire in rupees, the unit staff actually type; the store
 * converts to integer paise. Keeping the boundary in one place means no call
 * site has to remember which unit it is holding.
 */

const rupeeAmount = z.coerce.number({ error: "Enter a valid amount." }).min(0, "Amount can't be negative").finite("Enter a valid amount.");

/**
 * A charge is either priced from the master list (`priceCode`, the path that
 * keeps bills consistent) or spelled out in full for the one-off cases a
 * price list will never cover. Description/category/unitPrice are optional
 * only because the price code supplies them; the store rejects a charge that
 * ends up with neither.
 */
export const invoiceLineItemSchema = z.object({
  source: z.enum(invoiceSources, { error: "Invalid charge source." }),
  sourceRef: z.string().trim().optional(),
  priceCode: z.string().trim().optional(),
  tier: z.enum(priceTiers).optional(),
  description: z.string().trim().min(1, "Charge description is required.").optional(),
  category: z.string().trim().min(1, "Charge category is required.").optional(),
  quantity: z.coerce.number({ error: "Enter a valid quantity." }).positive("Quantity must be greater than zero."),
  unitPrice: rupeeAmount.optional(),
  discount: rupeeAmount.optional(),
  tax: rupeeAmount.optional()
});

export const invoiceCreateSchema = z.object({
  visitId: z.string().trim().optional(),
  patientName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  patientId: z.string().trim().optional(),
  uhid: z.string().trim().optional(),
  admissionId: z.string().trim().optional(),
  department: z.string().trim().optional(),
  doctorName: z.string().trim().optional(),
  lineItems: z.array(invoiceLineItemSchema).optional(),
  notes: z.string().trim().optional()
});

/**
 * One tender. Lives standalone so the collection form (Track 5.2) validates
 * against the exact schema the route enforces — one source of truth per form,
 * rather than a client copy that can drift from the server's rules.
 */
export const invoicePaymentFormSchema = z.object({
  method: z.enum(invoicePaymentMethods, { error: "Select a payment method." }),
  amount: rupeeAmount.refine((value) => value > 0, "Enter a payment amount greater than zero."),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional()
});

/**
 * One PATCH endpoint per invoice action rather than a free-form field patch:
 * issuing, collecting payment, discounting and cancelling each have different
 * permission and audit consequences, so they must not be indistinguishable on
 * the wire.
 */
export const invoiceUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add-items"),
    id: z.string().trim().min(1, "Invoice id is required."),
    lineItems: z.array(invoiceLineItemSchema).min(1, "Add at least one charge.")
  }),
  z.object({
    action: z.literal("remove-item"),
    id: z.string().trim().min(1, "Invoice id is required."),
    lineItemId: z.string().trim().min(1, "Charge id is required.")
  }),
  z.object({
    action: z.literal("issue"),
    id: z.string().trim().min(1, "Invoice id is required.")
  }),
  z.object({
    action: z.literal("sync-ipd-charges"),
    id: z.string().trim().min(1, "Invoice id is required."),
    tier: z.enum(priceTiers).optional()
  }),
  z.object({
    action: z.literal("sync-charges"),
    id: z.string().trim().min(1, "Invoice id is required."),
    tier: z.enum(priceTiers).optional()
  }),
  invoicePaymentFormSchema.extend({
    action: z.literal("record-payment"),
    id: z.string().trim().min(1, "Invoice id is required.")
  }),
  z.object({
    action: z.literal("set-discount"),
    id: z.string().trim().min(1, "Invoice id is required."),
    discount: rupeeAmount,
    reason: z.string().trim().optional()
  }),
  z.object({
    action: z.literal("cancel"),
    id: z.string().trim().min(1, "Invoice id is required."),
    reason: z.string({ error: "A cancellation reason is required." }).trim().min(1, "A cancellation reason is required.")
  })
]);

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type InvoicePaymentFormInput = z.infer<typeof invoicePaymentFormSchema>;
