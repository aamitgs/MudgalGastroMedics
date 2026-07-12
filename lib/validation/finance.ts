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
