export type PatientStatus = "Active" | "Inactive" | "Flagged";

export type PatientRecord = {
  id: string;
  uhid: string;
  createdAt: string;
  updatedAt: string;
  status: PatientStatus;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  age?: string;
  /** ISO date (YYYY-MM-DD). Additive alongside `age`: unlocks a minor's extended retention period (lib/retention/policy.ts, docs/privacy-review.md §5), which an age captured once at registration cannot be aged forward to compute. */
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  emergencyContact?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedicines?: string;
  notes?: string;
  lastVisitAt?: string;
  /** Persistent nutrition guidance, gated separately from general patient editing — see the "diet-plans" RBAC resource. */
  dietPlan?: string;
};

export const patientStatuses: PatientStatus[] = ["Active", "Inactive", "Flagged"];

export const bloodGroups = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
