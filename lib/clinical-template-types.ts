import type { AccessRole } from "@/lib/access/matrix";

/**
 * Named, curated diagnosis-to-documentation bundles ("GERD", "Fatty Liver",
 * "H. pylori gastritis") — one click fills History/Examination/Diagnosis/
 * Advice+Investigation/Clinical Note in the consultation form at once,
 * distinct from PrescriptionTemplate (medicines only) and the auto-derived
 * favourite diagnoses (lib/opd-store.ts's topFrequent). Shared/curated across
 * whoever can edit prescriptions, same as PrescriptionTemplate — no per-doctor
 * private library since this is a single-doctor practice today.
 */
export type ClinicalTemplate = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  tag?: string;
  diagnosis: string;
  history?: string;
  generalExamination?: string;
  perAbdomen?: string;
  investigationAdvice?: string;
  clinicalNote?: string;
  createdBy: string;
  createdByRole: AccessRole;
};
