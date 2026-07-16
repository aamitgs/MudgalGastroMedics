# Project Structure — MudgalGastromedics OS

Companion to [`ARCHITECTURE_AUDIT.md`](./ARCHITECTURE_AUDIT.md) (findings) and
[`REFACTORING_PLAN.md`](./REFACTORING_PLAN.md) (what to do about them). This document
is a structural map only — it describes what exists and how it relates, without
re-stating the findings.

---

## 1. The two products, and how the split is enforced

This repo ships two products from one codebase (see `CLAUDE.md`):

1. **Hospital Website** — public marketing routes at the root (`/`, `/about`,
   `/services`, `/blog`, `/portal`, ...). SEO, booking CTAs, WhatsApp, testimonials.
2. **MudgalGastromedics OS** — the staff/clinical app at `/admin` (retired redirect),
   `/doctor`, `/mudgalgastromedics-os/*`, `/login` (retired redirect).

**Enforced at the filesystem level (Track 4.1, 2026-07-16)** via three per-segment
`layout.tsx` files — no runtime pathname branching left:

```
app/(marketing)/layout.tsx              →  Header + PublicCareSearch (hidden on /blog) + CtaBand + Footer
app/doctor/layout.tsx                   →  StaffChrome
app/mudgalgastromedics-os/layout.tsx    →  OfflineBanner (HospitalOsShell renders inside each page itself)
```

`app/(marketing)/` is a route group — invisible in the URL, so `/`, `/about`,
`/services`, etc. are unaffected. `/doctor` and `/mudgalgastromedics-os` already had
their own distinct top-level path segment, so they didn't need a group, just their own
layout. `components/chrome/AppChrome.tsx` (the old single client-component switch on
`usePathname()`) is deleted; the compiler now enforces the split by construction — a
marketing page physically cannot import `StaffChrome` or vice versa without an explicit,
visible cross-folder import. See `ARCHITECTURE_AUDIT.md` F-3 (now fixed) and
`REFACTORING_PLAN.md` item 4.1 for the full before/after. Still holds: no OS/doctor
page imports marketing chrome, and no marketing page imports OS chrome — now for a
structural reason, not just current discipline.

---

## 2. Top-level layout

```
app/                 Routes (App Router) — 217 files, 85 API routes (both counts have
                     drifted upward over the session from loading.tsx/error.tsx
                     additions and the Track 4.1 route-groups migration; re-verified
                     directly via `find` rather than left at their older stated values)
components/          UI components — 130 files, 32 feature folders
lib/                 Domain stores, services, RBAC, clinical rules, validation — 156 files
hooks/               3 shared client hooks
stores/              3 Zustand client-state stores (UI state, not domain data — see §6)
docs/                access-control.md, build-roadmap.md, ux-refinement-roadmap.md,
                     design-system-draft-superseded.md (historical, see note below),
                     + this audit's three reports
scripts/             8 ops/verification scripts (db apply/export/check, smoke tests,
                     production-readiness check, auth-flow verification, content generators)
tests/               33 files — vitest unit tests + Playwright e2e/a11y specs
public/               static assets
database/             schema/migration-adjacent files
.github/workflows/    hospital-os-ci.yml — the one CI pipeline
```

**Note on the top-level `design-system/` folder (removed 2026-07-15):** it held a
single file, a brand-reference document describing a design language never actually
adopted in the app. Its name collided with **`components/design-system/`** (13 files,
the real shared UI primitives, 56 references across the codebase). Moved to
`docs/design-system-draft-superseded.md` with a header flagging it as historical —
see `ARCHITECTURE_AUDIT.md` §Cross-cutting themes and `REFACTORING_PLAN.md` item 2.9.

---

## 3. Routing structure (`app/`)

### Public website routes (marketing chrome)
`/`, `/about`, `/areas` (+`[slug]`), `/blog` (+`[slug]`), `/contact`,
`/cookie-policy`, `/disclaimer`, `/dr-deepak-kumar-sharma-gastroenterologist-agra`,
`/duty-doctor`, `/faqs`, `/gallery`, `/life-at-mgm`,
`/patient-rights-responsibilities`, `/portal` (the real patient portal — sign-in +
`AppointmentForm` + `PatientPortalAccess`), `/procedures/[slug]` (no listing page —
see audit F-6), `/privacy`, `/refund-cancellation-policy`, `/services` (+`[slug]`),
`/terms`.

Also public, but not linked from the main nav — reachable only by direct URL:
`/operations`, `/platform`, `/ai-planning`, `/patient-portal` (a **static pitch page**,
distinct from `/portal` — see audit F-1, this distinction is a live bug source).

### OS/staff routes (OS or staff chrome)
- `/admin`, `/login` → redirect stubs to `/mudgalgastromedics-os` (intentionally
  retained for bookmark/hash compatibility).
- `/doctor` → `StaffChrome`-wrapped, cookie-gated.
- `/mudgalgastromedics-os/` + 26 module routes: `access`, `ai-reviews`, `analytics`,
  `appointments`, `audit`, `automation`, `billing`, `cms`, `communication`,
  `diet-plans`, `doctor-workflow`, `finance`, `hr`, `inventory`, `ipd`, `lab`,
  `modules`, `opd`, `patients`, `pharmacy`, `procedures`, `radiology-pathology`,
  `readiness`, `reports`, `settings`, `staff-notes`. Each independently applies the
  same `cookies() → accessContextFromCookieStore → canOpenModule` gate (the Track 4.13
  per-module routing migration referenced in `build-roadmap.md`).

### API surface (`app/api/`, 86 routes)
40 resource groups: `access`, `admin`, `ai`, `analytics`, `announcements`,
`appointment`, `audit`, `auth`, `automation`, `clinical`, `cms`, `communication`,
`database`, `doctor`, `documents`, `external-referrals`, `feedback`, `finance`,
`health`, `hms`, `hospital-os`, `hr`, `inventory`, `ipd`, `lab`, **`mobile`**
(versioned sub-API, see below), `notifications`, `opd`, `patient` (self-service) /
`patients` (staff CRUD — intentional split, not a duplicate), `pdf`, `pharmacy`,
`procedures`, `production`, `purchase-orders`, `reports`, `search`, `staff-notes`,
`weather`.

**Mobile API is separately versioned**: `app/api/mobile/v1/{openapi,patient,procedures,profile}`,
backed by `lib/mobile-api.ts`, with its own response helpers (`mobileOk`/
`mobileUnauthorized`) rather than ad hoc `{ ok }` literals. This is the one part of the
API surface built for external/versioned consumption; the rest of `app/api/` is
first-party-only and correctly unversioned.

Response shape convention: `{ ok: boolean, error?: string, ... }`, followed by 85 of 86
routes (see audit for the one exception).

---

## 4. Component layer map (`components/`, 32 folders)

| Folder | Files | What it is |
|---|---|---|
| `chrome/` | 10 | OS shell + auth screens, no product-split switch left (Track 4.1 moved that to per-segment `layout.tsx` files): `StaffChrome`, `HospitalOperatingSystem` (418 lines, already decomposed), `DoctorPortalWorkspace` (394 lines, already decomposed — see `components/doctor-portal/`), `WorkspaceLauncher`, `AccessLogin`, `AdminLogin`, `DoctorLogin`, `DoctorRecentActivity`, `HospitalOsDynamic`, `StaffFooter` |
| `hospital-os/` | 26 | The newer, decomposed OS shell + shared clinical widgets: `HospitalOsShell`, `TopNav`, `CommandPalette`, `GlobalCommandPalette`, `PatientWorkspace`, `DoctorWorkspace`, `PatientRegistrationForm`, `AppointmentBookingForm`, `BillingForm`, `OperationsTable`, `AcceptancePanel`, `AuditTrailPanel`, `RoleTodayBand`, `HospitalOsPageShell`, ... |
| `site/` | 24 | Public marketing components: `Header`, `Footer`, `CtaBand`, `Section`, `AppointmentForm`, `ContactForm`, `BlogConsultationForm`, `HeroOpdTimingCard`, `FloatingActionHub`, plus two mis-homed OS/portal components (audit F-11) |
| `design-system/` | 13 | Shared platform primitives: `EmptyState`, `ModuleEmptyState`, `ModuleSkeleton`, `DataTable`, `MetricCard`, `BedWardMap`, `FormField`, `RecentValueChips`, `OfflineBanner`, ... |
| `ui/` | 20 | shadcn/ui primitives (kebab-case by convention): `button`, `card`, `badge`, `dialog`, `command`, `dropdown-menu`, `input-group`, `select`, `separator` (dead, unused — audit), ... |
| `patients/`, `ipd/`, `opd/`, `patient-portal/`, `inventory/` | 3, 3, 4, 2, 2 | Multi-file clinical/domain folders |
| `access/`, `ai-reviews/`, `analytics/`, `appointments/`, `audit/`, `automation/`, `billing/`, `cms/`, `communication/`, `doctor-workflow/`, `enterprise/`, `external-referrals/`, `finance/`, `hr/`, `lab/`, `pharmacy/`, `procedures/`, `readiness/`, `reports/`, `settings/`, `staff-notes/` | 1 each | Single `AdminX.tsx` per domain — one file *is* the folder (see audit §Cross-cutting theme #1) |
| `command-palette/` | 0 | Empty directory — no files, likely a leftover from before command-palette code moved into `hospital-os/` |

**Reuse regime, in one line:** `hospital-os/` and `design-system/` consume `ui/`
consistently; the 20 single-file `AdminX.tsx` folders mostly don't (see audit F-9).

---

## 5. Domain/service layer map (`lib/`, 156 files)

```
lib/
├── access/            (11 files) RBAC — matrix.ts, guard.ts (authorize(), the one
│                        canonical entry point), approvals/break-glass/session/user
│                        stores, admin-modules.ts, totp.ts, rate-limit.ts
├── clinical/           (4 files) drug-interactions.ts, lab-critical.ts,
│                        medication-overlap.ts — explainable, non-blocking-by-default
│                        clinical safety rules
├── patient-access/     (4 files) OTP-based patient record access — challenge/
│                        identity/session stores
├── pdf/                (10 files) two rendering stacks: @react-pdf/renderer for
│                        invoices/prescriptions/purchase-orders/referral letters/
│                        medical certificates; puppeteer-core + @sparticuz/chromium
│                        (chromium.ts) for the discharge-summary PDF only
├── validation/          (25 files) Zod schemas — server actions consume these
│                        directly; REST routes converge on them for the fields the
│                        route itself inspects, with a documented gap for 5 domains
│                        (see audit §3)
├── websocket/           (1 file) realtime feed backing
└── (101 flat files)     domain stores + types + query helpers, e.g.:
    ├── patient-store.ts / patient-types.ts / (patient query logic inline)
    ├── appointment-store.ts / appointment-types.ts / appointment-query.ts
    ├── billing, finance, pharmacy, inventory, ipd, opd, lab, hr, cms,
    │   communication, automation, procedure, purchase-order, family,
    │   external-referral, feedback, notification, staff-notes, hms, audit,
    │   ai-review — each with a *-store.ts (+ *-types.ts pair, mostly)
    ├── document-store.ts   generic createDocumentStore<T>() factory (Postgres
    │                        jsonb + JSON-file fallback) — 28 stores build on this
    ├── documents-store.ts  a *different*, bespoke store (patient file uploads/
    │                        versioning, BYTEA content) — confusingly named next to
    │                        the above (audit, Low)
    ├── notify.ts            the only sanctioned Sonner entry point
    ├── mobile-api.ts        response helpers for app/api/mobile/v1/*
    ├── production-readiness.ts   backs scripts/verify-production-readiness.mjs
    ├── hospital-os-data.ts  shared statusTone, canAccessSection — the one place
    │                        that pattern is done right (audit F-7 contrasts this)
    └── rbac.ts               legacy StaffPermission bridge — 1 remaining consumer
                               (app/api/cms/route.ts), see audit F-15
```

Pattern: **`*-store.ts` + `*-types.ts` pairs** are the domain-data convention (31
stores, 22 types files — the gap is intentional for `lib/access/*` and
`lib/patient-access/*`, which inline their types). A third layer, **`*-query.ts`**
(20 files), provides sort/filter/paginate logic over a store's raw list.

---

## 6. State layer: two kinds of "store," on purpose but confusingly named

```
lib/*-store.ts        Server-side domain data — import "server-only", async functions,
                       backed by Postgres jsonb (document-store.ts factory) or a JSON
                       file fallback. Example: lib/patient-store.ts → listPatients().

stores/*.ts            Client-side UI state — Zustand, "use client", create<T>().
                       3 files: hospital-os-store.ts, command-history-store.ts,
                       patient-drawer-store.ts, plus theme-store.ts (persist()-backed).
```

These share a naming suffix but are otherwise unrelated runtimes. `ARCHITECTURE_AUDIT.md`
F-13 originally found two separate, un-synced dark-mode Zustand stores here
(`hospital-os-store.ts`'s `darkMode` and a since-removed `admin-theme-store.ts`'s
`dark`) — fixed 2026-07-15 by consolidating onto the shared `theme-store.ts`
(`REFACTORING_PLAN.md` item 2.5).

---

## 7. Provider hierarchy

`app/layout.tsx` renders **no app-wide context providers** — no `ThemeProvider`,
`AuthProvider`, `SessionProvider`, or root `QueryClientProvider`. Auth is enforced
server-side per-route via cookies (`accessContextFromCookieStore` + `authorize()`),
which is intentional and correct per the RBAC contract. Two consequences worth knowing
about while navigating the codebase:

- **React Query has two independent `QueryClient` instances**, each constructed at
  page-shell level rather than shared from the root:
  `components/hospital-os/HospitalOsPageShell.tsx` and
  `components/chrome/HospitalOperatingSystem.tsx`.
- **Theme (dark mode) has no provider at all** — it's two separate Zustand stores each
  paired with a hand-rolled `localStorage` effect in the consuming shell component
  (`HospitalOsShell.tsx`, `StaffChrome.tsx`). See §6 above.
- **Toasts** go through `lib/notify.ts` → Sonner, with the `<Toaster/>` render target
  mounted once in `StaffChrome.tsx` — not a context provider, but the equivalent
  single-mount-point pattern for that library.

---

## 8. Import conventions

- Path alias: `@/*` → repo root (`tsconfig.json`, mirrored in `vitest.config.ts`).
  Used consistently — no broken or duplicate aliases found.
- No barrel (`index.ts`) files exist anywhere in the project — every import is a
  direct path to the file that defines the export. This is a deliberate, consistently
  applied choice (confirmed while sweeping for dead code — it's also what makes that
  sweep reliable, see `ARCHITECTURE_AUDIT.md` §4).
- Server-only modules (`lib/*-store.ts`, RBAC internals) use the `"server-only"`
  import guard; client modules (`components/`, `stores/`, `hooks/`) use `"use client"`.
- Toasts: always via `@/lib/notify`, never a raw `sonner` import (one correct exception
  — mounting `<Toaster/>` itself in `StaffChrome.tsx`).

---

## 9. Naming conventions (confirmed, by directory)

| Directory | Convention | Exceptions found |
|---|---|---|
| `app/` | kebab-case route segments | none |
| `components/<feature>/` | PascalCase.tsx | none |
| `components/ui/` | kebab-case.tsx (shadcn CLI convention) | none — correctly different from the rest of `components/`, not an inconsistency |
| `lib/` | kebab-case.ts, `*-store.ts` / `*-types.ts` / `*-query.ts` suffixes | `lib/document-store.ts` vs `lib/documents-store.ts` reads as a typo (audit, Low); `lib/access-user-query.ts` sits flat at `lib/` root even though its store lives in `lib/access/` |
| `hooks/` | camelCase, `use*` prefix | none |
| `stores/` | kebab-case, `-store` suffix | collides in *meaning* (not spelling) with `lib/*-store.ts`, see §6 |

---

## 10. Layer diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  app/  (routes — Server Components by default, "use client" leaf)│
│    marketing pages  │  OS module pages  │  API routes (86)       │
└──────────┬───────────────────┬───────────────────┬──────────────┘
           │                   │                    │
┌──────────▼──────────┐ ┌──────▼───────────┐ ┌──────▼──────────────┐
│ components/site/     │ │ components/       │ │ app/api/*/route.ts  │
│ components/design-   │ │  hospital-os/     │ │  → authorize()       │
│  system/, ui/         │ │ components/       │ │  → lib/validation/*  │
│ (presentation)        │ │  chrome/           │ │  → lib/*-store.ts    │
│                       │ │ components/<domain>│ │                      │
│                       │ │  /AdminX.tsx       │ │                      │
└──────────┬────────────┘ └──────┬────────────┘ └──────┬───────────────┘
           │                     │                       │
           │            ┌────────▼────────┐    ┌─────────▼──────────┐
           │            │ stores/ (Zustand │    │ lib/access/          │
           │            │  client UI state)│    │  (RBAC — authorize(),│
           │            └──────────────────┘    │  matrix, sessions)   │
           │                                     │ lib/clinical/         │
           │                                     │  (safety rules)       │
           │                                     │ lib/validation/       │
           │                                     │  (Zod schemas)        │
           │                                     │ lib/*-store.ts +      │
           │                                     │  *-types.ts + *-query │
           │                                     │  .ts (domain data)    │
           └─────────────────────────────────────┴──────────┬─────────┘
                                                              │
                                                   ┌──────────▼──────────┐
                                                   │ lib/document-store.ts│
                                                   │  → Postgres jsonb    │
                                                   │  (JSON-file fallback │
                                                   │   when DATABASE_URL  │
                                                   │   unset)              │
                                                   └───────────────────────┘
```

This is a clean, conventional layered architecture. The deviations from it are the
ones already catalogued in the audit (business logic occasionally in a leaf component,
e.g. OPD hours in `LiveClockWeather.tsx`; a client-side-only fetch in
`DoctorPortalWorkspace.tsx` instead of a Server Component prop) — isolated instances,
not a structural pattern.
