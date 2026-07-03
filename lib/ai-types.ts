export type AiReviewStatus = "Draft" | "Needs Review" | "Reviewed" | "Escalated" | "Archived";

export type AiCaseSource = "Appointment" | "OPD";

export type AiCaseReview = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: AiCaseSource;
  sourceId: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  service: string;
  urgency: "Routine" | "Priority Review" | "Urgent Reception Call";
  route: string;
  summary: string;
  flags: string[];
  preparation: string[];
  receptionScript: string;
  safetyNote: string;
  doctorReviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: AiReviewStatus;
};

export const aiReviewStatuses: AiReviewStatus[] = ["Draft", "Needs Review", "Reviewed", "Escalated", "Archived"];
