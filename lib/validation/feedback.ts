import { z } from "zod";

export const patientFeedbackCreateSchema = z.object({
  visitId: z.string().trim().min(1, "Visit id is required."),
  rating: z.coerce.number().int().min(1, "Rating is required.").max(5, "Rating must be between 1 and 5."),
  comment: z.string().trim().max(1000, "Keep comments under 1000 characters.").optional()
});

export type PatientFeedbackCreateInput = z.infer<typeof patientFeedbackCreateSchema>;
