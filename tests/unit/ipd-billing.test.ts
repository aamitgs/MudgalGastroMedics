import { describe, expect, it } from "vitest";
import { accrueAdmissionCharges, stayDates } from "@/lib/ipd-billing";
import type { HospitalBed, IpdAdmission } from "@/lib/ipd-types";
import type { ServicePrice } from "@/lib/pricing-types";

const NOW = new Date("2026-07-27T10:00:00.000Z");

function admission(overrides: Partial<IpdAdmission> = {}): IpdAdmission {
  return {
    id: "ADM-1",
    createdAt: "2026-07-25T08:00:00.000Z",
    updatedAt: "2026-07-25T08:00:00.000Z",
    status: "Admitted",
    visitId: "OPD-1",
    token: "MGM-001",
    patientName: "Asha Verma",
    phone: "9876543210",
    bedId: "BED-1",
    bedLabel: "P-102",
    ward: "Private Room",
    admissionType: "Planned",
    admittingDoctor: "Dr Mudgal",
    diagnosis: "Acute pancreatitis",
    ...overrides
  };
}

function bed(overrides: Partial<HospitalBed> = {}): HospitalBed {
  return { id: "BED-1", ward: "Private Room", label: "P-102", status: "Occupied", dailyRate: 3000, ...overrides };
}

function service(overrides: Partial<ServicePrice> = {}): ServicePrice {
  return {
    id: "SVC-1",
    code: "NURSE-DAY",
    name: "Nursing care",
    category: "Nursing",
    basePricePaise: 50_000,
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    revisions: [],
    ...overrides
  };
}

describe("stayDates", () => {
  it("counts every calendar day including admission and discharge", () => {
    expect(stayDates({ createdAt: "2026-07-25T08:00:00.000Z", dischargedAt: "2026-07-27T11:00:00.000Z" })).toEqual([
      "2026-07-25",
      "2026-07-26",
      "2026-07-27"
    ]);
  });

  it("runs to today for a patient still admitted", () => {
    expect(stayDates({ createdAt: "2026-07-25T08:00:00.000Z" }, NOW)).toHaveLength(3);
  });

  it("charges one day for a same-day admission and discharge", () => {
    expect(stayDates({ createdAt: "2026-07-27T08:00:00.000Z", dischargedAt: "2026-07-27T20:00:00.000Z" })).toEqual(["2026-07-27"]);
  });

  // A clock skew or a bad edit must never produce a negative stay.
  it("never produces a negative stay from a discharge before admission", () => {
    expect(stayDates({ createdAt: "2026-07-27T08:00:00.000Z", dischargedAt: "2026-07-20T08:00:00.000Z" })).toEqual(["2026-07-27"]);
  });
});

describe("accrueAdmissionCharges", () => {
  const services = [
    service({ id: "S1", code: "IPD-ADM", name: "Admission charge", category: "Other", basePricePaise: 1_00_000, ipdAdmissionCharge: true }),
    service({ id: "S2", code: "NURSE-DAY", name: "Nursing care", category: "Nursing", basePricePaise: 50_000, ipdDaily: true }),
    service({ id: "S3", code: "ROUNDS", name: "Doctor rounds", category: "Consultation", basePricePaise: 40_000, ipdDaily: true }),
    service({ id: "S4", code: "DIET", name: "Diet", category: "Other", basePricePaise: 20_000, ipdDaily: true }),
    service({ id: "S5", code: "OPD-CONS", name: "OPD consultation", category: "Consultation", basePricePaise: 50_000 })
  ];

  it("raises the admission charge once, not per day", () => {
    const accrual = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    expect(accrual.charges.filter((line) => line.sourceRef?.includes(":admission:"))).toHaveLength(1);
  });

  it("charges the bed at its own nightly rate, once per day", () => {
    const accrual = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    const bedLines = accrual.charges.filter((line) => line.sourceRef?.endsWith(":bed"));
    expect(bedLines).toHaveLength(3);
    expect(bedLines[0].unitPricePaise).toBe(3_00_000);
  });

  it("raises each daily ward service once per day", () => {
    const accrual = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    expect(accrual.charges.filter((line) => line.sourceRef?.endsWith(":NURSE-DAY"))).toHaveLength(3);
    expect(accrual.daysCharged).toBe(3);
  });

  it("never accrues a service that isn't marked as an IPD charge", () => {
    const accrual = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    expect(accrual.charges.some((line) => line.sourceRef?.includes("OPD-CONS"))).toBe(false);
  });

  // Idempotency is what makes an interim bill safe: the same day must always
  // produce the same reference so a re-accrual adds nothing.
  it("gives every charge a stable, unique sourceRef keyed by day", () => {
    const first = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    const second = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    const refs = first.charges.map((line) => line.sourceRef);
    expect(new Set(refs).size).toBe(refs.length);
    expect(second.charges.map((line) => line.sourceRef)).toEqual(refs);
  });

  it("accrues only the new day when the stay lengthens", () => {
    const dayThree = accrueAdmissionCharges(admission(), bed(), services, { now: NOW });
    const dayFour = accrueAdmissionCharges(admission(), bed(), services, { now: new Date("2026-07-28T10:00:00.000Z") });
    const added = dayFour.charges.filter((line) => !dayThree.charges.some((prior) => prior.sourceRef === line.sourceRef));
    // One bed + three daily services for the extra day.
    expect(added).toHaveLength(4);
    expect(added.every((line) => line.sourceRef?.includes("2026-07-28"))).toBe(true);
  });

  it("restricts a ward-scoped charge to its own ward", () => {
    const hduOnly = [...services, service({ id: "S6", code: "HDU-MON", name: "HDU monitoring", ipdDaily: true, ipdWards: ["HDU"] })];
    const privateRoom = accrueAdmissionCharges(admission(), bed(), hduOnly, { now: NOW });
    expect(privateRoom.charges.some((line) => line.sourceRef?.includes("HDU-MON"))).toBe(false);

    const hdu = accrueAdmissionCharges(admission({ ward: "HDU" }), bed({ ward: "HDU" }), hduOnly, { now: NOW });
    expect(hdu.charges.some((line) => line.sourceRef?.includes("HDU-MON"))).toBe(true);
  });

  it("never bills a cancelled admission", () => {
    const accrual = accrueAdmissionCharges(admission({ status: "Cancelled" }), bed(), services, { now: NOW });
    expect(accrual.charges).toHaveLength(0);
    expect(accrual.skipped[0].reason).toMatch(/cancelled/i);
  });

  it("reports a bed with no rate rather than silently charging nothing", () => {
    const accrual = accrueAdmissionCharges(admission(), bed({ dailyRate: 0 }), services, { now: NOW });
    expect(accrual.charges.some((line) => line.sourceRef?.endsWith(":bed"))).toBe(false);
    expect(accrual.skipped.some((entry) => /No daily rate/.test(entry.reason))).toBe(true);
  });

  it("reports a ward with no daily charges configured", () => {
    const accrual = accrueAdmissionCharges(admission(), bed(), [services[0]], { now: NOW });
    expect(accrual.skipped.some((entry) => /No nursing, rounds or diet/.test(entry.reason))).toBe(true);
  });

  it("stops accruing at discharge rather than running to today", () => {
    const accrual = accrueAdmissionCharges(
      admission({ status: "Discharged", dischargedAt: "2026-07-26T09:00:00.000Z" }),
      bed(),
      services,
      { now: NOW }
    );
    expect(accrual.daysCharged).toBe(2);
  });
});
