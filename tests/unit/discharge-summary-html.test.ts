// @vitest-environment node
// Server-only module (reads the logo off disk for the PDF header), so this
// file opts out of the suite's default jsdom environment.
import { describe, expect, it } from "vitest";
import { buildDischargeSummaryHeaderTemplate, buildDischargeSummaryHtml } from "@/lib/pdf/discharge-summary-html";
import type { IpdAdmission } from "@/lib/ipd-types";

const admission: IpdAdmission = {
  id: "IPD-MSOXD53Q-JFJ",
  admissionNo: "IPD-2026-00002",
  createdAt: "2026-08-11T17:19:04.214Z",
  updatedAt: "2026-08-11T17:19:04.214Z",
  status: "Admitted",
  visitId: "OPD-MSJZWXI8-31K",
  token: "MGM-014",
  uhid: "MGM-2026-00015",
  patientName: "Test Patient",
  phone: "9170695833",
  bedId: "BED-REC-01",
  bedLabel: "Recovery 1",
  ward: "Recovery",
  admissionType: "Planned",
  admittingDoctor: "Dr. Deepak Kumar Sharma",
  diagnosis: "Observation"
};

describe("discharge summary", () => {
  it("carries the admission number, not the repeating OPD token, as the reference", () => {
    const header = buildDischargeSummaryHeaderTemplate(admission);
    expect(header).toContain("Ref: IPD-2026-00002");
    expect(header).not.toContain("MGM-014");
  });

  it("prints the admission number alongside the lifelong UHID", () => {
    const html = buildDischargeSummaryHtml(admission, []);
    expect(html).toContain("Admission No.");
    expect(html).toContain("IPD-2026-00002");
    expect(html).toContain("MGM-2026-00015");
  });

  // Stays predating the admissionNo field still have to produce a usable
  // document — the token was genuinely their reference at the time, and "Ref"
  // is an honest label for it.
  it("falls back to the token in the generic Ref slot for a stay recorded before numbers existed", () => {
    const legacy: IpdAdmission = { ...admission, admissionNo: undefined };
    expect(buildDischargeSummaryHeaderTemplate(legacy)).toContain("Ref: MGM-014");
  });

  // The label is the point: a daily queue number printed under "Admission No."
  // is the exact confusion admission numbers exist to end, so the field is
  // omitted rather than filled with a token.
  it("omits the Admission No. field entirely rather than labelling a token as one", () => {
    const html = buildDischargeSummaryHtml({ ...admission, admissionNo: undefined }, []);
    expect(html).not.toContain("Admission No.");
    expect(html).toContain("MGM-2026-00015");
  });
});
