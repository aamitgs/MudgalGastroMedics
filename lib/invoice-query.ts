import { formatPaise } from "@/lib/billing-calc";
import type { Invoice, InvoiceStatus } from "@/lib/billing-types";

/**
 * Filtering / sorting / pagination for the invoice list (Track 5.2).
 *
 * Unlike lib/billing-query.ts — which paginates an already-loaded array
 * because its stat tiles need every row anyway — this runs **server-side**
 * (app/api/billing/route.ts). An invoice ledger only grows, and shipping the
 * whole hospital's billing history to a browser to filter one page out of it
 * is exactly the pattern §29's sub-300ms search target rules out.
 */

export type InvoiceSortField = "invoiceNo" | "patientName" | "status" | "totalPaise" | "balancePaise" | "createdAt";
export type SortDirection = "asc" | "desc";

export type InvoiceQueryParams = {
  page: number;
  pageSize: number;
  sortBy?: InvoiceSortField;
  sortDir?: SortDirection;
  query?: string;
  status?: InvoiceStatus;
  /** Only invoices still owing money — the collection desk's default view. */
  outstandingOnly?: boolean;
};

export type InvoiceQueryResult = {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type InvoiceStats = {
  outstandingPaise: number;
  collectedTodayPaise: number;
  draftCount: number;
  awaitingPaymentCount: number;
};

const numericFields: InvoiceSortField[] = ["totalPaise", "balancePaise"];

/**
 * Searchable text for one invoice. Deliberately includes UHID, phone and
 * invoice number: at a billing counter the patient volunteers whichever of
 * those they happen to be holding, and making staff pick the right field
 * first is the slow path.
 */
function haystack(invoice: Invoice) {
  return [invoice.invoiceNo, invoice.uhid, invoice.patientName, invoice.phone, invoice.department, invoice.doctorName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesQuery(invoice: Invoice, query: string) {
  return haystack(invoice).includes(query.toLowerCase());
}

function compareBy(field: InvoiceSortField, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  return (left: Invoice, right: Invoice) => {
    if (numericFields.includes(field)) {
      return ((left[field] as number) - (right[field] as number)) * sign;
    }
    const a = (left[field] ?? "").toString().toLowerCase();
    const b = (right[field] ?? "").toString().toLowerCase();
    if (a < b) return -1 * sign;
    if (a > b) return 1 * sign;
    return 0;
  };
}

export function queryInvoices(allInvoices: Invoice[], params: InvoiceQueryParams): InvoiceQueryResult {
  const page = Math.max(0, Math.floor(params.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize)));
  const query = params.query?.trim() ?? "";

  let filtered = allInvoices;
  if (params.status) filtered = filtered.filter((invoice) => invoice.status === params.status);
  if (params.outstandingOnly) {
    filtered = filtered.filter((invoice) => invoice.status !== "Cancelled" && invoice.status !== "Draft" && invoice.balancePaise > 0);
  }
  if (query) filtered = filtered.filter((invoice) => matchesQuery(invoice, query));

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc");
  const sorted = [...filtered].sort(compareBy(sortBy, sortDir));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * pageSize;

  return { invoices: sorted.slice(start, start + pageSize), total, page: clampedPage, pageSize, pageCount };
}

/**
 * Counter-level totals. Computed over every invoice, never the current page —
 * a collection figure that changed when you turned the page would be worse
 * than no figure at all.
 */
export function invoiceStats(allInvoices: Invoice[], today = new Date().toISOString().slice(0, 10)): InvoiceStats {
  let outstandingPaise = 0;
  let collectedTodayPaise = 0;
  let draftCount = 0;
  let awaitingPaymentCount = 0;

  for (const invoice of allInvoices) {
    if (invoice.status === "Cancelled") continue;
    if (invoice.status === "Draft") {
      draftCount += 1;
      continue;
    }
    if (invoice.balancePaise > 0) {
      outstandingPaise += invoice.balancePaise;
      awaitingPaymentCount += 1;
    }
    for (const payment of invoice.payments) {
      if (payment.receivedAt.slice(0, 10) === today) collectedTodayPaise += payment.amountPaise;
    }
  }

  return { outstandingPaise, collectedTodayPaise, draftCount, awaitingPaymentCount };
}

/** CSV row for the billing export — rupee strings, since a spreadsheet reader expects money, not paise. */
export function invoiceExportRow(invoice: Invoice) {
  return [
    invoice.invoiceNo,
    invoice.patientName,
    invoice.uhid ?? "",
    invoice.phone,
    invoice.status,
    formatPaise(invoice.totalPaise),
    formatPaise(invoice.paidPaise),
    formatPaise(invoice.balancePaise),
    invoice.createdAt.slice(0, 10)
  ];
}

export const invoiceExportHeaders = ["Invoice", "Patient", "UHID", "Phone", "Status", "Total", "Paid", "Balance", "Date"];
