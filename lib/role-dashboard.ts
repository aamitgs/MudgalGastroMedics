import type { AccessRole } from "@/lib/access/matrix";

/**
 * Per-role "Today" command band for /admin (Track 2.3): every role answers
 * "what needs my attention, what do I do first" with its own live counts and
 * quick actions — same design language, role-specific content (P3).
 *
 * Pure config: takes a structural subset of the analytics snapshot so it is
 * unit-testable without touching the stores.
 */
export type RoleDashboardData = {
  queues: { opdInFlight: number; labPending: number; pharmacyUnpaid: number; receptionNew: number };
  risks: {
    urgentAppointments: number;
    lowStockItems: number;
    expiringItems: number;
    flaggedPatients: number;
    unpaidLab: number;
    unpaidPharmacy: number;
    criticalLabsUnacked: number;
  };
  executive: { bedOccupancy: number; staffPresence: number };
  volume: { activeAdmissions: number };
  trend: Array<{ opd: number; revenue: number }>;
};

export type RoleDashboardTile = {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "danger";
  href: string;
};

export type RoleDashboardAction = { label: string; href: string };

export type RoleDashboard = {
  heading: string;
  tiles: RoleDashboardTile[];
  actions: RoleDashboardAction[];
};

function n(value: number) {
  return String(value);
}

function attentionTone(count: number, quiet: "primary" | "success" = "primary"): RoleDashboardTile["tone"] {
  return count > 0 ? "warning" : quiet;
}

function criticalTone(count: number): RoleDashboardTile["tone"] {
  return count > 0 ? "danger" : "success";
}

export function buildRoleDashboard(role: AccessRole, data: RoleDashboardData): RoleDashboard | null {
  const today = data.trend[data.trend.length - 1] ?? { opd: 0, revenue: 0 };
  const criticalLabs: RoleDashboardTile = {
    label: "Critical labs unacked",
    value: n(data.risks.criticalLabsUnacked),
    tone: criticalTone(data.risks.criticalLabsUnacked),
    href: "#module-lab"
  };

  switch (role) {
    case "super-admin":
    case "admin":
      return {
        heading: "Hospital today",
        tiles: [
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "#module-opd" },
          { label: "Revenue today", value: `Rs ${today.revenue.toLocaleString("en-IN")}`, tone: "success", href: "#module-billing" },
          { label: "Bed occupancy", value: `${data.executive.bedOccupancy}%`, tone: "primary", href: "#module-ipd" },
          {
            label: "Critical alerts",
            value: n(data.risks.criticalLabsUnacked + data.risks.urgentAppointments + data.risks.expiringItems),
            tone: criticalTone(data.risks.criticalLabsUnacked + data.risks.urgentAppointments + data.risks.expiringItems),
            href: "#module-lab"
          }
        ],
        actions: [
          { label: "Reports", href: "#module-reports" },
          { label: "Analytics", href: "#module-analytics" },
          { label: "Access control", href: "#module-access" },
          { label: "Audit log", href: "#module-audit" }
        ]
      };
    case "main-doctor":
    case "duty-doctor":
      return {
        heading: "Clinical today",
        tiles: [
          { label: "Patients waiting", value: n(data.queues.opdInFlight), tone: attentionTone(data.queues.opdInFlight), href: "#module-opd" },
          criticalLabs,
          { label: "Lab results pending", value: n(data.queues.labPending), tone: attentionTone(data.queues.labPending), href: "#module-lab" },
          { label: "Active admissions", value: n(data.volume.activeAdmissions), tone: "primary", href: "#module-ipd" }
        ],
        actions: [
          { label: "Doctor workflow", href: "#module-doctor-workflow" },
          { label: "OPD queue", href: "#module-opd" },
          { label: "Laboratory", href: "#module-lab" },
          { label: "IPD & beds", href: "#module-ipd" }
        ]
      };
    case "nurse":
      return {
        heading: "Ward today",
        tiles: [
          { label: "Active admissions", value: n(data.volume.activeAdmissions), tone: "primary", href: "#module-ipd" },
          criticalLabs,
          { label: "Flagged patients", value: n(data.risks.flaggedPatients), tone: attentionTone(data.risks.flaggedPatients), href: "#module-patients" },
          { label: "OPD waiting", value: n(data.queues.opdInFlight), tone: attentionTone(data.queues.opdInFlight), href: "#module-opd" }
        ],
        actions: [
          { label: "IPD & beds", href: "#module-ipd" },
          { label: "Patients", href: "#module-patients" },
          { label: "OPD queue", href: "#module-opd" }
        ]
      };
    case "reception":
    case "pro":
      return {
        heading: "Front desk today",
        tiles: [
          { label: "New requests", value: n(data.queues.receptionNew), tone: attentionTone(data.queues.receptionNew), href: "#module-appointments" },
          {
            label: "Urgent symptoms",
            value: n(data.risks.urgentAppointments),
            tone: criticalTone(data.risks.urgentAppointments),
            href: "#module-appointments"
          },
          { label: "OPD in flight", value: n(data.queues.opdInFlight), tone: "primary", href: "#module-opd" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "#module-opd" }
        ],
        actions: [
          { label: "Register patient", href: "#module-patients" },
          { label: "Appointments", href: "#module-appointments" },
          { label: "OPD queue", href: "#module-opd" },
          { label: "Billing", href: "#module-billing" }
        ]
      };
    case "lab-technician":
      return {
        heading: "Laboratory today",
        tiles: [
          { label: "Orders pending", value: n(data.queues.labPending), tone: attentionTone(data.queues.labPending), href: "#module-lab" },
          criticalLabs,
          { label: "Unpaid lab orders", value: n(data.risks.unpaidLab), tone: attentionTone(data.risks.unpaidLab), href: "#module-lab" },
          { label: "OPD waiting", value: n(data.queues.opdInFlight), tone: "primary", href: "#module-lab" }
        ],
        actions: [{ label: "Lab queue", href: "#module-lab" }, { label: "Patients", href: "#module-patients" }]
      };
    case "pharmacist":
      return {
        heading: "Pharmacy today",
        tiles: [
          { label: "Unpaid dispenses", value: n(data.queues.pharmacyUnpaid), tone: attentionTone(data.queues.pharmacyUnpaid), href: "#module-pharmacy" },
          { label: "Low stock items", value: n(data.risks.lowStockItems), tone: attentionTone(data.risks.lowStockItems), href: "#module-inventory" },
          {
            label: "Expiry alerts",
            value: n(data.risks.expiringItems),
            tone: criticalTone(data.risks.expiringItems),
            href: "#module-inventory"
          },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "#module-pharmacy" }
        ],
        actions: [
          { label: "Dispense", href: "#module-pharmacy" },
          { label: "Inventory", href: "#module-inventory" }
        ]
      };
    case "billing-accounts":
      return {
        heading: "Finance today",
        tiles: [
          { label: "Revenue today", value: `Rs ${today.revenue.toLocaleString("en-IN")}`, tone: "success", href: "#module-billing" },
          { label: "Unpaid lab", value: n(data.risks.unpaidLab), tone: attentionTone(data.risks.unpaidLab), href: "#module-lab" },
          { label: "Unpaid pharmacy", value: n(data.risks.unpaidPharmacy), tone: attentionTone(data.risks.unpaidPharmacy), href: "#module-pharmacy" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "#module-billing" }
        ],
        actions: [
          { label: "Billing", href: "#module-billing" },
          { label: "Insurance & accounts", href: "#module-finance" },
          { label: "Reports", href: "#module-reports" }
        ]
      };
    case "hr":
      return {
        heading: "People today",
        tiles: [
          { label: "Staff presence", value: `${data.executive.staffPresence}%`, tone: "primary", href: "#module-hr" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "#module-hr" }
        ],
        actions: [{ label: "HR & attendance", href: "#module-hr" }]
      };
    case "patient":
      return null;
  }
}
