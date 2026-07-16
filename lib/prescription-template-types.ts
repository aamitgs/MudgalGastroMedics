import type { AccessRole } from "@/lib/access/matrix";

/**
 * Named, deliberately curated prescription regimens (e.g. "IBS-D", "H. pylori
 * triple therapy", "post-ERCP") — distinct from the existing auto-derived
 * "favourite prescriptions" (lib/opd-store.ts's topFrequent over exact past
 * prescription text): a template is created on purpose, has a name a doctor
 * can browse by, and can be curated/renamed/deleted over time rather than
 * only ever surfacing text that has already been typed identically before.
 */
export type PrescriptionTemplate = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  tag?: string;
  prescriptionText: string;
  createdBy: string;
  createdByRole: AccessRole;
};
