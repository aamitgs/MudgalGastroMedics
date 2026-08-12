import type { ExternalReferral, ExternalReferralStatus, ExternalReferralType } from "@/lib/external-referral-types";

export type ExternalReferralSortField = "patientName" | "token" | "status" | "priority" | "createdAt";
export type SortDirection = "asc" | "desc";

export type ExternalReferralQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: ExternalReferralSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: ExternalReferralStatus;
  type?: ExternalReferralType;
  criticalOnly?: boolean;
};

export type ExternalReferralQueryResult = {
  referrals: ExternalReferral[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(referral: ExternalReferral, query: string) {
  const haystack = [referral.id, referral.referralNo, referral.visitNo, referral.token, referral.uhid, referral.patientName, referral.phone, referral.testName, referral.facilityName, referral.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function isCriticalUnacknowledged(referral: ExternalReferral) {
  return Boolean(referral.criticalFlag) && !referral.criticalAcknowledgedAt && referral.status !== "Cancelled";
}

function compareBy(field: ExternalReferralSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: ExternalReferral, right: ExternalReferral) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/** Server-side pagination/sorting/filtering (Track 3.1 pattern), same shape as lib/lab-query.ts. */
export function queryExternalReferrals(allReferrals: ExternalReferral[], params: ExternalReferralQueryParams): ExternalReferralQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allReferrals;
  if (params.status) filtered = filtered.filter((referral) => referral.status === params.status);
  if (params.type) filtered = filtered.filter((referral) => referral.type === params.type);
  if (params.criticalOnly) filtered = filtered.filter(isCriticalUnacknowledged);
  if (query) filtered = filtered.filter((referral) => matchesQuery(referral, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    referrals: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
