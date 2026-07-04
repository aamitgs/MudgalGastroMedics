import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOpdVisitById } from "@/lib/opd-store";
import { listIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { findPatientByPhone, getPatientById } from "@/lib/patient-store";
import { registerPdfFonts } from "@/lib/pdf/branding";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import { buildDischargeSummaryFooterTemplate, buildDischargeSummaryHeaderTemplate, buildDischargeSummaryHtml } from "@/lib/pdf/discharge-summary-html";
import { renderHtmlToPdf } from "@/lib/pdf/chromium";

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

export async function renderInvoicePdf(visitId: string): Promise<PdfRenderResult> {
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { ok: false, error: "Visit not found.", status: 404 };

  registerPdfFonts();
  const buffer = await renderToBuffer(InvoiceDocument({ visit }));
  const prefix = visit.billingStatus === "Paid" ? "receipt" : "invoice";
  return { ok: true, buffer, filename: `${prefix}-${slugify(visit.patientName)}-${visit.receiptId || visit.token}.pdf` };
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
