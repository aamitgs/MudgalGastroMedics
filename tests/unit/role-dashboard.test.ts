import { describe, expect, it } from "vitest";
import { staffLoginRoles } from "@/lib/access/matrix";
import { buildRoleDashboard, type RoleDashboardData } from "@/lib/role-dashboard";

function data(overrides: Partial<RoleDashboardData> = {}): RoleDashboardData {
  return {
    queues: { opdInFlight: 4, labPending: 3, pharmacyUnpaid: 2, receptionNew: 5 },
    risks: {
      urgentAppointments: 1,
      lowStockItems: 2,
      expiringItems: 1,
      flaggedPatients: 0,
      unpaidLab: 2,
      unpaidPharmacy: 2,
      criticalLabsUnacked: 1,
      overdueRecalls: 0
    },
    executive: { bedOccupancy: 70, staffPresence: 90 },
    volume: { activeAdmissions: 3 },
    trend: [{ opd: 10, revenue: 42000 }],
    ...overrides
  };
}

describe("buildRoleDashboard (Track 2.3)", () => {
  it("gives every staff login role its own band", () => {
    for (const role of staffLoginRoles) {
      const dashboard = buildRoleDashboard(role, data());
      expect(dashboard, role).not.toBeNull();
      expect(dashboard!.tiles.length, role).toBeGreaterThanOrEqual(2);
      expect(dashboard!.actions.length, role).toBeGreaterThanOrEqual(1);
    }
  });

  it("never renders a band for the patient role", () => {
    expect(buildRoleDashboard("patient", data())).toBeNull();
  });

  it("doctors see waiting patients and critical labs in danger tone", () => {
    const dashboard = buildRoleDashboard("main-doctor", data())!;
    const critical = dashboard.tiles.find((tile) => tile.label === "Critical labs unacked")!;
    expect(critical.tone).toBe("danger");
    expect(dashboard.tiles[0].label).toBe("Patients waiting");
  });

  it("critical tiles calm down to success when the count is zero", () => {
    const dashboard = buildRoleDashboard("lab-technician", data({ risks: { ...data().risks, criticalLabsUnacked: 0 } }))!;
    expect(dashboard.tiles.find((tile) => tile.label === "Critical labs unacked")!.tone).toBe("success");
  });

  it("pharmacists see stock and expiry, reception sees new requests first", () => {
    expect(buildRoleDashboard("pharmacist", data())!.tiles.map((tile) => tile.label)).toContain("Expiry alerts");
    expect(buildRoleDashboard("reception", data())!.tiles[0].label).toBe("New requests");
  });

  it("doctors and reception see overdue follow-up recalls, warning tone only when any are overdue", () => {
    const quiet = buildRoleDashboard("main-doctor", data())!;
    expect(quiet.tiles.find((tile) => tile.label === "Overdue follow-ups")!.tone).toBe("primary");

    const busy = buildRoleDashboard("reception", data({ risks: { ...data().risks, overdueRecalls: 3 } }))!;
    const tile = busy.tiles.find((tile) => tile.label === "Overdue follow-ups")!;
    expect(tile.value).toBe("3");
    expect(tile.tone).toBe("warning");
    expect(tile.href).toBe("/mudgalgastromedics-os/automation");
  });

  it("differently-permissioned roles get different bands", () => {
    const doctor = buildRoleDashboard("main-doctor", data())!;
    const billing = buildRoleDashboard("billing-accounts", data())!;
    expect(doctor.heading).not.toBe(billing.heading);
    expect(doctor.tiles.map((t) => t.label)).not.toEqual(billing.tiles.map((t) => t.label));
  });
});
