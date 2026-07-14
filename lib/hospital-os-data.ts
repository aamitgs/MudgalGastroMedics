import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bed,
  Bell,
  BookUser,
  BrainCircuit,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
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
  Sparkles,
  Stethoscope,
  Syringe,
  UserRound,
  UsersRound,
  Utensils,
  WalletCards
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
  /** Extra search aliases for the command palette (e.g. a module's registry name when the sidebar label differs, like "Finance" for "Insurance"/"Accounts"). */
  keywords?: string[];
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
  /** Registered contact number — the cross-store patient identity key. Absent on demo rows. */
  phone?: string;
};

export type DoctorAssignment = {
  patientId: string;
  patientName: string;
  doctor: string;
};

export const assignableDoctors = ["Dr. Deepak Sharma", "Duty Doctor", "Dr. Neha Bansal", "Dr. Arvind Rao"];

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

// Anchor-only hrefs are prefixed with the dashboard's own path (not bare
// "#id") — Track 4.13's shell now renders on 14+ other routes too, and a bare
// "#id" link only scrolls within whatever page you're currently on; clicked
// from another route it would silently do nothing instead of navigating to
// the dashboard first. Full navigation to a URL with a hash still scrolls to
// that element once the page renders, same as before, on every page.
const dashboardPath = "/mudgalgastromedics-os";

export const navItems: NavItem[] = [
  { label: "Dashboard", group: "Overview", href: `${dashboardPath}#analytics`, icon: LayoutDashboard, roles: rolesWithPermission(null) },
  // "Patients" and "Appointments" deliberately still point at this dashboard's
  // own OperationsTable / PatientRegistrationForm+AppointmentBookingForm
  // sections — real, e2e-tested, Hospital-OS-native live-triage UI (bulk
  // actions, CSV export, doctor assignment; new patient/appointment forms),
  // not the same thing as the registry/report pages below. "Patient Registry"
  // and "Appointment Requests" are the dedicated /mudgalgastromedics-os/*
  // pages added in Phase 2, now given their own entries (same label-pair
  // pattern as "Billing" vs. "Billing Summary") so both destinations are
  // reachable from the sidebar like every other module, instead of only one.
  { label: "Patients", group: "Clinical", href: `${dashboardPath}#operations-table`, icon: UsersRound, roles: rolesWithPermission("patients") },
  { label: "Patient Registry", group: "Clinical", href: "/mudgalgastromedics-os/patients", icon: BookUser, roles: rolesWithPermission("patients") },
  { label: "Doctors", group: "Clinical", href: `${dashboardPath}#doctor-workspace`, icon: Stethoscope, roles: rolesWithPermission("appointments") },
  { label: "AI Reviews", group: "Clinical", href: "/mudgalgastromedics-os/ai-reviews", icon: BrainCircuit, roles: rolesWithPermission("patients") },
  // Track 4.13 (docs/build-roadmap.md): migrated modules point at their new
  // dedicated /mudgalgastromedics-os/* route instead of an /admin#module-x
  // anchor. Not-yet-migrated modules (Phase 2) keep their old href.
  { label: "Appointments", group: "Clinical", href: `${dashboardPath}#appointment-flow`, icon: CalendarClock, roles: rolesWithPermission("appointments") },
  { label: "Appointment Requests", group: "Clinical", href: "/mudgalgastromedics-os/appointments", icon: Inbox, roles: rolesWithPermission("appointments") },
  { label: "OPD", group: "Clinical", href: "/mudgalgastromedics-os/opd", icon: ClipboardList, roles: rolesWithPermission("appointments") },
  { label: "Procedures", group: "Clinical", href: "/mudgalgastromedics-os/procedures", icon: Syringe, roles: rolesWithPermission("appointments") },
  { label: "IPD", group: "Clinical", href: "/mudgalgastromedics-os/ipd", icon: Bed, roles: rolesWithPermission("beds") },
  { label: "Doctor Workflow", group: "Clinical", href: "/mudgalgastromedics-os/doctor-workflow", icon: NotebookPen, roles: rolesWithPermission("prescriptions") },
  { label: "Prescriptions", group: "Clinical", href: "/doctor", icon: FileText, roles: rolesWithPermission("prescriptions") },
  { label: "Pharmacy", group: "Operations", href: "/mudgalgastromedics-os/pharmacy", icon: Pill, roles: rolesWithPermission("pharmacy-inventory") },
  { label: "Laboratory", group: "Diagnostics", href: "/mudgalgastromedics-os/lab", icon: FlaskConical, roles: rolesWithPermission("lab-orders") },
  { label: "Radiology & Pathology", group: "Diagnostics", href: "/mudgalgastromedics-os/radiology-pathology", icon: ScanLine, roles: rolesWithPermission("lab-orders") },
  // "Billing" (dashboard's own BillingForm, a real e2e-tested billing-entry
  // section) deliberately stays as-is, same reasoning as Patients/Appointments
  // above — "Billing Summary" is the new Phase 2 revenue/receipts report page.
  { label: "Billing", group: "Finance", href: `${dashboardPath}#billing`, icon: CreditCard, roles: rolesWithPermission("billing") },
  { label: "Billing Summary", group: "Finance", href: "/mudgalgastromedics-os/billing", icon: Receipt, roles: rolesWithPermission("billing") },
  { label: "Insurance", group: "Finance", href: "/mudgalgastromedics-os/finance", icon: ShieldCheck, roles: rolesWithPermission("insurance"), keywords: ["finance"] },
  { label: "Accounts", group: "Finance", href: "/mudgalgastromedics-os/finance", icon: WalletCards, roles: rolesWithPermission("billing"), keywords: ["finance"] },
  { label: "HR", group: "Administration", href: "/mudgalgastromedics-os/hr", icon: UserRound, roles: rolesWithPermission("hr-records") },
  { label: "Inventory", group: "Operations", href: "/mudgalgastromedics-os/inventory", icon: Package, roles: rolesWithPermission("pharmacy-inventory") },
  { label: "Reports", group: "Administration", href: "/mudgalgastromedics-os/reports", icon: BarChart3, roles: rolesWithPermission("reports") },
  { label: "CMS", group: "Administration", href: "/mudgalgastromedics-os/cms", icon: Activity, roles: rolesWithPermission("cms") },
  { label: "Settings", group: "Administration", href: "/mudgalgastromedics-os/settings", icon: Settings, roles: rolesWithPermission("system-settings") },
  { label: "Notifications", group: "Overview", href: `${dashboardPath}#realtime-feed`, icon: Bell, roles: rolesWithPermission(null) },
  { label: "AI Assistant", group: "Overview", href: `${dashboardPath}#patient-portal-preview`, icon: Sparkles, roles: rolesWithPermission("patients") },
  // New entries for modules migrated in Phase 1 that had no prior Hospital OS
  // sidebar entry at all (they only lived on /admin before).
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
  { id: "cmd-1", entity: "Patient", title: "Aarav Sharma", subtitle: "UHID MGM-24018 - active OPD", href: `${dashboardPath}#patient-workspace`, keywords: ["aarav", "mgm-24018", "opd"], priority: 100 },
  { id: "cmd-2", entity: "Doctor", title: "Dr. Deepak Kumar Sharma", subtitle: "Gastroenterology - available today", href: `${dashboardPath}#doctor-workspace`, keywords: ["doctor", "deepak", "gastro"], priority: 96 },
  { id: "cmd-3", entity: "Invoice", title: "INV-5821", subtitle: "Rs 18,450 - insurance review", href: `${dashboardPath}#billing`, keywords: ["invoice", "billing", "insurance"], priority: 90 },
  { id: "cmd-4", entity: "Medicine", title: "Pantoprazole 40 mg", subtitle: "Pharmacy stock 42 strips", href: `${dashboardPath}#operations-table`, keywords: ["medicine", "pharmacy", "stock"], priority: 76 },
  { id: "cmd-5", entity: "Appointment", title: "ERCP follow-up", subtitle: "Today 3:20 PM - Room 2", href: `${dashboardPath}#appointment-flow`, keywords: ["appointment", "ercp"], priority: 82 },
  { id: "cmd-6", entity: "Department", title: "Endoscopy Unit", subtitle: "2 rooms active, 1 procedure delayed", href: `${dashboardPath}#analytics`, keywords: ["department", "endoscopy"], priority: 62 },
  { id: "cmd-7", entity: "Employee", title: "Nurse Priya S.", subtitle: "Assigned to HDU and vitals desk", href: `${dashboardPath}#doctor-workspace`, keywords: ["employee", "nurse"], priority: 60 },
  { id: "cmd-8", entity: "Insurance", title: "Star Health policy STH-9082", subtitle: "Preauth pending for MGM-24018", href: `${dashboardPath}#billing`, keywords: ["insurance", "preauth"], priority: 80 },
  { id: "cmd-9", entity: "Report", title: "LFT panel", subtitle: "Critical bilirubin flag", href: `${dashboardPath}#patient-workspace`, keywords: ["report", "lab", "lft"], priority: 92 },
  { id: "cmd-10", entity: "Bed", title: "HDU-04", subtitle: "Occupied - discharge expected 6 PM", href: `${dashboardPath}#analytics`, keywords: ["bed", "hdu"], priority: 68 },
  { id: "cmd-11", entity: "Room", title: "Procedure Room 2", subtitle: "ERCP list running 12 minutes late", href: `${dashboardPath}#appointment-flow`, keywords: ["room", "procedure"], priority: 58 },
  { id: "cmd-12", entity: "Procedure", title: "Colonoscopy package", subtitle: "Billing template and consent ready", href: `${dashboardPath}#billing`, keywords: ["procedure", "colonoscopy"], priority: 54 }
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

/** Badge color per PatientStatus/BillingStatus value — shared by the monolith's OperationsTable and the extracted DoctorWorkspace. */
export const statusTone: Record<string, string> = {
  "In Consultation": "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  "Vitals Pending": "border-[var(--hos-warning)]/25 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]",
  "Lab Review": "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  Scheduled: "border-[var(--hos-border)] bg-[var(--hos-muted)] text-[var(--hos-text)]",
  "Billing Hold": "border-[var(--hos-danger)]/20 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]",
  Discharged: "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  Open: "border-[var(--hos-warning)]/25 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]",
  Paid: "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  Insurance: "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  Preauth: "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  "Refund Review": "border-[var(--hos-danger)]/20 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]"
};

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
