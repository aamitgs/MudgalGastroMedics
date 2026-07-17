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
  assert.equal(exists("app/api/hospital-os/snapshot/route.ts"), true);
  assert.equal(exists("app/api/hospital-os/realtime/route.ts"), true);
  assert.match(read("app/api/hospital-os/snapshot/route.ts"), /hospital_os\.snapshot\.viewed/);
  assert.match(read("app/api/hospital-os/realtime/route.ts"), /hospital_os\.realtime\.polled/);
  // Phase 0b (Track 4.13): shell extraction moved the snapshot fetch and realtime
  // polling connection out of the monolith into the shared shell/data layer.
  assert.match(read("lib/hospital-os-data.ts"), /fetch\(\"\/api\/hospital-os\/snapshot\"/);
  assert.match(read("components/hospital-os/HospitalOsShell.tsx"), /pollingUrl: \"\/api\/hospital-os\/realtime\"/);
  assert.match(read("components/chrome/HospitalOperatingSystem.tsx"), /useQuery/);
});

test("dashboard has no fake-persistence preview widgets left (production cleanup)", () => {
  // These all used to sit on the /mudgalgastromedics-os dashboard, looked
  // functional (real forms, real Zod validation, real audit-log writes), but
  // never persisted to the real stores — every one duplicated a real,
  // fully-working module already reachable from the sidebar. Removed entirely
  // rather than rewired, since the real equivalents already exist.
  const removedComponents = [
    "components/hospital-os/AcceptancePanel.tsx",
    "components/hospital-os/PatientRegistrationForm.tsx",
    "components/hospital-os/AppointmentBookingForm.tsx",
    "components/hospital-os/BillingForm.tsx",
    "components/hospital-os/AuditTrailPanel.tsx",
    "components/hospital-os/DoctorWorkspace.tsx",
    "components/hospital-os/ClinicalNotesEditor.tsx",
    "components/hospital-os/AiPrescriptionAssistant.tsx",
    "components/hospital-os/PatientPortalPanel.tsx",
    "components/hospital-os/AssignDoctorDialog.tsx"
  ];
  for (const file of removedComponents) {
    assert.equal(exists(file), false, `${file} should have been removed`);
  }
  assert.equal(exists("app/mudgalgastromedics-os/actions.ts"), false);
  assert.equal(exists("lib/validation/hospital-os.ts"), false);

  const dashboard = read("components/chrome/HospitalOperatingSystem.tsx");
  assert.doesNotMatch(dashboard, /bulkUpdatePatientFlow|assignHospitalDoctor|AcceptancePanel|AuditTrailPanel/);

  const store = read("stores/hospital-os-store.ts");
  assert.doesNotMatch(store, /flowStatus|markPatientRegistered|markAppointmentBooked|markBillingPosted/);

  const patientWorkspace = read("components/hospital-os/PatientWorkspace.tsx");
  // The 8 placeholder tabs ("vitals workspace ready", "Add prescriptions record", etc.)
  // are gone — only the two real, API-backed tabs remain.
  assert.doesNotMatch(patientWorkspace, /workspace ready|Add \$\{/);
  assert.match(patientWorkspace, /PatientClinicalSnapshot/);
  assert.match(patientWorkspace, /PatientTimelinePanel/);
});

test("Hospital OS command palette searches real data, not hardcoded sample records", () => {
  // HospitalOsShell.tsx used to show a Fuse.js search over a hardcoded array
  // of fictional patients/doctors/invoices ("Aarav Sharma", "INV-5821 Rs
  // 18,450", "Star Health policy STH-9082"...) on every real OS page's
  // Cmd+K palette. Fixed to hit the same real /api/search endpoint
  // GlobalCommandPalette already uses correctly elsewhere in the app.
  const shell = read("components/hospital-os/HospitalOsShell.tsx");
  assert.doesNotMatch(shell, /commandRecords|Aarav Sharma|INV-5821|STH-9082/);
  assert.match(shell, /fetch\(`\/api\/search\?q=/);

  // patientFlowRows (a separate, legitimately-kept dev-preview fallback,
  // gated to never render in production — app/api/hospital-os/snapshot/route.ts)
  // still legitimately contains sample names; only the command-palette data is checked here.
  assert.doesNotMatch(read("lib/hospital-os-data.ts"), /commandRecords|assignableDoctors|v1AiScope/);

  // Patient results carry patientPhone and open the Patient Drawer instead of
  // navigating to a raw phone-number "href".
  assert.match(read("components/hospital-os/CommandPalette.tsx"), /patientPhone/);
  assert.match(read("components/hospital-os/CommandPalette.tsx"), /openDrawer/);
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

test("every HMS workspace has a dedicated Hospital OS route", () => {
  // Track 4.13: /admin (and its LazyModuleSection dynamic-import map) was
  // retired once every module got its own real /mudgalgastromedics-os/*
  // route — this checks each component is actually imported+rendered by its
  // corresponding page.tsx instead.
  const routeByComponent = {
    AdminReports: "reports",
    AdminAuditLog: "audit",
    AdminAnalytics: "analytics",
    AdminCmsWorkspace: "cms",
    AdminEnterpriseModules: "modules",
    AdminAutomation: "automation",
    AdminAiReviews: "ai-reviews",
    AdminPatients: "patients",
    AdminAppointments: "appointments",
    AdminOpdQueue: "opd",
    AdminProcedures: "procedures",
    AdminIpdBeds: "ipd",
    AdminDoctorWorkflow: "doctor-workflow",
    AdminLab: "lab",
    AdminPharmacy: "pharmacy",
    AdminBillingSummary: "billing",
    AdminFinance: "finance",
    AdminHR: "hr",
    AdminInventory: "inventory",
    AdminCommunication: "communication",
    AdminProductionReadiness: "readiness"
  };

  for (const [component, slug] of Object.entries(routeByComponent)) {
    const route = `app/mudgalgastromedics-os/${slug}/page.tsx`;
    assert.equal(exists(route), true, `${route} should exist`);
    const source = read(route);
    assert.match(source, new RegExp(`import\\s*\\{\\s*${component}\\s*\\}\\s*from\\s*"@/components/[\\w-]+/${component}"`), `${route} should import ${component}`);
    assert.match(source, new RegExp(`<${component}\\s*/>`), `${route} should render <${component} />`);
  }
});

test("patient and doctor portals have separate access surfaces", () => {
  assert.equal(exists("app/(marketing)/portal/page.tsx"), true);
  assert.equal(exists("app/mudgalgastromedics-os/doctor-portal/page.tsx"), true);
  assert.equal(exists("components/patient-portal/PatientPortalAccess.tsx"), true);
  assert.equal(exists("components/chrome/DoctorLogin.tsx"), true);
  assert.match(read("app/mudgalgastromedics-os/doctor-portal/page.tsx"), /canOpenDoctorWorkspace/);
  assert.match(read("app/api/doctor/session/route.ts"), /DOCTOR_PASSCODE|isValidDoctorPasscode/);
  // /doctor was retired outright (Track 4.14) — confirmed with the user that
  // nothing external ever linked there, so no redirect stub is kept.
  assert.equal(exists("app/doctor"), false);
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

test("staff RBAC and CMS permissions are enforced", () => {
  assert.equal(exists("lib/rbac.ts"), false);
  assert.match(read("app/api/cms/route.ts"), /authorize\(request, "cms"/);
  // Legacy StaffMember.permissions (incl. cms:publish) is still maintained for
  // the AdminHR toggle UI and the DB schema, even though no route reads it
  // for authorization anymore since the CMS route migrated onto authorize().
  assert.match(read("lib/hr-types.ts"), /cms:publish/);
  assert.match(read("lib/hr-store.ts"), /roleDefaultPermissions/);
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
  assert.match(read("app/(marketing)/procedures/[slug]/page.tsx"), /getPublicProcedure/);
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

test("self-service account photo upload is wired end-to-end", () => {
  assert.equal(exists("app/api/account/photo/route.ts"), true);
  const route = read("app/api/account/photo/route.ts");
  // Self-service: gated by session identity alone, never an authorize()
  // resource/action grant — a staff member can only ever read/replace their
  // OWN photo, unlike the admin-gated /api/documents upload.
  assert.match(route, /getSessionAndUser\(request\)/);
  assert.doesNotMatch(route, /authorize\(request/);
  assert.match(route, /entityType: "access-user"/);
  assert.match(route, /allowedAccountPhotoMimeTypes/);
  assert.match(route, /account\.photo\.updated/);

  assert.match(read("lib/access/user-store.ts"), /photoDocumentId/);
  assert.match(read("lib/validation/auth.ts"), /allowedAccountPhotoMimeTypes.*image\/jpeg.*image\/png.*image\/webp/s);

  assert.match(read("app/api/auth/me/route.ts"), /hasPhoto: Boolean\(user\.photoDocumentId\)/);

  // Upload/validation logic lives in one shared component, not copied into
  // both TopNav (Hospital OS shell) and StaffChrome (Doctor Portal shell).
  assert.match(read("components/design-system/ProfilePhotoButton.tsx"), /\/api\/account\/photo/);
  assert.match(read("components/hospital-os/TopNav.tsx"), /ProfilePhotoButton/);
  assert.match(read("components/chrome/StaffChrome.tsx"), /ProfilePhotoButton/);
});

test("prescription regimen templates are wired end-to-end", () => {
  assert.equal(exists("app/api/prescription-templates/route.ts"), true);
  const route = read("app/api/prescription-templates/route.ts");
  assert.match(route, /authorize\(request, "prescriptions", "view"\)/);
  assert.match(route, /authorize\(request, "prescriptions", "edit"\)/);
  assert.match(route, /prescription_template\.created/);
  assert.match(route, /prescription_template\.updated/);
  assert.match(route, /prescription_template\.deleted/);

  assert.match(read("lib/prescription-template-store.ts"), /export async function (listPrescriptionTemplates|createPrescriptionTemplate|updatePrescriptionTemplate|deletePrescriptionTemplate)/);
  assert.match(read("components/doctor-portal/PrescriptionField.tsx"), /PrescriptionTemplateMenu/);
  // Inserting a saved template must never silently discard prescription text
  // the doctor already typed (Track 4.2's "never silently lose data" principle).
  assert.match(read("components/doctor-portal/PrescriptionField.tsx"), /draft\.trim\(\) \? `\$\{draft\}/);
});

test("patient-facing report-ready and recall reminders are wired end-to-end", () => {
  assert.match(read("lib/lab-store.ts"), /export async function listPatientLabOrders/);
  assert.match(read("app/api/patient/appointments/route.ts"), /listPatientLabOrders/);
  assert.match(read("app/api/patient/appointments/route.ts"), /labOrders/);
  // Deliberately minimal patient-facing lab fields — no resultSummary/
  // criticalFlag/criticalReasons exposed (raw critical values shown with no
  // clinician mediating the context is a real patient-safety risk).
  assert.doesNotMatch(read("app/api/patient/appointments/route.ts"), /resultSummary:|criticalFlag:|criticalReasons:/);

  const dashboard = read("components/patient-portal/PatientHealthDashboard.tsx");
  assert.match(dashboard, /evaluateRecalls/);
  assert.match(dashboard, /"Result Ready"/);
  // The old bug this replaced: showing a followUpDate reminder forever, even
  // after the patient already returned for that visit — evaluateRecalls'
  // "fulfilled" status must gate it out now, not a bare followUpDate check.
  assert.doesNotMatch(dashboard, /if \(visit\.followUpDate\) items\.push/);

  assert.match(read("lib/clinical/recall.ts"), /export type RecallVisit/);
});

test("appointment waitlist auto-offer on cancellation is wired end-to-end", () => {
  assert.equal(exists("app/api/appointment-waitlist/route.ts"), true);
  const route = read("app/api/appointment-waitlist/route.ts");
  assert.match(route, /authorize\(request, "appointments", "view"\)/);
  assert.match(route, /authorize\(request, "appointments", "edit"\)/);
  assert.match(route, /appointment_waitlist\.created/);
  assert.match(route, /appointment_waitlist\.status_updated/);

  assert.match(read("lib/appointment-waitlist-match.ts"), /export function findWaitlistMatch/);
  assert.match(read("lib/appointment-waitlist-store.ts"), /export async function offerWaitlistSlot/);

  const appointmentRoute = read("app/api/appointment/route.ts");
  assert.match(appointmentRoute, /offerWaitlistSlot/);
  // The auto-offer must only fire on an actual cancellation, not every status update.
  assert.match(appointmentRoute, /appointment\.status === "Cancelled"/);

  assert.match(read("lib/notification-rules.ts"), /waitlist:\$\{entry\.id\}/);
  assert.match(read("lib/notification-store.ts"), /listAppointmentWaitlist/);
  assert.match(read("components/appointments/AdminAppointments.tsx"), /AppointmentWaitlistPanel/);
});

test("legacy doctor login resolves a real staff identity for profile photo support", () => {
  const guard = read("lib/access/guard.ts");
  // The legacy doctor passcode used to map to a hardcoded "legacy-doctor"
  // placeholder with no persisted record at all — self-service photo upload
  // (getStaffById(legacy.userId) in the photo/me routes) had nothing to
  // attach a photo to. Now resolves the real seeded STF-DOCTOR-001 record,
  // with the old placeholder kept only as a fallback if that record is ever
  // removed/deactivated, so login itself can never break.
  assert.match(guard, /getStaffById\("STF-DOCTOR-001"\)/);
  assert.match(guard, /userId: "legacy-doctor"/);

  assert.match(read("app/api/account/photo/route.ts"), /getStaffById\(legacy\.userId\)/);
  assert.match(read("app/api/auth/me/route.ts"), /getStaffById\(legacy\.userId\)/);
});

test("Global Patient Drawer is mounted on the Hospital OS shell, not just the doctor portal", () => {
  // Every admin module (Patients, Pharmacy, Lab, IPD, Appointments, Billing...)
  // calls usePatientDrawerStore().openDrawer() when a row is clicked, but the
  // <PatientDrawer /> component that actually renders the sheet was only ever
  // mounted inside StaffChrome.tsx (the Doctor Portal shell) — every row click across
  // every /mudgalgastromedics-os/* page silently did nothing. Confirmed live
  // with Playwright: role="dialog" count stayed 0 after clicking a patient row
  // before this fix, 1 after.
  const shell = read("components/hospital-os/HospitalOsShell.tsx");
  assert.match(shell, /import \{ PatientDrawer \} from "@\/components\/hospital-os\/PatientDrawer"/);
  assert.match(shell, /<PatientDrawer \/>/);
});

test("Sonner Toaster is mounted on the Hospital OS shell, not just the doctor portal", () => {
  // lib/notify.ts (used by every admin module for success/error/retry
  // feedback) is a thin wrapper over sonner's toast() — it renders nothing
  // without a mounted <Toaster />. That component only ever lived in
  // StaffChrome.tsx (the Doctor Portal shell), so every notify.*() call across every
  // /mudgalgastromedics-os/* admin module produced zero visible feedback.
  // Confirmed live with Playwright: an offline notify.retryable() call showed
  // no toast before this fix, a real "Unable to reach the server..." toast
  // with a working Retry button after.
  const shell = read("components/hospital-os/HospitalOsShell.tsx");
  assert.match(shell, /import \{ Toaster \} from "sonner"/);
  assert.match(shell, /<Toaster richColors closeButton position="top-right"/);
});

test("StaffFooter is mounted on the Hospital OS shell and defers to its ShortcutsDialog", () => {
  // StaffFooter (system status, version, Privacy/Terms/Support, shortcuts)
  // only ever rendered inside StaffChrome.tsx (the Doctor Portal shell) — the OS
  // shell had no footer at all. It's shared here via its existing
  // onOpenShortcuts prop so staff see one canonical shortcuts list (the
  // shell's own ShortcutsDialog) instead of a second, slightly different one
  // baked into the footer — StaffChrome keeps calling it with no prop, so its
  // own self-contained dialog is unchanged.
  const shell = read("components/hospital-os/HospitalOsShell.tsx");
  assert.match(shell, /import \{ StaffFooter \} from "@\/components\/chrome\/StaffFooter"/);
  assert.match(shell, /<StaffFooter onOpenShortcuts=\{\(\) => setShortcutsOpen\(true\)\} \/>/);

  const footer = read("components/chrome/StaffFooter.tsx");
  assert.match(footer, /onOpenShortcuts/);
});

test("Doctor Portal moved under /mudgalgastromedics-os/* and the old route was retired", () => {
  // Track 4.14: the doctor's workspace now lives at
  // /mudgalgastromedics-os/doctor-portal instead of a standalone /doctor
  // route, so the whole product lives inside one URL namespace. /doctor was
  // retired outright, not kept as a redirect — confirmed with the user that
  // nothing external (bookmarks, QR codes, printed material) ever linked
  // there, so there was no bookmark-continuity risk to guard against.
  assert.equal(exists("app/mudgalgastromedics-os/doctor-portal/page.tsx"), true);
  assert.equal(exists("app/mudgalgastromedics-os/doctor-portal/layout.tsx"), true);
  assert.equal(exists("app/doctor"), false);
  assert.match(read("app/mudgalgastromedics-os/doctor-portal/layout.tsx"), /StaffChrome/);

  assert.match(read("components/chrome/WorkspaceLauncher.tsx"), /destination: "\/mudgalgastromedics-os\/doctor-portal"/);
  assert.match(read("lib/access/matrix.ts"), /landing: "\/mudgalgastromedics-os\/doctor-portal"/);

  // The "Doctor" and "Hospital OS" nav tabs must use an exact pathname match,
  // not startsWith — /mudgalgastromedics-os/doctor-portal is now a sub-path
  // of the Hospital OS tile's own href, so a prefix check would light up
  // both tabs at once while on the Doctor Portal.
  assert.match(read("components/chrome/StaffChrome.tsx"), /pathname === href/);
});

test("Hospital OS TopNav has no unwired buttons", () => {
  // A "Messages" icon button sat in every Hospital OS page's header with no
  // onClick at all and no backing feature anywhere in the codebase (no
  // store, no API route, no types) — clicking it silently did nothing.
  // Removed rather than stubbed, since (unlike the disclosed "Branch
  // switcher" stub beside it) nothing was ever built for it to open.
  const topNav = read("components/hospital-os/TopNav.tsx");
  assert.doesNotMatch(topNav, /aria-label="Messages"/);
  assert.doesNotMatch(topNav, /MessageSquare/);
});

test("Hospital OS sidebar has no duplicate nav entries pointing at the same route", () => {
  // "Doctors" and "Doctor Workflow" both linked to
  // /mudgalgastromedics-os/doctor-workflow, so the sidebar highlighted both
  // as active on that page at once. Worse, "Doctors" was gated by the
  // "appointments" permission while the page itself only requires
  // "prescriptions" (lib/access/admin-modules.ts) — a role with appointments
  // but not prescriptions would see a working-looking link that the page's
  // own access check then rejected. Removed the redundant "Doctors" entry.
  const data = read("lib/hospital-os-data.ts");
  const hrefCounts = new Map();
  for (const match of data.matchAll(/href: "(\/mudgalgastromedics-os\/[\w-]+)"/g)) {
    hrefCounts.set(match[1], (hrefCounts.get(match[1]) ?? 0) + 1);
  }
  for (const [href, count] of hrefCounts) {
    assert.equal(count, 1, `${href} should appear as a nav destination exactly once, found ${count}`);
  }
  assert.doesNotMatch(data, /label: "Doctors"/);
});

test("dashboard's own anchor nav entries (Dashboard/Patients/Notifications) get scroll-spy active state", () => {
  // pathname === href can never match an href with a #hash (usePathname()
  // never includes one), so these three sidebar entries never highlighted
  // as active even while genuinely viewing that section. Fixed with a
  // scroll-spy effect that special-cases #realtime-feed, which renders
  // beside #analytics in the same grid row at xl+ widths (identical top at
  // every scroll position there, not just on load) — Dashboard keeps
  // priority until it genuinely diverges in a narrower, stacked layout.
  const shell = read("components/hospital-os/HospitalOsShell.tsx");
  assert.match(shell, /activeDashboardSection/);
  assert.match(shell, /dashboardSectionIds/);
  assert.match(shell, /hrefHash\s*\?\s*\n?\s*pathname === hrefPath && activeDashboardSection === hrefHash/);
});
