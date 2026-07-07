import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";

export type AppointmentSortField = "name" | "service" | "status" | "date" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AppointmentQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: AppointmentSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: AppointmentStatus;
};

export type AppointmentQueryResult = {
  appointments: AppointmentRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(appointment: AppointmentRecord, query: string) {
  const haystack = [appointment.name, appointment.phone, appointment.service, appointment.priority, appointment.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: AppointmentSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: AppointmentRecord, right: AppointmentRecord) => {
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering for the Appointments module
 * (Track 3.1 rollout, second module after Patients). Same pure, in-memory
 * shape as lib/patient-query.ts — the seed pattern every module copies.
 */
export function queryAppointments(allAppointments: AppointmentRecord[], params: AppointmentQueryParams): AppointmentQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allAppointments;
  if (params.status) filtered = filtered.filter((appointment) => appointment.status === params.status);
  if (query) filtered = filtered.filter((appointment) => matchesQuery(appointment, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    appointments: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
