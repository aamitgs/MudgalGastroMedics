import { describe, expect, it } from "vitest";
import type { AiCaseReview } from "@/lib/ai-types";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { InventoryItem } from "@/lib/inventory-types";
import type { IpdAdmission, VitalsReading } from "@/lib/ipd-types";
import type { LabOrder } from "@/lib/lab-types";
import { evaluateNotificationRules, opdWaitAlertMinutes, type NotificationRuleInputs } from "@/lib/notification-rules";
import type { OpdVisit } from "@/lib/opd-types";

const now = new Date("2026-07-07T12:00:00");

function minutesAgo(minutes: number) {
  return new Date(now.getTime() - minutes * 60000).toISOString();
}

function inputs(overrides: Partial<NotificationRuleInputs> = {}): NotificationRuleInputs {
  return { inventory: [], appointments: [], admissions: [], vitals: [], aiReviews: [], opdVisits: [], labOrders: [], ...overrides };
}

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "INV-1",
    name: "PPI Tablets",
    category: "Medicine",
    quantity: 100,
    reorderLevel: 30,
    unit: "strips",
    lastUpdatedAt: now.toISOString(),
    ...overrides
  };
}

function appointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "APT-1",
    createdAt: minutesAgo(10),
    status: "New",
    name: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    symptoms: ["severe abdominal pain"],
    ...overrides
  } as AppointmentRecord;
}

function admission(overrides: Partial<IpdAdmission> = {}): IpdAdmission {
  return {
    id: "IPD-1",
    createdAt: minutesAgo(240),
    updatedAt: minutesAgo(240),
    status: "Admitted",
    visitId: "V-1",
    token: "T-9",
    patientName: "Ravi Kumar",
    phone: "9876500000",
    bedId: "BED-HDU-1",
    bedLabel: "HDU-01",
    ward: "HDU",
    admissionType: "Emergency",
    admittingDoctor: "Dr. Mudgal",
    diagnosis: "GI bleed observation",
    ...overrides
  } as IpdAdmission;
}

function vitalsReading(overrides: Partial<VitalsReading> = {}): VitalsReading {
  return {
    id: "VIT-1",
    admissionId: "IPD-1",
    recordedAt: minutesAgo(10),
    recordedBy: "Nurse Priya",
    ...overrides
  };
}

function review(overrides: Partial<AiCaseReview> = {}): AiCaseReview {
  return {
    id: "AIR-1",
    createdAt: minutesAgo(30),
    updatedAt: minutesAgo(30),
    source: "Appointment",
    sourceId: "APT-1",
    patientName: "Asha Verma",
    phone: "9876543210",
    service: "Gastro consult",
    urgency: "Routine",
    route: "OPD",
    summary: "Routine follow-up",
    flags: [],
    preparation: [],
    receptionScript: "",
    safetyNote: "",
    status: "Escalated",
    ...overrides
  };
}

function visit(overrides: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "OPD-1",
    token: "T-14",
    appointmentId: "APT-1",
    createdAt: minutesAgo(opdWaitAlertMinutes + 5),
    status: "Waiting",
    patientName: "Sunil Jain",
    phone: "9876511111",
    service: "OPD consult",
    symptoms: [],
    billingStatus: "Not Started",
    ...overrides
  };
}

function labOrder(overrides: Partial<LabOrder> = {}): LabOrder {
  return {
    id: "LAB-1",
    createdAt: minutesAgo(120),
    updatedAt: minutesAgo(10),
    visitId: "V-1",
    token: "T-14",
    patientName: "Sunil Jain",
    phone: "9876511111",
    service: "LFT panel",
    tests: ["LFT"],
    priority: "Urgent",
    status: "Result Ready",
    paymentStatus: "Paid",
    ...overrides
  };
}

describe("evaluateNotificationRules", () => {
  it("returns nothing when operations are healthy", () => {
    expect(evaluateNotificationRules(inputs({ inventory: [item()], opdVisits: [visit({ createdAt: minutesAgo(5) })] }), now)).toEqual([]);
  });

  it("flags low stock as High and zero stock as Critical", () => {
    const result = evaluateNotificationRules(
      inputs({ inventory: [item({ id: "A", quantity: 10, reorderLevel: 30 }), item({ id: "B", quantity: 0, reorderLevel: 30 })] }),
      now
    );
    expect(result.map((n) => [n.source, n.priority])).toEqual([
      ["low-stock:A", "High"],
      ["low-stock:B", "Critical"]
    ]);
    expect(result[0].category).toBe("Pharmacy");
  });

  it("flags expired stock as Critical with quarantine wording, expiring soon as High", () => {
    const result = evaluateNotificationRules(
      inputs({ inventory: [item({ id: "E1", expiryDate: "2026-07-01" }), item({ id: "E2", expiryDate: "2026-07-20" })] }),
      now
    );
    const expired = result.find((n) => n.source === "expiry:E1");
    const expiring = result.find((n) => n.source === "expiry:E2");
    expect(expired?.priority).toBe("Critical");
    expect(expired?.detail).toContain("must not be dispensed");
    expect(expiring?.priority).toBe("High");
  });

  it("flags urgent appointment requests only while still actionable", () => {
    const result = evaluateNotificationRules(
      inputs({
        appointments: [
          appointment({ id: "U1", priority: "Urgent symptoms", status: "New" }),
          appointment({ id: "U2", priority: "Urgent symptoms", status: "Completed" }),
          appointment({ id: "U3", priority: "Routine", status: "New" })
        ]
      }),
      now
    );
    expect(result.map((n) => n.source)).toEqual(["urgent-appointment:U1"]);
    expect(result[0].priority).toBe("Critical");
  });

  it("raises an Emergency HDU flag with the reason when vitals are overdue", () => {
    const result = evaluateNotificationRules(
      inputs({ admissions: [admission()], vitals: [vitalsReading({ recordedAt: minutesAgo(90) })] }),
      now
    );
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Emergency");
    expect(result[0].detail).toContain("vitals overdue");
    expect(result[0].detail).toContain("never a diagnosis");
  });

  it("ignores non-HDU wards and discharged admissions", () => {
    const result = evaluateNotificationRules(
      inputs({
        admissions: [admission({ id: "G1", ward: "General" }), admission({ id: "D1", status: "Discharged" })],
        vitals: []
      }),
      now
    );
    expect(result).toEqual([]);
  });

  it("flags escalated AI reviews and long OPD waits, but not fresh waits", () => {
    const result = evaluateNotificationRules(
      inputs({
        aiReviews: [review({ id: "R1", status: "Escalated" }), review({ id: "R2", status: "Reviewed" })],
        opdVisits: [visit({ id: "W1" }), visit({ id: "W2", createdAt: minutesAgo(20) })]
      }),
      now
    );
    expect(result.map((n) => n.source)).toEqual(["ai-review:R1", "opd-wait:W1"]);
  });

  it("flags unacknowledged critical lab results and drops acknowledged ones", () => {
    const result = evaluateNotificationRules(
      inputs({
        labOrders: [
          labOrder({ id: "L1", criticalFlag: true, criticalReasons: ["Potassium 6.9 mmol/L is above the critical high of 6.2 mmol/L."] }),
          labOrder({ id: "L2", criticalFlag: true, criticalAcknowledgedAt: minutesAgo(5), criticalAcknowledgedBy: "Dr. Mudgal" }),
          labOrder({ id: "L3" })
        ]
      }),
      now
    );
    expect(result.map((n) => n.source)).toEqual(["lab-critical:L1"]);
    expect(result[0].category).toBe("Laboratory");
    expect(result[0].priority).toBe("Critical");
    expect(result[0].detail).toContain("Potassium 6.9");
    expect(result[0].detail).toContain("acknowledgement");
  });

  it("always explains why a notification fired", () => {
    const result = evaluateNotificationRules(
      inputs({
        inventory: [item({ id: "A", quantity: 0 }), item({ id: "E1", expiryDate: "2026-07-01" })],
        appointments: [appointment({ priority: "Urgent symptoms" })],
        admissions: [admission({ escalated: true })],
        aiReviews: [review()],
        opdVisits: [visit()]
      }),
      now
    );
    expect(result.length).toBeGreaterThanOrEqual(5);
    for (const notification of result) {
      expect(notification.detail.length).toBeGreaterThan(20);
      expect(notification.href).toBeTruthy();
    }
  });
});
