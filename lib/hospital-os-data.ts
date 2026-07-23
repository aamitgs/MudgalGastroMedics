import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bed,
  Bell,
  BookUser,
  BrainCircuit,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FlaskConical,
  Gauge,
  History,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  ListTodo,
  MessageCircle,
  MessagesSquare,
  NotebookPen,
  Package,
  Pill,
  Receipt,
  ScanLine,
  Settings,
  ShieldCheck,
  Syringe,
  UserRound,
  UsersRound,
  Utensils
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roleHasPermission, type AccessAction, type AccessResource, type AccessRole } from "@/lib/access/matrix";
import { downloadCsv } from "@/lib/table-export";
import { useHospitalOsStore } from "@/stores/hospital-os-store";

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
  /** Extra search aliases for the command palette (e.g. alternate names staff might search for, like "insurance"/"accounts" for the "Finance" module). */
  keywords?: string[];
};

export type PatientFlowRow = {
  id: string;
  /** Which store `id` resolves against — status changes (e.g. cancel) must PATCH the matching endpoint. */
  kind: "opd-visit" | "appointment";
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
  /** Registered contact number — the cross-store patient identity key. Absent on demo rows. */
  phone?: string;
};

export type CommandRecord = {
  id: string;
  entity: CommandEntity;
  title: string;
  subtitle: string;
  href: string;
  /** Set for a Patient result — selecting it opens the Patient Drawer instead of navigating to href. */
  patientPhone?: string;
  keywords?: string[];
  priority?: number;
};

export type ClinicalEvent = {
  time: string;
  title: string;
  detail: string;
  type: "registration" | "vitals" | "consult" | "lab" | "billing" | "appointment" | "admission" | "discharge" | "pharmacy";
};

/** Live per-module counts for sidebar badges, computed server-side in the snapshot. */
export type NavBadgeCounts = Partial<Record<"OPD" | "Laboratory" | "Pharmacy", number>>;

/** Client-side record of a successful Hospital OS mutation, shown in AuditTrailPanel (Track 4.10). */
export type AuditTrailItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  recordedAt: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "primary" | "success" | "warning" | "danger";
  dataKey: "opd" | "beds" | "revenue" | "alerts";
};

export const metricIcons: Record<string, LucideIcon> = {
  "OPD Flow": Activity,
  "Bed Occupancy": Bed,
  "Revenue Today": CircleDollarSign,
  "Critical Alerts": AlertTriangle
};

export type HospitalTrendPoint = { time: string; opd: number; revenue: number };

export type HospitalSnapshot = {
  rows: PatientFlowRow[];
  metrics: DashboardMetric[];
  trend: HospitalTrendPoint[];
  navBadges: NavBadgeCounts;
};

type HospitalSnapshotResponse = {
  ok: boolean;
  rows?: PatientFlowRow[];
  metrics?: DashboardMetric[];
  trend?: HospitalTrendPoint[];
  navBadges?: NavBadgeCounts;
  error?: string;
};

/**
 * Shared fetcher for react-query key ["hospital-os","patient-flow"] — used by
 * both HospitalOsShell (for nav badge counts) and the dashboard content (for
 * the full snapshot). Using the SAME function reference for the same key
 * matters: react-query dedupes in-flight requests per key regardless of which
 * component's useQuery call fires first, so both must agree on what a cache
 * hit for this key actually contains.
 */
export async function fetchHospitalSnapshot(): Promise<HospitalSnapshot> {
  const response = await fetch("/api/hospital-os/snapshot", { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as HospitalSnapshotResponse;

  if (!response.ok || !data.ok || !data.rows) {
    throw new Error(data.error || "Unable to load Hospital OS snapshot.");
  }

  // metrics/trend are always computed live by the API from real store data
  // (never omitted); these fall back to empty, not fabricated numbers, so a
  // malformed response degrades to "no data" rather than misleading figures.
  return { rows: data.rows, metrics: data.metrics ?? [], trend: data.trend ?? [], navBadges: data.navBadges ?? {} };
}

export type RealtimeMessage = { id: string; text: string };

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
 * PRO and Dietitian approximate to Front Desk for UI purposes only — the
 * server still enforces each role's own narrower matrix on every API call.
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
  dietitian: "Front Desk",
  patient: "Front Desk"
};

function rolesWithPermission(resource: AccessResource | null, action: AccessAction = "view"): HospitalRole[] {
  if (!resource) return hospitalRoles;
  return hospitalRoles.filter((role) => roleHasPermission(hospitalRoleToAccessRole[role], resource, action));
}

export const navItems: NavItem[] = [
  { label: "Dashboard", group: "Overview", href: "/mudgalgastromedics-os", icon: LayoutDashboard, roles: rolesWithPermission(null) },
  // "Patients" is the dashboard's live today's-queue view (patient-flow), its
  // own dedicated route; "Patient List" is the separate full-CRUD
  // /mudgalgastromedics-os/patients page — genuinely different views, both kept.
  // Roles gated on "appointments" (not "patients") to match sectionPermission.patientFlow
  // below, which is what actually gates the patient-flow page's content — otherwise a
  // patients-view-only role (e.g. Lab Tech, Billing/Accounts) would see this item but
  // land on a page with nothing they're allowed to see.
  { label: "Patients", group: "Clinical", href: "/mudgalgastromedics-os/patient-flow", icon: UsersRound, roles: rolesWithPermission("appointments") },
  { label: "Patient List", group: "Clinical", href: "/mudgalgastromedics-os/patients", icon: BookUser, roles: rolesWithPermission("patients") },
  { label: "AI Reviews", group: "Clinical", href: "/mudgalgastromedics-os/ai-reviews", icon: BrainCircuit, roles: rolesWithPermission("patients") },
  { label: "Appointment Requests", group: "Clinical", href: "/mudgalgastromedics-os/appointments", icon: Inbox, roles: rolesWithPermission("appointments") },
  { label: "OPD", group: "Clinical", href: "/mudgalgastromedics-os/opd", icon: ClipboardList, roles: rolesWithPermission("appointments") },
  { label: "Procedures", group: "Clinical", href: "/mudgalgastromedics-os/procedures", icon: Syringe, roles: rolesWithPermission("appointments") },
  { label: "IPD", group: "Clinical", href: "/mudgalgastromedics-os/ipd", icon: Bed, roles: rolesWithPermission("beds") },
  { label: "Doctor Workflow", group: "Clinical", href: "/mudgalgastromedics-os/doctor-workflow", icon: NotebookPen, roles: rolesWithPermission("prescriptions") },
  // Hardcoded roles, not rolesWithPermission(): the Doctor Portal's real
  // gate (canOpenDoctorWorkspace) is main-doctor/duty-doctor/super-admin
  // only, a role check with no matching resource permission — the previous
  // "Prescriptions" and "AI Assistant" entries both linked here gated by
  // resource permissions (prescriptions, patients) that admin, nurse,
  // pharmacist, reception and lab-technician all also hold, so those roles
  // saw a working-looking link that silently redirected them away. "Doctor"
  // already covers both main-doctor and duty-doctor sessions here (see
  // accessRoleToHospitalRole) — super-admin loses this one sidebar
  // shortcut, which is a safe tradeoff against showing a broken link.
  { label: "Doctor Portal", group: "Clinical", href: "/mudgalgastromedics-os/doctor-portal", icon: FileText, roles: ["Doctor"] },
  { label: "Pharmacy", group: "Operations", href: "/mudgalgastromedics-os/pharmacy", icon: Pill, roles: rolesWithPermission("pharmacy-inventory") },
  { label: "Laboratory", group: "Diagnostics", href: "/mudgalgastromedics-os/lab", icon: FlaskConical, roles: rolesWithPermission("lab-orders") },
  { label: "Radiology & Pathology", group: "Diagnostics", href: "/mudgalgastromedics-os/radiology-pathology", icon: ScanLine, roles: rolesWithPermission("lab-orders") },
  { label: "Billing", group: "Finance", href: "/mudgalgastromedics-os/billing", icon: Receipt, roles: rolesWithPermission("billing") },
  { label: "Finance", group: "Finance", href: "/mudgalgastromedics-os/finance", icon: ShieldCheck, roles: rolesWithPermission("insurance"), keywords: ["insurance", "accounts"] },
  { label: "HR", group: "Administration", href: "/mudgalgastromedics-os/hr", icon: UserRound, roles: rolesWithPermission("hr-records") },
  { label: "Inventory", group: "Operations", href: "/mudgalgastromedics-os/inventory", icon: Package, roles: rolesWithPermission("pharmacy-inventory") },
  { label: "Reports", group: "Administration", href: "/mudgalgastromedics-os/reports", icon: BarChart3, roles: rolesWithPermission("reports") },
  { label: "CMS", group: "Administration", href: "/mudgalgastromedics-os/cms", icon: Activity, roles: rolesWithPermission("cms") },
  { label: "Settings", group: "Administration", href: "/mudgalgastromedics-os/settings", icon: Settings, roles: rolesWithPermission("system-settings") },
  { label: "Notifications", group: "Overview", href: "/mudgalgastromedics-os/notifications", icon: Bell, roles: rolesWithPermission(null) },
  { label: "Readiness", group: "Administration", href: "/mudgalgastromedics-os/readiness", icon: Gauge, roles: rolesWithPermission("system-settings") },
  { label: "Audit", group: "Administration", href: "/mudgalgastromedics-os/audit", icon: History, roles: rolesWithPermission("audit-logs") },
  { label: "Analytics", group: "Administration", href: "/mudgalgastromedics-os/analytics", icon: LineChart, roles: rolesWithPermission("reports") },
  { label: "Access", group: "Administration", href: "/mudgalgastromedics-os/access", icon: KeyRound, roles: rolesWithPermission("user-management") },
  { label: "Modules", group: "Administration", href: "/mudgalgastromedics-os/modules", icon: Layers, roles: rolesWithPermission("system-settings") },
  { label: "Diet Plans", group: "Clinical", href: "/mudgalgastromedics-os/diet-plans", icon: Utensils, roles: rolesWithPermission("diet-plans") },
  { label: "Automation", group: "Operations", href: "/mudgalgastromedics-os/automation", icon: ListTodo, roles: rolesWithPermission("appointments") },
  { label: "Comms", group: "Operations", href: "/mudgalgastromedics-os/communication", icon: MessageCircle, roles: rolesWithPermission("appointments") },
  { label: "Staff Notes", group: "Operations", href: "/mudgalgastromedics-os/staff-notes", icon: MessagesSquare, roles: rolesWithPermission(null) }
];

export type HospitalOsSection = "clinicalWorkspace" | "patientFlow";

/** Section visibility derived from the access matrix — one permission per section. */
const sectionPermission: Record<HospitalOsSection, [AccessResource, AccessAction]> = {
  clinicalWorkspace: ["prescriptions", "view"],
  patientFlow: ["appointments", "view"]
};

export const sectionAccess: Record<HospitalOsSection, HospitalRole[]> = Object.fromEntries(
  (Object.entries(sectionPermission) as Array<[HospitalOsSection, [AccessResource, AccessAction]]>).map(
    ([section, [resource, action]]) => [section, rolesWithPermission(resource, action)]
  )
) as Record<HospitalOsSection, HospitalRole[]>;

export function canAccessSection(role: HospitalRole, section: HospitalOsSection) {
  return sectionAccess[section].includes(role);
}

/** Shown when a role has no Hospital OS workspace sections built yet; points staff to their dedicated admin module. */
export const roleFallbackMessage: Partial<Record<HospitalRole, { title: string; description: string }>> = {
  Pharmacist: { title: "Pharmacy workspace lives in Admin", description: "Prescription fulfillment, stock and dispensing workflows are managed in the Pharmacy module." },
  "Lab Tech": { title: "Laboratory workspace lives in Admin", description: "Sample tracking and report uploads are managed in the Laboratory module." },
  HR: { title: "HR workspace lives in Admin", description: "Staff records, shifts and attendance are managed in the HR module." }
};

export const patientFlowRows: PatientFlowRow[] = [
  { id: "pf-1", kind: "opd-visit", uhid: "MGM-24018", patient: "Aarav Sharma", age: 42, status: "In Consultation", doctor: "Dr. Deepak Sharma", department: "Gastroenterology", billing: "Open", insurance: "Star Health", waitMinutes: 18, risk: "Moderate", lastActivity: "Consult started 09:44" },
  { id: "pf-2", kind: "opd-visit", uhid: "MGM-24019", patient: "Nisha Verma", age: 35, status: "Vitals Pending", doctor: "Dr. Deepak Sharma", department: "OPD", billing: "Paid", insurance: "Self pay", waitMinutes: 24, risk: "Low", lastActivity: "Registered 09:28" },
  { id: "pf-3", kind: "opd-visit", uhid: "MGM-24020", patient: "Imran Khan", age: 51, status: "Lab Review", doctor: "Dr. Deepak Sharma", department: "Laboratory", billing: "Insurance", insurance: "Care Health", waitMinutes: 35, risk: "High", lastActivity: "Critical LFT flagged" },
  { id: "pf-4", kind: "appointment", uhid: "MGM-24021", patient: "Meera Joshi", age: 29, status: "Scheduled", doctor: "Duty Doctor", department: "Endoscopy", billing: "Preauth", insurance: "HDFC Ergo", waitMinutes: 8, risk: "Low", lastActivity: "Procedure slot held" },
  { id: "pf-5", kind: "opd-visit", uhid: "MGM-24022", patient: "Devendra Singh", age: 63, status: "Billing Hold", doctor: "Dr. Deepak Sharma", department: "IPD", billing: "Refund Review", insurance: "Ayushman Bharat", waitMinutes: 11, risk: "Moderate", lastActivity: "Discharge bill review" },
  { id: "pf-6", kind: "opd-visit", uhid: "MGM-24023", patient: "Kavya Mehta", age: 46, status: "Discharged", doctor: "Dr. Deepak Sharma", department: "Pharmacy", billing: "Paid", insurance: "Self pay", waitMinutes: 0, risk: "Low", lastActivity: "Medicine dispensed" }
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


export const patientFlowExportHeaders = ["UHID", "Patient", "Age", "Status", "Doctor", "Department", "Billing", "Insurance", "Wait Minutes", "Risk", "Last Activity"];

export function patientFlowExportRow(patient: PatientFlowRow) {
  return [
    patient.uhid,
    patient.patient,
    String(patient.age),
    patient.status,
    patient.doctor,
    patient.department,
    patient.billing,
    patient.insurance,
    String(patient.waitMinutes),
    patient.risk,
    patient.lastActivity
  ];
}

export function downloadCsvFile(rows: string[][], filename: string) {
  downloadCsv(patientFlowExportHeaders, rows, filename);
}

/** Shared by the monolith's column actions and the extracted OperationsTable's keyboard "Enter" handler. */
export function openPatientWorkspace(patientId: string) {
  useHospitalOsStore.getState().setActivePatient(patientId);
  document.querySelector("#patient-workspace")?.scrollIntoView({ block: "start" });
}
