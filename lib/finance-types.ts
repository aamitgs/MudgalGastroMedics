export type InsuranceClaimStatus = "Draft" | "Preauth Sent" | "Approved" | "Rejected" | "Submitted" | "Settled";

export type InsuranceClaim = {
  id: string;
  createdAt: string;
  updatedAt: string;
  admissionId?: string;
  /**
   * The stay's register number, denormalized alongside the patient identity
   * below — a TPA queries a claim by the admission it covers, and that
   * reference has to survive unchanged for the life of the claim.
   */
  admissionNo?: string;
  visitId?: string;
  patientId?: string;
  uhid?: string;
  patientName: string;
  phone: string;
  insurer: string;
  tpa?: string;
  policyNumber?: string;
  claimNumber?: string;
  requestedAmount: number;
  approvedAmount: number;
  settledAmount: number;
  status: InsuranceClaimStatus;
  documents?: string;
  notes?: string;
};

export type AccountEntryType = "Income" | "Expense" | "Deposit" | "Refund" | "Adjustment";

export type AccountEntryMethod = "Cash" | "UPI" | "Card" | "Bank" | "Insurance" | "Other";

export type AccountEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  type: AccountEntryType;
  category: string;
  amount: number;
  method: AccountEntryMethod;
  reference?: string;
  party?: string;
  notes?: string;
};

export const insuranceClaimStatuses: InsuranceClaimStatus[] = ["Draft", "Preauth Sent", "Approved", "Rejected", "Submitted", "Settled"];
export const accountEntryTypes: AccountEntryType[] = ["Income", "Expense", "Deposit", "Refund", "Adjustment"];
export const accountEntryMethods: AccountEntryMethod[] = ["Cash", "UPI", "Card", "Bank", "Insurance", "Other"];
