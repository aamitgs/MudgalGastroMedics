# Architecture Audit — MudgalGastromedics OS

**Date:** 2026-07-15 · **Scope:** full repository, read-only inspection (no source files
were changed to produce this report) · **Method:** four parallel deep-dive passes
(App Router, component layer, domain/service/state layer, dependencies+config+dead-code)
plus direct verification of the provider/context hierarchy, cross-checked against
`docs/build-roadmap.md` and `CLAUDE.md` so this doesn't re-litigate what's already
tracked or already frozen (auth, RBAC, audit logging, the Postgres document-store
migration, strict typing — all confirmed still holding, see §Verified Clean below).

This is an audit only. No fixes were applied. Prioritized remediation lives in
[`REFACTORING_PLAN.md`](./REFACTORING_PLAN.md); the structural map lives in
[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

---

## Executive Summary

**Overall verdict:** the spine is genuinely solid, with one important correction to
this document's own original claim. Zero Critical issues were reported in the four
initial passes — **that was wrong**. Implementing item 2.4 of the refactoring plan (a
change the original audit scoped as routine legacy-bridge cleanup) surfaced a real,
live privilege-escalation vulnerability in `lib/access/guard.ts`'s legacy admin-cookie
handling: it granted blanket `super-admin` to *any* holder of that cookie regardless
of their actual staff role, meaning a seeded Reception-level account had de facto
super-admin on 63 of 64 `authorize()`-gated routes. See F-15 for the full trace,
including the methodology gap that let it through the initial passes (two files that
interpret the same legacy cookie were read by different focus areas without
cross-referencing each other). **It has since been fixed and verified live** — see
F-15 and `REFACTORING_PLAN.md` item 2.4. One other finding (F-1, a stale
`roleMeta.patient.landing` value) initially looked like a post-login redirect bug but
was traced at fix time to unreachable dead code (real patients never authenticate
through that role/matrix at all; see F-1's correction note) — so, as of this
document's current state, zero *open* Critical issues and zero live functional bugs
remain, but the original "zero Critical issues found" claim was not accurate at
publication time. Every other High/Medium finding is maintainability and consistency
debt, not a correctness risk. The codebase is disciplined about the things that matter
most on the project's own decision hierarchy (patient safety, security, type safety)
and undisciplined about the things that matter least (some duplication, some
file-size sprawl, some doc/reality drift) — this incident is itself evidence that
"disciplined about security" needs an asterisk: the *design intent* was disciplined,
but a cross-file inconsistency slipped through undetected until this session's
implementation work exercised it directly.

| Metric | Count | Source |
|---|---|---|
| Total `.ts`/`.tsx` files audited (`app/`, `components/`, `lib/`, `hooks/`, `stores/`) | 446 | direct count |
| `app/` files | 156 (57 `page.tsx`, 86 API routes, rest layouts/special files) | App Router pass |
| `components/` files | 130, across 32 feature folders | Components pass |
| `lib/` files | 156 (31 `*-store.ts`, 22 `*-types.ts`, 20 `*-query.ts`, plus `access/`, `clinical/`, `patient-access/`, `validation/`, `pdf/` subfolders) | lib pass |
| Dedicated hooks (`hooks/`) | 3, all consumed, none duplicated | lib pass |
| Zustand client stores (`stores/`) | 4 | lib pass |
| API routes (`app/api/**/route.ts`) | 86 | App Router pass |
| Global providers at root (`app/layout.tsx`) | **0** — no `ThemeProvider`/`AuthProvider`/`SessionProvider`/root `QueryClientProvider`; two independent `QueryClientProvider` instances created ad hoc at page-shell level instead | direct verification |
| Runtime dependencies | 32 (CLAUDE.md claims 29 — drift, see F-16) | Deps pass |
| Confirmed orphan/dead files | 2 (`components/ui/separator.tsx`, `components/chrome/AdminThemeShell.tsx`, both deleted) + 1 unused doc (`design-system/mudgal-gastromedics/MASTER.md`, moved to `docs/design-system-draft-superseded.md`) + 3 stray root files (removed) — all fixed, see Refactoring Plan Phase 1 and item 2.9 | Deps pass |
| Confirmed unused/misplaced packages | 3 (`eslint-visitor-keys`, `@21st-dev/registry`, `@types/pg`) + 1 redundant (`axe-core`) | Deps pass |
| Circular dependencies | 1, type-only, compiles away, zero runtime effect | lib pass |
| `any`/`@ts-ignore`/`@ts-expect-error` in source | **0 real violations** across `components/`, `lib/`, `hooks/`, `stores/` (all grep hits were English prose in comments/strings) | Components + lib passes |
| Architecture smells (see §Findings) | 6 High, ~22 Medium, ~25 Low | all four passes |

**Critical issues:** 1 found (F-15, a live RBAC privilege-escalation vulnerability —
missed by the original four passes, discovered during Phase 2 implementation, now
fixed and verified live; see F-15's full correction). 0 open.
**High issues:** 5, all maintainability/consistency (F-1 was downgraded to Low after
tracing showed it was unreachable dead code, not a live bug — see F-1's correction).
**Medium issues:** ~22 (mostly duplication, doc drift, CI gaps).
**Low issues:** ~25 (naming/organization polish, minor SEO/convention gaps).

**Immediate fixes worth doing first** (safe, mechanical, low-risk — see Refactoring Plan
Phase 1 for the full list with effort estimates): the stale patient-role landing value
(F-1 — fixed 2026-07-15, confirmed dead-code/unreachable, not a live bug), deleting the
two dead files (`components/ui/separator.tsx`, `components/chrome/AdminThemeShell.tsx`),
removing the `eslint-visitor-keys` and `@21st-dev/registry` unused packages (F-16),
un-tracking `.DS_Store` and the two `.tmp-*` debris files (F-17), fixing the double
Geist font load (F-19).

**Future improvements** (real but non-urgent — architecture-shaped, need design
judgment, not mechanical): converging the `AdminX.tsx` god-components onto
`components/ui`/`design-system` primitives (F-6), a shared `generateId()` helper to
kill ~40 duplicated ID-generation snippets (F-11), finishing the `lib/rbac.ts` legacy
bridge migration (F-9), and reconciling the two un-synced dark-mode stores (F-12).
(Route-group-based chrome separation, F-3, was on this list at audit time — done as of
2026-07-16, see below.)

---

## How to read this document

Each finding is tagged **F-n** with a severity, exact location(s), why it matters, and
which of this project's decision-hierarchy tiers it touches (Patient Safety → Clinical
Workflow → Operational Efficiency → Reliability → Security → Performance →
Accessibility → Maintainability → Scalability → Visual Design — from `CLAUDE.md`).
Findings are grouped by architectural layer, matching the four audit passes, with a
cross-cutting section at the end for issues that span layers.

---

## 1. App Router (`app/`, 156 files, 86 API routes)

### F-1 · Low (corrected from High at implementation time) · Maintainability — dead-code redirect target for an unreachable role
`lib/access/matrix.ts:154` set `roleMeta.patient.landing = "/patient-portal"` (a
static pitch page, not the working portal at `/portal`). The initial pass flagged this
as a High-severity live redirect bug, hedged on "if this login path is actually
exercised for the patient role." Tracing it at fix time showed it isn't: real patients
authenticate entirely through the separate OTP/magic-link system
(`lib/patient-access/*`, `app/api/patient/auth/*`), which never touches this RBAC
matrix. The `patient` entry in `roleMeta` exists only to satisfy
`Record<AccessRole, RoleMeta>` exhaustiveness — it's used as a sentinel
(`activeRole: "patient"`) for *unauthenticated* staff-RBAC context in
`lib/access/guard.ts`, and both the staff login-role dropdown
(`components/chrome/AccessLogin.tsx`) and the admin role-assignment UI
(`components/access/AdminUserManagement.tsx`) only ever offer `staffLoginRoles`, which
excludes `"patient"`. No code path can produce a session with `activeRole ===
"patient"`, so `roleMeta.patient.landing` was unreachable — corrected to `/portal` for
semantic accuracy (2026-07-15), not because any user was actually being misdirected.
**Zero live functional bugs were found in this audit** once this was traced through.

### F-2 · Fixed (2026-07-15) · Reliability — no route-level loading states anywhere
Zero `loading.tsx` files existed in the whole `app/` tree. All 27 `/mudgalgastromedics-os/*`
pages plus `/doctor` are `async` Server Components that `await cookies()` and fetch
data — real per-navigation latency with nothing shown while it resolved, since any
spinners that existed were ad hoc inside client components, not the route-level
convention.

**Fix applied:** all 28 routes now have a `loading.tsx` (see `REFACTORING_PLAN.md` item
3.1 for the shared-component design and the streaming-response verification used to
confirm this actually works, not just that the files exist).

### F-3 · Fixed (2026-07-16) · Maintainability — product split was convention-enforced, not structure-enforced
There were no route groups (`(folder)`), parallel routes (`@folder`), or intercepted
routes anywhere in `app/` — the marketing/OS/staff split was done entirely at runtime in
`components/chrome/AppChrome.tsx` via `usePathname()` prefix checks. Verified intact at
audit time (no bypass found: no OS/doctor page imported marketing chrome, no marketing
page imported OS chrome), but nothing in the file tree itself would have stopped a
future top-level folder from being miscategorized — it depended on someone remembering
to update one array in one file.

**Fixed:** all 24 top-level marketing route folders (plus the homepage) moved into a
new `app/(marketing)/` route group — invisible in the URL, so `/`, `/about`,
`/services`, etc. are completely unaffected. Three new per-segment `layout.tsx` files
(`app/(marketing)/layout.tsx`, `app/doctor/layout.tsx`,
`app/mudgalgastromedics-os/layout.tsx`) replace `AppChrome.tsx`'s three runtime
branches; `AppChrome.tsx` itself is deleted. The split is now enforced by the compiler
and the folder structure, not a client-side pathname string check someone has to
remember to keep in sync. See `REFACTORING_PLAN.md` item 4.1 for the full migration
account, including why this was judged safe to do as one deliberate pass (zero relative
imports anywhere in `app/`, so moving folders couldn't break imports) and how it was
verified.

### F-4 · Fixed (2026-07-15) · Medium · Accessibility/Reliability — single root `error.tsx` and `not-found.tsx` don't know which product they're in
Only one `error.tsx` and one `not-found.tsx` existed (both at root, both correctly
inherited by every route since there's no nesting). `not-found.tsx` was hard-coded with
patient-facing marketing content (booking CTAs, `HeroOpdTimingCard`) — a staff member
who mistyped an OS URL saw a patient brochure 404, not anything OS-appropriate.

**Fixed:** `app/mudgalgastromedics-os/[...catchAll]/page.tsx` now catches any path
under that segment that isn't one of the 26 known modules and renders OS-appropriate
content directly (200, not a true 404 — see `REFACTORING_PLAN.md` item 3.3 for why that
tradeoff was made deliberately, after two dead-end approaches were tried and traced
empirically rather than assumed: a plain nested `not-found.tsx` needs a sibling
`layout.tsx` to catch unmatched paths, which this app deliberately doesn't have; and
`notFound()` from a catch-all resolved to the right boundary but still returned `200`).
`/doctor` was deliberately left out, same reasoning as F-4's `error.tsx` half (below).

`error.tsx` used to give no way back into the OS shell (just "Try again", no nav) when
an error happened on an OS route. **Fixed:** 27 OS routes now have their own
`error.tsx` with a working "Back to dashboard" link — see item 3.2 for the full trace,
including the discovery that `error.tsx` fallbacks are client-side React error
boundaries (unlike `loading.tsx`'s server-streamed Suspense fallback), which needed a
real browser (a throwaway Playwright script) to verify conclusively rather than plain
HTTP checks. `/doctor` deliberately did not get a new file — traced the actual chrome
structure and confirmed neither problem this item describes applies there (`StaffChrome`
sits above `/doctor`'s route segment and survives errors automatically; its site-token
styling already matches the root `error.tsx`).

### F-5 · Medium · Maintainability — two apparently-unused API routes
`app/api/feedback/route.ts` (GET) and `app/api/auth/sessions/route.ts` (GET/DELETE,
fully-implemented self-service session management) have no confirmed UI caller anywhere
in `components/`. The feedback-listing UI (`AdminAnalytics.tsx`) actually reads
`/api/analytics`, not `/api/feedback`. `auth/sessions` is a real, audit-logged,
security-relevant feature with no entry point — worth wiring in or intentionally
shelving, not leaving silently unreachable.

### F-6 · Medium · Maintainability — `/procedures` has no listing page
Every other dynamic-route content type (`services`, `areas`, `blog`) has both a listing
page and a `[slug]` detail page. `app/procedures/` only has `[slug]/` — visiting
`/procedures` directly 404s. No internal link currently points at the missing page, so
nothing is broken today, just inconsistent with the established pattern.

### Also found (Low severity, full detail in the raw pass — not repeated here):
homepage (`app/page.tsx`) has no explicit `metadata`/canonical unlike every other page;
`app/areas/[slug]/` is missing `opengraph-image.tsx` unlike its dynamic-route siblings;
`app/api/weather/route.ts` returns `{ ok: false }` without an `error` field, breaking
the project's `{ ok, error }` convention; four orphaned-from-nav "pitch" pages
(`/operations`, `/platform`, `/ai-planning`, `/patient-portal`) carry stale "Open Admin
Preview" copy pointing at the retired `/admin`; `/procedures/[slug]` (public) and
`/mudgalgastromedics-os/procedures` (OS module) share a name, which is confusing but
not a collision (different route trees).

### Verified clean
File/folder naming under `app/` is 100% consistent kebab-case. The `{ ok, error }` API
shape is followed by all 86 routes except the one weather-route exception above. No
dead route folders (every folder has a real `page.tsx`/`route.ts`). No auth/RBAC
bypass of the chrome split was found anywhere.

---

## 2. Component layer (`components/`, 130 files, 32 feature folders)

### F-7 · Fixed (2026-07-15) · Maintainability — 11 independently hand-rolled status-color maps
`statusTone`-shaped `Record<Status, string>` maps were defined separately in 11 files
(`AdminPatients.tsx:57`, `AdminSettings.tsx:31`, `AdminEnterpriseModules.tsx:18`,
`AdminAiReviews.tsx`, `AdminAuditLog.tsx`, `AdminAppointments.tsx:43`,
`AdminPurchaseOrders.tsx:20`, `AdminCmsWorkspace.tsx:37`, `AdminFinance.tsx`,
`AdminCommunication.tsx:59`, `BedWardMap.tsx:52`) instead of one shared status-badge
primitive. A working example already existed (`lib/hospital-os-data.ts`'s shared
`statusTone`, consumed by `DoctorWorkspace.tsx` and `HospitalOperatingSystem.tsx`) —
proving the pattern was solvable, just not applied elsewhere. Direct violation of the
project's own "green=success, amber=warning, red=critical, blue=info, gray=inactive"
token rule being redefined 11 times instead of centralized once.

**Fix applied:** `components/design-system/StatusBadge.tsx` now centralizes all 5
tones as one canonical class set each; 10 of the 11 files migrated onto it (9 map
their own status enum to `success`/`warning`/`critical`/`info`/`inactive`, rendering
via either the `<StatusBadge>` component or the plain `getStatusToneClass()` function
depending on whether the render site is a read-only badge or an editable `<select>`).
`BedWardMap.tsx` was deliberately excluded and left on its own `--hos-*`-based map —
its tokens resolve to OS-shell *brand* colors, not generic Tailwind shades, and
converging it would be the separate, larger site-token/OS-token unification already
flagged as its own debt item, not a mechanical part of this fix. See
`REFACTORING_PLAN.md` item 2.2 for the full color-convergence rationale (including one
incidental dark-mode bug fixed as a side effect in `AdminCmsWorkspace.tsx`).

### F-8 · Fixed (2026-07-15) · Maintainability — OPD operating-hours business rule hardcoded in 6 places
The "11 AM–2 PM & 5 PM–6 PM, Mon–Sat" window (as literal minute-math and/or copy)
appeared independently in `LiveClockWeather.tsx:34-46`, `HeroOpdTimingCard.tsx:12-13`,
`CtaBand.tsx:27`, `FloatingActionHub.tsx:35`, `Header.tsx:263`, `AppointmentForm.tsx:389`.
If OPD hours ever changed, six call sites needed coordinated manual edits with no
compiler help — a real clinical-operations fact (Operational Efficiency tier), not
cosmetic.

**Fix applied:** `lib/site-data.ts` now exports `opdWindows` (the raw window data with
both display labels and minute boundaries) and `isOpdOpenNow(weekday, minutes)` (the
live open/closed predicate). All 6 sites migrated — see `REFACTORING_PLAN.md` item 2.3
for the per-file nuances (three genuinely different shapes: live boolean logic, plain
display copy, and one compact abbreviated format) and the verification performed,
including 10 new boundary-condition unit tests and direct comparison of the rendered
HTML against the original strings.

### F-9 · High · Maintainability — shadcn/design-system primitives adopted in one layer, ignored in another
`ui/card` and `ui/badge` are used exclusively by the newer `components/hospital-os/`
+ `components/design-system/` layer (12 and 5 files respectively). The ~20 single-file
`AdminX.tsx` domain components — which represent most of the app's actual page
surface (patients, appointments, finance, HR, lab, pharmacy, CMS, communication,
inventory, etc.) — use **none** of them, hand-rolling their own bordered-div cards and
feeding the 11 duplicated status maps in F-7 instead. The shared primitives exist and
work well in one part of the app; most feature folders simply never adopted them.

### F-10 · Fixed (2026-07-15) · High · Maintainability — `components/chrome/DoctorPortalWorkspace.tsx` used to be the largest, least-decomposed file (1,145 lines)
Contained 9 separate sub-components in one file (`AiPatientSummaryPanel`,
`AllergyGuard`, `InteractionGuard`, `IdentityGuard`, `FavouriteChips`,
`DiagnosisField`, `PrescriptionField`, `DoctorConsultationCard`,
`DoctorPrintableSummary`, plus the exported workspace itself), and used to fetch
its initial data (`/api/opd`, `/api/patients`) entirely client-side in a mount
`useEffect` rather than via a Server Component prop (the pattern used correctly
elsewhere, e.g. `HospitalOperatingSystem.tsx` receiving `roleTodayBand`
pre-rendered), with two near-duplicate fetch functions (`loadWorkspace` /
`loadInitialWorkspace`) instead of one shared implementation.

**Fixed in two parts, tracked separately since the client-fetch change was the
riskier one:**
- Item 3.4: `app/doctor/page.tsx` now fetches server-side and passes the data as
  props; `loadInitialWorkspace` is gone entirely rather than merged, since lifting
  the fetch removed the need for it — see item 3.4 for the RBAC-equivalence check
  performed before bypassing the HTTP round-trip, and the golden-path browser
  verification.
- Item 3.5: the 9 sub-components and 3 helper functions moved out into their own
  files under a new `components/doctor-portal/` feature folder, mirroring the
  `HospitalOperatingSystem.tsx` → `components/hospital-os/*` precedent.
  `DoctorPortalWorkspace.tsx` itself is now 394 lines (down from 1,145); the
  largest extracted file is 215 lines. See item 3.5 for the full account, including
  the live Playwright verification that exercised every extracted piece
  (`AllergyGuard`, `IdentityGuard`, `PrescriptionField` + `InteractionGuard`) after
  the split.

### Correction to a standing assumption
**`components/chrome/HospitalOperatingSystem.tsx` is 418 lines today, not the
2,188-line monolith `CLAUDE.md` describes as "awaiting decomposition."** Git history
shows it already went through the Phase 0b shell-extraction and Track 4.13
route-per-module migration referenced in `build-roadmap.md`, splitting out
`HospitalOsShell`, `PatientWorkspace`, `DoctorWorkspace`, `PatientRegistrationForm`,
`AppointmentBookingForm`, `BillingForm`, `OperationsTable`, `AcceptancePanel`,
`AuditTrailPanel`, and more into `components/hospital-os/`. **`CLAUDE.md`'s
"one sanctioned monolith" line pointed at `DoctorPortalWorkspace.tsx` (F-10) as
the actual current outlier at the time of this audit; that file is now 394 lines
after item 3.5's decomposition**, so `CLAUDE.md` needs a second correction —
tracked below.

### F-11 · Fixed (2026-07-15) · Maintainability — two marketing-folder components aren't marketing
`components/site/LiveClockWeather.tsx` ships an `"os"` variant styled entirely in
`--hos-*` tokens and was imported by `hospital-os/TopNav.tsx` and
`chrome/WorkspaceLauncher.tsx` — real OS-shell code, not marketing. Its physical
location in `components/site/` made every OS import of it look like exactly the
cross-boundary violation `AppChrome.tsx` is supposed to prevent, even though it was
harmless in practice. `components/site/PatientFeedbackWidget.tsx` similarly belonged
under `patient-portal/` — it's only ever rendered from the authenticated
`PatientPortalAccess.tsx`, never from a marketing page.

**Fix applied:** both moved (`git mv`, history preserved) — `LiveClockWeather.tsx` →
`components/design-system/`, `PatientFeedbackWidget.tsx` → `components/patient-portal/`
— and all 5 import sites updated. See `REFACTORING_PLAN.md` item 2.6.

### F-12 · Medium · Maintainability — RHF+Zod stack mismatch drives duplicated form validation
`react-hook-form` is a listed core-stack dependency but has a single real call site
(`hooks/useAdvancedForm.ts`, which correctly wraps it for 10+ components). Every form
component still hand-rolls native `<form>` + `FormData` + local `useState` validation
independent of that hook in places, and Zod is used exclusively server-side — never
paired with RHF client-side the way the stated stack implies. Directly causes the
duplicated phone-normalization logic between `AppointmentForm.tsx:75-90` and
`BlogConsultationForm.tsx:9`.

### Also found (Low severity): `stores/` (Zustand) vs `lib/*-store.ts` (Postgres/JSON
document stores) naming collision, real but not a functional bug (see also F-13 in the
lib section for the concrete duplicate-store consequence of this same collision, now
fixed); top-level `design-system/mudgal-gastromedics/MASTER.md` name-collided with
`components/design-system/` and additionally described a **third, fictional design
token vocabulary** (Figtree/Noto Sans, `--color-primary`/`--space-xs`) that matched
neither of the two real ones in use — a contributor consulting it would have built to a
design language nothing in the app actually implements. **Fixed 2026-07-15**: moved to
`docs/design-system-draft-superseded.md` with a header flagging it as a never-adopted
historical draft (`REFACTORING_PLAN.md` item 2.9). Note: a vendored Claude Code skill
(`.claude/skills/ui-ux-pro-max/SKILL.md`, `.codex/skills/...`) documents a convention
of generating `design-system/MASTER.md` when invoked — out of scope to modify (it's
tooling, not application code), but re-running that skill on this project in the
future could recreate a similarly-named file at the old path; worth knowing rather
than assuming this collision can never recur. `CommandPalette.tsx` vs
`GlobalCommandPalette.tsx` naming doesn't make their very different scopes obvious
without reading both.

### Verified clean
Zero real `any`/`@ts-ignore` violations anywhere in `components/`. Zero raw `toast()`
calls bypassing `lib/notify.ts` (27 files correctly import from it; the one `sonner`
import outside `lib/notify.ts` is `StaffChrome.tsx` mounting the `<Toaster/>` render
target itself, which is correct and expected). No rogue loading-skeleton or
modal/dialog reimplementations. No clinical decision logic, dosage math, or RBAC logic
duplicated inside components — drug interactions, allergy checks, and permission
checks are all correctly imported from `lib/clinical/` and `lib/access/`, not
reimplemented. 100% consistent PascalCase naming outside `components/ui/` (which
correctly follows the shadcn CLI's own kebab-case convention).

---

## 3. Domain/service/state layer (`lib/` 156 files, `hooks/` 3, `stores/` 4)

### F-13 · Fixed (2026-07-15) · Maintainability — two independent, un-synced dark-mode stores
`stores/hospital-os-store.ts` (`darkMode`/`setDarkMode`/`toggleDarkMode`, consumed by
`HospitalOsShell.tsx`) and `stores/admin-theme-store.ts` (`dark`/`setDark`/`toggleDark`,
consumed by `StaffChrome.tsx` and `AdminThemeShell.tsx`) were two separate Zustand
stores for the identical concept, with different property names, each hand-rolling its
own `localStorage` persistence effect instead of using the `persist()` middleware
(which only `command-history-store.ts` actually used). A user's theme choice in one
admin surface didn't carry over to the other, and there was no way for a new
contributor to know which store "owns" dark mode. Direct product of the `stores/` vs
`lib/*-store.ts` naming split noted in F-11 — this was its concrete cost, not just a
naming preference.

**Fix applied:** `stores/theme-store.ts` now holds one `persist()`-backed store (key
`mgm-staff-theme`), consumed by both `HospitalOsShell.tsx` and `StaffChrome.tsx`;
`stores/admin-theme-store.ts` and the dark-mode fields on `hospital-os-store.ts` are
gone. Confirmed first that the two consuming shells are genuinely mutually-exclusive
top-level wrappers for different route families (`/doctor` vs
`/mudgalgastromedics-os/*`), so this is a real UX fix — staff moving between the two
surfaces now keep their theme preference — not just a code-dedup exercise. See
`REFACTORING_PLAN.md` item 2.5 for verification detail.

### F-14 · Medium · Maintainability — ~40 hand-copied ID-generation snippets across 29 store files
The exact pattern `` `${PREFIX}-${Date.now().toString(36).toUpperCase()}-${Math.random()...}` ``
is duplicated in 29 different `lib/*-store.ts` files (40 occurrences total) — only the
prefix and random-slice length differ between copies. A single `generateId(prefix,
randomLen)` helper would remove ~40 near-identical lines and remove the risk of an
inconsistent collision-length showing up in a future copy.

### F-15 · Corrected to Critical, fixed 2026-07-15 · Security — the legacy admin cookie granted blanket super-admin regardless of the holder's actual role
The original pass through this file characterized `app/api/cms/route.ts` still using
`lib/rbac.ts` instead of `authorize()` as a Medium/"not a security hole" consistency
issue — "the bridge still calls the same underlying matrix." **That was wrong**, and
the error was a methodology gap: `lib/rbac.ts` and `lib/access/guard.ts` were read by
different focus areas of this audit without cross-referencing how each interprets the
*same* legacy admin cookie. They don't agree, and the disagreement is a real,
live vulnerability, found and fixed while implementing what was originally scoped as
routine cleanup (see `REFACTORING_PLAN.md` item 2.4 for the full trace).

**The gap:** `lib/rbac.ts::getAdminAuthContext` (used only by the CMS route) resolves
the legacy admin cookie to the *specific staff member's own* permissions. `lib/access/
guard.ts::getAccessContext` (used by all other 63 `authorize()`-gated routes) instead
mapped **any** legacy-cookie holder to `super-admin`, unconditionally, by explicit
design. A real, seeded, `Active` staff account (`STF-RECEPTION-001`, "Reception Desk")
logs in through this cookie via the still-live `/api/admin/session` route (wired into
`AdminLogin.tsx`, `StaffChrome.tsx`, `HospitalOsShell.tsx`, with its password
configurable via `RECEPTION_PASSWORD` or a dev-mode default). That meant a
Reception-role legacy login had de facto super-admin on HR, audit logs, user/role
management, settings, finance — every RBAC-gated resource except the one route that
happened to still use the older, more careful bridge. Migrating `cms/route.ts` onto
`authorize()` was only safe to do *after* this fix (doing it before would have
extended the escalation to the CMS route instead of closing it) — see the correction
below; this document originally also claimed `lib/hr-store.ts:roleDefaultPermissions()`
would become removable once that migration happened, which turned out to be wrong (it
independently feeds `StaffMember.permissions` for the HR module's own permission-toggle
UI, unrelated to the CMS bridge).

**Fix applied:** `lib/access/guard.ts`'s legacy-cookie branch now resolves the actual
staff member's role via a new `accessRoleForStaffRole()` mapping (Admin→super-admin,
Doctor→main-doctor, Nurse→nurse, Reception→reception, Pharmacy→pharmacist, Lab/
Technician→lab-technician) and checks `staff.status === "Active"`. Any role without a
confident RBAC equivalent (e.g. the legacy `Housekeeping` role, which was never given
a branch) returns `null` and the request **fails closed** — falls through to
unauthenticated — rather than guessing broad access. Verified: `tsc --noEmit` clean,
`npm run test` (271/271 unit + 12/12 smoke) unaffected, and — since this is exactly
what the tool exists for — `scripts/verify-auth-flows.mjs` run live against a fresh
dev server with 6 new regression checks added specifically for this fix (legacy
reception login → resolves to `reception` not `super-admin` → denied HR/audit/
user-management → still allowed patients). All 28 checks passed, including the 6 new
ones and the pre-existing legacy-admin-login check (confirming `Admin` staff still
correctly get full access — this fix narrows the hole without breaking the intended
"admin operator" path the e2e suite and this same script also rely on).

**Follow-up also completed the same session:** `cms/route.ts` has since been migrated
onto `authorize()` and `lib/rbac.ts` deleted (`REFACTORING_PLAN.md` item 2.4b) — the
legacy `cms:publish` gate was dropped as provably redundant (the current matrix grants
`cms` to exactly one role, so nothing has edit-without-publish to protect against), and
`lib/hr-store.ts:roleDefaultPermissions()` was deliberately kept (see correction
above). `StaffMember.permissions` is now a fully decorative field app-wide — flagged as
its own known-debt item, not silently left undocumented.

### Also found (Medium): a real Zod-validation convergence gap — for 5 domains
(automation, cms, communication, finance, lab), a stricter Zod schema in
`lib/validation/{domain}.ts` is imported only by the client-side form, never by the
actual API route (which uses a looser passthrough schema instead) — not a security
bug since the store's hand-rolled checks still reject malformed writes, but two
independent sources of truth per domain that nothing keeps in sync; `lib/appointment-store.ts:createAppointment`
has no conflict/double-booking detection at all (may be intentional — human-managed
queue rather than a slot engine — but worth confirming with the product owner since
"appointment scheduling rules" were expected to live somewhere in `lib/`).

### Also found (Low, fixed 2026-07-15): `lib/document-store.ts` (generic factory, 28
consumers) vs `lib/documents-store.ts` (a specific, justified hand-rolled binary-file
store) read as a typo/duplicate pair despite being legitimately different — renamed
the latter to `lib/patient-file-store.ts` (`REFACTORING_PLAN.md` item 2.8).
`lib/access/session-store.ts` and
`lib/patient-access/session-store.ts` are legitimately separate domains but duplicate
the same token-hash/cookie-builder boilerplate almost verbatim; 4 files
(`automation-types.ts:79,84`, `notification-types.ts:82`, `staff-notes-types.ts:68`,
`access/admin-modules.ts:67`) each redundantly re-check `role === "super-admin"` before
calling `roleHasPermission()`, which already does that check internally — dead
conditionals, no security impact; one harmless type-only circular import between
`lib/blog-posts.ts` and `lib/additional-blog-posts.ts` (erased at compile time, zero
runtime effect, but a 2-line fix would remove it entirely by moving the shared
`BlogPost` type to its own file).

### Verified clean
Zero real `any`/`@ts-ignore`/`@ts-expect-error` violations in `lib/`, `hooks/`,
`stores/`. No orphan modules — all 156 `lib/` files are imported somewhere. No direct
mutation in any Zustand store (all use immutable `set()` correctly). All 3 hooks are
correctly named, correctly cleaned up (`useOnlineStatus` uses
`useSyncExternalStore`, not effect+state, so there's no listener-leak risk), and each
is centralized — no scattered duplicate hook implementations found anywhere in
`components/` or `lib/`. RBAC has one real canonical entry point (`authorize()`)
applied consistently outside the one documented CMS exception above.

---

## 4. Dependencies, config, dead code, env

### F-16 · High · Maintainability — `eslint-visitor-keys` unused and miscategorized
Zero application-code references; already pulled in transitively by `eslint`,
`espree`, `@typescript-eslint/visitor-keys` at the versions those tools need. It's
also a lint-tooling package that has no reason to sit in `dependencies` (production
runtime) even if it were used. Straightforward removal candidate. Related: the
project's stated "29 runtime dependencies" (`CLAUDE.md`) is actually 32 today, and 2 of
those 32 (`@types/pg`, and arguably `eslint-visitor-keys` itself) are dev-only
packages miscategorized into `dependencies` — worth reconciling the count and the
categorization together.

### F-17 · Medium/High · Reliability/Hygiene — a throwaway RBAC-verification script is committed with real-looking staff names and unusual permissions
`.tmp-verify-rbac.mjs` (9,161 bytes, `-rw-------` — the only non-standard-permission
file in the repo) is tracked in git, hardcodes an absolute local path
(`/tmp/seed-result.json`) that wouldn't work for any other developer or CI, and appears
to be an early draft of what's now the maintained `scripts/verify-auth-flows.mjs`. It
references real-looking staff first/last names in its test-flow logic (no literal
passwords — those come from an external seed file at runtime) — worth a quick
confirmation that these are seed/fixture names before deleting, then delete.
`.tmp-btn.mjs` (0 bytes, also tracked) is unambiguous leftover debris.

### Also found (Medium, ESLint gap fixed 2026-07-15): ESLint's flat config
(`eslint.config.mjs`) only registered the `@typescript-eslint` parser/plugin via
`eslint-config-next`'s `next/typescript` block — it did **not** actually extend
`typescript-eslint`'s `recommended`/`strict` rule sets the way the legacy eslintrc-based
config used to, meaning TS-specific lint rules (`no-unused-vars`, `no-explicit-any`,
`no-floating-promises`) were **not active**, only Next's core-web-vitals/react/jsx-a11y
rules were — a real gap against the project's "TypeScript strict" framing. **Fixed:**
`typescript-eslint`'s `recommended` set is now explicitly included; this surfaced 41
real (mostly unused-import) findings, all triaged and fixed in the same change —
see `REFACTORING_PLAN.md` item 2.10. Two other items in this same paragraph remain
open: `scripts/verify-auth-flows.mjs` — documented in `CLAUDE.md` itself as required
"after anything near the auth path" — is still not wired to any `package.json` script
and does not run in CI, so it still depends entirely on a human remembering to run it
manually; CI still has no dependency-vulnerability scan step (no `npm audit`, no
Dependabot config) despite this being a healthcare app. (`@21st-dev/registry` was
removed already, in Phase 1 item 1.5.)

### F-19 · Fixed (2026-07-15) · Performance — Geist font loaded twice in the same layout
`app/layout.tsx` imported **both** `GeistSans` from the `geist` npm package (applied to
`<body>`) **and** `Geist` from `next/font/google` (applied to `<html>`, aliased
`geist`) — confirmed directly during this audit. At fix time this turned out subtler
than "redundant load, delete one": the compiled `.font-sans` Tailwind utility resolved
to `var(--font-sans)` (fed only by the `next/font/google` loader), while a
hand-written `h1–h6, nav, button` rule in `globals.css` hardcoded
`var(--font-geist-sans)` (fed only by `GeistSans`) — both variables were genuinely
load-bearing for different elements, confirmed by inspecting the compiled
`.next/static/chunks/*.css` output before changing anything. **Fix applied:** kept
`GeistSans` only (self-hosted, no external Google Fonts request, already what
`tailwind.config.ts`'s `fontFamily.sans` expected), removed the `next/font/google`
loader, and repointed `globals.css`'s `@theme inline` block so `--font-sans` resolves
to `var(--font-geist-sans)` instead of self-referencing. Verified from a fully clean
`node_modules`/`.next` cache: `tsc --noEmit`, `npm run build`, and the compiled CSS all
confirm identical rendered typography with one font load instead of two. (The separate
`geist` usage in `lib/pdf/branding.tsx` for `@react-pdf/renderer`'s bundled `.ttf`
files is unrelated and was left untouched.)

### Also found (Low): `components/ui/separator.tsx` and
`components/chrome/AdminThemeShell.tsx` are confirmed dead (zero inbound imports
anywhere) — the latter looks like a superseded first draft of the dark-mode toggle now
implemented in `StaffChrome.tsx` (see F-13); `.DS_Store` files are tracked in git in 3
locations because `.gitignore` doesn't list them; `NEXT_PUBLIC_HOSPITAL_WS_URL` is used
in code (`HospitalOsShell.tsx:238`) but undocumented in `.env.example`; hardcoded
dev-only fallback credentials in `lib/admin-auth.ts`, `lib/doctor-auth.ts`,
`lib/mobile-api.ts`, `lib/staff-auth.ts` are all consistently gated behind
`isProduction()` (verified — not a live secret-exposure risk, just worth a
defense-in-depth comment); `playwright.config.ts` hardcodes
`reuseExistingServer: true` instead of the standard `!process.env.CI` pattern;
`axe-core` is a redundant direct devDependency (already pulled in transitively, same
version, via `@axe-core/playwright`); `shadcn` (a devDependency) is a hard build-time
requirement for production CSS via `app/globals.css:3`'s
`@import "shadcn/tailwind.css"` — works today but would break under an
`npm ci --omit=dev` pipeline.

### Verified clean
Env-var hygiene is good — every documented `.env.example` key is genuinely consumed
(an initial pass flagged several as unused, but they're read via a `hasEnv()`
bracket-notation helper, not `process.env.X` dot-notation, and are real). No
undocumented critical secrets. CI's verification steps match what `CLAUDE.md`
documents (`npm test`, `npm run test:e2e`, `npm run prod:check`). No package.json
script points at a missing file. Naming conventions across `lib/`, `hooks/`, `stores/`,
and `app/` are consistently kebab-case (PascalCase for components, `use*` for hooks) —
no violations found in the sampled scan.

---

## 5. Provider / context hierarchy (direct verification)

The master-prompt's Step 6 asks specifically about provider nesting; none of the four
parallel passes owned this cross-cutting question, so it was checked directly against
`app/layout.tsx` and the two files that instantiate React Query.

- **There is no app-wide provider tree.** `app/layout.tsx` renders `<html><body>` with
  a Sentry script tag, Vercel `<Analytics/>`, and `AppChrome` directly — no
  `ThemeProvider`, no `AuthProvider`/`SessionProvider` (auth is done via server-side
  cookie checks per-route, which is fine and matches the "backend-enforced, UI
  visibility is never the only gate" rule), no `NotificationProvider` (Sonner's
  `<Toaster/>` is mounted directly inside `StaffChrome.tsx`, which is the correct
  pattern for Sonner — it isn't a context provider).
- **Fixed (2026-07-15) — two independent `QueryClientProvider` instances used to
  exist**: `components/hospital-os/HospitalOsPageShell.tsx` and
  `components/chrome/HospitalOperatingSystem.tsx` each constructed their own
  `QueryClient` with byte-identical config, rather than sharing one instance.
  `HospitalOperatingSystem.tsx` now reuses `HospitalOsPageShell` directly (the same
  component already used correctly by all 26 per-module routes) instead of
  hand-rolling a second copy — see `REFACTORING_PLAN.md` item 2.7.
- Dark mode (see F-13, also fixed) was implemented as two separate Zustand stores with
  hand-rolled `localStorage` effects — now one `persist()`-backed store, consistent
  with there still being no formal `ThemeProvider`, which remains an accurate
  description of the provider tree (React Query and theme state are both handled by
  targeted stores/shells now, not root-level context — a defensible choice at this
  app's scale, not a gap needing its own provider).

**Severity: was Medium, now resolved.** Both instances identified in this section have
been consolidated; see F-13 and Refactoring Plan items 2.5 and 2.7 for the fixes.

---

## 6. Scalability & enterprise-architecture read (Step 16/18)

Assessed against the master prompt's scale/enterprise questions, using facts confirmed
across the four passes rather than re-scanning independently:

- **Layer separation** is real and mostly well-observed: presentation (`components/`,
  `app/`), business/service (`lib/*-store.ts` + `lib/clinical/`), data (`lib/document-store.ts`
  over Postgres jsonb with a JSON-file fallback), validation (`lib/validation/` Zod
  schemas, though see the convergence gap in §3), shared/cross-cutting (`lib/access/`,
  `lib/notify.ts`). The exceptions are the ones already documented above (RHF+Zod not
  actually paired client-side, ~20 `AdminX.tsx` files mixing fetch+table-columns+forms
  in one file each) rather than a broken layering model.
- **100–1,000 users:** current architecture comfortably supports this — Postgres
  document-store backend, backend-enforced RBAC, audited writes are all already in
  place and verified solid.
- **10,000–100,000 users:** no blocking architectural issue was found in this audit's
  scope, but this audit did not inspect database indexing/query plans (out of scope for
  a structural pass) — that would be the next thing to verify before assuming this tier
  is supported, not something this audit can confirm or deny from source alone.
- **Multiple hospitals / multi-tenancy:** the codebase shows no tenant/hospital-scoping
  concept anywhere in `lib/` (no `hospitalId`/`tenantId` field surfaced by any of the
  three deep-dive passes) — consistent with this being, by design, a single-hospital
  system (the product is literally branded "Mudgal Gastromedics Hospital"). This is not
  a defect; it's just worth being explicit that multi-tenancy would be new design work,
  not a configuration flag, if it's ever a real future goal.
- **Mobile app:** already has a versioned, isolated surface (`app/api/mobile/v1/`,
  `lib/mobile-api.ts`) — this is exactly the API-versioning foundation Step 16 asks
  about, already in place for the one surface that needs it. The main `app/api/`
  routes are unversioned, which is appropriate for a first-party-only REST layer, not a
  gap.
- **Microservices:** a single Next.js monolith is the right choice at current scale;
  nothing in this audit suggests a service split is warranted yet.

---

## Cross-cutting themes

A few findings recur across more than one layer and are worth naming once, together,
rather than as isolated file-level notes:

1. **Two coexisting "eras" of the codebase.** The newer `components/hospital-os/` +
   `components/design-system/` layer (uses `ui/card`, shared `statusTone`, Server
   Component data-fetching where it matters) is measurably more disciplined than the
   older ~20 single-file `AdminX.tsx` domain components (hand-rolled cards, 11
   duplicated status maps, client-only fetch-on-mount). This is the throughline behind
   F-7, F-9, F-10's cousins, and the RHF+Zod mismatch (F-12) — not 4 unrelated
   findings, but one adoption gap as the codebase evolved.
2. **Naming collisions between a client-state layer and a domain-data layer**, twice:
   `stores/` (Zustand) vs `lib/*-store.ts` (Postgres/JSON documents) — concrete cost is
   F-13's duplicate dark-mode stores; and top-level `design-system/` (a doc, describing
   a token vocabulary nothing in the app uses) vs `components/design-system/` (the real
   code, 56 references). Neither is a functional bug; both are the kind of thing that
   costs a new contributor real time.
3. **The project's own documentation has drifted from the code it describes** in two
   verifiable places: `CLAUDE.md`'s "29 runtime dependencies" (actually 32, F-16) and
   its "`HospitalOperatingSystem.tsx` (2,188 lines) is the one sanctioned monolith"
   (actually 418 lines today — already decomposed; `DoctorPortalWorkspace.tsx` was the
   real outlier at audit time, F-10, and is itself now decomposed too — 394 lines as of
   item 3.5). Both are easy, mechanical doc corrections once the underlying work is
   acknowledged.

---

## Verified-clean summary (things this audit checked and found genuinely solid)

Restating these together because a findings-heavy document can read as more alarming
than the codebase actually is — with one honest caveat this time: **zero *open*
Critical issues (one was found and fixed — F-15, see above), zero real `any`/
`@ts-ignore` violations anywhere in `components/`/`lib/`/`hooks/`/`stores/`, one
canonical RBAC entry point (`authorize()`) applied on 63 of 64 gated routes, zero
raw-`toast()` bypasses, zero orphaned `lib/` modules, zero direct-mutation bugs in
state stores, and consistent naming conventions almost everywhere.** The claim "no
auth/RBAC/chrome-split bypass found anywhere in the app" from this document's original
version was **incomplete** — it held for the chrome/product split (still true) but not
for RBAC's legacy-cookie handling, where F-15's vulnerability existed undetected until
implementation work exercised it directly. The auth, RBAC, audit-logging, and Postgres
document-store foundations this project treats as frozen contracts remain frozen in
scope and intent; F-15 was a bug in one branch's *implementation* of that contract, now
fixed and covered by a permanent regression test in `scripts/verify-auth-flows.mjs`,
not a change to the contract itself.
