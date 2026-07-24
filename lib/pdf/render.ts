import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOpdVisitById } from "@/lib/opd-store";
import { listIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { findPatientByPhone, getPatientById } from "@/lib/patient-store";
import { registerPdfFonts } from "@/lib/pdf/branding";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
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
  return { ok: true, buffer, filename: `prescription-${slugify(visit.patientName)}-${visit.token}.pdf` };
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
  return { ok: true, buffer, filename: `medical-certificate-${slugify(visit.patientName)}-${visit.token}.pdf` };
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
  return { ok: true, buffer, filename: `referral-letter-${slugify(visit.patientName)}-${visit.token}.pdf` };
}

export async function renderInvoicePdf(visitId: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };

  registerPdfFonts();
  const buffer = await renderToBuffer(InvoiceDocument({ visit }));
  const prefix = visit.billingStatus === "Paid" ? "receipt" : "invoice";
  return { ok: true, buffer, filename: `${prefix}-${slugify(visit.patientName)}-${visit.receiptId || visit.token}.pdf` };
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
  return { ok: true, buffer, filename: `discharge-summary-${slugify(admission.patientName)}-${admission.token}.pdf` };
}
