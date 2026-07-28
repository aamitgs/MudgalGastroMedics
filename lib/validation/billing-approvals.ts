import { z } from "zod";
import { approvalKinds, discountTypes } from "@/lib/billing-approval-types";
import { invoicePaymentMethods } from "@/lib/billing-types";

/** Server-side validation for the billing approval chain (Track 5.6). Amounts cross the wire in rupees. */

const rupeeAmount = z.coerce.number({ error: "Enter a valid amount." }).positive("Enter an amount greater than zero.").finite("Enter a valid amount.");

export const approvalRequestSchema = z
  .object({
    kind: z.enum(approvalKinds, { error: "Select what you are requesting." }),
    invoiceId: z.string({ error: "Invoice id is required." }).trim().min(1, "Invoice id is required."),
    reason: z.string({ error: "A reason is required." }).trim().min(3, "Give a reason an approver can act on."),
    amount: rupeeAmount.optional(),
    percent: z.coerce.number().positive("Enter a percentage greater than zero.").max(100, "A discount can't exceed 100%.").optional(),
    discountType: z.enum(discountTypes).optional(),
    refundMethod: z.enum(invoicePaymentMethods).optional()
  })
  .refine((value) => value.kind === "Cancellation" || value.amount !== undefined || value.percent !== undefined, {
    error: "Enter an amount or a percentage.",
    path: ["amount"]
  })
  .refine((value) => value.kind !== "Refund" || value.refundMethod !== undefined, {
    error: "Select how the refund will be paid back.",
    path: ["refundMethod"]
  });

export const approvalDecisionSchema = z.object({
  id: z.string({ error: "Approval id is required." }).trim().min(1, "Approval id is required."),
  decision: z.enum(["Approved", "Rejected"], { error: "Select approve or reject." }),
  note: z.string().trim().optional()
});

export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
