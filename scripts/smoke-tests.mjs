import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(join(root, relativePath));
}

test("HMS roadmap contains all 30 implementation modules in order", () => {
  const source = read("lib/hms-modules.ts");
  const orders = Array.from(source.matchAll(/order:\s*(\d+)/g)).map((match) => Number(match[1]));
  assert.equal(orders.length, 30);
  assert.deepEqual(orders, Array.from({ length: 30 }, (_, index) => index + 1));
});

test("core protected APIs are present", () => {
  const routes = [
    "app/api/admin/session/route.ts",
    "app/api/audit/route.ts",
    "app/api/ai/reviews/route.ts",
    "app/api/analytics/route.ts",
    "app/api/appointment/route.ts",
    "app/api/automation/route.ts",
    "app/api/cms/route.ts",
    "app/api/communication/route.ts",
    "app/api/database/health/route.ts",
    "app/api/doctor/session/route.ts",
    "app/api/finance/route.ts",
    "app/api/hospital-os/realtime/route.ts",
    "app/api/hospital-os/snapshot/route.ts",
    "app/api/hms/route.ts",
    "app/api/hr/route.ts",
    "app/api/inventory/route.ts",
    "app/api/ipd/route.ts",
    "app/api/lab/route.ts",
    "app/api/opd/route.ts",
    "app/api/patients/route.ts",
    "app/api/pharmacy/route.ts",
    "app/api/production/readiness/route.ts",
    "app/api/procedures/schedule/route.ts",
    "app/api/reports/route.ts"
  ];

  for (const route of routes) {
    assert.equal(exists(route), true, `${route} should exist`);
  }
});

test("Hospital OS uses a server snapshot boundary for TanStack Query", () => {
  assert.equal(exists("app/mudgalgastromedics-os/actions.ts"), true);
  assert.equal(exists("app/api/hospital-os/snapshot/route.ts"), true);
  assert.equal(exists("app/api/hospital-os/realtime/route.ts"), true);
  assert.match(read("app/api/hospital-os/snapshot/route.ts"), /hospital_os\.snapshot\.viewed/);
  assert.match(read("app/api/hospital-os/realtime/route.ts"), /hospital_os\.realtime\.polled/);
  assert.match(read("components/chrome/HospitalOperatingSystem.tsx"), /fetch\(\"\/api\/hospital-os\/snapshot\"/);
  assert.match(read("components/chrome/HospitalOperatingSystem.tsx"), /pollingUrl: \"\/api\/hospital-os\/realtime\"/);
  assert.match(read("components/chrome/HospitalOperatingSystem.tsx"), /useQuery/);
  assert.match(read("components/chrome/HospitalOperatingSystem.tsx"), /bulkUpdatePatientFlow/);
  // Track 4.10: extracted to their own files, no longer inline in the monolith.
  assert.match(read("components/hospital-os/AuditTrailPanel.tsx"), /Session audit trail/);
  assert.match(read("components/hospital-os/PatientPortalPanel.tsx"), /AI symptom checker/);
  assert.match(read("components/hospital-os/PatientRegistrationForm.tsx"), /registerHospitalPatient/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.patient\.registered/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.appointment\.booked/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.billing\.posted/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.patient_flow\.bulk_updated/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.patient_flow\.doctor_assigned/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.clinical_notes\.autosaved/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.ai_prescription\.confirmed/);
  assert.match(read("app/mudgalgastromedics-os/actions.ts"), /hospital_os\.teleconsultation\.requested/);
});

test("mobile API exposes versioned token-gated endpoints", () => {
  const routes = [
    "app/api/mobile/v1/openapi/route.ts",
    "app/api/mobile/v1/patient/route.ts",
    "app/api/mobile/v1/procedures/route.ts",
    "app/api/mobile/v1/profile/route.ts"
  ];

  for (const route of routes) {
    assert.equal(exists(route), true, `${route} should exist`);
    assert.match(read(route), /hasMobileToken|openapi/, `${route} should declare token gating or schema`);
  }
});

test("admin dashboard mounts major HMS workspaces", () => {
  // Track 4.1: modules are dynamically imported and lazy-mounted (not static
  // JSX in app/admin/page.tsx), so this checks each component's dynamic-import
  // loader is wired up in LazyModuleSection, which mounts them on demand.
  const source = read("components/hospital-os/LazyModuleSection.tsx");
  const components = [
    "AdminReports",
    "AdminAuditLog",
    "AdminAnalytics",
    "AdminCmsWorkspace",
    "AdminEnterpriseModules",
    "AdminAutomation",
    "AdminAiReviews",
    "AdminPatients",
    "AdminAppointments",
    "AdminOpdQueue",
    "AdminProcedures",
    "AdminIpdBeds",
    "AdminDoctorWorkflow",
    "AdminLab",
    "AdminPharmacy",
    "AdminBillingSummary",
    "AdminFinance",
    "AdminHR",
    "AdminInventory",
    "AdminCommunication",
    "AdminProductionReadiness"
  ];

  for (const component of components) {
    // Track 1.7: each lives in its own per-domain feature folder now
    // (e.g. "@/components/reports/AdminReports"), not flat under components/.
    assert.match(source, new RegExp(`import\\("@/components/[\\w-]+/${component}"\\)`), `${component} should have a dynamic-import loader in the admin dashboard`);
  }
});

test("patient and doctor portals have separate access surfaces", () => {
  assert.equal(exists("app/portal/page.tsx"), true);
  assert.equal(exists("app/doctor/page.tsx"), true);
  assert.equal(exists("components/patient-portal/PatientPortalAccess.tsx"), true);
  assert.equal(exists("components/chrome/DoctorLogin.tsx"), true);
  assert.match(read("app/doctor/page.tsx"), /canOpenDoctorWorkspace/);
  assert.match(read("app/api/doctor/session/route.ts"), /DOCTOR_PASSCODE|isValidDoctorPasscode/);
});

test("production safety defaults are documented in auth and mobile helpers", () => {
  assert.match(read("lib/admin-auth.ts"), /ADMIN_PASSCODE/);
  assert.match(read("lib/admin-auth.ts"), /ADMIN_AUTH_SECRET/);
  assert.match(read("lib/admin-auth.ts"), /adminStaffCookie/);
  assert.match(read("lib/admin-auth.ts"), /isProduction\(\) \? "" : "mgm-admin"/);
  assert.match(read("lib/staff-auth.ts"), /STAFF_USERS_JSON/);
  assert.match(read("lib/staff-auth.ts"), /if \(isProduction\(\)\)/);
  assert.match(read("lib/doctor-auth.ts"), /DOCTOR_PASSCODE/);
  assert.match(read("lib/doctor-auth.ts"), /isProduction\(\) \? "" : "mgm-doctor"/);
  assert.match(read("lib/mobile-api.ts"), /MOBILE_API_TOKEN/);
  assert.match(read("lib/mobile-api.ts"), /isProduction\(\) \? "" : "mgm-mobile"/);
});

test("staff RBAC and CMS publish permissions are enforced", () => {
  assert.equal(exists("lib/rbac.ts"), true);
  assert.match(read("lib/hr-types.ts"), /cms:publish/);
  assert.match(read("lib/hr-store.ts"), /roleDefaultPermissions/);
  assert.match(read("app/api/cms/route.ts"), /requirePermission/);
  assert.match(read("app/api/cms/route.ts"), /CMS publish permission required/);
  assert.match(read("components/hr/AdminHR.tsx"), /staffPermissions/);
  assert.match(read("database/schema.sql"), /permissions text\[\]/);
});

test("production readiness surfaces are available", () => {
  assert.equal(exists("app/api/health/route.ts"), true);
  assert.equal(exists("app/api/production/readiness/route.ts"), true);
  assert.equal(exists("lib/production-readiness.ts"), true);
  assert.equal(exists("components/readiness/AdminProductionReadiness.tsx"), true);
  assert.equal(exists("scripts/verify-production-readiness.mjs"), true);
  assert.match(read("lib/production-readiness.ts"), /DATABASE_URL/);
  assert.match(read("lib/production-readiness.ts"), /BACKUP_POLICY/);
  assert.match(read("lib/production-readiness.ts"), /PRIVACY_REVIEWED_AT/);
  assert.match(read("scripts/verify-production-readiness.mjs"), /Do not deploy as a live HMS/);
});

test("audit logging surfaces are available", () => {
  assert.equal(exists("app/api/audit/route.ts"), true);
  assert.equal(exists("lib/audit-store.ts"), true);
  assert.equal(exists("lib/audit-types.ts"), true);
  assert.equal(exists("components/audit/AdminAuditLog.tsx"), true);
  assert.match(read("lib/audit-store.ts"), /shouldUseDatabaseStores/);
  assert.match(read("lib/audit-store.ts"), /insert into audit_events/);
  assert.match(read("app/api/audit/route.ts"), /await listAuditEvents/);
  assert.match(read("app/api/admin/session/route.ts"), /recordAuditEvent/);
  assert.match(read("app/api/appointment/route.ts"), /appointment\.request\.created/);
  assert.match(read("app/api/hms/route.ts"), /hms\.record\.updated/);
});

test("internal CMS surfaces are available", () => {
  assert.equal(exists("app/api/cms/route.ts"), true);
  assert.equal(exists("lib/cms-public.ts"), true);
  assert.equal(exists("lib/cms-store.ts"), true);
  assert.equal(exists("lib/cms-types.ts"), true);
  assert.equal(exists("components/cms/AdminCmsWorkspace.tsx"), true);
  assert.match(read("app/api/cms/route.ts"), /cms\.content\.saved/);
  assert.match(read("lib/cms-store.ts"), /procedures/);
  assert.match(read("lib/cms-public.ts"), /getPublicProcedures/);
  assert.match(read("app/procedures/[slug]/page.tsx"), /getPublicProcedure/);
  assert.match(read("app/api/mobile/v1\/procedures\/route.ts"), /getPublicProcedures/);
  assert.match(read("database/schema.sql"), /CREATE TABLE IF NOT EXISTS cms_content_items/);
  assert.match(read("database/schema.sql"), /CREATE TABLE IF NOT EXISTS cms_content_revisions/);
  assert.match(read("components/cms/AdminCmsWorkspace.tsx"), /Preview \+ History/);
});

test("database migration baseline is documented", () => {
  assert.equal(exists("database/schema.sql"), true);
  assert.equal(exists("database/README.md"), true);
  assert.equal(exists(".env.example"), true);
  assert.equal(exists("scripts/export-json-to-sql.mjs"), true);
  assert.equal(exists("scripts/apply-schema.mjs"), true);
  assert.equal(exists("scripts/check-database.mjs"), true);
  assert.equal(exists("lib/database.ts"), true);
  assert.equal(exists("app/api/database/health/route.ts"), true);

  const schema = read("database/schema.sql");
  for (const table of [
    "patients",
    "appointments",
    "opd_visits",
    "inventory_items",
    "pharmacy_dispenses",
    "lab_orders",
    "procedure_schedules",
    "ipd_admissions",
    "insurance_claims",
    "staff_members",
    "communication_logs",
    "ai_case_reviews",
    "automation_tasks",
    "cms_content_items",
    "cms_content_revisions",
    "audit_events"
  ]) {
    assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`), `${table} table should be in schema`);
  }
  assert.match(schema, /legacy_id text UNIQUE/);
  assert.match(schema, /idx_audit_events_legacy_id/);

  const envExample = read(".env.example");
  assert.match(envExample, /DATABASE_URL=/);
  assert.match(envExample, /DATA_SOURCE=local-json/);
  assert.match(envExample, /BACKUP_POLICY=/);
  assert.match(envExample, /SENTRY_DSN=/);
  assert.match(envExample, /ADMIN_PASSCODE=/);
  assert.match(envExample, /ADMIN_AUTH_SECRET=/);
  assert.match(envExample, /STAFF_USERS_JSON=/);
  assert.match(envExample, /DOCTOR_PASSCODE=/);
  assert.match(envExample, /MOBILE_API_TOKEN=/);

  const packageJson = read("package.json");
  assert.match(packageJson, /"prod:check": "node scripts\/verify-production-readiness\.mjs"/);
  assert.match(packageJson, /"db:export": "node scripts\/export-json-to-sql\.mjs"/);
  assert.match(packageJson, /"db:apply": "node scripts\/apply-schema\.mjs"/);
  assert.match(packageJson, /"db:check": "node scripts\/check-database\.mjs"/);
  assert.match(read("scripts/export-json-to-sql.mjs"), /audit-events\.json/);
  assert.match(read("scripts/export-json-to-sql.mjs"), /insert\("audit_events"/);
  assert.match(read("database/README.md"), /npm run db:export/);
  assert.match(read("database/README.md"), /npm run db:check/);
  assert.match(read("lib/production-readiness.ts"), /DATA_SOURCE/);
});
