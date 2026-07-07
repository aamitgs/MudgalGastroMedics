import type { PatientRecord, PatientStatus } from "@/lib/patient-types";

export type PatientSortField = "name" | "uhid" | "status" | "lastVisitAt" | "createdAt";
export type SortDirection = "asc" | "desc";

export type PatientQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: PatientSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: PatientStatus;
};

export type PatientQueryResult = {
  patients: PatientRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function matchesQuery(patient: PatientRecord, query: string) {
  const haystack = [patient.uhid, patient.name, patient.phone, patient.email, patient.city, patient.status].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareBy(field: PatientSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: PatientRecord, right: PatientRecord) => {
    const a = (field === "lastVisitAt" || field === "createdAt" ? left[field] ?? "" : left[field] ?? "").toString().toLowerCase();
    const b = (field === "lastVisitAt" || field === "createdAt" ? right[field] ?? "" : right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

/**
 * Server-side pagination/sorting/filtering over an already-loaded patient
 * list (Track 3.1 pilot module). Pure — the document store loads the whole
 * collection into memory regardless, so slicing happens here rather than in
 * a query; this is the seed pattern other modules copy when they adopt the
 * shared DataTable, and swaps cleanly for a real SQL query if the document
 * store is ever replaced.
 */
export function queryPatients(allPatients: PatientRecord[], params: PatientQueryParams): PatientQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allPatients;
  if (params.status) filtered = filtered.filter((patient) => patient.status === params.status);
  if (query) filtered = filtered.filter((patient) => matchesQuery(patient, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return {
    patients: sorted.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    pageCount
  };
}
