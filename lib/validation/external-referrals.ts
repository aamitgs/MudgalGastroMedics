import { z } from "zod";
import { externalReferralStatuses, externalReferralTypes } from "@/lib/external-referral-types";

const optionalText = z.string().trim().optional();

export const externalReferralCreateSchema = z.object({
  visitId: z.string().trim().min(1, "OPD visit is required."),
  type: z.enum(externalReferralTypes, { error: "Invalid referral type." }),
  testName: z.string().trim().min(1, "A test/scan name is required."),
  facilityName: optionalText,
  priority: optionalText,
  amount: z.coerce.number().optional(),
  paymentStatus: optionalText,
  notes: optionalText
});

export const externalReferralUpdateSchema = z.object({
  id: z.string().trim().min(1, "Referral id is required."),
  status: z.enum(externalReferralStatuses, { error: "Invalid referral status." }).optional(),
  facilityName: optionalText,
  resultSummary: optionalText,
  paymentStatus: z.enum(["Paid", "Unpaid"], { error: "Invalid payment status." }).optional(),
  amount: z.coerce.number().optional(),
  notes: optionalText,
  criticalManual: z.boolean().optional(),
  acknowledgeCritical: z.boolean().optional()
});

export type ExternalReferralCreateInput = z.infer<typeof externalReferralCreateSchema>;
export type ExternalReferralUpdateInput = z.infer<typeof externalReferralUpdateSchema>;
