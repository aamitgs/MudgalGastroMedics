import type { AccessRole } from "@/lib/access/matrix";

export type ManagedUser = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "suspended";
  name: string;
  username: string;
  email?: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  lastLoginAt?: string;
  lockedUntil?: string;
};

export type AccessUserSortField = "name" | "username" | "status" | "lastLoginAt" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AccessUserQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AccessUserSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: ManagedUser["status"];
  role?: AccessRole;
};

export type AccessUserQueryResult = {
  users: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(user: ManagedUser, query: string) {
  const haystack = [user.name, user.username, user.email].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AccessUserSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: ManagedUser, right: ManagedUser) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Client-side pagination/sorting/filtering for User Management (Track 3.1
 * rollout). Runs against the already-loaded users array — realistic staff
 * account volume is small, so server pagination would add complexity
 * without a real benefit, same reasoning as the HR staff directory. This is
 * a display-only concern: every mutation (suspend, reset password, reset
 * MFA, role change request) still goes straight to the RBAC-enforced API
 * routes untouched by this module.
 */
export function queryAccessUsers(allUsers: ManagedUser[], params: AccessUserQueryParams): AccessUserQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allUsers;
  if (params.status) filtered = filtered.filter((user) => user.status === params.status);
  if (params.role) filtered = filtered.filter((user) => user.roles.includes(params.role as AccessRole));
  if (query) filtered = filtered.filter((user) => matchesQuery(user, query));

  const sortBy = params.sortBy ?? "name";
  const sortDir = params.sortDir ?? "asc";
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    users: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
