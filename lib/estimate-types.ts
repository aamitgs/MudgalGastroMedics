import type { InvoiceLineItem } from "@/lib/billing-types";

/**
 * Pre-treatment estimates (Track 5.7, §30).
 *
 * A patient facing a procedure asks "what will this cost?" before consenting,
 * and answering with a verbal number is how disputes start. An estimate is a
 * written, dated quote that converts into the real invoice — so what was
 * quoted and what was billed are the same document lineage.
 *
 * Reuses `InvoiceLineItem` rather than defining a parallel line shape: an
 * estimate line and a bill line are the same thing at different times, and a
 * separate type would immediately drift.
 */

export type EstimateStatus = "Draft" | "Shared" | "Accepted" | "Declined" | "Converted" | "Expired";

/** How the patient's acceptance was captured. */
export type AcceptanceMethod = "In person" | "Phone" | "Portal";

export type Estimate = {
  id: string;
  estimateNo: string;
  createdAt: string;
  updatedAt: string;
  status: EstimateStatus;
  patientName: string;
  phone: string;
  uhid?: string;
  patientId?: string;
  visitId?: string;
  department?: string;
  doctorName?: string;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  /** After this the quote is stale — prices move, and an indefinite quote is a liability. */
  validUntil?: string;
  sharedAt?: string;
  /**
   * Acceptance record, not a cryptographic signature: the patient's name as
   * they gave it, who took it, when, and how. Real e-signature needs a legal
   * framework and a dependency this project does not have, and claiming to be
   * one would be worse than being clearly what it is.
   */
  acceptedAt?: string;
  acceptedBy?: string;
  acceptanceMethod?: AcceptanceMethod;
  patientSignatureName?: string;
  declinedAt?: string;
  declineReason?: string;
  /** Set once this estimate became a real bill. */
  convertedInvoiceId?: string;
  convertedInvoiceNo?: string;
  convertedAt?: string;
  notes?: string;
  createdBy: string;
};

export const estimateStatuses: EstimateStatus[] = ["Draft", "Shared", "Accepted", "Declined", "Converted", "Expired"];
export const acceptanceMethods: AcceptanceMethod[] = ["In person", "Phone", "Portal"];
