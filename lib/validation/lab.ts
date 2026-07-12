import { z } from "zod";
import { labOrderPriorities, labPaymentStatuses } from "@/lib/lab-types";

// tests (the common-test chips + comma-separated custom tests) stays outside
// this schema entirely — it's combined from two pieces of local component
// state, not a single registered field, and the server already returns a
// friendly "Add at least one lab test." error when it's empty; modeling it
// here would be new behavior, not a faithful migration of the existing form.
export const labOrderCreateSchema = z.object({
  visitId: z.string({ error: "Select an OPD visit." }).trim().min(1, "Select an OPD visit."),
  priority: z.enum(labOrderPriorities, { error: "Invalid priority." }),
  sampleType: z.string().trim().optional(),
  amount: z.coerce.number().optional(),
  paymentStatus: z.enum(labPaymentStatuses, { error: "Invalid payment status." }),
  notes: z.string().trim().optional()
});

export type LabOrderCreateInput = z.infer<typeof labOrderCreateSchema>;
