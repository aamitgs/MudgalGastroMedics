import { readFileSync } from "node:fs";
import { generate } from "otplib";

const BASE = "http://127.0.0.1:3100";
const seed = JSON.parse(readFileSync("/tmp/seed-result.json", "utf8"));
const creds = Object.fromEntries(seed.credentials.map((c) => [c.username, c.temporaryPassword]));
const newPasswords = {};

let pass = 0, fail = 0;
function check(label, condition, detail = "") {
  if (condition) { pass++; console.log(`  PASS ${label}`); }
  else { fail++; console.log(`  FAIL ${label} ${detail}`); }
}

function jar() {
  let cookies = {};
  return {
    header() { return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "); },
    absorb(res) {
      const setCookies = res.headers.getSetCookie?.() ?? [];
      for (const raw of setCookies) {
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
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function onboard(username, opts = {}) {
  const j = jar();
  const login1 = await api(j, "POST", "/api/auth/login", { username, password: creds[username], role: opts.role });
  check(`${username}: first login -> password-change-required`, login1.data.status === "password-change-required", JSON.stringify(login1.data));
  const fresh = `Mgm!${Math.random().toString(36).slice(2, 8)}Aa9#zQ`;
  newPasswords[username] = fresh;
  const change = await api(j, "POST", "/api/auth/password", { currentPassword: creds[username], newPassword: fresh });
  check(`${username}: forced password change ok`, change.data.ok === true, JSON.stringify(change.data));
  if (change.data.status === "mfa-setup-required") {
    const setup = await api(j, "GET", "/api/auth/mfa/setup");
    check(`${username}: got TOTP secret`, Boolean(setup.data.secret));
    const code = await generate({ secret: setup.data.secret });
    const confirm = await api(j, "POST", "/api/auth/mfa/setup", { code });
    check(`${username}: MFA setup confirmed -> active`, confirm.data.status === "active", JSON.stringify(confirm.data));
  }
  return j;
}

console.log("\n-- 1. weak password rejected --");
{
  const j = jar();
  await api(j, "POST", "/api/auth/login", { username: "avinash", password: creds["avinash"] });
  const weak = await api(j, "POST", "/api/auth/password", { currentPassword: creds["avinash"], newPassword: "password123" });
  check("weak password rejected", weak.status === 400, JSON.stringify(weak.data));
}

console.log("\n-- 2. role-not-held rejected at login --");
{
  const j = jar();
  const res = await api(j, "POST", "/api/auth/login", { username: "avinash", password: creds["avinash"], role: "admin" });
  check("avinash as admin -> 403", res.status === 403, JSON.stringify(res.data));
}

console.log("\n-- 3. reception onboarding + least privilege --");
const avinash = await onboard("avinash");
{
  const patients = await api(avinash, "GET", "/api/patients");
  check("reception can view patients", patients.status === 200);
  const hr = await api(avinash, "GET", "/api/hr");
  check("reception denied HR (403)", hr.status === 403, String(hr.status));
  const audit = await api(avinash, "GET", "/api/audit");
  check("reception denied audit logs (403)", audit.status === 403, String(audit.status));
  const rx = await api(avinash, "PATCH", "/api/opd", { id: "X", prescription: "should fail" });
  check("reception denied prescription edit (403)", rx.status === 403, String(rx.status));
  const billing = await api(avinash, "PATCH", "/api/opd", { id: "NOPE", billingStatus: "Paid" });
  check("reception allowed billing edit path (404 not 403)", billing.status === 404, String(billing.status));
}

console.log("\n-- 4. super admin onboarding with mandatory MFA + audit access --");
const hs = await onboard("hs.sharma");
{
  const audit = await api(hs, "GET", "/api/audit");
  check("super admin can view audit logs", audit.status === 200);
  const me = await api(hs, "GET", "/api/auth/me");
  check("hs.sharma activeRole super-admin", me.data.activeRole === "super-admin");
}

console.log("\n-- 5. two-person rule --");
const deepak = await onboard("deepak.sharma");
{
  const me = await api(deepak, "GET", "/api/auth/me");
  check("deepak default role main-doctor", me.data.activeRole === "main-doctor", JSON.stringify(me.data.activeRole));

  const users = await api(hs, "GET", "/api/access/users");
  const target = users.data.users.find((u) => u.username === "avinash");
  const req = await api(hs, "PATCH", "/api/access/users", { id: target.id, operation: "request-role-change", roles: ["reception", "billing-accounts"], defaultRole: "reception" });
  check("role change queued", req.data.ok && req.data.approval.status === "pending", JSON.stringify(req.data));

  const selfApprove = await api(hs, "POST", "/api/access/approvals", { id: req.data.approval.id, decision: "approved" });
  check("requester cannot self-approve (403)", selfApprove.status === 403, String(selfApprove.status));

  // Deepak must elevate to super-admin to approve (default is main-doctor)
  const elevateBad = await api(deepak, "POST", "/api/auth/role", { role: "super-admin", password: "wrong-password" });
  check("elevation with wrong password denied", elevateBad.status === 401, String(elevateBad.status));
  const elevate = await api(deepak, "POST", "/api/auth/role", { role: "super-admin", password: newPasswords["deepak.sharma"] });
  check("deepak elevated to super-admin", elevate.data.ok && elevate.data.activeRole === "super-admin", JSON.stringify(elevate.data));

  const approve = await api(deepak, "POST", "/api/access/approvals", { id: req.data.approval.id, decision: "approved" });
  check("second super admin approved", approve.data.ok === true, JSON.stringify(approve.data));

  const usersAfter = await api(hs, "GET", "/api/access/users");
  const after = usersAfter.data.users.find((u) => u.username === "avinash");
  check("avinash now holds billing-accounts", after.roles.includes("billing-accounts"), JSON.stringify(after.roles));

  const avinashDead = await api(avinash, "GET", "/api/patients");
  check("avinash sessions revoked after role change (401)", avinashDead.status === 401, String(avinashDead.status));

  const drop = await api(deepak, "DELETE", "/api/auth/role");
  check("deepak dropped elevation back to main-doctor", drop.data.activeRole === "main-doctor", JSON.stringify(drop.data));
}

console.log("\n-- 6. break-glass --");
const dusyant = await onboard("dusyant");
{
  const denied = await api(dusyant, "GET", "/api/finance");
  check("duty doctor denied billing (403)", denied.status === 403, String(denied.status));
  const badReason = await api(dusyant, "POST", "/api/auth/break-glass", { reason: "help" });
  check("break-glass needs a real reason (400)", badReason.status === 400, String(badReason.status));
  const grant = await api(dusyant, "POST", "/api/auth/break-glass", { reason: "Emergency: unconscious patient, need billing/insurance context, accounts staff unreachable" });
  check("break-glass granted", grant.data.ok === true, JSON.stringify(grant.data));
  const allowed = await api(dusyant, "GET", "/api/finance");
  check("duty doctor reads billing under break-glass", allowed.status === 200, String(allowed.status));
  const write = await api(dusyant, "PATCH", "/api/finance", { id: "X" });
  check("break-glass does NOT grant writes (403)", write.status === 403, String(write.status));
}

console.log("\n-- 7. lockout with exponential backoff --");
{
  const j = jar();
  for (let i = 0; i < 4; i++) {
    await api(j, "POST", "/api/auth/login", { username: "cp", password: "wrong-password-x" });
  }
  const locked = await api(j, "POST", "/api/auth/login", { username: "cp", password: creds["cp"] });
  check("cp locked out even with correct password (429)", locked.status === 429, String(locked.status));
}

console.log("\n-- 8. session management --");
{
  const sessions = await api(hs, "GET", "/api/auth/sessions");
  check("hs sees own sessions", sessions.data.ok && sessions.data.sessions.length >= 1);
  const revoke = await api(hs, "DELETE", "/api/auth/sessions", { all: true });
  check("revoke-all others ok", revoke.data.ok === true);
  const still = await api(hs, "GET", "/api/auth/me");
  check("current session still alive", still.status === 200);
}

console.log("\n-- 9. audit trail contains security events --");
{
  const audit = await api(hs, "GET", "/api/audit");
  const actions = new Set(audit.data.events?.map((e) => e.action) ?? []);
  for (const expected of ["auth.denied", "access.login", "access.elevated", "access.break_glass.granted", "access.break_glass.used", "access.role_change.approved", "access.user.seeded", "access.mfa.enabled", "access.login.failed"]) {
    check(`audit has ${expected}`, actions.has(expected));
  }
}

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
process.exit(fail ? 1 : 0);
