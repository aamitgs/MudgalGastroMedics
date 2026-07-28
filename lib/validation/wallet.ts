import { z } from "zod";
import { invoicePaymentMethods } from "@/lib/billing-types";

/**
 * Server-side validation for the advance wallet (Track 5.5). Amounts cross the
 * wire in rupees and convert to paise at the route, the same boundary the
 * invoice and pricing routes use.
 */

const rupeeAmount = z.coerce.number({ error: "Enter a valid amount." }).positive("Enter an amount greater than zero.").finite("Enter a valid amount.");

export const walletDepositSchema = z.object({
  phone: z.string({ error: "A patient phone number is required." }).trim().min(6, "A valid patient phone number is required."),
  patientName: z.string({ error: "Patient name is required." }).trim().min(1, "Patient name is required."),
  uhid: z.string().trim().optional(),
  patientId: z.string().trim().optional(),
  amount: rupeeAmount,
  method: z.enum(invoicePaymentMethods, { error: "Select how the deposit was taken." }),
  reference: z.string().trim().optional(),
  note: z.string().trim().optional()
});

/** Each wallet action is its own member so the differing permission and audit consequences stay distinguishable on the wire. */
export const walletUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("apply-advance"),
    invoiceId: z.string().trim().min(1, "Invoice id is required."),
    /** Omitted means "apply as much as helps" — the lesser of the balance and what the bill owes. */
    amount: rupeeAmount.optional()
  }),
  z.object({
    action: z.literal("refund"),
    phone: z.string().trim().min(6, "A valid patient phone number is required."),
    amount: rupeeAmount,
    method: z.enum(invoicePaymentMethods, { error: "Select how the refund was paid." }),
    reason: z.string({ error: "A refund reason is required." }).trim().min(1, "A refund reason is required."),
    reference: z.string().trim().optional()
  })
]);

export type WalletDepositInput = z.infer<typeof walletDepositSchema>;
export type WalletUpdateInput = z.infer<typeof walletUpdateSchema>;
