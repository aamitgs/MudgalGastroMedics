import { z } from "zod";

const optionalField = z.string().trim().max(2000, "Keep this field under 2000 characters.").optional();

export const clinicalTemplateCreateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required.").max(80, "Keep the name under 80 characters."),
  tag: z.string().trim().max(40, "Keep the tag under 40 characters.").optional(),
  diagnosis: z.string().trim().min(1, "Diagnosis is required.").max(200, "Keep the diagnosis under 200 characters."),
  history: optionalField,
  generalExamination: optionalField,
  perAbdomen: optionalField,
  investigationAdvice: optionalField,
  clinicalNote: optionalField
});

export const clinicalTemplateDeleteSchema = z.object({
  id: z.string().trim().min(1, "Template id is required.")
});
