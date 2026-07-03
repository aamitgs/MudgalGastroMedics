export type LabOrderStatus = "Ordered" | "Sample Collected" | "Processing" | "Result Ready" | "Delivered" | "Cancelled";

export type LabOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  visitId: string;
  token: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  service: string;
  tests: string[];
  priority: "Routine" | "Urgent";
  status: LabOrderStatus;
  sampleType?: string;
  resultSummary?: string;
  reportReference?: string;
  amount?: number;
  paymentStatus: "Unpaid" | "Paid";
  notes?: string;
};

export const labOrderStatuses: LabOrderStatus[] = ["Ordered", "Sample Collected", "Processing", "Result Ready", "Delivered", "Cancelled"];

export const commonLabTests = [
  "CBC",
  "LFT",
  "KFT",
  "PT/INR",
  "Viral Markers",
  "HBsAg",
  "Anti-HCV",
  "Amylase / Lipase",
  "Stool Occult Blood",
  "CRP",
  "Blood Sugar",
  "Thyroid Profile"
];
