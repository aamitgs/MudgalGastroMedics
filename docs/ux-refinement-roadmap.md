# MudgalGastromedics OS — UX/UI Refinement Roadmap (v1.0 → v2.0)

A grounded audit of the running product. Every observation below was verified in the
actual codebase/browser, not assumed. Format per item: **Observation → Why → Recommendation
→ Benefit → Priority → Effort.**

Governing constraints (already decided, not revisited here): design tokens and density
posture from the master build prompt; product separation (no marketing on staff surfaces);
patient portal stays website-integrated; RBAC architecture unchanged; color is never
decorative; animation ≤300ms and never decorative; no fabricated data on live surfaces.

---

## 1. Visual polish

**1.1 New staff chrome is light-mode-only.**
StaffChrome, AdminModuleNav and WorkspaceLauncher hardcode `bg-white`, while the admin
modules beneath them are dark-mode capable — toggling dark mode gives a white bar over a
dark page. → Use the `--site-*` variable classes (`bg-surface`, `border-line`) like the
modules do. **Benefit:** coherent dark mode on every staff screen. **High / Small.**

**1.2 Patient portal cards are light-only.**
PatientPortalAccess and the printable summary hardcode `bg-white`/fixed hexes. Apple-Health
warmth is fine, but the master prompt requires dark mode on every screen. → Same variable
treatment, with a warmer patient palette in dark. **Medium / Small.**

**1.3 Loading states are text, not skeletons.**
Most admin modules render “Loading…” strings; shared patterns require skeletons matching
final layout for anything >300ms (only Hospital OS tables have them). → One shared
`ModuleSkeleton` (header + tile row + list) dropped into each module’s loading branch.
**High / Small-Medium.**

**1.4 No success feedback on mutations.**
Sonner is in the stack but most admin mutations (status changes, saves) give no toast; some
give inline text only. Doctor-workspace autosave is silent (onBlur). → Toasts for
create/delete/error; a subtle “Saved · just now” indicator on autosave fields. **High /
Small.**

**1.5 Icon and heading scale drift.**
Post-density-pass, stat values (2xl) and section headers (xl) are consistent, but icon
sizes range 13–22px ad hoc. → Fix an icon scale (14 inline / 16 buttons / 20 section) in a
lint-able constant. **Low / Small.**

## 2. Navigation

**2.1 /admin mounts all 23 modules simultaneously.**
Every load fires ~23 parallel fetches and renders the full tree; the jump-nav fixes
wayfinding but not cost. → Lazy-mount below-fold modules (IntersectionObserver wrapper) as
step 1; step 2 is proper tabbed/sectioned routes. **High / Medium (step 1), Large (step 2).**

**2.2 Modules render for roles that cannot use them.**
A nurse sees Billing/HR/CMS cards that just error with 403s (server enforcement is correct;
the UI isn’t filtered). The permission matrix is already client-safe. → Fetch `/api/auth/me`
once on /admin and render only modules the active role can view; jump-nav filters
identically. **High / Medium.**

**2.3 Hospital OS sidebar is decorative.**
The active item is hardcoded to index 0 and clicking does not navigate to sections. →
Wire items to section anchors with scroll-spy active state. **High / Small-Medium.**

**2.4 No recents/favorites.**
Command palette has no recent-item memory; staff repeat searches for the same patients. →
Store last N palette selections per user (localStorage) and show a “Recent” group; pinning
later. **Medium / Small.**

## 3. Authentication experience (refine, not re-architect)

**3.1 Two-step identity-first login.**
Currently a single form. → Step 1: username → server returns display name + role labels
(only after valid username+rate-limit; avoid enumeration by requiring the workspace tile
context) → Step 2: password → TOTP. Matches enterprise IdP feel; no backend redesign — the
same endpoints, sequenced. **Medium / Medium.**

**3.2 Remember last workspace.**
→ localStorage of the last chosen tile; show “Welcome back — Continue to Doctor Workspace /
Switch workspace.” **High / Small.**

**3.3 Time-aware greeting.**
The IST clock util already exists. → “Good morning / Good afternoon / Night shift
operations” on the launcher; subtle background tint shift, `prefers-reduced-motion`
respected. **Low / Small.**

**3.4 Security posture strip.**
→ A quiet row of badges under the login card: Encrypted connection · RBAC enforced · Audit
logged · MFA — all true statements today. No compliance claims. **Low / Small.**

**3.5 Post-login transition.**
Hard redirect today. → 400–600ms overlay sequence (“Verifying role → Opening workspace”)
driven by the real auth response, not fake steps. **Medium / Small.**

**3.6 Pre-auth “command center” widgets — revised.**
The premium-auth spec asks for live appointments/beds/emergency widgets before login.
**Recommend against as specified:** operational data pre-auth violates product separation
and leaks hospital state to the public internet; demo data violates the no-fabricated-data
rule. → Show only non-sensitive system badges (environment, version, server/status,
system-health from `/api/health`). **High (as a guardrail) / Small.**

## 4. Dashboards

**4.1 KPI tiles are static numbers.** No deltas or drill-down. → Add vs-yesterday deltas
(data exists in reports) and make each tile a link to its module anchor. **Medium / Small.**

**4.2 Alert surfacing.** Low stock, HDU escalations and overdue turnover live inside their
modules. → A single alert strip at the top of /admin and the OS dashboard, fed by the same
stores, deep-linking into modules. **High / Medium.**

**4.3 Chart hygiene.** Recharts panels lack axis/legend consistency and dark-mode-aware
colors in places. → One chart theme file consumed everywhere (Stripe-style). **Medium /
Medium.**

## 5. Tables

**5.1 Only one real table exists.**
Patient flow (TanStack) has sort/filter/export/bulk; Patients, Appointments, OPD, Lab,
Pharmacy lists are card stacks with no sort/filter/pagination — fine at 20 records, painful
at 2,000 (a real hospital reaches that quickly). → Shared `DataTable` built on the patient
flow table’s patterns; adopt module by module starting with Patients and Appointments.
Server-side pagination arrives with the Postgres migration; virtualize >200 rows per NFR.
**High / Large (incremental).**

**5.2 Export consistency.** CSV exists widely; no Excel except patient flow, no column
chooser. → Fold into the shared DataTable. **Medium / Medium (absorbed by 5.1).**

## 6. Forms

**6.1 Validation is server-round-trip on admin forms.** Several use raw FormData with no
inline zod. → Shared RHF+zod wrapper for admission, staff, inventory forms; human-readable
inline errors. **Medium / Medium.**

**6.2 Autosave visibility** — see 1.4. **6.3 Keyboard flow:** field order is fine; add
Enter-to-submit consistency and focus-first-error. **Medium / Small.**

## 7. Role experience

**7.1 One dashboard for all roles.** /admin looks identical for reception and pharmacist
apart from failing modules (2.2 fixes visibility). → Per-role welcome header (name, role,
shift hours), role-ordered modules (reception sees Appointments first; pharmacist sees
Pharmacy first), and 3–4 role quick actions. One design language, no separate apps.
**High / Medium (after 2.2).**

**7.2 Workspace accents.** Carry each launcher tile’s icon/accent into its target section
header — continuity without theming forks. **Low / Small.**

## 8. Micro-interactions

Standardize on tokens: 150ms hover, 250ms expand, ≤300ms everything; add press states on
primary buttons; table row hover exists in OS, add to admin lists. Skip: particles, glass
reflections, ambient backgrounds (conflict with density/no-decorative-animation rules).
**Medium / Small-Medium.**

## 9. Command palette

Exists in Hospital OS (Ctrl+K, Fuse.js, role-filtered). Gaps: not available on /admin or
/doctor; no action commands. → Mount the palette on all staff surfaces; add actions
(“Book appointment”, “New patient”, “Open Pharmacy”, “Generate invoice PDF”) that deep-link;
recents per 2.4. **High / Medium.**

## 10. Smart search

Palette searches static command records; live records (patients created today) appear only
after snapshot refresh. → Back the palette with a lightweight `/api/search` that queries the
real stores (post-Postgres, SQL `ilike`; today, in-memory). **Medium / Medium.**

## 11. Notification center

OS has a realtime feed (polling) without read state, priority or grouping; admin surfaces
have none. → A bell + tray on StaffChrome and OS top bar: priority levels (critical =
HDU/stock), unread counts, mark-read, filter by module — sourced from the existing audit
stream plus alert rules. **Medium / Large.**

## 12. Theme

Dark palette exists and largely works; gaps: new chrome (1.1), portal (1.2), a few status
chips with fixed hexes; verify all chart colors. → Sweep + add axe contrast checks in CI
for dark mode too. **High / Small-Medium.**

## 13. Mobile / tablet

Staff surfaces are desktop-first by design; verified: jump-nav scrolls horizontally, tables
overflow correctly. Density pass reduced touch targets to 36px — acceptable for desktop
stations, borderline for tablets on wards. → At `md:` and below, restore 44px control
heights via a responsive utility (keep desktop density). Patient portal is already
touch-sized. **Medium / Small.**

## 14. Accessibility

Axe runs in e2e only for /hospital-os flows. → Extend axe checks to /admin, /login, /portal
(logged-in states); add `prefers-reduced-motion` to the few framer-motion entrances on the
portal side; keyboard-trap audit on the new launcher → login flow. **High / Small-Medium.**

## 15. Performance

- **/admin initial cost** — see 2.1 (biggest win).
- **HospitalOperatingSystem.tsx is a ~2,100-line client component**; split sections into
  dynamic imports so the dashboard shell paints first. **Medium / Medium.**
- **23 fetches on /admin** collapse naturally after 2.1/2.2; consider one aggregate
  endpoint for the module KPI headers. **Medium / Medium.**
- Recheck LCP on /hospital-os after splitting (target <2.5s per NFR). **Medium / Small.**

## Structural (strategic, sequenced last)

- **Global Patient Drawer** (master-prompt shared pattern, still missing): clicking a
  patient anywhere opens a side drawer with summary/allergies/bills/quick actions instead
  of navigating. Prereq: shared DataTable + a patient-summary endpoint. **High / Large.**
- **Consolidate /admin into the Hospital OS shell** (one staff app, matrix-driven sidebar;
  /admin redirects). **High / Large.**
- **Engineering track (parallel, already agreed):** Postgres migration — Phase 1 async
  stores (in progress), Phase 2 JSONB document backend (awaiting Neon `DATABASE_URL`);
  then production env/secrets, MSG91 smoke test.

## Suggested sequencing

| Phase | Items | Outcome |
|---|---|---|
| A — quick wins (days) | 1.1, 1.3, 1.4, 3.2, 3.4, 3.6 guardrail, 12, 14 | Coherent dark mode, felt responsiveness, safer entry |
| B — core UX (1–2 wks) | 2.1-step1, 2.2, 2.3, 3.1, 3.5, 7.1, 9, 4.1, 4.2 | Role-true workspaces, fast /admin, enterprise login feel |
| C — data & scale | 5.1, 6.1, 10, 13, 15 | Real-volume readiness alongside Postgres migration |
| D — structural | Patient Drawer, notification center, OS consolidation | The “one OS” end-state |

## Premium-auth spec — conflict log (flagged per output rules)

| Spec item | Conflict | Resolution taken |
|---|---|---|
| Primary `#DA241C` | Master prompt fixes primary `#2563EB`/brand cyan; color never decorative | Keep existing tokens; logo red stays an accent only |
| Pre-auth live hospital widgets | Product separation + data exposure; demo data banned on live surfaces | System-status badges only (3.6) |
| Glassmorphism, particles, ambient/DNA/ECG animation | Glass = overlays only; animation never decorative; density posture | Restrained equivalents: grid background, ≤300ms micro-interactions |
| Radiology / Emergency Ops / IT workspaces | No such modules exist — tiles would be fake doors | Tiles limited to real workspaces; add when modules exist |
| Face ID | Passkeys deliberately phase 2 (RBAC decision log) | Unchanged |
