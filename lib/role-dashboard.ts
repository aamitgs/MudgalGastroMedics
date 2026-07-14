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
    href: "/mudgalgastromedics-os/lab"
  };

  switch (role) {
    case "super-admin":
    case "admin":
      return {
        heading: "Hospital today",
        tiles: [
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/opd" },
          { label: "Revenue today", value: `Rs ${today.revenue.toLocaleString("en-IN")}`, tone: "success", href: "/mudgalgastromedics-os/billing" },
          { label: "Bed occupancy", value: `${data.executive.bedOccupancy}%`, tone: "primary", href: "/mudgalgastromedics-os/ipd" },
          {
            label: "Critical alerts",
            value: n(data.risks.criticalLabsUnacked + data.risks.urgentAppointments + data.risks.expiringItems),
            tone: criticalTone(data.risks.criticalLabsUnacked + data.risks.urgentAppointments + data.risks.expiringItems),
            href: "/mudgalgastromedics-os/lab"
          }
        ],
        actions: [
          { label: "Reports", href: "/mudgalgastromedics-os/reports" },
          { label: "Analytics", href: "/mudgalgastromedics-os/analytics" },
          { label: "Access control", href: "/mudgalgastromedics-os/access" },
          { label: "Audit log", href: "/mudgalgastromedics-os/audit" }
        ]
      };
    case "main-doctor":
    case "duty-doctor":
      return {
        heading: "Clinical today",
        tiles: [
          { label: "Patients waiting", value: n(data.queues.opdInFlight), tone: attentionTone(data.queues.opdInFlight), href: "/mudgalgastromedics-os/opd" },
          criticalLabs,
          { label: "Lab results pending", value: n(data.queues.labPending), tone: attentionTone(data.queues.labPending), href: "/mudgalgastromedics-os/lab" },
          { label: "Active admissions", value: n(data.volume.activeAdmissions), tone: "primary", href: "/mudgalgastromedics-os/ipd" }
        ],
        actions: [
          { label: "Doctor workflow", href: "/mudgalgastromedics-os/doctor-workflow" },
          { label: "OPD queue", href: "/mudgalgastromedics-os/opd" },
          { label: "Laboratory", href: "/mudgalgastromedics-os/lab" },
          { label: "IPD & beds", href: "/mudgalgastromedics-os/ipd" }
        ]
      };
    case "nurse":
      return {
        heading: "Ward today",
        tiles: [
          { label: "Active admissions", value: n(data.volume.activeAdmissions), tone: "primary", href: "/mudgalgastromedics-os/ipd" },
          criticalLabs,
          { label: "Flagged patients", value: n(data.risks.flaggedPatients), tone: attentionTone(data.risks.flaggedPatients), href: "/mudgalgastromedics-os/patients" },
          { label: "OPD waiting", value: n(data.queues.opdInFlight), tone: attentionTone(data.queues.opdInFlight), href: "/mudgalgastromedics-os/opd" }
        ],
        actions: [
          { label: "IPD & beds", href: "/mudgalgastromedics-os/ipd" },
          { label: "Patients", href: "/mudgalgastromedics-os/patients" },
          { label: "OPD queue", href: "/mudgalgastromedics-os/opd" }
        ]
      };
    case "reception":
    case "pro":
      return {
        heading: "Front desk today",
        tiles: [
          { label: "New requests", value: n(data.queues.receptionNew), tone: attentionTone(data.queues.receptionNew), href: "/mudgalgastromedics-os/appointments" },
          {
            label: "Urgent symptoms",
            value: n(data.risks.urgentAppointments),
            tone: criticalTone(data.risks.urgentAppointments),
            href: "/mudgalgastromedics-os/appointments"
          },
          { label: "OPD in flight", value: n(data.queues.opdInFlight), tone: "primary", href: "/mudgalgastromedics-os/opd" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/opd" }
        ],
        actions: [
          { label: "Register patient", href: "/mudgalgastromedics-os/patients" },
          { label: "Appointments", href: "/mudgalgastromedics-os/appointments" },
          { label: "OPD queue", href: "/mudgalgastromedics-os/opd" },
          { label: "Billing", href: "/mudgalgastromedics-os/billing" }
        ]
      };
    case "lab-technician":
      return {
        heading: "Laboratory today",
        tiles: [
          { label: "Orders pending", value: n(data.queues.labPending), tone: attentionTone(data.queues.labPending), href: "/mudgalgastromedics-os/lab" },
          criticalLabs,
          { label: "Unpaid lab orders", value: n(data.risks.unpaidLab), tone: attentionTone(data.risks.unpaidLab), href: "/mudgalgastromedics-os/lab" },
          { label: "OPD waiting", value: n(data.queues.opdInFlight), tone: "primary", href: "/mudgalgastromedics-os/lab" }
        ],
        actions: [{ label: "Lab queue", href: "/mudgalgastromedics-os/lab" }, { label: "Patients", href: "/mudgalgastromedics-os/patients" }]
      };
    case "pharmacist":
      return {
        heading: "Pharmacy today",
        tiles: [
          { label: "Unpaid dispenses", value: n(data.queues.pharmacyUnpaid), tone: attentionTone(data.queues.pharmacyUnpaid), href: "/mudgalgastromedics-os/pharmacy" },
          { label: "Low stock items", value: n(data.risks.lowStockItems), tone: attentionTone(data.risks.lowStockItems), href: "/mudgalgastromedics-os/inventory" },
          {
            label: "Expiry alerts",
            value: n(data.risks.expiringItems),
            tone: criticalTone(data.risks.expiringItems),
            href: "/mudgalgastromedics-os/inventory"
          },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/pharmacy" }
        ],
        actions: [
          { label: "Dispense", href: "/mudgalgastromedics-os/pharmacy" },
          { label: "Inventory", href: "/mudgalgastromedics-os/inventory" }
        ]
      };
    case "billing-accounts":
      return {
        heading: "Finance today",
        tiles: [
          { label: "Revenue today", value: `Rs ${today.revenue.toLocaleString("en-IN")}`, tone: "success", href: "/mudgalgastromedics-os/billing" },
          { label: "Unpaid lab", value: n(data.risks.unpaidLab), tone: attentionTone(data.risks.unpaidLab), href: "/mudgalgastromedics-os/lab" },
          { label: "Unpaid pharmacy", value: n(data.risks.unpaidPharmacy), tone: attentionTone(data.risks.unpaidPharmacy), href: "/mudgalgastromedics-os/pharmacy" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/billing" }
        ],
        actions: [
          { label: "Billing", href: "/mudgalgastromedics-os/billing" },
          { label: "Insurance & accounts", href: "/mudgalgastromedics-os/finance" },
          { label: "Reports", href: "/mudgalgastromedics-os/reports" }
        ]
      };
    case "hr":
      return {
        heading: "People today",
        tiles: [
          { label: "Staff presence", value: `${data.executive.staffPresence}%`, tone: "primary", href: "/mudgalgastromedics-os/hr" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/hr" }
        ],
        actions: [{ label: "HR & attendance", href: "/mudgalgastromedics-os/hr" }]
      };
    case "dietitian":
      return {
        heading: "Nutrition today",
        tiles: [
          { label: "Active admissions", value: n(data.volume.activeAdmissions), tone: "primary", href: "/mudgalgastromedics-os/ipd" },
          { label: "OPD today", value: n(today.opd), tone: "primary", href: "/mudgalgastromedics-os/opd" }
        ],
        actions: [
          { label: "Patients", href: "/mudgalgastromedics-os/patients" },
          { label: "Diet plans", href: "/mudgalgastromedics-os/diet-plans" }
        ]
      };
    case "patient":
      return null;
  }
}
