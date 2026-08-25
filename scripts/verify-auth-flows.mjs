/**
 * Live verification of the auth stack against a running server.
 * Self-contained: creates a throwaway staff user + patient session, exercises
 * the critical flows, and reports pass/fail. Reusable in JSON and database
 * modes:  BASE=http://127.0.0.1:3100 node scripts/verify-auth-flows.mjs
 */
const BASE = process.env.BASE || "http://127.0.0.1:3100";

let pass = 0;
let fail = 0;
function check(label, condition, detail = "") {
  if (condition) {
    pass += 1;
    console.log(`  PASS ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${label} ${detail}`);
  }
}

function jar() {
  const cookies = {};
  return {
    header() {
      return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(res) {
      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(";");
        const idx = pair.indexOf("=");
        cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1);
      }
    }
  };
}

async function api(j, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: j.header() },
    body: body ? JSON.stringify(body) : undefined
  });
  j.absorb(res);
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const suffix = Math.random().toString(36).slice(2, 7);
const username = `verify.${suffix}`;

console.log(`\nVerifying auth flows against ${BASE}`);

console.log("-- staff: create, forced reset, least privilege --");
const admin = jar();
const adminLogin = await api(admin, "POST", "/api/admin/session", { username: "admin", password: "mgm-admin" });
check("legacy admin login", adminLogin.data.ok === true, JSON.stringify(adminLogin.data).slice(0, 120));

console.log("-- legacy admin cookie: role-scoped, not blanket super-admin --");
// Regression test for a real privilege-escalation gap: the legacy admin cookie
// used to grant blanket super-admin to whoever held it, regardless of the
// underlying staff member's actual role. A Reception-role legacy login had de
// facto super-admin on every authorize()-gated route. Fixed in
// lib/access/guard.ts (accessRoleForStaffRole) — this proves it stays fixed.
const legacyReception = jar();
const receptionLogin = await api(legacyReception, "POST", "/api/admin/session", { username: "reception", password: "mgm-reception" });
check("legacy reception login", receptionLogin.data.ok === true, JSON.stringify(receptionLogin.data).slice(0, 120));
const receptionMe = await api(legacyReception, "GET", "/api/auth/me");
check("legacy reception resolves to reception role, not super-admin", receptionMe.data.activeRole === "reception", JSON.stringify(receptionMe.data).slice(0, 120));
const receptionHr = await api(legacyReception, "GET", "/api/hr");
check("legacy reception denied HR (403)", receptionHr.status === 403, String(receptionHr.status));
const receptionAudit = await api(legacyReception, "GET", "/api/audit");
check("legacy reception denied audit logs (403)", receptionAudit.status === 403, String(receptionAudit.status));
const receptionUsers = await api(legacyReception, "GET", "/api/access/users");
check("legacy reception denied user management (403)", receptionUsers.status === 403, String(receptionUsers.status));
const receptionPatients = await api(legacyReception, "GET", "/api/patients");
check("legacy reception can still view patients (in-scope)", receptionPatients.status === 200, String(receptionPatients.status));

const created = await api(admin, "POST", "/api/access/users", {
  name: `Verify ${suffix}`,
  username,
  roles: ["reception"],
  defaultRole: "reception"
});
check("user created with temp password", created.data.ok === true && Boolean(created.data.temporaryPassword), JSON.stringify(created.data).slice(0, 140));
const tempPassword = created.data.temporaryPassword;

const staff = jar();
const login1 = await api(staff, "POST", "/api/auth/login", { username, password: tempPassword });
check("first login forces password change", login1.data.status === "password-change-required", JSON.stringify(login1.data).slice(0, 120));

// Deliberately unrelated to the username so the no-name-in-password rule passes.
const newPassword = `Kx#${Math.random().toString(36).slice(2, 8)}Qw9!mZt4`;
const changed = await api(staff, "POST", "/api/auth/password", { currentPassword: tempPassword, newPassword });
check("forced password change ok", changed.data.ok === true, JSON.stringify(changed.data).slice(0, 120));

const patients = await api(staff, "GET", "/api/patients");
check("reception can view patients", patients.status === 200, String(patients.status));
const hr = await api(staff, "GET", "/api/hr");
check("reception denied HR (403)", hr.status === 403, String(hr.status));
const audit = await api(staff, "GET", "/api/audit");
check("reception denied audit logs (403)", audit.status === 403, String(audit.status));

const me = await api(staff, "GET", "/api/auth/me");
check("me reflects active reception role", me.data.activeRole === "reception", JSON.stringify(me.data).slice(0, 120));

console.log("-- CMS route: migrated onto authorize(), matrix-only access --");
// Under the current RBAC matrix only "admin" (and the super-admin bypass)
// hold any "cms" grant — reception has none, unlike the retired legacy
// bridge which gave Reception cms:read. Confirms app/api/cms/route.ts's
// migration off lib/rbac.ts didn't loosen or tighten access unexpectedly.
const adminCms = await api(admin, "GET", "/api/cms");
check("legacy admin (super-admin) can read CMS", adminCms.status === 200, String(adminCms.status));
const receptionCms = await api(staff, "GET", "/api/cms");
check("RBAC reception denied CMS (403)", receptionCms.status === 403, String(receptionCms.status));

const wrongRole = await api(jar(), "POST", "/api/auth/login", { username, password: newPassword, role: "admin" });
check("role-not-held rejected (403)", wrongRole.status === 403, String(wrongRole.status));

console.log("-- IPD direct admission: needs patients:create, not just beds:edit --");
// A direct admission registers or updates a patient record on the way in, so
// it is gated on patients:create as well as beds:edit. Without that second
// gate, every role that can manage a ward (Nurse holds beds:edit and only
// patients:view) would gain patient-registration rights through the IPD form.
// The OPD-visit route into admission must stay open to those roles — its
// patient already exists.
const nurseSuffix = Math.random().toString(36).slice(2, 7);
const nurseUsername = `verify.nurse.${nurseSuffix}`;
const nurseCreated = await api(admin, "POST", "/api/access/users", {
  name: `Verify Nurse ${nurseSuffix}`,
  username: nurseUsername,
  roles: ["nurse"],
  defaultRole: "nurse"
});
check("nurse user created", nurseCreated.data.ok === true, JSON.stringify(nurseCreated.data).slice(0, 140));

const nurse = jar();
await api(nurse, "POST", "/api/auth/login", { username: nurseUsername, password: nurseCreated.data.temporaryPassword });
const nursePassword = `Nz#${Math.random().toString(36).slice(2, 8)}Qw9!mZt4`;
await api(nurse, "POST", "/api/auth/password", { currentPassword: nurseCreated.data.temporaryPassword, newPassword: nursePassword });
const nurseMe = await api(nurse, "GET", "/api/auth/me");
check("nurse resolves to nurse role", nurseMe.data.activeRole === "nurse", JSON.stringify(nurseMe.data).slice(0, 120));

const probeBed = await api(admin, "POST", "/api/ipd", {
  type: "bed",
  ward: "General",
  label: `Auth probe ${nurseSuffix}`,
  dailyRate: 1000
});
const probeBedId = probeBed.data.bed?.id;

const nurseDirect = await api(nurse, "POST", "/api/ipd", {
  patientName: `Verify Direct ${nurseSuffix}`,
  phone: `98123${nurseSuffix.replace(/\D/g, "4").padEnd(5, "6")}`,
  bedId: probeBedId,
  diagnosis: "probe",
  consentRecorded: "true"
});
check("nurse denied direct admission (403)", nurseDirect.status === 403, String(nurseDirect.status));

const nurseBoard = await api(nurse, "GET", "/api/ipd");
const admittedVisitIds = new Set(
  (nurseBoard.data.admissions ?? []).filter((entry) => entry.status === "Admitted").map((entry) => entry.visitId)
);
const openVisit = (nurseBoard.data.visits ?? []).find((visit) => visit.status !== "Cancelled" && !admittedVisitIds.has(visit.id));
const nurseViaVisit = await api(nurse, "POST", "/api/ipd", {
  visitId: openVisit?.id,
  bedId: probeBedId,
  diagnosis: "probe via visit",
  consentRecorded: "true"
});
check("nurse can still admit from an OPD visit", nurseViaVisit.status === 200, String(nurseViaVisit.status));

console.log("-- staff: sessions + suspension revokes access --");
const sessions = await api(staff, "GET", "/api/auth/sessions");
check("session list works", sessions.data.ok === true && sessions.data.sessions.length >= 1);

const userId = created.data.user.id;
const suspended = await api(admin, "PATCH", "/api/access/users", { id: userId, operation: "suspend" });
check("suspend ok", suspended.data.ok === true, JSON.stringify(suspended.data).slice(0, 120));
const afterSuspend = await api(staff, "GET", "/api/patients");
check("suspended session blocked (401)", afterSuspend.status === 401, String(afterSuspend.status));

console.log("-- audit trail --");
const auditEvents = await api(admin, "GET", "/api/audit");
const actions = new Set((auditEvents.data.events ?? []).map((event) => event.action));
for (const expected of ["access.user.created", "access.login", "access.password.changed", "auth.denied", "access.user.suspended"]) {
  check(`audit has ${expected}`, actions.has(expected));
}

console.log("-- patient portal: OTP + scoping --");
const phone = `98${Math.floor(10000000 + Math.random() * 89999999)}`;
const patient = jar();
const noSession = await api(patient, "POST", "/api/patient/appointments", {});
check("patient records need session (401)", noSession.status === 401, String(noSession.status));
const otpReq = await api(patient, "POST", "/api/patient/auth/otp/request", { phone });
check("otp requested (dev code available)", otpReq.data.ok === true && Boolean(otpReq.data.devCode), JSON.stringify(otpReq.data).slice(0, 120));
const otpVerify = await api(patient, "POST", "/api/patient/auth/otp/verify", { phone, code: otpReq.data.devCode });
check("otp verified -> session", otpVerify.data.ok === true, JSON.stringify(otpVerify.data).slice(0, 120));
const records = await api(patient, "POST", "/api/patient/appointments", {});
check("patient records load with session", records.status === 200, String(records.status));
await api(patient, "POST", "/api/patient/auth/logout");
const afterLogout = await api(patient, "POST", "/api/patient/appointments", {});
check("patient session revoked on logout (401)", afterLogout.status === 401, String(afterLogout.status));

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
