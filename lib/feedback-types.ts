export type PatientFeedbackRecord = {
  id: string;
  createdAt: string;
  visitId: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  service: string;
  /** 1 (poor) to 5 (excellent). */
  rating: number;
  comment?: string;
};

export const feedbackRatingValues = [1, 2, 3, 4, 5];
