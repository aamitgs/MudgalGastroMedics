import { describe, expect, it } from "vitest";
import type { IpdAdmission } from "@/lib/ipd-types";
import { admissibleVisits, queryIpdAdmissions } from "@/lib/ipd-admission-query";

function admission(overrides: Partial<IpdAdmission> = {}): IpdAdmission {
  return {
    id: "IPD-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Admitted",
    visitId: "V-1",
    token: "T-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    bedId: "BED-1",
    bedLabel: "HDU-01",
    ward: "HDU",
    admissionType: "Emergency",
    admittingDoctor: "Dr. Mudgal",
    diagnosis: "GI bleed observation",
    ...overrides
  } as IpdAdmission;
}

const fixture: IpdAdmission[] = [
  admission({ id: "A1", patientName: "Charlie", status: "Admitted", createdAt: "2026-01-01T00:00:00.000Z" }),
  admission({ id: "A2", patientName: "Alice", status: "Admitted", createdAt: "2026-01-02T00:00:00.000Z", ward: "General", bedLabel: "GEN-04" }),
  admission({ id: "A3", patientName: "Bob", status: "Discharged", createdAt: "2026-01-03T00:00:00.000Z", phone: "9123456789" }),
  admission({ id: "A4", patientName: "Dev", status: "Admitted", createdAt: "2026-01-04T00:00:00.000Z" })
];

describe("queryIpdAdmissions", () => {
  it("paginates: page size caps rows and reports total/pageCount", () => {
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 2, sortBy: "createdAt", sortDir: "asc" });
    expect(result.admissions).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.pageCount).toBe(2);
    expect(result.admissions.map((a) => a.id)).toEqual(["A1", "A2"]);
  });

  it("clamps an out-of-range page back to the last valid page", () => {
    const result = queryIpdAdmissions(fixture, { page: 99, pageSize: 2 });
    expect(result.page).toBe(1);
    expect(result.admissions).toHaveLength(2);
  });

  it("sorts by patient name ascending and descending", () => {
    const asc = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "asc" });
    expect(asc.admissions.map((a) => a.patientName)).toEqual(["Alice", "Bob", "Charlie", "Dev"]);
    const desc = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, sortBy: "patientName", sortDir: "desc" });
    expect(desc.admissions.map((a) => a.patientName)).toEqual(["Dev", "Charlie", "Bob", "Alice"]);
  });

  it("filters by free-text query across token/patient/phone/bed/diagnosis", () => {
    const byName = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, query: "alice" });
    expect(byName.admissions.map((a) => a.id)).toEqual(["A2"]);

    const byPhone = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, query: "9123456789" });
    expect(byPhone.admissions.map((a) => a.id)).toEqual(["A3"]);

    const byBed = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, query: "gen-04" });
    expect(byBed.admissions.map((a) => a.id)).toEqual(["A2"]);
  });

  it("finds a stay by its admission number", () => {
    const numbered = [...fixture, admission({ id: "A5", admissionNo: "IPD-2026-00045" })];
    const result = queryIpdAdmissions(numbered, { page: 0, pageSize: 10, query: "IPD-2026-00045" });
    expect(result.admissions.map((a) => a.id)).toEqual(["A5"]);
  });

  it("sorts by admission number", () => {
    const numbered = [
      admission({ id: "B2", admissionNo: "IPD-2026-00002" }),
      admission({ id: "B1", admissionNo: "IPD-2026-00001" }),
      admission({ id: "B3", admissionNo: "IPD-2026-00003" })
    ];
    const result = queryIpdAdmissions(numbered, { page: 0, pageSize: 10, sortBy: "admissionNo", sortDir: "asc" });
    expect(result.admissions.map((a) => a.admissionNo)).toEqual(["IPD-2026-00001", "IPD-2026-00002", "IPD-2026-00003"]);
  });

  it("filters by status", () => {
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, status: "Discharged" });
    expect(result.admissions.map((a) => a.id)).toEqual(["A3"]);
  });

  it("escalatedOnly surfaces only admissions whose id is in the escalated set", () => {
    const escalatedIds = new Set(["A1", "A4"]);
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, escalatedOnly: true, escalatedIds });
    expect(result.admissions.map((a) => a.id).sort()).toEqual(["A1", "A4"]);
  });

  it("escalatedOnly with an empty set returns nothing", () => {
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, escalatedOnly: true, escalatedIds: new Set() });
    expect(result.admissions).toEqual([]);
  });

  it("combines escalatedOnly with free-text query", () => {
    const escalatedIds = new Set(["A1"]);
    const match = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, escalatedOnly: true, escalatedIds, query: "charlie" });
    expect(match.admissions.map((a) => a.id)).toEqual(["A1"]);
    const noMatch = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, escalatedOnly: true, escalatedIds, query: "dev" });
    expect(noMatch.admissions).toEqual([]);
  });

  it("defaults to newest-first by createdAt when no sort is given", () => {
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 10 });
    expect(result.admissions.map((a) => a.id)).toEqual(["A4", "A3", "A2", "A1"]);
  });

  it("returns an empty page gracefully when nothing matches", () => {
    const result = queryIpdAdmissions(fixture, { page: 0, pageSize: 10, query: "zzz-no-match" });
    expect(result.admissions).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it("caps pageSize at 100 and floors it at 1", () => {
    expect(queryIpdAdmissions(fixture, { page: 0, pageSize: 0 }).admissions.length).toBeLessThanOrEqual(1);
    expect(queryIpdAdmissions(fixture, { page: 0, pageSize: 500 }).total).toBe(4);
  });
});

describe("admissibleVisits", () => {
  const visits = [
    { id: "V-1", status: "Waiting" },
    { id: "V-2", status: "In Consultation" },
    { id: "V-3", status: "Completed" },
    { id: "V-4", status: "Cancelled" }
  ];

  it("keeps a completed visit — the consultation ending is when admission is advised", () => {
    expect(admissibleVisits(visits, []).map((visit) => visit.id)).toEqual(["V-1", "V-2", "V-3"]);
  });

  it("drops a cancelled visit", () => {
    expect(admissibleVisits(visits, []).some((visit) => visit.id === "V-4")).toBe(false);
  });

  it("drops a visit that already holds an active admission", () => {
    const held = [admission({ visitId: "V-2", status: "Admitted" })];
    expect(admissibleVisits(visits, held).map((visit) => visit.id)).toEqual(["V-1", "V-3"]);
  });

  it("keeps a visit whose only admission was discharged or cancelled — a readmission is legitimate", () => {
    const past = [
      admission({ id: "A-old", visitId: "V-1", status: "Discharged" }),
      admission({ id: "A-void", visitId: "V-3", status: "Cancelled" })
    ];
    expect(admissibleVisits(visits, past).map((visit) => visit.id)).toEqual(["V-1", "V-2", "V-3"]);
  });

  it("returns nothing admissible when every visit is spent — the Admit form's empty state", () => {
    const all = [
      admission({ id: "A1", visitId: "V-1", status: "Admitted" }),
      admission({ id: "A2", visitId: "V-2", status: "Admitted" }),
      admission({ id: "A3", visitId: "V-3", status: "Admitted" })
    ];
    expect(admissibleVisits(visits, all)).toEqual([]);
  });
});
