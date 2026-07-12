import { z } from "zod";
import { accountEntryMethods, accountEntryTypes } from "@/lib/finance-types";

// The { error } option on the base z.string()/z.coerce.number() call (not
// just a chained .min() message) is what covers an entirely-absent key —
// .min() alone only fires once the type check already passed, so an absent
// required field would otherwise surface a raw "expected string, received
// undefined" instead of this friendly message.
export const accountEntryCreateSchema = z.object({
  date: z.string().trim().optional(),
  type: z.enum(accountEntryTypes, { error: "Invalid entry type." }),
  category: z.string({ error: "Category is required." }).trim().min(1, "Category is required."),
  amount: z.coerce.number({ error: "Amount is required." }).min(0.01, "Amount must be greater than zero."),
  method: z.enum(accountEntryMethods, { error: "Invalid payment method." }),
  reference: z.string().trim().optional(),
  party: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export type AccountEntryCreateInput = z.infer<typeof accountEntryCreateSchema>;

// sourceType drives which of admissionId/visitId the form renders (only one
// at a time) — superRefine attaches the "select a source" error to whichever
// field is currently visible, so it never points at the hidden one.
export const insuranceClaimCreateSchema = z
  .object({
    sourceType: z.enum(["ipd", "opd"]),
    admissionId: z.string().trim().optional(),
    visitId: z.string().trim().optional(),
    insurer: z.string({ error: "Insurer is required." }).trim().min(1, "Insurer is required."),
    tpa: z.string().trim().optional(),
    policyNumber: z.string().trim().optional(),
    claimNumber: z.string().trim().optional(),
    requestedAmount: z.coerce.number().optional(),
    approvedAmount: z.coerce.number().optional(),
    settledAmount: z.coerce.number().optional(),
    documents: z.string().trim().optional(),
    notes: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    const hasSource = data.sourceType === "ipd" ? Boolean(data.admissionId) : Boolean(data.visitId);
    if (!hasSource) {
      ctx.addIssue({
        code: "custom",
        message: "Select an IPD admission or OPD visit.",
        path: [data.sourceType === "ipd" ? "admissionId" : "visitId"]
      });
    }
  });

export type InsuranceClaimCreateInput = z.infer<typeof insuranceClaimCreateSchema>;
