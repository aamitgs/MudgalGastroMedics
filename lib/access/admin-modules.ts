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
  resource: AccessResource;
};

export const adminModules: AdminModuleDef[] = [
  { id: "module-reports", label: "Reports", resource: "reports" },
  { id: "module-access", label: "Access", resource: "user-management" },
  { id: "module-readiness", label: "Readiness", resource: "system-settings" },
  { id: "module-audit", label: "Audit", resource: "audit-logs" },
  { id: "module-analytics", label: "Analytics", resource: "reports" },
  { id: "module-cms", label: "CMS", resource: "cms" },
  { id: "module-modules", label: "Modules", resource: "system-settings" },
  // Task board is driven by appointment/OPD follow-ups — front-desk + clinical.
  { id: "module-automation", label: "Automation", resource: "appointments" },
  // AI case reviews contain clinical content: gate like patient records.
  { id: "module-ai-reviews", label: "AI Reviews", resource: "patients" },
  { id: "module-patients", label: "Patients", resource: "patients" },
  { id: "module-appointments", label: "Appointments", resource: "appointments" },
  { id: "module-opd", label: "OPD", resource: "appointments" },
  { id: "module-procedures", label: "Procedures", resource: "appointments" },
  { id: "module-ipd", label: "IPD & Beds", resource: "beds" },
  { id: "module-doctor-workflow", label: "Doctor Workflow", resource: "prescriptions" },
  { id: "module-lab", label: "Lab", resource: "lab-orders" },
  // No in-house radiologist/pathologist — external referral tracking, so it
  // shares the same "diagnostics ordering" resource/audience as Lab (Track 4.6).
  { id: "module-external-referrals", label: "Radiology & Pathology", resource: "lab-orders" },
  { id: "module-pharmacy", label: "Pharmacy", resource: "pharmacy-inventory" },
  { id: "module-billing", label: "Billing", resource: "billing" },
  { id: "module-finance", label: "Finance", resource: "insurance" },
  { id: "module-hr", label: "HR", resource: "hr-records" },
  { id: "module-inventory", label: "Inventory", resource: "pharmacy-inventory" },
  // Patient communication (confirmations, reminders) is front-desk messaging.
  { id: "module-communication", label: "Comms", resource: "appointments" },
  { id: "module-settings", label: "Settings", resource: "system-settings" }
];

export function canViewAdminModule(role: AccessRole, moduleId: string): boolean {
  if (role === "super-admin") return true;
  const definition = adminModules.find((module) => module.id === moduleId);
  if (!definition) return false;
  return roleHasPermission(role, definition.resource, "view");
}

export function visibleAdminModules(role: AccessRole): AdminModuleDef[] {
  return adminModules.filter((module) => canViewAdminModule(role, module.id));
}
