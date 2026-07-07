import type { InsuranceClaim, InsuranceClaimStatus } from "@/lib/finance-types";

export type InsuranceClaimSortField = "patientName" | "insurer" | "status" | "settledAmount" | "createdAt";
export type SortDirection = "asc" | "desc";

export type InsuranceClaimQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: InsuranceClaimSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: InsuranceClaimStatus;
};

export type InsuranceClaimQueryResult = {
  claims: InsuranceClaim[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(claim: InsuranceClaim, query: string) {
  const haystack = [claim.patientName, claim.phone, claim.insurer, claim.tpa, claim.policyNumber, claim.claimNumber].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: InsuranceClaimSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: InsuranceClaim, right: InsuranceClaim) => {
    if (field === "settledAmount") return (left.settledAmount - right.settledAmount) * sign;
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for Insurance Claims
 * (Track 3.1 rollout). Runs against the already-loaded claims array: the
 * "Create insurance claim" form on the same screen needs the complete
 * admissions/visits lists regardless, and claims volume is small enough
 * that a server round-trip would add latency without reducing anything
 * actually transferred — same reasoning as IPD and HR.
 */
export function queryInsuranceClaims(allClaims: InsuranceClaim[], params: InsuranceClaimQueryParams): InsuranceClaimQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allClaims;
  if (params.status) filtered = filtered.filter((claim) => claim.status === params.status);
  if (query) filtered = filtered.filter((claim) => matchesQuery(claim, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    claims: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
