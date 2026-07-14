import { describe, expect, it } from "vitest";
import type { AppointmentRecord } from "@/lib/appointment-types";
import {
  rankSearchResults,
  searchAdmissions,
  searchAppointments,
  searchInventory,
  searchLabOrders,
  searchPatients,
  searchStaff,
  type SearchResult
} from "@/lib/global-search";
import type { StaffMember } from "@/lib/hr-types";
import type { InventoryItem } from "@/lib/inventory-types";
import type { IpdAdmission } from "@/lib/ipd-types";
import type { LabOrder } from "@/lib/lab-types";
import type { PatientRecord } from "@/lib/patient-types";

function patient(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id: "PAT-1",
    uhid: "MGM-24018",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Active",
    name: "Asha Verma",
    phone: "9876543210",
    ...overrides
  };
}

function appointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "APT-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "New",
    name: "Ravi Kumar",
    phone: "9876500000",
    service: "Gastro consult",
    symptoms: [],
    ...overrides
  } as AppointmentRecord;
}

function labOrder(overrides: Partial<LabOrder> = {}): LabOrder {
  return {
    id: "LAB-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    visitId: "V-1",
    token: "T-14",
    patientName: "Sunil Jain",
    phone: "9876511111",
    service: "LFT panel",
    tests: ["LFT"],
    priority: "Routine",
    status: "Result Ready",
    paymentStatus: "Paid",
    ...overrides
  };
}

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "INV-1",
    name: "PPI Tablets",
    category: "Medicine",
    quantity: 80,
    reorderLevel: 30,
    unit: "strips",
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function admission(overrides: Partial<IpdAdmission> = {}): IpdAdmission {
  return {
    id: "IPD-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Admitted",
    visitId: "V-1",
    token: "T-9",
    patientName: "Meena Rao",
    phone: "9876522222",
    bedId: "BED-1",
    bedLabel: "HDU-01",
    ward: "HDU",
    admissionType: "Emergency",
    admittingDoctor: "Dr. Mudgal",
    diagnosis: "GI bleed observation",
    ...overrides
  } as IpdAdmission;
}

function staffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: "STF-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "Active",
    name: "Priya Nurse",
    phone: "9876533333",
    role: "Nurse",
    department: "Nursing",
    shift: "Morning",
    ...overrides
  } as StaffMember;
}

describe("searchPatients (ranking tiers)", () => {
  it("scores an exact match highest, startsWith next, includes lowest", () => {
    const [exact] = searchPatients("asha verma", [patient({ name: "Asha Verma" })]);
    const [starts] = searchPatients("MGM-24", [patient({ uhid: "MGM-24018" })]);
    const [includes] = searchPatients("543210", [patient({ phone: "9876543210" })]);
    expect(exact.score).toBe(100);
    expect(starts.score).toBe(80);
    expect(includes.score).toBe(50);
  });

  it("filters out non-matching records entirely", () => {
    expect(searchPatients("zzz-no-match", [patient()])).toEqual([]);
  });

  it("maps output shape: category, href, patientPhone, subtitle", () => {
    const [result] = searchPatients("Asha", [patient({ name: "Asha Verma", uhid: "MGM-24018", phone: "9876543210", bloodGroup: "O+" })]);
    expect(result).toMatchObject({
      category: "Patients",
      href: "/mudgalgastromedics-os/patients",
      patientPhone: "9876543210",
      title: "Asha Verma"
    });
    expect(result.subtitle).toContain("MGM-24018");
    expect(result.subtitle).toContain("9876543210");
    expect(result.subtitle).toContain("O+");
  });
});

describe("searchAppointments", () => {
  it("matches by name, phone or service and carries patientPhone", () => {
    const [result] = searchAppointments("gastro", [appointment({ service: "Gastro consult" })]);
    expect(result).toMatchObject({ category: "Appointments", href: "/mudgalgastromedics-os/appointments", patientPhone: "9876500000" });
  });
});

describe("searchLabOrders", () => {
  it("surfaces CRITICAL in the subtitle when the order is critically flagged", () => {
    const [result] = searchLabOrders("Sunil", [labOrder({ criticalFlag: true })]);
    expect(result.subtitle).toContain("CRITICAL");
    expect(result.category).toBe("Laboratory");
  });

  it("omits the marker for non-critical orders", () => {
    const [result] = searchLabOrders("Sunil", [labOrder({ criticalFlag: false })]);
    expect(result.subtitle).not.toContain("CRITICAL");
  });
});

describe("searchInventory", () => {
  it("has no patientPhone field — pharmacy stock isn't a patient record", () => {
    const [result] = searchInventory("PPI", [inventoryItem()]);
    expect(result.category).toBe("Pharmacy");
    expect(result.patientPhone).toBeUndefined();
  });
});

describe("searchAdmissions", () => {
  it("matches by bed label and diagnosis", () => {
    const [result] = searchAdmissions("HDU-01", [admission()]);
    expect(result).toMatchObject({ category: "Admissions", href: "/mudgalgastromedics-os/ipd", patientPhone: "9876522222" });
  });
});

describe("searchStaff", () => {
  it("matches by role and department, has no patientPhone", () => {
    const [result] = searchStaff("Nursing", [staffMember()]);
    expect(result.category).toBe("Employees");
    expect(result.patientPhone).toBeUndefined();
  });
});

describe("rankSearchResults", () => {
  function result(overrides: Partial<SearchResult> = {}): SearchResult {
    return { id: "R", category: "Patients", title: "R", subtitle: "", href: "#", score: 50, ...overrides };
  }

  it("sorts the merged output by score descending", () => {
    const ranked = rankSearchResults([[result({ id: "low", score: 50 })], [result({ id: "high", score: 90 })]]);
    expect(ranked.map((r) => r.id)).toEqual(["high", "low"]);
  });

  it("caps each group before merging, so a small group still survives a large one", () => {
    const bigGroup = Array.from({ length: 6 }, (_, index) => result({ id: `p${index}`, category: "Patients", score: 100 - index }));
    const smallGroup = [result({ id: "appt", category: "Appointments", score: 40 })];
    const ranked = rankSearchResults([bigGroup, smallGroup], 5);
    expect(ranked).toHaveLength(6);
    expect(ranked.map((r) => r.id)).toContain("appt");
    expect(ranked.map((r) => r.id)).not.toContain("p5");
  });

  it("honors a custom perCategoryLimit", () => {
    const group = Array.from({ length: 4 }, (_, index) => result({ id: `x${index}`, score: 10 - index }));
    expect(rankSearchResults([group], 2)).toHaveLength(2);
  });

  it("handles empty input gracefully", () => {
    expect(rankSearchResults([])).toEqual([]);
    expect(rankSearchResults([[], []])).toEqual([]);
  });
});
