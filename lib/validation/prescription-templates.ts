import { z } from "zod";

export const prescriptionTemplateCreateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required.").max(80, "Keep the name under 80 characters."),
  tag: z.string().trim().max(40, "Keep the tag under 40 characters.").optional(),
  prescriptionText: z.string().trim().min(1, "Prescription text is required.").max(4000, "Keep the prescription under 4000 characters.")
});

export const prescriptionTemplateUpdateSchema = z.object({
  id: z.string().trim().min(1, "Template id is required."),
  name: z.string().trim().min(1, "Template name is required.").max(80, "Keep the name under 80 characters.").optional(),
  tag: z.string().trim().max(40, "Keep the tag under 40 characters.").optional(),
  prescriptionText: z.string().trim().min(1, "Prescription text is required.").max(4000, "Keep the prescription under 4000 characters.").optional()
});

export const prescriptionTemplateDeleteSchema = z.object({
  id: z.string().trim().min(1, "Template id is required.")
});
