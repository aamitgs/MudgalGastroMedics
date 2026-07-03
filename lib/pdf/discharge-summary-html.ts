import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { IpdAdmission, VitalsReading } from "@/lib/ipd-types";
import { doctor, fullAddress, site } from "@/lib/site-data";
import { generatedAtLabel } from "@/lib/pdf/branding";

let cachedLogoDataUri: string | null = null;

function logoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const buffer = readFileSync(path.join(process.cwd(), "public", "mgm-logo.png"));
  cachedLogoDataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  return cachedLogoDataUri;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textBlock(label: string, value?: string) {
  const safeValue = value?.trim();
  if (!safeValue) return "";
  return `
    <section class="card">
      <p class="section-label">${escapeHtml(label)}</p>
      <p class="body-text">${escapeHtml(safeValue).replace(/\n/g, "<br />")}</p>
    </section>
  `;
}

function formatVital(reading: VitalsReading) {
  const parts = [
    reading.heartRate !== undefined ? `HR ${reading.heartRate}` : "",
    reading.spo2 !== undefined ? `SpO2 ${reading.spo2}%` : "",
    reading.bloodPressure ? `BP ${reading.bloodPressure}` : "",
    reading.temperature !== undefined ? `Temp ${reading.temperature}°F` : ""
  ].filter(Boolean);
  return `${generatedAtLabel(new Date(reading.recordedAt))} — ${parts.join(", ") || "No readings"}`;
}

// Puppeteer paginates page.pdf() independently of the source document's layout, so a
// CSS `position: fixed` header/footer only renders on whichever single page it happens to
// land on. Repeating per-page chrome must instead go through page.pdf()'s own
// headerTemplate/footerTemplate option, which is why the header/footer markup lives in
// separate template builders below rather than inside the body HTML.
export function buildDischargeSummaryHtml(admission: IpdAdmission, vitals: VitalsReading[]) {
  const admittedAt = generatedAtLabel(new Date(admission.createdAt));
  const dischargedAt = admission.dischargedAt ? generatedAtLabel(new Date(admission.dischargedAt)) : "Not yet discharged";
  const recentVitals = vitals.slice(0, 8).map((reading) => `<li>${escapeHtml(formatVital(reading))}</li>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: "Geist", "Helvetica Neue", Arial, sans-serif; color: #0f172a; font-size: 11px; margin: 0; }
  .patient-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 12px; }
  .patient-label { font-size: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; margin: 0; }
  .patient-value { font-size: 10px; font-weight: 600; margin: 1px 0 0; }
  .card { border: 1pt solid #dbe3e8; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
  .section-label { font-weight: 600; font-size: 9px; color: #087d9e; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 4px; }
  .body-text { font-size: 9.5px; line-height: 1.5; margin: 0; white-space: pre-wrap; }
  ul.vitals { margin: 0; padding-left: 16px; font-size: 9px; line-height: 1.6; }
  .signature { margin-top: 28px; text-align: right; }
  .signature .name { font-weight: 700; font-size: 10.5px; margin: 0; }
  .signature .meta { font-size: 8px; color: #475569; margin: 2px 0 0; }
</style>
</head>
<body>
  <main>
    <div class="patient-row">
      <div><p class="patient-label">Patient</p><p class="patient-value">${escapeHtml(admission.patientName)}</p></div>
      ${admission.uhid ? `<div><p class="patient-label">UHID</p><p class="patient-value">${escapeHtml(admission.uhid)}</p></div>` : ""}
      <div><p class="patient-label">Phone</p><p class="patient-value">${escapeHtml(admission.phone)}</p></div>
      <div><p class="patient-label">Ward / Bed</p><p class="patient-value">${escapeHtml(admission.ward)} / ${escapeHtml(admission.bedLabel)}</p></div>
      <div><p class="patient-label">Admitted</p><p class="patient-value">${escapeHtml(admittedAt)}</p></div>
      <div><p class="patient-label">Discharged</p><p class="patient-value">${escapeHtml(dischargedAt)}</p></div>
      <div><p class="patient-label">Admitting Doctor</p><p class="patient-value">${escapeHtml(admission.admittingDoctor || doctor.name)}</p></div>
      ${admission.assignedNurse ? `<div><p class="patient-label">Assigned Nurse</p><p class="patient-value">${escapeHtml(admission.assignedNurse)}</p></div>` : ""}
    </div>

    ${textBlock("Diagnosis", admission.diagnosis)}
    ${textBlock("Care Plan", admission.carePlan)}
    ${textBlock("Nursing Notes", admission.nursingNotes)}
    ${textBlock("Diet Advice", admission.dietAdvice)}
    ${textBlock("Discharge Summary", admission.dischargeSummary || "Discharge summary not yet documented.")}

    ${recentVitals ? `<section class="card"><p class="section-label">Recent Vitals</p><ul class="vitals">${recentVitals}</ul></section>` : ""}

    <div class="signature">
      <p class="name">${escapeHtml(admission.admittingDoctor || doctor.name)}</p>
      <p class="meta">${escapeHtml(doctor.designation)}</p>
      <p class="meta">Reg. No: ${escapeHtml(doctor.registration)}</p>
    </div>
  </main>
</body>
</html>`;
}

export function buildDischargeSummaryHeaderTemplate(admission: IpdAdmission) {
  return `
    <div style="width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 8px; color: #0f172a; padding: 0 20mm; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5pt solid #087d9e; padding-bottom: 6px;">
      <div style="display: flex; gap: 8px;">
        <img src="${logoDataUri()}" style="width: 32px; height: 32px;" />
        <div>
          <p style="font-weight: 700; font-size: 11px; margin: 0;">${escapeHtml(site.name)}</p>
          <p style="font-size: 7px; color: #475569; margin: 2px 0 0; max-width: 260px;">${escapeHtml(fullAddress)}</p>
          <p style="font-size: 7px; color: #475569; margin: 1px 0 0;">Phone: ${escapeHtml(site.phone)} | ${escapeHtml(site.mobile)}</p>
        </div>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: 700; font-size: 10px; color: #087d9e; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Discharge Summary</p>
        <p style="font-size: 7px; color: #475569; margin: 3px 0 0;">Ref: ${escapeHtml(admission.token)}</p>
      </div>
    </div>
  `;
}

export function buildDischargeSummaryFooterTemplate() {
  return `
    <div style="width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 7px; color: #475569; padding: 0 20mm; display: flex; justify-content: space-between; border-top: 1pt solid #dbe3e8; padding-top: 5px;">
      <span>Confidential clinical document. Generated electronically for the named patient only. Generated ${escapeHtml(generatedAtLabel())}.</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
}
