// Track 4.6: this hospital has no in-house radiologist/pathologist — imaging
// and pathology tests are sent to an external facility, so this tracks the
// referral (sent → result received → reviewed), not an in-house
// acquire/read/approve pipeline. Deliberately one module for both Radiology
// and Pathology (same lifecycle, distinguished by `type`) rather than two
// near-duplicate ones.

export type ExternalReferralType = "Radiology" | "Pathology";

export type ExternalReferralStatus = "Ordered" | "Sent" | "Result Received" | "Reviewed" | "Cancelled";

export type ExternalReferral = {
  id: string;
  createdAt: string;
  updatedAt: string;
  visitId: string;
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  type: ExternalReferralType;
  testName: string;
  facilityName?: string;
  priority: "Routine" | "Urgent";
  status: ExternalReferralStatus;
  resultSummary?: string;
  amount?: number;
  paymentStatus: "Unpaid" | "Paid";
  notes?: string;
  /** Reviewing doctor's judgment call — no threshold auto-detection like Lab's numeric panic values, since these results are free text. */
  criticalFlag?: boolean;
  criticalReasons?: string[];
  criticalAcknowledgedBy?: string;
  criticalAcknowledgedAt?: string;
};

export const externalReferralTypes: ExternalReferralType[] = ["Radiology", "Pathology"];

export const externalReferralStatuses: ExternalReferralStatus[] = ["Ordered", "Sent", "Result Received", "Reviewed", "Cancelled"];

export const commonRadiologyTests = ["X-Ray Abdomen", "Ultrasound Abdomen", "CT Abdomen", "MRI Abdomen", "MRCP", "Chest X-Ray", "CT Chest"];

export const commonPathologyTests = [
  "Liver Biopsy Histopathology",
  "Ascitic Fluid Cytology",
  "Endoscopic Biopsy Histopathology",
  "Fine Needle Aspiration Cytology"
];
