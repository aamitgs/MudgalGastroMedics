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
  prescription?: string;
  advice?: string;
  followUpDate?: string;
};

export const opdVisitStatuses: OpdVisitStatus[] = ["Waiting", "In Consultation", "Completed", "Cancelled"];
