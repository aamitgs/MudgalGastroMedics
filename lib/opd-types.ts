export type OpdVisitStatus = "Waiting" | "In Consultation" | "Completed" | "Cancelled";

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
  clinicalNote?: string;
  /** Short structured impression, separate from the free-text clinical note — powers the doctor's "favourite diagnoses" quick-insert list. */
  diagnosis?: string;
  prescription?: string;
  advice?: string;
  followUpDate?: string;
  /** Set automatically to whichever doctor first writes a clinical field — real attribution, not manual assignment. */
  doctorName?: string;
  /** Set automatically the first time status moves to "In Consultation" — powers a real (not fabricated) average wait time. */
  consultationStartedAt?: string;
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
