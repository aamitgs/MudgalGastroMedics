export type InsuranceClaimStatus = "Draft" | "Preauth Sent" | "Approved" | "Rejected" | "Submitted" | "Settled";

export type InsuranceClaim = {
  id: string;
  createdAt: string;
  updatedAt: string;
  admissionId?: string;
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

export type AccountEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  type: AccountEntryType;
  category: string;
  amount: number;
  method: "Cash" | "UPI" | "Card" | "Bank" | "Insurance" | "Other";
  reference?: string;
  party?: string;
  notes?: string;
};

export const insuranceClaimStatuses: InsuranceClaimStatus[] = ["Draft", "Preauth Sent", "Approved", "Rejected", "Submitted", "Settled"];
export const accountEntryTypes: AccountEntryType[] = ["Income", "Expense", "Deposit", "Refund", "Adjustment"];
