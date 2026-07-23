import { roleHasPermission, type AccessResource, type AccessRole } from "@/lib/access/matrix";

/**
 * Single registry for the /admin operations modules (Track 2.2): the page
 * renders sections and the jump-nav renders links from this same list, both
 * filtered by the SAME permission matrix the server enforces on every API
 * call. UI filtering here only removes 403 dead-ends — it is never the gate.
 *
 * `resource` is the view permission that makes a module useful. Where a module
 * spans several resources the broadest sensible one is chosen: hiding a usable
 * module costs more than showing one whose writes the server will refuse.
 */
export type AdminModuleDef = {
  id: string;
  label: string;
  /** null means visible to every authenticated staff role (e.g. cross-department tools with no single owning resource) — matches canViewNotificationCategory's convention. */
  resource: AccessResource | null;
  /** Dedicated Hospital OS route for this module (Track 4.13) — the single source of truth every #module-x deep link (role-dashboard, global-search, notification-rules) resolves through. */
  route: string;
};

export const adminModules: AdminModuleDef[] = [
  { id: "module-reports", label: "Reports", resource: "reports", route: "/mudgalgastromedics-os/reports" },
  { id: "module-access", label: "Access", resource: "user-management", route: "/mudgalgastromedics-os/access" },
  { id: "module-readiness", label: "Readiness", resource: "system-settings", route: "/mudgalgastromedics-os/readiness" },
  { id: "module-audit", label: "Audit", resource: "audit-logs", route: "/mudgalgastromedics-os/audit" },
  { id: "module-analytics", label: "Analytics", resource: "reports", route: "/mudgalgastromedics-os/analytics" },
  { id: "module-cms", label: "CMS", resource: "cms", route: "/mudgalgastromedics-os/cms" },
  { id: "module-modules", label: "Modules", resource: "system-settings", route: "/mudgalgastromedics-os/modules" },
  // Task board is driven by appointment/OPD follow-ups — front-desk + clinical.
  { id: "module-automation", label: "Automation", resource: "appointments", route: "/mudgalgastromedics-os/automation" },
  // AI case reviews contain clinical content: gate like patient records.
  { id: "module-ai-reviews", label: "AI Reviews", resource: "patients", route: "/mudgalgastromedics-os/ai-reviews" },
  { id: "module-patients", label: "Patients", resource: "patients", route: "/mudgalgastromedics-os/patients" },
  { id: "module-diet-plans", label: "Diet Plans", resource: "diet-plans", route: "/mudgalgastromedics-os/diet-plans" },
  { id: "module-appointments", label: "Appointments", resource: "appointments", route: "/mudgalgastromedics-os/appointments" },
  { id: "module-opd", label: "OPD", resource: "appointments", route: "/mudgalgastromedics-os/opd" },
  { id: "module-procedures", label: "Procedures", resource: "appointments", route: "/mudgalgastromedics-os/procedures" },
  { id: "module-ipd", label: "IPD & Beds", resource: "beds", route: "/mudgalgastromedics-os/ipd" },
  { id: "module-doctor-workflow", label: "Doctor Workflow", resource: "prescriptions", route: "/mudgalgastromedics-os/doctor-workflow" },
  { id: "module-lab", label: "Lab", resource: "lab-orders", route: "/mudgalgastromedics-os/lab" },
  // No in-house radiologist/pathologist — external referral tracking, so it
  // shares the same "diagnostics ordering" resource/audience as Lab (Track 4.6).
  { id: "module-external-referrals", label: "Radiology & Pathology", resource: "lab-orders", route: "/mudgalgastromedics-os/radiology-pathology" },
  { id: "module-pharmacy", label: "Pharmacy", resource: "pharmacy-inventory", route: "/mudgalgastromedics-os/pharmacy" },
  { id: "module-billing", label: "Billing", resource: "billing", route: "/mudgalgastromedics-os/billing" },
  { id: "module-finance", label: "Finance", resource: "insurance", route: "/mudgalgastromedics-os/finance" },
  { id: "module-hr", label: "HR", resource: "hr-records", route: "/mudgalgastromedics-os/hr" },
  { id: "module-inventory", label: "Inventory", resource: "pharmacy-inventory", route: "/mudgalgastromedics-os/inventory" },
  // Patient communication (confirmations, reminders) is front-desk messaging.
  { id: "module-communication", label: "Comms", resource: "appointments", route: "/mudgalgastromedics-os/communication" },
  { id: "module-settings", label: "Settings", resource: "system-settings", route: "/mudgalgastromedics-os/settings" },
  // Cross-department notes/handover: no single resource covers every role
  // that needs to send or receive one (e.g. pharmacist has no "patients"
  // permission), so this is visible to every staff role by design; per-note
  // read/write is still gated department-by-department (staff-notes-types.ts).
  { id: "module-staff-notes", label: "Staff Notes", resource: null, route: "/mudgalgastromedics-os/staff-notes" },
  // Same "visible to everyone" reasoning as Staff Notes — /api/notifications
  // already filters each notification by canViewNotificationCategory server-side,
  // so a role with no visible categories just sees an empty inbox, not a 403.
  { id: "module-notifications", label: "Notifications", resource: null, route: "/mudgalgastromedics-os/notifications" },
  // Matches sectionPermission.patientFlow (lib/hospital-os-data.ts) — the
  // dashboard's live today's-queue view, kept separate from the full-CRUD
  // Patient Registry (module-patients).
  { id: "module-patient-flow", label: "Patient Flow", resource: "appointments", route: "/mudgalgastromedics-os/patient-flow" }
];

/** Resolves a legacy `#module-x` hash id (old /admin deep links) to its real Hospital OS route; null if the id is unknown. */
export function moduleRouteFromHash(hash: string): string | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  return adminModules.find((module) => module.id === id)?.route ?? null;
}

export function canViewAdminModule(role: AccessRole, moduleId: string): boolean {
  if (role === "super-admin") return true;
  const definition = adminModules.find((module) => module.id === moduleId);
  if (!definition) return false;
  if (!definition.resource) return true;
  return roleHasPermission(role, definition.resource, "view");
}

export function visibleAdminModules(role: AccessRole): AdminModuleDef[] {
  return adminModules.filter((module) => canViewAdminModule(role, module.id));
}
