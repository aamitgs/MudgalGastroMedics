# Access Control (RBAC) — Mudgal Gastromedics Hospital OS

## Model

- **Permission matrix as data** — roles, resources and actions live in
  [lib/access/matrix.ts](../lib/access/matrix.ts). Adding a role (e.g. "Senior
  Nurse") is a data change to `rolePermissions` — no new code paths. The same
  matrix drives server enforcement, the Hospital OS sidebar/sections/command
  palette, and the login role dropdown.
- **Enforcement** happens server-side in every API route via
  `authorize(request, resource, action)` ([lib/access/guard.ts](../lib/access/guard.ts)).
  UI hiding is a convenience only. Permissions are evaluated against the
  session's **active role**; holding a second role grants nothing until the
  user switches into it (`POST /api/auth/role`).
- **Sessions** are server-side and revocable ([lib/access/session-store.ts](../lib/access/session-store.ts)):
  8-hour absolute lifetime, 30-minute idle auto-logout (shared terminals),
  SHA-256-hashed tokens, "manage my sessions" via `GET/DELETE /api/auth/sessions`.
- **Storage** follows the codebase's dual-mode pattern: JSON files under
  `.data/` now, PostgreSQL DDL ready in [database/schema.sql](../database/schema.sql)
  for the `DATA_SOURCE=database` migration.

## Roles at launch

Seeded via **Admin → Access Control → Seed Launch Team** (idempotent, Super
Admin only). Insurance Coordinator was merged into Billing / Accounts
(confirmed decision). Amit Sharma's five roles are confirmed intentional.
Dr. Deepak Sharma is one account with two roles, defaulting to Main Doctor;
Super Admin is a deliberate elevated mode (password re-auth, 30-minute expiry,
distinct `access.elevated` audit trail).

## Legacy compatibility

The pre-RBAC logins keep working: the legacy admin cookie maps to
**super-admin** (it was always the full-access operator account) and the
doctor passcode cookie maps to **main-doctor**. Named RBAC accounts are the
least-privilege path; retire the legacy credentials once the launch team is
onboarded (unset `ADMIN_PASSCODE`/`ADMIN_PASSWORD`/`DOCTOR_PASSCODE`).

## Security controls

| Control | Implementation |
|---|---|
| Password hashing | Node built-in scrypt (memory-hard; bcrypt/argon2 avoided for serverless-fragile native deps) |
| Password policy | ≥12 chars, 3 of 4 classes, bundled common-password blocklist, no name/username. The offline HIBP Pwned Passwords range dataset (~40GB) can replace the bundled list at deployment; wire it into `validatePassword` in [lib/access/password.ts](../lib/access/password.ts) |
| MFA | TOTP (otplib), **mandatory for Super Admin and Admin role holders** — enforced at login (`mfa-setup-required` session state), not just recommended. SMS OTP deliberately dropped for staff (SIM-swap risk, carrier dependency) |
| Lockout | Exponential backoff after 3 failures: 2^(n-3) minutes, capped at 60 (`lockoutMinutesForFailures`) |
| Rate limiting | Sliding window behind an adapter ([lib/access/rate-limit.ts](../lib/access/rate-limit.ts)); in-memory now, self-hosted Redis later by implementing `RateLimitAdapter` — no call-site changes |
| Break-glass | `POST /api/auth/break-glass` (doctors only, reason required) grants 30 minutes of patients:view outside normal scope; grant and every use are `critical` audit events for post-hoc review |
| Two-person rule | Role changes (incl. any Super Admin grant) queue in [approvals](../lib/access/approvals-store.ts); a **different** Super Admin must approve. Suspension/offboarding is deliberately immediate (revokes all sessions), never queued |
| Audit | `auth.denied` (failed authorization), `access.login*`, `access.elevated`, `access.superadmin.bypass` (super-admin exercising beyond-admin power), all user-management actions. Audit log API is super-admin only |
| Headers | nosniff, frame denial, referrer policy, permissions policy, HSTS in production ([next.config.mjs](../next.config.mjs)) |
| Cookies | httpOnly, SameSite=Lax, Secure in production |

## Deferred by decision (serverless hosting)

Rate limiting, transactional email (password-reset delivery) and error
monitoring are built behind adapters with serverless-safe defaults. Moving to
self-hosted Redis / Postal / Sentry later is an env + adapter change, not a
rebuild. Forgot-password is currently "Super Admin resets from User
Management" (temporary password shown once, forced change at next login) until
an email path exists.

## Organizational items (not code)

- Secrets live in the hosting platform's environment settings — never in the repo.
- Quarterly access review: check dual-role accounts and `lastLoginAt` in Access Control.
- Offboarding runbook: **Suspend** in Access Control (immediate session revocation) → remove from rosters → document in HR.
- Pre-launch penetration test, DPDP-aligned retention policy and incident-response process remain owner actions; the production-readiness panel tracks them.

## Phase 2 backlog (deliberately not built)

Shift-based auto-activation, delegated access, just-in-time elevation,
passkeys/WebAuthn (SimpleWebAuthn), cryptographic prescription signatures,
field-level permissions (e.g. masked identifiers for Billing, contact-only
patient view for PRO), access-intelligence dashboards.

## Patient portal login (separate system)

Patients never touch the staff login. `lib/patient-access/*` +
`/api/patient/auth/*` implement, per the confirmed v1 scope:

- **Mobile + OTP (primary)** — 6-digit code, 5-minute expiry, 5 attempts,
  hashed at rest, per-phone and per-IP rate limits. Delivery via **MSG91**
  (the one approved paid exception, patient-facing only) once
  `SMS_PROVIDER_KEY` + `MSG91_TEMPLATE_ID` are set; until then dev builds show
  the code on screen and production refuses SMS login. Smoke-test the first
  live send when the MSG91 account exists.
- **Email + password** — enabled after the patient adds an email from inside
  the portal (OTP-first onboarding); scrypt-hashed, lockout with backoff.
- **Email magic link** — 15-minute single-use token; delivery is log-based
  until self-hosted Postal/Mailu email lands (deferred infra decision).
- **Sessions** — separate `mgm_patient_session` cookie, 30-day revocable
  server-side sessions (convenience-weighted: personal phones, not shared
  terminals).
- **Scoping fix** — `/api/patient/appointments` and `/api/patient/family`
  previously accepted any phone number from the request body (unauthenticated
  PHI read). They now derive the phone exclusively from the verified session.
- **Deliberately excluded** — social login (rejected by spec); UHID+DOB
  lookup, QR-code access and family delegated access are v2 backlog
  (confirmed decision).
