/**
 * Data-driven RBAC permission matrix for the Hospital OS.
 *
 * This file is intentionally client-safe (no "server-only") so navigation,
 * the login role dropdown, and the Hospital OS sidebar can derive their
 * visibility from the same matrix the server enforces. Enforcement itself
 * happens exclusively in lib/access/guard.ts on the server.
 *
 * Adding a new role (e.g. "Senior Nurse") is a data change here — no new
 * code paths are required anywhere else.
 */

export type AccessRole =
  | "super-admin"
  | "admin"
  | "main-doctor"
  | "duty-doctor"
  | "nurse"
  | "reception"
  | "pharmacist"
  | "lab-technician"
  | "billing-accounts"
  | "hr"
  | "pro"
  | "dietitian"
  | "patient";

export type AccessResource =
  | "patients"
  | "appointments"
  | "beds"
  | "prescriptions"
  | "lab-orders"
  | "pharmacy-inventory"
  | "billing"
  | "insurance"
  | "hr-records"
  | "reports"
  | "system-settings"
  | "user-management"
  | "audit-logs"
  | "liaison-notes"
  | "cms"
  | "diet-plans";

export type AccessAction = "view" | "create" | "edit" | "delete" | "export";

export const accessActions: AccessAction[] = ["view", "create", "edit", "delete", "export"];

export const accessResources: AccessResource[] = [
  "patients",
  "appointments",
  "beds",
  "prescriptions",
  "lab-orders",
  "pharmacy-inventory",
  "billing",
  "insurance",
  "hr-records",
  "reports",
  "system-settings",
  "user-management",
  "audit-logs",
  "liaison-notes",
  "cms",
  "diet-plans"
];

export type RoleMeta = {
  label: string;
  description: string;
  /** Where this role lands after login. */
  landing: string;
  /** Shown in the login dropdown; patient logins use the separate patient portal. */
  staffLogin: boolean;
};

export const roleMeta: Record<AccessRole, RoleMeta> = {
  "super-admin": {
    label: "Super Admin",
    description: "Full system access including user management, settings and audit logs.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  admin: {
    label: "Admin",
    description: "Day-to-day operational control across modules; cannot change system settings or Super Admin assignments.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  "main-doctor": {
    label: "Main Doctor",
    description: "Senior/consulting doctor with full clinical authority and department oversight.",
    landing: "/mudgalgastromedics-os/doctor-portal",
    staffLogin: true
  },
  "duty-doctor": {
    label: "Duty Doctor",
    description: "On-call/shift clinical care for assigned patients, with escalation to the Main Doctor.",
    landing: "/mudgalgastromedics-os/doctor-portal",
    staffLogin: true
  },
  nurse: {
    label: "Nurse",
    description: "Vitals entry, HDU monitoring and escalation, medication logging, bed status updates.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  reception: {
    label: "Reception / Front Desk",
    description: "Registration, appointment booking, bed assignment requests, queues and basic billing.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  pharmacist: {
    label: "Pharmacist",
    description: "Pharmacy inventory, prescription fulfilment, stock and reorder alerts.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  "lab-technician": {
    label: "Lab Technician",
    description: "Lab order queue, sample tracking, result upload.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  "billing-accounts": {
    label: "Billing / Accounts",
    description: "Invoicing, payments, insurance verification and claims, financial reports.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  hr: {
    label: "HR",
    description: "Staff records, attendance, leave, payroll. No patient data access.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  pro: {
    label: "PRO (Public Relations)",
    description: "Patient/family liaison and referrals. Reads contact/admission info; no clinical editing.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  dietitian: {
    label: "Dietitian",
    description: "Reviews patient nutrition/medical history and manages diet plans for OPD and admitted patients.",
    landing: "/mudgalgastromedics-os",
    staffLogin: true
  },
  patient: {
    label: "Patient",
    description: "Self-service portal: own appointments, reports, prescriptions, bills.",
    landing: "/portal",
    staffLogin: false
  }
};

export const staffLoginRoles: AccessRole[] = (Object.keys(roleMeta) as AccessRole[]).filter(
  (role) => roleMeta[role].staffLogin
);

type PermissionSet = Partial<Record<AccessResource, AccessAction[]>>;

const allActions: AccessAction[] = ["view", "create", "edit", "delete", "export"];
const readWrite: AccessAction[] = ["view", "create", "edit"];
const readWriteExport: AccessAction[] = ["view", "create", "edit", "export"];

/**
 * The permission matrix. Super Admin is represented with every permission for
 * display purposes, but the guard also treats it as a logged bypass so a gap
 * here can never lock out the Super Admin.
 *
 * Note: the Insurance Coordinator role was merged into Billing / Accounts at
 * launch (confirmed decision); the "insurance" resource remains separate so a
 * dedicated role can be added later as pure data.
 */
export const rolePermissions: Record<AccessRole, PermissionSet> = {
  "super-admin": Object.fromEntries(accessResources.map((resource) => [resource, allActions])) as PermissionSet,
  admin: {
    patients: [...readWriteExport, "delete"],
    appointments: [...readWriteExport, "delete"],
    beds: readWriteExport,
    prescriptions: readWriteExport,
    "lab-orders": readWriteExport,
    "pharmacy-inventory": readWriteExport,
    billing: readWriteExport,
    insurance: readWriteExport,
    "hr-records": readWriteExport,
    reports: ["view", "export"],
    // "edit" here specifically covers hospital-wide announcements
    // (Track 4.11) and the internal HMS build-tracker records the admin
    // role already has "view" access to — not a broader settings-write
    // grant than that.
    "system-settings": ["view", "edit"],
    "user-management": ["view"],
    "liaison-notes": readWriteExport,
    cms: readWriteExport,
    "diet-plans": readWriteExport
  },
  "main-doctor": {
    patients: readWriteExport,
    appointments: readWrite,
    beds: ["view", "edit"],
    prescriptions: readWriteExport,
    "lab-orders": readWrite,
    reports: ["view", "export"],
    "liaison-notes": ["view"],
    "diet-plans": readWrite
  },
  "duty-doctor": {
    patients: ["view", "edit"],
    // Shares the Doctor Portal's "New Consultation" walk-in action with Main
    // Doctor — view/edit-only left an on-call doctor unable to start a
    // consultation for a walk-in with no reception-booked appointment.
    appointments: ["view", "create", "edit"],
    beds: ["view", "edit"],
    prescriptions: readWrite,
    "lab-orders": ["view", "create"],
    reports: ["view"],
    "diet-plans": readWrite
  },
  nurse: {
    patients: ["view"],
    appointments: ["view"],
    beds: ["view", "edit"],
    prescriptions: ["view"],
    "lab-orders": ["view"]
  },
  reception: {
    patients: readWrite,
    appointments: readWriteExport,
    // Reception's own role description ("bed assignment requests") and the
    // Admit Patient action already present in the IPD module both assume
    // reception can actually admit — view-only left them unable to use a
    // button that was already visible to them.
    beds: readWrite,
    // "Basic billing": registration/consultation fees at the front desk.
    // Voids/refunds and financial reporting stay with Billing / Accounts.
    billing: ["view", "create", "edit"],
    insurance: ["view"]
  },
  pharmacist: {
    "pharmacy-inventory": readWriteExport,
    prescriptions: ["view", "edit"],
    reports: ["view"]
  },
  "lab-technician": {
    "lab-orders": readWriteExport,
    patients: ["view"]
  },
  "billing-accounts": {
    billing: readWriteExport,
    insurance: readWriteExport,
    reports: ["view", "export"],
    patients: ["view"]
  },
  hr: {
    "hr-records": [...readWriteExport, "delete"],
    reports: ["view"]
  },
  pro: {
    patients: ["view"],
    appointments: ["view"],
    insurance: ["view"],
    "liaison-notes": readWriteExport
  },
  dietitian: {
    // View-only on the patient record itself (name/history/allergies) —
    // writes are scoped narrowly to diet-plans, not general patient editing.
    patients: ["view"],
    // View-only on beds/admissions too — needed to see who's currently
    // admitted (the Diet Plans module's "Currently admitted" panel reads
    // GET /api/ipd, which is gated on beds:view), not to manage bed status.
    beds: ["view"],
    "diet-plans": readWrite
  },
  patient: {}
};

export function roleHasPermission(role: AccessRole, resource: AccessResource, action: AccessAction) {
  if (role === "super-admin") return true;
  return rolePermissions[role]?.[resource]?.includes(action) ?? false;
}

export function anyRoleHasPermission(roles: AccessRole[], resource: AccessResource, action: AccessAction) {
  return roles.some((role) => roleHasPermission(role, resource, action));
}

export function isAccessRole(value: string): value is AccessRole {
  return value in roleMeta;
}

/** Roles that must complete TOTP MFA setup before using the system. */
export const mfaMandatoryRoles: AccessRole[] = ["super-admin", "admin"];

/** Roles allowed to invoke break-glass emergency patient access. */
export const breakGlassRoles: AccessRole[] = ["main-doctor", "duty-doctor"];

/**
 * Resources a break-glass grant unlocks for READ during an emergency —
 * clinical and financial context a doctor may need when the normally
 * responsible staff member is unavailable. Never grants write access.
 */
export const breakGlassResources: AccessResource[] = [
  "patients",
  "appointments",
  "beds",
  "prescriptions",
  "lab-orders",
  "billing",
  "insurance"
];
