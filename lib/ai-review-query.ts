import type { AiCaseReview, AiCaseSource, AiReviewStatus } from "@/lib/ai-types";

export type AiReviewSortField = "patientName" | "source" | "urgency" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AiReviewQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AiReviewSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: AiReviewStatus;
  source?: AiCaseSource;
};

export type AiReviewQueryResult = {
  reviews: AiCaseReview[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(review: AiCaseReview, query: string) {
  const haystack = [review.patientName, review.phone, review.uhid, review.service, review.summary, review.route].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AiReviewSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AiCaseReview, right: AiCaseReview) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for AI case reviews (Track 3.1
 * rollout). Same shape as lib/lab-query.ts / lib/procedure-schedule-query.ts.
 */
export function queryAiReviews(allReviews: AiCaseReview[], params: AiReviewQueryParams): AiReviewQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allReviews;
  if (params.status) filtered = filtered.filter((review) => review.status === params.status);
  if (params.source) filtered = filtered.filter((review) => review.source === params.source);
  if (query) filtered = filtered.filter((review) => matchesQuery(review, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    reviews: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
