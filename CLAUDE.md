# CLAUDE.md

Distilled from the MudgalGastromedics OS Master Prompt v1.0.0 (8 parts). This file is
the standing contract for every session. The full audit-derived build order lives in
`docs/build-roadmap.md` — work top-to-bottom from it unless directed otherwise.

## Two products, never mixed

1. **Hospital Website** (public routes) — markets the hospital. SEO, booking CTAs,
   WhatsApp, testimonials belong here and ONLY here.
2. **MudgalGastromedics OS** (`/admin`, `/doctor`, `/mudgalgastromedics-os`, `/login`) —
   runs the hospital. Never call it an HMS/ERP; never let marketing components reach
   authenticated screens. `components/chrome/AppChrome.tsx` enforces the chrome split.

Browser titles on OS surfaces: `<Screen> • MudgalGastromedics OS`.

## Decision hierarchy (Part 8 — governs all trade-offs)

Patient Safety → Clinical Workflow → Operational Efficiency → Reliability → Security →
Performance → Accessibility → Maintainability → Scalability → Visual Design.
Appearance is always last. Clinical alerts must be explainable (say why they fired)
and non-blocking-by-default — warn, don't obstruct the clinician; log overrides.

## Frozen contracts — never break

- Authentication, RBAC (`lib/access/` — backend-enforced via `authorize()` on every
  route; UI visibility is never the only gate), audit logging (every mutation stays
  audited with actor/IP/reason/before-after/device via `lib/audit-diff.ts`).
- Existing API shapes (`{ ok, error }`), database contracts, business logic, workflows.
- Every change is backward-compatible. Additive schema changes only.
- Never expose stack traces or internal errors; error messages stay friendly + actionable.

## Engineering standards (verified state — keep it this way)

- Strict TypeScript. Zero `any`, zero `@ts-ignore` in source. Never bypass types or lint.
- Server-side validation for every write. Converge REST routes onto the Zod schemas in
  `lib/validation/` (server actions already use them) — do not add new hand-rolled checks.
- Minimal dependencies (29 runtime). Before adding one: can existing libs or native APIs do it?
- Comments explain business rules, healthcare logic, or constraints code can't show —
  never what the next line does.

## Design system (Part 6 stack — no other UI frameworks)

Next.js App Router · TypeScript · Tailwind (v4) · shadcn/ui (`components/ui/`) ·
Lucide only · Framer Motion (≤300ms, honor reduced-motion) · RHF + Zod ·
TanStack Table · Recharts · Sonner (via `lib/notify.ts`, never raw `toast`) · cmdk.

- Tokens only — no hardcoded colors/spacing/radius/shadows. Site tokens (`text-ink`,
  `border-line`…) under StaffChrome; `--hos-*` tokens inside the OS shell. These two
  vocabularies are a known debt: converge, don't extend the split.
- Reuse first: search `components/design-system/` and `components/ui/` before creating
  anything. Known duplicates to converge (not worsen): `ui/button` vs `ActionButton`;
  `EmptyState` vs `ModuleEmptyState`.
- Status colors: green=success, amber=warning, red=critical, blue=info, gray=inactive.
- Every table/list gets a real empty state (icon + why + how + actions); skeletons for
  loading; no blank screens; no marketing language on staff surfaces.
- Information density over whitespace; workflow over appearance; never add UI that
  slows an 8–12 h/day user.

## Working rules (Part 7)

- Think before coding: understand the request, the existing implementation, and risks;
  present the approach first for major changes.
- Improve/refactor/reuse/extend — never rewrite working systems. Refactors never change
  behavior.
- Module-by-module: one roadmap item per change-set; never sweep the whole app at once.
- Small focused files. `components/chrome/HospitalOperatingSystem.tsx` (2,188 lines) is the
  one sanctioned monolith awaiting decomposition — do not grow it; extract when touching it.
- Commits: conventional format, one concern each, e.g.
  `feat(clinical): active allergy alert at prescribe time (Track 0.1)`.

## Verification (before calling any change done)

```sh
npm run test          # lint + vitest unit + smoke
npm run test:e2e      # Playwright (includes a11y suite)
npm run prod:check    # production readiness
BASE=<url> node scripts/verify-auth-flows.mjs   # after anything near auth/RBAC
```

Drive the affected flow in the running app (`npm run dev`), not just the test suite.

## Architecture map

- `app/` — routes. Public site at root; OS at `/admin`, `/doctor`, `/mudgalgastromedics-os`;
  REST under `app/api/` (58 routes, authorize-first); versioned mobile API at `api/mobile/v1`.
- `lib/` — domain stores (`*-store.ts` + `*-types.ts` pairs) over a Postgres document
  backend (`document-store.ts`, JSON fallback when `DATABASE_URL` unset); `lib/access/`
  RBAC; `lib/clinical/` safety rules; `lib/patient-access/` OTP record access;
  `lib/validation/` Zod schemas; `lib/notify.ts` toasts.
- `components/` — feature folders (`patients/`, `billing/`, `pharmacy/`, `chrome/` for
  OS shell+auth, `site/` for public-website marketing, `patient-portal/`, ...);
  `ui/` shadcn primitives; `design-system/` shared platform primitives.
- `docs/build-roadmap.md` — sequenced build order (Tracks 0–4). `docs/access-control.md`
  — RBAC model.

## Non-negotiables (quick recall)

Never: redesign working workflows without justification · introduce breaking changes ·
duplicate components/logic/validation · hardcode values (incl. demo/placeholder data on
staff surfaces) · ignore accessibility (WCAG AA, keyboard, focus, reduced motion) ·
weaken security or trust frontend permissions · let aesthetics beat productivity ·
ship features without measurable value to care, safety, efficiency, or maintainability.
