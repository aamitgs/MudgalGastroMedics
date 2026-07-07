import type { CmsContentItem, CmsContentStatus, CmsContentType } from "@/lib/cms-types";

export type CmsContentSortField = "title" | "type" | "status" | "owner" | "createdAt";
export type SortDirection = "asc" | "desc";

export type CmsContentQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: CmsContentSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: CmsContentStatus;
  type?: CmsContentType;
};

export type CmsContentQueryResult = {
  items: CmsContentItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(item: CmsContentItem, query: string) {
  const haystack = [item.title, item.slug, item.summary, item.owner, item.seoTitle, item.seoDescription].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: CmsContentSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: CmsContentItem, right: CmsContentItem) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the internal CMS (Track 3.1
 * rollout). Same shape as lib/lab-query.ts / lib/procedure-schedule-query.ts.
 */
export function queryCmsContent(allItems: CmsContentItem[], params: CmsContentQueryParams): CmsContentQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allItems;
  if (params.status) filtered = filtered.filter((item) => item.status === params.status);
  if (params.type) filtered = filtered.filter((item) => item.type === params.type);
  if (query) filtered = filtered.filter((item) => matchesQuery(item, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
