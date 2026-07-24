export type OpdVisitStatus = "Waiting" | "In Consultation" | "Completed" | "Cancelled";

/**
 * One row of a structured prescription (Track: prescription pad redesign).
 * `instruction` holds either a prescriptionInstructionPresets id (resolved to
 * its bilingual label at render time) or free-typed text for anything the
 * preset list doesn't cover.
 */
export type PrescriptionItem = {
  id: string;
  medicine: string;
  strength?: string;
  instruction: string;
  days?: string;
  /** Set only when this row came from "Duplicate Previous Rx" (medication reconciliation) — Continue (carried forward unchanged) or Modify (doctor changed dose/duration). Undefined for medicines entered fresh this visit. */
  status?: "Continue" | "Modify";
};

export type OpdVisit = {
  id: string;
  token: string;
  appointmentId: string;
  patientId?: string;
  uhid?: string;
  createdAt: string;
  status: OpdVisitStatus;
  patientName: string;
  phone: string;
  service: string;
  priority?: string;
  symptoms: string[];
  billingStatus: "Not Started" | "Estimate Shared" | "Paid";
  estimatedAmount?: string;
  paymentMethod?: "Cash" | "UPI" | "Card" | "Insurance" | "Other";
  receiptId?: string;
  paidAt?: string;
  notes?: string;
  /** History of presenting complaint, as narrated by the patient — precedes clinical examination on the prescription pad. */
  presentingComplaints?: string;
  /** Relevant past/family history distinct from the patient's own stored chronicConditions (which is background, not this visit's history-taking). */
  history?: string;
  vitalsBp?: string;
  vitalsPulse?: string;
  vitalsWeight?: string;
  /** Reception-captured, before the doctor sees the patient (Track: reception vitals) — doctor may edit. BMI is derived from height+weight, never stored. */
  vitalsHeight?: string;
  vitalsRespiratoryRate?: string;
  vitalsTemperature?: string;
  vitalsSpo2?: string;
  vitalsBloodSugar?: string;
  generalExamination?: string;
  /** GI-specific exam finding, matches the pad's own layout. */
  perAbdomen?: string;
  priorInvestigation?: string;
  clinicalNote?: string;
  /** Short structured impression, separate from the free-text clinical note — powers the doctor's "favourite diagnoses" quick-insert list. */
  diagnosis?: string;
  /** Optional, doctor-attached coding from lib/icd10-codes.ts's curated GI/hepatology subset (Track: ICD-10 coding) — never inferred automatically from the free-text diagnosis. Label is stored alongside the code so the record stays self-contained even if the curated list changes later. */
  diagnosisIcd10Code?: string;
  diagnosisIcd10Label?: string;
  /** What investigations/tests to get done — distinct from `advice` (general patient instructions: diet, warning signs, reports to bring). */
  investigationAdvice?: string;
  prescription?: string;
  /** Structured rows (medicine/strength/instruction/days) for the redesigned prescription pad — `prescription` above stays auto-derived from these for every existing string consumer (favourites, exports, copy summary). Undefined on visits written before this existed. */
  prescriptionItems?: PrescriptionItem[];
  advice?: string;
  followUpDate?: string;
  /** Name/specialty/facility the patient is being referred to (Track 4.3) — not a structured lookup, since referrals go to external specialists this hospital has no directory of. */
  referralTo?: string;
  /** The referral letter body, AI-drafted or hand-written; only rendered into the referral-letter PDF once non-empty. */
  referralLetter?: string;
  /** AI-drafted or hand-written certificate wording (Track 4.3); when set, replaces the medical certificate PDF's auto-composed fallback paragraph. */
  certificateNote?: string;
  /** Set automatically to whichever doctor first writes a clinical field — real attribution, not manual assignment. */
  doctorName?: string;
  /** Set automatically the first time status moves to "In Consultation" — powers a real (not fabricated) average wait time. */
  consultationStartedAt?: string;
  /** Set automatically the first time status moves to "Completed" — with consultationStartedAt, powers real (not fabricated) consultation-duration analytics. */
  completedAt?: string;
  /** Requested by Billing after a Paid visit; Refunded once the money has actually gone back. */
  refundStatus?: "Requested" | "Refunded";
  refundReason?: string;
  refundAmount?: string;
  refundRequestedAt?: string;
  refundRequestedBy?: string;
  refundedAt?: string;
  refundedBy?: string;
};

export const opdVisitStatuses: OpdVisitStatus[] = ["Waiting", "In Consultation", "Completed", "Cancelled"];
