import {
  Activity,
  BarChart3,
  Bed,
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roleHasPermission, type AccessAction, type AccessResource, type AccessRole } from "@/lib/access/matrix";

export type HospitalRole = "Admin" | "Doctor" | "Nurse" | "Front Desk" | "Pharmacist" | "Lab Tech" | "Accountant" | "HR";
export type CommandEntity = "Patient" | "Doctor" | "Invoice" | "Medicine" | "Appointment" | "Department" | "Employee" | "Insurance" | "Report" | "Bed" | "Room" | "Procedure";
export type PatientStatus = "In Consultation" | "Vitals Pending" | "Lab Review" | "Scheduled" | "Billing Hold" | "Discharged";
export type BillingStatus = "Open" | "Paid" | "Insurance" | "Preauth" | "Refund Review";

export type NavGroup = "Overview" | "Clinical" | "Diagnostics" | "Operations" | "Finance" | "Administration";

/** Sidebar section order (Part 2/6 information architecture). Empty groups are hidden per role. */
export const navGroupOrder: NavGroup[] = ["Overview", "Clinical", "Diagnostics", "Operations", "Finance", "Administration"];

export type NavItem = {
  label: string;
  icon: LucideIcon;
  roles: HospitalRole[];
  /** In-page section anchor or cross-surface route this item opens. */
  href: string;
  /** IA group this item belongs to. */
  group: NavGroup;
  badge?: string;
};

export type PatientFlowRow = {
  id: string;
  uhid: string;
  patient: string;
  age: number;
  status: PatientStatus;
  doctor: string;
  department: string;
  billing: BillingStatus;
  insurance: string;
  waitMinutes: number;
  risk: "Low" | "Moderate" | "High";
  lastActivity: string;
};

export type CommandRecord = {
  id: string;
  entity: CommandEntity;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  priority: number;
};

export type ClinicalEvent = {
  time: string;
  title: string;
  detail: string;
  type: "registration" | "vitals" | "consult" | "lab" | "billing";
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "primary" | "success" | "warning" | "danger";
  dataKey: "opd" | "beds" | "revenue" | "alerts";
};

export type HospitalRealtimeEvent =
  | { type: "queue.updated"; payload: { uhid: string; status: string; waitMinutes: number } }
  | { type: "bed.updated"; payload: { bedId: string; status: string } }
  | { type: "doctor.updated"; payload: { doctorId: string; available: boolean } }
  | { type: "pharmacy.stock.updated"; payload: { item: string; stock: number; threshold: number } }
  | { type: "notification.created"; payload: { message: string; severity: "info" | "warning" | "critical" } }
  | { type: "dashboard.metric.updated"; payload: { metric: string; value: string } };

export const hospitalRoles: HospitalRole[] = ["Admin", "Doctor", "Nurse", "Front Desk", "Pharmacist", "Lab Tech", "Accountant", "HR"];

/**
 * Maps the Hospital OS shell's workspace roles onto the RBAC access matrix
 * (lib/access/matrix.ts). "Admin" is the operator view and maps to Super Admin;
 * every other role's sidebar, sections and command palette are DERIVED from
 * the same permission matrix the server enforces — there is no separate
 * hardcoded nav config to drift out of sync.
 */
export const hospitalRoleToAccessRole: Record<HospitalRole, AccessRole> = {
  Admin: "super-admin",
  Doctor: "main-doctor",
  Nurse: "nurse",
  "Front Desk": "reception",
  Pharmacist: "pharmacist",
  "Lab Tech": "lab-technician",
  Accountant: "billing-accounts",
  HR: "hr"
};

/**
 * Reverse mapping: which OS workspace a logged-in access role lands in.
 * PRO approximates to Front Desk for UI purposes only — the server still
 * enforces PRO's narrower matrix on every API call.
 */
export const accessRoleToHospitalRole: Record<AccessRole, HospitalRole> = {
  "super-admin": "Admin",
  admin: "Admin",
  "main-doctor": "Doctor",
  "duty-doctor": "Doctor",
  nurse: "Nurse",
  reception: "Front Desk",
  pharmacist: "Pharmacist",
  "lab-technician": "Lab Tech",
  "billing-accounts": "Accountant",
  hr: "HR",
  pro: "Front Desk",
  patient: "Front Desk"
};

function rolesWithPermission(resource: AccessResource | null, action: AccessAction = "view"): HospitalRole[] {
  if (!resource) return hospitalRoles;
  return hospitalRoles.filter((role) => roleHasPermission(hospitalRoleToAccessRole[role], resource, action));
}

export const navItems: NavItem[] = [
  { label: "Dashboard", group: "Overview", href: "#analytics", icon: LayoutDashboard, roles: rolesWithPermission(null) },
  { label: "Patients", group: "Clinical", href: "#operations-table", icon: UsersRound, roles: rolesWithPermission("patients") },
  { label: "Doctors", group: "Clinical", href: "#doctor-workspace", icon: Stethoscope, roles: rolesWithPermission("appointments") },
  { label: "Departments", group: "Administration", href: "/admin#module-hr", icon: Building2, roles: rolesWithPermission("hr-records") },
  { label: "Appointments", group: "Clinical", href: "#appointment-flow", icon: CalendarClock, roles: rolesWithPermission("appointments") },
  { label: "OPD", group: "Clinical", href: "/admin#module-opd", icon: ClipboardList, roles: rolesWithPermission("appointments"), badge: "Live" },
  { label: "IPD", group: "Clinical", href: "/admin#module-ipd", icon: Bed, roles: rolesWithPermission("beds") },
  { label: "Prescriptions", group: "Clinical", href: "/doctor", icon: FileText, roles: rolesWithPermission("prescriptions") },
  { label: "Pharmacy", group: "Operations", href: "/admin#module-pharmacy", icon: Pill, roles: rolesWithPermission("pharmacy-inventory"), badge: "4" },
  { label: "Laboratory", group: "Diagnostics", href: "/admin#module-lab", icon: FlaskConical, roles: rolesWithPermission("lab-orders"), badge: "9" },
  { label: "Billing", group: "Finance", href: "#billing", icon: CreditCard, roles: rolesWithPermission("billing") },
  { label: "Insurance", group: "Finance", href: "/admin#module-finance", icon: ShieldCheck, roles: rolesWithPermission("insurance") },
  { label: "Accounts", group: "Finance", href: "/admin#module-finance", icon: WalletCards, roles: rolesWithPermission("billing") },
  { label: "HR", group: "Administration", href: "/admin#module-hr", icon: UserRound, roles: rolesWithPermission("hr-records") },
  { label: "Inventory", group: "Operations", href: "/admin#module-inventory", icon: Package, roles: rolesWithPermission("pharmacy-inventory") },
  { label: "Reports", group: "Administration", href: "/admin#module-reports", icon: BarChart3, roles: rolesWithPermission("reports") },
  { label: "CMS", group: "Administration", href: "/admin#module-cms", icon: Activity, roles: rolesWithPermission("cms") },
  { label: "Settings", group: "Administration", href: "/admin#module-settings", icon: Settings, roles: rolesWithPermission("system-settings") },
  { label: "Notifications", group: "Overview", href: "#realtime-feed", icon: Bell, roles: rolesWithPermission(null) },
  { label: "AI Assistant", group: "Overview", href: "#patient-portal-preview", icon: Sparkles, roles: rolesWithPermission("patients") }
];

export type HospitalOsSection =
  | "clinicalWorkspace"
  | "patientPortalPreview"
  | "patientRegistration"
  | "appointmentBooking"
  | "billing"
  | "patientFlow"
  | "acceptance"
  | "auditTrail";

/** Section visibility derived from the access matrix — one permission per section. */
const sectionPermission: Record<HospitalOsSection, [AccessResource, AccessAction]> = {
  clinicalWorkspace: ["prescriptions", "view"],
  patientPortalPreview: ["patients", "view"],
  patientRegistration: ["patients", "create"],
  appointmentBooking: ["appointments", "create"],
  billing: ["billing", "view"],
  patientFlow: ["appointments", "view"],
  acceptance: ["system-settings", "view"],
  auditTrail: ["audit-logs", "view"]
};

export const sectionAccess: Record<HospitalOsSection, HospitalRole[]> = Object.fromEntries(
  (Object.entries(sectionPermission) as Array<[HospitalOsSection, [AccessResource, AccessAction]]>).map(
    ([section, [resource, action]]) => [section, rolesWithPermission(resource, action)]
  )
) as Record<HospitalOsSection, HospitalRole[]>;

export function canAccessSection(role: HospitalRole, section: HospitalOsSection) {
  return sectionAccess[section].includes(role);
}

/** Command palette entity visibility derived from the access matrix. */
const commandEntityResource: Record<CommandEntity, AccessResource> = {
  Patient: "patients",
  Doctor: "appointments",
  Appointment: "appointments",
  Bed: "beds",
  Room: "beds",
  Procedure: "appointments",
  Medicine: "pharmacy-inventory",
  Invoice: "billing",
  Insurance: "insurance",
  Report: "reports",
  Department: "hr-records",
  Employee: "hr-records"
};

export const commandEntityAccess: Record<CommandEntity, HospitalRole[]> = Object.fromEntries(
  (Object.entries(commandEntityResource) as Array<[CommandEntity, AccessResource]>).map(([entity, resource]) => [
    entity,
    rolesWithPermission(resource)
  ])
) as Record<CommandEntity, HospitalRole[]>;

export function canAccessCommandEntity(role: HospitalRole, entity: CommandEntity) {
  return commandEntityAccess[entity].includes(role);
}

/** Shown when a role has no Hospital OS workspace sections built yet; points staff to their dedicated admin module. */
export const roleFallbackMessage: Partial<Record<HospitalRole, { title: string; description: string }>> = {
  Pharmacist: { title: "Pharmacy workspace lives in Admin", description: "Prescription fulfillment, stock and dispensing workflows are managed in the Pharmacy module." },
  "Lab Tech": { title: "Laboratory workspace lives in Admin", description: "Sample tracking and report uploads are managed in the Laboratory module." },
  HR: { title: "HR workspace lives in Admin", description: "Staff records, shifts and attendance are managed in the HR module." }
};

export const patientFlowRows: PatientFlowRow[] = [
  { id: "pf-1", uhid: "MGM-24018", patient: "Aarav Sharma", age: 42, status: "In Consultation", doctor: "Dr. Deepak Sharma", department: "Gastroenterology", billing: "Open", insurance: "Star Health", waitMinutes: 18, risk: "Moderate", lastActivity: "Consult started 09:44" },
  { id: "pf-2", uhid: "MGM-24019", patient: "Nisha Verma", age: 35, status: "Vitals Pending", doctor: "Dr. Deepak Sharma", department: "OPD", billing: "Paid", insurance: "Self pay", waitMinutes: 24, risk: "Low", lastActivity: "Registered 09:28" },
  { id: "pf-3", uhid: "MGM-24020", patient: "Imran Khan", age: 51, status: "Lab Review", doctor: "Dr. Deepak Sharma", department: "Laboratory", billing: "Insurance", insurance: "Care Health", waitMinutes: 35, risk: "High", lastActivity: "Critical LFT flagged" },
  { id: "pf-4", uhid: "MGM-24021", patient: "Meera Joshi", age: 29, status: "Scheduled", doctor: "Duty Doctor", department: "Endoscopy", billing: "Preauth", insurance: "HDFC Ergo", waitMinutes: 8, risk: "Low", lastActivity: "Procedure slot held" },
  { id: "pf-5", uhid: "MGM-24022", patient: "Devendra Singh", age: 63, status: "Billing Hold", doctor: "Dr. Deepak Sharma", department: "IPD", billing: "Refund Review", insurance: "Ayushman Bharat", waitMinutes: 11, risk: "Moderate", lastActivity: "Discharge bill review" },
  { id: "pf-6", uhid: "MGM-24023", patient: "Kavya Mehta", age: 46, status: "Discharged", doctor: "Dr. Deepak Sharma", department: "Pharmacy", billing: "Paid", insurance: "Self pay", waitMinutes: 0, risk: "Low", lastActivity: "Medicine dispensed" }
];

export const commandRecords: CommandRecord[] = [
  { id: "cmd-1", entity: "Patient", title: "Aarav Sharma", subtitle: "UHID MGM-24018 - active OPD", href: "#patient-workspace", keywords: ["aarav", "mgm-24018", "opd"], priority: 100 },
  { id: "cmd-2", entity: "Doctor", title: "Dr. Deepak Kumar Sharma", subtitle: "Gastroenterology - available today", href: "#doctor-workspace", keywords: ["doctor", "deepak", "gastro"], priority: 96 },
  { id: "cmd-3", entity: "Invoice", title: "INV-5821", subtitle: "Rs 18,450 - insurance review", href: "#billing", keywords: ["invoice", "billing", "insurance"], priority: 90 },
  { id: "cmd-4", entity: "Medicine", title: "Pantoprazole 40 mg", subtitle: "Pharmacy stock 42 strips", href: "#operations-table", keywords: ["medicine", "pharmacy", "stock"], priority: 76 },
  { id: "cmd-5", entity: "Appointment", title: "ERCP follow-up", subtitle: "Today 3:20 PM - Room 2", href: "#appointment-flow", keywords: ["appointment", "ercp"], priority: 82 },
  { id: "cmd-6", entity: "Department", title: "Endoscopy Unit", subtitle: "2 rooms active, 1 procedure delayed", href: "#analytics", keywords: ["department", "endoscopy"], priority: 62 },
  { id: "cmd-7", entity: "Employee", title: "Nurse Priya S.", subtitle: "Assigned to HDU and vitals desk", href: "#doctor-workspace", keywords: ["employee", "nurse"], priority: 60 },
  { id: "cmd-8", entity: "Insurance", title: "Star Health policy STH-9082", subtitle: "Preauth pending for MGM-24018", href: "#billing", keywords: ["insurance", "preauth"], priority: 80 },
  { id: "cmd-9", entity: "Report", title: "LFT panel", subtitle: "Critical bilirubin flag", href: "#patient-workspace", keywords: ["report", "lab", "lft"], priority: 92 },
  { id: "cmd-10", entity: "Bed", title: "HDU-04", subtitle: "Occupied - discharge expected 6 PM", href: "#analytics", keywords: ["bed", "hdu"], priority: 68 },
  { id: "cmd-11", entity: "Room", title: "Procedure Room 2", subtitle: "ERCP list running 12 minutes late", href: "#appointment-flow", keywords: ["room", "procedure"], priority: 58 },
  { id: "cmd-12", entity: "Procedure", title: "Colonoscopy package", subtitle: "Billing template and consent ready", href: "#billing", keywords: ["procedure", "colonoscopy"], priority: 54 }
];

export const clinicalTimeline: ClinicalEvent[] = [
  { time: "09:12", title: "OPD registration", detail: "UHID verified, previous ERCP notes attached.", type: "registration" },
  { time: "09:28", title: "Vitals captured", detail: "BP 126/82, pulse 82, SpO2 98%, pain score 3/10.", type: "vitals" },
  { time: "09:44", title: "Consultation started", detail: "Follow-up for abdominal pain and reflux symptoms.", type: "consult" },
  { time: "10:10", title: "Lab order", detail: "CBC, LFT, amylase, lipase requested with priority normal.", type: "lab" },
  { time: "10:22", title: "Billing note", detail: "Insurance preauth documents requested from front desk.", type: "billing" }
];

export const dashboardMetrics: DashboardMetric[] = [
  { label: "OPD Flow", value: "42", delta: "+12% vs yesterday", tone: "success", dataKey: "opd" },
  { label: "Bed Occupancy", value: "76%", delta: "4 HDU beds free", tone: "primary", dataKey: "beds" },
  { label: "Revenue Today", value: "Rs 4.8L", delta: "+8.4% vs 7-day avg", tone: "success", dataKey: "revenue" },
  { label: "Critical Alerts", value: "3", delta: "2 labs, 1 stock", tone: "danger", dataKey: "alerts" }
];

export const analyticsSeries = [
  { time: "08:00", opd: 8, revenue: 0.8, beds: 68, alerts: 0 },
  { time: "10:00", opd: 22, revenue: 1.7, beds: 72, alerts: 1 },
  { time: "12:00", opd: 35, revenue: 2.9, beds: 76, alerts: 2 },
  { time: "14:00", opd: 42, revenue: 4.8, beds: 76, alerts: 3 },
  { time: "16:00", opd: 50, revenue: 5.5, beds: 74, alerts: 2 }
];

export const liveEvents = [
  "Queue moved: MGM-24018 to Consultation",
  "Critical LFT report assigned to doctor",
  "Pharmacy stock alert: Rifaximin below threshold",
  "HDU-04 discharge request submitted"
];

/** Audit actions that are internal telemetry, not activity worth surfacing in the live feed. */
const realtimeExcludedActions = new Set([
  "hospital_os.realtime.polled",
  "hospital_os.snapshot.viewed",
  "production.readiness.checked",
  "admin.login.success",
  "admin.login.failed",
  "admin.logout",
  "doctor.login.success",
  "doctor.login.failed",
  "doctor.logout"
]);

function humanizeAuditAction(action: string) {
  const words = action.replaceAll(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

type MinimalAuditEvent = {
  action: string;
  severity: "info" | "warning" | "critical";
  metadata: Record<string, unknown>;
};

/** Maps a real audit-log entry to a Hospital OS realtime event; returns null for entries that shouldn't appear in the live feed. */
export function auditEventToRealtimeEvent(event: MinimalAuditEvent): HospitalRealtimeEvent | null {
  if (realtimeExcludedActions.has(event.action)) return null;

  const meta = event.metadata;
  switch (event.action) {
    case "ipd.bed.transfer":
      return {
        type: "bed.updated",
        payload: { bedId: String(meta.toBed ?? "bed"), status: `Transferred from ${meta.fromBed ?? "previous bed"}` }
      };
    case "hospital_os.patient_flow.doctor_assigned":
      return {
        type: "doctor.updated",
        payload: { doctorId: String(meta.doctor ?? meta.doctorId ?? "doctor"), available: false }
      };
    default:
      return {
        type: "notification.created",
        payload: { message: humanizeAuditAction(event.action), severity: event.severity }
      };
  }
}

export const v1AiScope = [
  "AI Patient Summary",
  "AI Report Summary",
  "AI Search",
  "AI Symptom Checker",
  "AI Prescription Assistance",
  "AI Follow-up Suggestions",
  "AI Analytics"
];
