import type { StaffMember, StaffRole, StaffStatus } from "@/lib/hr-types";

export type StaffSortField = "name" | "role" | "department" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";

export type StaffQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: StaffSortField;
  sortDir?: SortDirection;
  query?: string;
  role?: StaffRole;
  status?: StaffStatus;
};

export type StaffQueryResult = {
  staff: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(member: StaffMember, query: string) {
  const haystack = [member.name, member.phone, member.email, member.department, member.role].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: StaffSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: StaffMember, right: StaffMember) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for the Staff Directory
 * (Track 3.1 rollout). Runs against the already-loaded staff array rather
 * than a fresh server fetch: the "Mark attendance" form's staff dropdown
 * on the same screen needs the complete, unfiltered staff list regardless,
 * so server pagination would add latency without reducing anything
 * actually transferred — same reasoning as IPD's admissions table.
 */
export function queryStaffDirectory(allStaff: StaffMember[], params: StaffQueryParams): StaffQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allStaff;
  if (params.role) filtered = filtered.filter((member) => member.role === params.role);
  if (params.status) filtered = filtered.filter((member) => member.status === params.status);
  if (query) filtered = filtered.filter((member) => matchesQuery(member, query));

  const sortBy = params.sortBy ?? "name";
  const sortDir = params.sortDir ?? "asc";
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    staff: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
