import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOpdVisitById } from "@/lib/opd-store";
import { visitReference } from "@/lib/opd-types";
import { listIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { admissionReference } from "@/lib/ipd-types";
import { findPatientByPhone, getPatientById } from "@/lib/patient-store";
import { registerPdfFonts } from "@/lib/pdf/branding";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { ItemisedInvoiceDocument } from "@/lib/pdf/itemised-invoice-document";
import { getInvoiceById, listInvoicesForVisit } from "@/lib/billing-store";
import { invoiceUpiLink } from "@/lib/billing-upi";
import type { Invoice } from "@/lib/billing-types";
import QRCode from "qrcode";
import { MedicalCertificateDocument } from "@/lib/pdf/medical-certificate-document";
import { ReferralLetterDocument } from "@/lib/pdf/referral-letter-document";
import { buildDischargeSummaryFooterTemplate, buildDischargeSummaryHeaderTemplate, buildDischargeSummaryHtml } from "@/lib/pdf/discharge-summary-html";
import { renderHtmlToPdf } from "@/lib/pdf/chromium";
import { PurchaseOrderDocument } from "@/lib/pdf/purchase-order-document";
import { listPurchaseOrders } from "@/lib/purchase-order-store";
import { TableDocument } from "@/lib/pdf/table-document";
import { getPublicProcedure } from "@/lib/cms-public";
import { getPrepChecklist } from "@/lib/procedure-prep";
import { ProcedurePrepDocument } from "@/lib/pdf/procedure-prep-document";
import { getPatientEducationSheet } from "@/lib/patient-education-sheets";
import { PatientEducationDocument } from "@/lib/pdf/patient-education-document";

export type PdfRenderResult =
  | { ok: true; buffer: Buffer; filename: string }
  | { ok: false; error: string; status: number };

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "document";
}

async function findPatientForVisit(patientId: string | undefined, phone: string) {
  if (patientId) {
    const byId = (await getPatientById(patientId));
    if (byId) return byId;
  }
  return (await findPatientByPhone(phone)) ?? undefined;
}

export async function renderPrescriptionPdf(visitId: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };

  registerPdfFonts();
  const patient = await findPatientForVisit(visit.patientId, visit.phone);
  const buffer = await renderToBuffer(PrescriptionDocument({ visit, patient }));
  return { ok: true, buffer, filename: `prescription-${slugify(visit.patientName)}-${slugify(visitReference(visit))}.pdf` };
}

export async function renderPatientEducationPdf(visitId: string, sheetKey: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };
  const sheet = getPatientEducationSheet(sheetKey);
  if (!sheet) return { ok: false, error: "Unknown education sheet.", status: 404 };

  registerPdfFonts();
  const patient = await findPatientForVisit(visit.patientId, visit.phone);
  const buffer = await renderToBuffer(PatientEducationDocument({ visit, patient, title: sheet.title, points: sheet.points }));
  return { ok: true, buffer, filename: `${slugify(sheet.title)}-${slugify(visit.patientName)}.pdf` };
}

export async function renderMedicalCertificatePdf(visitId: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };

  registerPdfFonts();
  const patient = await findPatientForVisit(visit.patientId, visit.phone);
  const buffer = await renderToBuffer(MedicalCertificateDocument({ visit, patient }));
  return { ok: true, buffer, filename: `medical-certificate-${slugify(visit.patientName)}-${slugify(visitReference(visit))}.pdf` };
}

export async function renderReferralLetterPdf(visitId: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };
  if (!visit.referralLetter?.trim()) {
    return { ok: false, error: "Write or draft a referral letter first.", status: 400 };
  }

  registerPdfFonts();
  const patient = await findPatientForVisit(visit.patientId, visit.phone);
  const buffer = await renderToBuffer(ReferralLetterDocument({ visit, patient }));
  return { ok: true, buffer, filename: `referral-letter-${slugify(visit.patientName)}-${slugify(visitReference(visit))}.pdf` };
}

/** PNG data URI for a QR payload, or undefined if it can't be produced — a missing QR must never break a bill. */
async function qrDataUri(payload: string | null | undefined): Promise<string | undefined> {
  if (!payload) return undefined;
  try {
    return await QRCode.toDataURL(payload, { margin: 1, width: 256, errorCorrectionLevel: "M" });
  } catch {
    return undefined;
  }
}

/**
 * The itemised invoice (Track 5.8). `copyNumber` above 1 stamps the document
 * DUPLICATE — the caller gets that from lib/reprint-store.ts.
 */
/**
 * The stay a bill was raised for. Read from the invoice, where it is stamped at
 * creation; only looked up for IPD bills issued before that field existed, so
 * that reprinting an old one still cites its admission rather than silently
 * dropping the reference.
 */
async function resolveAdmissionNo(invoice: Invoice) {
  if (invoice.admissionNo) return invoice.admissionNo;
  if (!invoice.admissionId) return undefined;
  const admission = (await listIpdAdmissions()).find((entry) => entry.id === invoice.admissionId);
  // Deliberately not admissionReference(): a bill that prints the OPD token
  // under "Admission No." is worse than one that prints nothing there. Stays
  // still awaiting the backfill simply omit the line.
  return admission?.admissionNo;
}

/** The OPD encounter a bill was raised for; same read-then-fall-back-to-lookup rule. */
async function resolveVisitNo(invoice: Invoice) {
  if (invoice.visitNo) return invoice.visitNo;
  if (!invoice.visitId) return undefined;
  const visit = await getOpdVisitById(invoice.visitId);
  // Not visitReference(), for the reason above — a daily token under a
  // "Visit No." label is the confusion this replaced.
  return visit?.visitNo;
}

export async function renderItemisedInvoicePdf(invoice: Invoice, copyNumber = 1): Promise<PdfRenderResult> {
  registerPdfFonts();

  const [upiQrDataUri, invoiceQrDataUri, admissionNo, visitNo] = await Promise.all([
    qrDataUri(invoiceUpiLink(invoice)),
    qrDataUri(invoice.invoiceNo),
    resolveAdmissionNo(invoice),
    resolveVisitNo(invoice)
  ]);

  const buffer = await renderToBuffer(ItemisedInvoiceDocument({ invoice, admissionNo, visitNo, upiQrDataUri, invoiceQrDataUri, copyNumber }));
  return { ok: true, buffer, filename: `invoice-${slugify(invoice.invoiceNo)}.pdf` };
}

export async function renderInvoicePdfById(invoiceId: string, copyNumber = 1): Promise<PdfRenderResult> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found.", status: 404 };
  return renderItemisedInvoicePdf(invoice, copyNumber);
}

/**
 * Kept on the original `visitId` contract so every existing caller keeps
 * working, but it now renders the *real* invoice when the visit has one —
 * falling back to the legacy single-line document only for visits that predate
 * the invoice entity.
 */
export async function renderInvoicePdf(visitId: string, copyNumber = 1): Promise<PdfRenderResult> {
  const invoices = await listInvoicesForVisit(visitId);
  const live = invoices.find((invoice) => invoice.status !== "Cancelled") ?? invoices[0];
  if (live) return renderItemisedInvoicePdf(live, copyNumber);

  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };

  registerPdfFonts();
  const buffer = await renderToBuffer(InvoiceDocument({ visit }));
  const prefix = visit.billingStatus === "Paid" ? "receipt" : "invoice";
  return { ok: true, buffer, filename: `${prefix}-${slugify(visit.patientName)}-${slugify(visit.receiptId || visitReference(visit))}.pdf` };
}

export async function renderPurchaseOrderPdf(orderId: string): Promise<PdfRenderResult> {
  const order = (await listPurchaseOrders()).find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Purchase order not found.", status: 404 };

  registerPdfFonts();
  const buffer = await renderToBuffer(PurchaseOrderDocument({ order }));
  return { ok: true, buffer, filename: `purchase-order-${slugify(order.vendor)}-${order.id}.pdf` };
}

// Shared by the table-export download and email routes (Track 3.4) — unlike
// the other renderX helpers, there's no store lookup to fail: the caller
// already fetched this data itself via its own authorized GET, so this is a
// pure format transform, not a data-access point.
export async function renderTablePdf({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  registerPdfFonts();
  const buffer = await renderToBuffer(TableDocument({ title, headers, rows }));
  return { buffer, filename: `${slugify(title)}.pdf` };
}

// Public content, not a patient record — validated against the real published
// procedure/disease list (getPublicProcedure) rather than trusting the raw
// slug, so an unknown/malformed ?slug= 404s instead of rendering a blank doc.
export async function renderProcedurePrepPdf(slug: string): Promise<PdfRenderResult> {
  const procedure = await getPublicProcedure(slug);
  if (!procedure) return { ok: false, error: "Procedure not found.", status: 404 };

  registerPdfFonts();
  const buffer = await renderToBuffer(ProcedurePrepDocument({ title: procedure.title, checklist: getPrepChecklist(slug) }));
  return { ok: true, buffer, filename: `${slugify(procedure.title)}-prep-checklist.pdf` };
}

export async function renderDischargeSummaryPdf(admissionId: string): Promise<PdfRenderResult> {
  const admission = (await listIpdAdmissions()).find((item) => item.id === admissionId);
  if (!admission) return { ok: false, error: "Admission not found.", status: 404 };

  const vitals = (await listVitals(admission.id));
  const html = buildDischargeSummaryHtml(admission, vitals);
  const buffer = await renderHtmlToPdf(html, {
    headerTemplate: buildDischargeSummaryHeaderTemplate(admission),
    footerTemplate: buildDischargeSummaryFooterTemplate()
  });
  return { ok: true, buffer, filename: `discharge-summary-${slugify(admission.patientName)}-${slugify(admissionReference(admission))}.pdf` };
}
