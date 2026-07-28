import { describe, expect, it } from "vitest";
import { consultationCharges, dispenseCharges, harvestEncounterCharges, labOrderCharges, procedureCharges } from "@/lib/billing-sources";
import type { LabOrder } from "@/lib/lab-types";
import type { OpdVisit } from "@/lib/opd-types";
import type { PharmacyDispenseRecord } from "@/lib/pharmacy-types";
import type { ConsultationFeeRule, ServicePrice } from "@/lib/pricing-types";
import type { ProcedureSchedule } from "@/lib/procedure-types";

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "MGM-001",
    appointmentId: "APT-1",
    createdAt: "2026-07-27T09:00:00.000Z", // Monday
    status: "Completed",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consultation",
    symptoms: [],
    billingStatus: "Not Started",
    ...overrides
  };
}

function service(overrides: Partial<ServicePrice> = {}): ServicePrice {
  return {
    id: "SVC-1",
    code: "ENDO-FEE",
    name: "Upper GI Endoscopy",
    category: "Procedure",
    basePricePaise: 4_50_000,
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    revisions: [],
    ...overrides
  };
}

function feeRule(overrides: Partial<ConsultationFeeRule> = {}): ConsultationFeeRule {
  return {
    id: "FEE-1",
    visitType: "New",
    feePaise: 50_000,
    active: true,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides
  };
}

function labOrder(overrides: Partial<LabOrder> = {}): LabOrder {
  return {
    id: "LAB-1",
    createdAt: "2026-07-27T09:30:00.000Z",
    updatedAt: "2026-07-27T09:30:00.000Z",
    visitId: "OPD-1",
    token: "MGM-001",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consultation",
    tests: ["LFT"],
    priority: "Routine",
    status: "Ordered",
    paymentStatus: "Unpaid",
    ...overrides
  };
}

function dispense(overrides: Partial<PharmacyDispenseRecord> = {}): PharmacyDispenseRecord {
  return {
    id: "PH-1",
    createdAt: "2026-07-27T10:00:00.000Z",
    updatedAt: "2026-07-27T10:00:00.000Z",
    status: "Dispensed",
    visitId: "OPD-1",
    token: "MGM-001",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consultation",
    items: [{ inventoryItemId: "INV-1", name: "Pantoprazole 40mg", quantity: 10, unit: "tab", unitPrice: 12, total: 120 }],
    subtotal: 120,
    discount: 0,
    total: 120,
    paymentStatus: "Unpaid",
    ...overrides
  };
}

function schedule(overrides: Partial<ProcedureSchedule> = {}): ProcedureSchedule {
  return {
    id: "PRC-1",
    createdAt: "2026-07-27T11:00:00.000Z",
    updatedAt: "2026-07-27T11:00:00.000Z",
    visitId: "OPD-1",
    token: "MGM-001",
    patientName: "Asha Verma",
    phone: "9876543210",
    procedureSlug: "upper-gi-endoscopy",
    procedureTitle: "Upper GI Endoscopy",
    scheduledDate: "2026-07-27",
    scheduledTime: "11:30",
    room: "Endoscopy Room",
    doctor: "Dr Mudgal",
    priority: "Routine",
    status: "Completed",
    checklist: {
      consent: true,
      fastingConfirmed: true,
      vitalsChecked: true,
      allergiesReviewed: true,
      reportsReviewed: true,
      attendantAvailable: true,
      equipmentReady: true,
      recoveryInstructions: true
    },
    ...overrides
  };
}

describe("consultationCharges", () => {
  const rules = [
    feeRule({ id: "F-NEW", visitType: "New", feePaise: 50_000 }),
    feeRule({ id: "F-FU", visitType: "Follow-up", feePaise: 20_000, followUpWindowDays: 14 }),
    feeRule({ id: "F-WKND", visitType: "New", dayType: "Weekend", feePaise: 70_000 })
  ];

  it("bills a new patient at the new-patient rate", () => {
    const harvest = consultationCharges(visit(), rules, { now: new Date("2026-07-27T09:00:00.000Z") });
    expect(harvest.charges).toHaveLength(1);
    expect(harvest.charges[0].unitPricePaise).toBe(50_000);
    expect(harvest.charges[0].sourceRef).toBe("OPD-1:consultation");
  });

  it("bills a revisit inside the courtesy window as a follow-up", () => {
    const harvest = consultationCharges(visit(), rules, {
      previousVisitAt: "2026-07-20T09:00:00.000Z",
      now: new Date("2026-07-27T09:00:00.000Z")
    });
    expect(harvest.charges[0].unitPricePaise).toBe(20_000);
  });

  it("bills a revisit past the window as a new consultation again", () => {
    const harvest = consultationCharges(visit(), rules, {
      previousVisitAt: "2026-05-01T09:00:00.000Z",
      now: new Date("2026-07-27T09:00:00.000Z")
    });
    expect(harvest.charges[0].unitPricePaise).toBe(50_000);
  });

  it("applies the weekend rate from the visit's own date", () => {
    const harvest = consultationCharges(visit({ createdAt: "2026-07-25T09:00:00.000Z" }), rules);
    expect(harvest.charges[0].unitPricePaise).toBe(70_000);
  });

  it("never bills a cancelled visit, and says why", () => {
    const harvest = consultationCharges(visit({ status: "Cancelled" }), rules);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/cancelled/i);
  });

  it("reports an unconfigured fee instead of guessing or billing zero", () => {
    const harvest = consultationCharges(visit(), []);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/No consultation fee is configured/);
  });

  it("names the rule that set the fee, so the amount is explainable", () => {
    const harvest = consultationCharges(visit(), rules);
    expect(harvest.charges[0].description).toContain("Hospital default");
  });
});

describe("labOrderCharges", () => {
  it("bills the amount entered in Laboratory as one line", () => {
    const harvest = labOrderCharges(labOrder({ amount: 800, tests: ["LFT", "CBC"] }), []);
    expect(harvest.charges).toHaveLength(1);
    expect(harvest.charges[0].unitPricePaise).toBe(80_000);
    expect(harvest.charges[0].description).toBe("LFT, CBC");
    expect(harvest.charges[0].sourceRef).toBe("LAB-1");
  });

  it("never re-bills an order already collected at the lab counter", () => {
    const harvest = labOrderCharges(labOrder({ amount: 800, paymentStatus: "Paid" }), []);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/already collected/i);
  });

  it("skips a cancelled order", () => {
    const harvest = labOrderCharges(labOrder({ amount: 800, status: "Cancelled" }), []);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/cancelled/i);
  });

  it("falls back to the price master per test when no amount was entered, itemising the bill", () => {
    const services = [
      service({ id: "S-LFT", code: "LAB-LFT", name: "LFT", category: "Investigation", basePricePaise: 80_000 }),
      service({ id: "S-CBC", code: "LAB-CBC", name: "CBC", category: "Investigation", basePricePaise: 30_000 })
    ];
    const harvest = labOrderCharges(labOrder({ tests: ["LFT", "CBC"] }), services);
    expect(harvest.charges.map((c) => c.unitPricePaise)).toEqual([80_000, 30_000]);
    expect(harvest.charges.map((c) => c.sourceRef)).toEqual(["LAB-1:LAB-LFT", "LAB-1:LAB-CBC"]);
  });

  it("reports a test it can neither price nor find an amount for", () => {
    const harvest = labOrderCharges(labOrder({ tests: ["Obscure Panel"] }), []);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].label).toBe("Obscure Panel");
  });
});

describe("dispenseCharges", () => {
  it("itemises each medicine with its own quantity and rate", () => {
    const harvest = dispenseCharges(dispense());
    expect(harvest.charges).toHaveLength(1);
    expect(harvest.charges[0].quantity).toBe(10);
    expect(harvest.charges[0].unitPricePaise).toBe(1_200);
    expect(harvest.charges[0].sourceRef).toBe("PH-1:INV-1");
  });

  it("never re-bills a dispense already paid at the pharmacy counter", () => {
    const harvest = dispenseCharges(dispense({ paymentStatus: "Paid" }));
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/pharmacy counter/i);
  });

  it("spreads a dispense-level discount across lines so the parts sum to the whole", () => {
    const harvest = dispenseCharges(
      dispense({
        items: [
          { inventoryItemId: "A", name: "Drug A", quantity: 1, unit: "tab", unitPrice: 300, total: 300 },
          { inventoryItemId: "B", name: "Drug B", quantity: 1, unit: "tab", unitPrice: 100, total: 100 }
        ],
        subtotal: 400,
        discount: 100,
        total: 300
      })
    );
    const totalDiscount = harvest.charges.reduce((sum, charge) => sum + (charge.discountPaise ?? 0), 0);
    expect(totalDiscount).toBe(10_000);
    expect(harvest.charges[0].discountPaise).toBe(7_500);
    expect(harvest.charges[1].discountPaise).toBe(2_500);
  });

  it("puts the rounding remainder on the last line rather than losing a paisa", () => {
    const harvest = dispenseCharges(
      dispense({
        items: [
          { inventoryItemId: "A", name: "A", quantity: 1, unit: "tab", unitPrice: 1, total: 1 },
          { inventoryItemId: "B", name: "B", quantity: 1, unit: "tab", unitPrice: 1, total: 1 },
          { inventoryItemId: "C", name: "C", quantity: 1, unit: "tab", unitPrice: 1, total: 1 }
        ],
        subtotal: 3,
        discount: 1,
        total: 2
      })
    );
    expect(harvest.charges.reduce((sum, charge) => sum + (charge.discountPaise ?? 0), 0)).toBe(100);
  });
});

describe("procedureCharges", () => {
  const services = [
    service({ id: "S-1", code: "ENDO-FEE", name: "Endoscopy procedure fee", procedureSlug: "upper-gi-endoscopy", basePricePaise: 4_00_000 }),
    service({ id: "S-2", code: "ENDO-SED", name: "Sedation", procedureSlug: "upper-gi-endoscopy", basePricePaise: 80_000 }),
    service({ id: "S-3", code: "ENDO-CONS", name: "Consumables", procedureSlug: "upper-gi-endoscopy", basePricePaise: 50_000 }),
    service({ id: "S-4", code: "COLO-FEE", name: "Colonoscopy fee", procedureSlug: "colonoscopy", basePricePaise: 6_00_000 })
  ];

  it("bills every component linked to the procedure, not one lump sum", () => {
    const harvest = procedureCharges(schedule(), services);
    expect(harvest.charges.map((c) => c.description)).toEqual(["Endoscopy procedure fee", "Sedation", "Consumables"]);
  });

  it("does not bill another procedure's components", () => {
    const harvest = procedureCharges(schedule(), services);
    expect(harvest.charges.some((c) => c.description.includes("Colonoscopy"))).toBe(false);
  });

  it("applies the operating doctor's own rate", () => {
    const withDoctorRate = services.map((entry) =>
      entry.code === "ENDO-FEE" ? { ...entry, doctorPricesPaise: { "Dr Mudgal": 5_00_000 } } : entry
    );
    const harvest = procedureCharges(schedule(), withDoctorRate);
    expect(harvest.charges[0].unitPricePaise).toBe(5_00_000);
  });

  it("never bills a procedure that was only booked", () => {
    const harvest = procedureCharges(schedule({ status: "Planned" }), services);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/has not started/i);
  });

  it("never bills a cancelled procedure", () => {
    const harvest = procedureCharges(schedule({ status: "Cancelled" }), services);
    expect(harvest.charges).toHaveLength(0);
  });

  it("bills a procedure still in recovery — it has been performed", () => {
    expect(procedureCharges(schedule({ status: "Recovery" }), services).charges.length).toBe(3);
  });

  it("reports an unpriced procedure actionably instead of billing nothing silently", () => {
    const harvest = procedureCharges(schedule({ procedureSlug: "ercp", procedureTitle: "ERCP" }), services);
    expect(harvest.charges).toHaveLength(0);
    expect(harvest.skipped[0].reason).toMatch(/No price-list entry is linked/);
  });
});

describe("harvestEncounterCharges", () => {
  const pricing = {
    services: [
      service({ id: "S-1", code: "ENDO-FEE", name: "Endoscopy procedure fee", procedureSlug: "upper-gi-endoscopy", basePricePaise: 4_00_000 })
    ],
    consultationFees: [feeRule({ visitType: "New", feePaise: 50_000 })]
  };

  it("gathers consultation, lab, pharmacy and procedure charges in one pass", () => {
    const harvest = harvestEncounterCharges(
      {
        visit: visit(),
        labOrders: [labOrder({ amount: 800 })],
        dispenses: [dispense()],
        procedures: [schedule()]
      },
      pricing
    );

    expect(harvest.charges.map((c) => c.source)).toEqual(["OPD", "Laboratory", "Pharmacy", "Procedure"]);
    expect(harvest.charges.reduce((sum, c) => sum + c.unitPricePaise * c.quantity, 0)).toBe(50_000 + 80_000 + 12_000 + 4_00_000);
  });

  it("gives every charge a distinct sourceRef so a re-sync can't duplicate one", () => {
    const harvest = harvestEncounterCharges(
      { visit: visit(), labOrders: [labOrder({ amount: 800 })], dispenses: [dispense()], procedures: [schedule()] },
      pricing
    );
    const refs = harvest.charges.map((c) => c.sourceRef);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.every(Boolean)).toBe(true);
  });

  it("collects every skip reason rather than dropping charges quietly", () => {
    const harvest = harvestEncounterCharges(
      {
        visit: visit(),
        labOrders: [labOrder({ amount: 800, paymentStatus: "Paid" })],
        dispenses: [dispense({ status: "Cancelled" })],
        procedures: [schedule({ status: "Planned" })]
      },
      pricing
    );
    expect(harvest.charges).toHaveLength(1); // consultation only
    expect(harvest.skipped).toHaveLength(3);
  });

  it("handles an encounter with nothing but a consultation", () => {
    const harvest = harvestEncounterCharges({ visit: visit() }, pricing);
    expect(harvest.charges).toHaveLength(1);
    expect(harvest.skipped).toHaveLength(0);
  });
});
