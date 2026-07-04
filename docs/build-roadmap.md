# MudgalGastromedics OS — Consolidated Build Roadmap

Derived from the six-part Master Prompt audit. Every item below was verified against
the running codebase, not assumed. This is a **build order**, not a feature wall:
work top-to-bottom, each track shippable on its own.

**Governing rule (from the blueprint):** every item here is backward-compatible and
pure UI + data-aggregation + performance. **None** touches authentication, RBAC, API
contracts, the database schema, or existing workflows. Auth/RBAC/audit/Postgres are
already done and are treated as frozen contracts.

**Legend:** Effort **S**≈hours · **M**≈1–3 days · **L**≈1–2 weeks · **XL**≈multi-week.
Priority reflects value-per-effort toward the "enterprise feel," not raw importance.

---

## Where things stand (one-line verdict)

The **spine is production-grade** — auth, RBAC (backend-enforced, zero gaps), audit,
the Postgres document backend, strict TypeScript (zero `any`), security headers,
adapter-based integration seams, and the test harness. The **enterprise experience and
scale layers** the blueprint describes are largely unbuilt. This roadmap builds those.

---

## TRACK 1 — Finish the Foundation
*Cheap, high-visibility, zero backend risk. Closes the most Part 1/2/6 gaps fastest.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 1.1 | **Enterprise staff footer** | Staff screens have **no footer** | Slim footer in `StaffChrome`: OS name · tagline · category · Version · Environment · System Status · Last Sync · Privacy · Terms · Support · Keyboard Shortcuts · Copyright — nothing else (P1 spec) | High | S | — |
| 1.2 | **Grouped sidebar IA** | Flat 20-item list | Group nav into Clinical / Diagnostics / Operations / Finance / Administration with headers; keep matrix-driven visibility (P2/P6) | High | M | — |
| 1.3 | **Adopt the shared `Button`** | 82 raw `<button>` in admin; `ui/button` unused there | Migrate to the design-system Button with all variants (primary/secondary/outline/ghost/destructive/success/warning/link/icon) + loading/pressed/disabled/keyboard states | High | M | — |
| 1.4 | **Finish empty states** | 16/26 modules; text-only | Bring all 26 to the shared `EmptyState` (icon + explanation + primary + secondary + help) | High | M | 1.3 |
| 1.5 | **Toast categories** | Only `toast.success` (7×) | Wire error / info / warning / loading / undo through Sonner; standard helper | Med | S | — |
| 1.6 | **Audit before/after + device** | actor/IP/reason present; no before/after or device | Add `previousValue`/`newValue`/`device` to the audit event on create/edit/delete of Patients, Prescriptions, Billing, Beds (P4/P5) | Med | M | — |
| 1.7 | **Feature-folder components** | 48 files in `components/` root | Move `AdminX.tsx` into `components/{patients,appointments,billing,pharmacy,laboratory,ipd,hr,…}` (P6). Pure move + import fixes | Med | M | — |
| 1.8 | **Reduced-motion + token cleanup** | RM in 4 components; ~90 hardcoded hex | Extend `prefers-reduced-motion` to admin; move stray hex to tokens (keep intentional CTA gradients documented) | Low | S | — |

**Track 1 outcome:** staff surfaces look and behave like one enterprise product;
navigation is grouped; one Button everywhere; every table/list has a real empty state.

---

## TRACK 2 — Structural UX
*The "enterprise feel." Medium effort; each item independently valuable.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 2.1 | **Global Patient Drawer** | Missing (referenced in P2/P3/P4/P6) | Side drawer on any patient click: photo, UHID/MRN, age/sex, blood group, allergies, alerts, meds, diagnosis, doctor, recent visits, next appt, outstanding bills, insurance, recent reports + quick actions (book, print Rx, invoice, lab, admit, discharge, open timeline). One shared component used app-wide | **High** | L | patient-summary read endpoint (small) |
| 2.2 | **Role-filtered modules** | `/admin` shows all 23 to everyone (403 on use) | Fetch `/api/auth/me` once; render only modules the active role may view; jump-nav filters identically (P1/P2/P3). Server already enforces — this aligns UI to it | **High** | M | — |
| 2.3 | **Per-role dashboards** | One generic dashboard | Role landing dashboards (Doctor/Reception/Nursing/Lab/Pharmacy/Billing/Admin/Management) — same design language, role-specific widgets + quick actions + empty states (P3) | High | L | 2.2 |
| 2.4 | **Notification inbox** | Realtime feed only (no read/priority) | Bell + tray in StaffChrome/OS: unread, priority, critical, assigned, resolved, archived, grouped by department; sourced from the audit stream + alert rules (low stock, HDU escalation, overdue turnover) (P3/P4) | High | L | — |
| 2.5 | **Command palette upgrades** | Search+navigate over static records; OS-only | Add recent records, favourites, quick-create actions ("New patient", "Book appointment", "Generate invoice"); mount on `/admin` and `/doctor` (P3/P6) | Med | M | — |
| 2.6 | **Global search on live data** | Static command records | Back the palette with a `/api/search` over real stores (SQL `ilike` in DB mode); categorized results (P3) | Med | M | 2.5 |
| 2.7 | **Recent activity + Favourites** | Only sidebar/theme/lang/workspace persisted | Recently-viewed patients/reports/invoices; favourite patients/reports/commands (P3) | Med | M | 2.1, 2.5 |

**Track 2 outcome:** each role enters its own workspace; the patient drawer makes
context one click away; a real notification inbox and live global search.

---

## TRACK 3 — Enterprise Data
*Scale-critical. Larger, but unlocks "not a CRUD app."*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 3.1 | **Shared enterprise DataTable** | 1 real table (OS); 26 card-stacks; no virtualization/server paging | One TanStack-based `DataTable` (sticky header/col, resize, column visibility, saved views/filters, multi-sort, bulk actions, export, print, keyboard, skeleton, empty/error) + **server pagination/filtering/sorting** and virtualization >200 rows. Adopt module-by-module starting Patients → Appointments (P2/P4/P5/P6) | **High** | XL | Postgres (done) |
| 3.2 | **Advanced forms** | Basic; doctor autosave only | Shared RHF+Zod wrapper: smart defaults, autocomplete, recently-used values, searchable dropdowns, grouped sections, inline validation, autosave, undo, success feedback (P4/P6) | Med | L | — |
| 3.3 | **Print center** | 3 PDFs (Rx/invoice/discharge) | Unified print surface: + medical certificate, patient card, barcode labels, wristbands; consistent branded templates (P4) | Med | M | — |
| 3.4 | **Export center** | CSV/Excel in 17 spots, ad hoc | Central export (PDF/Excel/CSV/print/email; scheduled/encrypted later) reused by every table (P4) | Med | M | 3.1 |
| 3.5 | **Reports + analytics drill-down** | Daily summary + charts | Date-range/department/doctor filters, saved & scheduled reports; analytics that "answer questions" with drill-down (P3/P4) | Med | L | 3.1 |
| 3.6 | **Document management** | Base64 report attach only | Upload/preview/version history/download/access-log/role-permissions (P4/P5) | Low | L | — |

**Track 3 outcome:** every module runs on a real enterprise table that survives
2,000+ records; forms minimize typing; unified print/export; reports that answer questions.

---

## TRACK 4 — Scale & Future
*Architectural, forward-looking. Lower urgency; do as growth demands.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 4.1 | **Code-split `/admin` + Lighthouse 95** | Eager-loads 23 modules | Lazy-mount below-fold modules (IntersectionObserver), dynamic-import OS sections; measure/verify LCP <2.5s (P5) | High | M | 2.2 |
| 4.2 | **Offline queue / retry** | None (dropped save = lost write) | Queue mutations on connectivity loss, safe retry, clear warnings, never silently lose data (P5) | Med | L | — |
| 4.3 | **Operational AI assistant** | Patient Summary + reviews + symptom-check | Context-aware assistant (knows current module/patient): discharge summary, referral/certificate generation, medicine-interaction, low-stock, "next actions" (P3) | Med | XL | Claude API (done) |
| 4.4 | **Multi-tenancy groundwork** | Single-tenant; branch switcher is a stub | Thread `branchId` through stores behind a default; branch isolation + central analytics without redesign (P5) | Med | XL | 3.1 |
| 4.5 | **Observability** | health + audit + readiness; Sentry deferred | Wire monitoring/error-reporting (self-hosted Sentry/GlitchTip per infra decision), usage metrics, alerts (P5) | Med | M | hosting |
| 4.6 | **Radiology / Pathology modules** | Don't exist | Build as modules mirroring Lab workflow (order→schedule→acquire→review→approve→report→notify) (P3/P4) | Low | XL | 3.1 |
| 4.7 | **Shift handover · task assignment · internal messaging** | Auto-task generation only | User-assigned tasks (priority/due/reassign), shift handover (pending/critical/escalations/ack), secure internal notes/mentions (P3/P4) | Low | L | 2.4 |
| 4.8 | **Full i18n + next-themes** | Hindi toggle (partial), custom theme store | Proper i18n framework (multi-lang/currency/timezone/RTL); optionally reconcile theme onto next-themes (P5/P6) | Low | L | — |

---

## Recommended execution order

1. **Track 1 in full** (about a week) — biggest visible lift for least risk; makes the
   platform *feel* like one enterprise product before any heavy build.
2. **Track 2: 2.1 (Patient Drawer) + 2.2 (role-filtered modules) + 2.4 (notifications)** —
   the three items that most change the day-to-day experience.
3. **Track 3: 3.1 (DataTable)** — the single largest lever for real-hospital data volume;
   start it in parallel with late Track 2 since it's independent.
4. **Track 4** — pull items in as growth (multi-branch), scale (offline/observability),
   or clinical scope (radiology, AI assistant) demand them.

## Cross-cutting discipline (apply to every item)
- Reuse-first: search the design system before creating a component.
- Keep it backward-compatible; never weaken auth/RBAC; every mutation stays audited.
- Verify each change end-to-end (tsc/lint/build/unit/smoke/e2e + a live check) before
  calling it done — the standing practice this project already follows.
- Re-run `BASE=<url> node scripts/verify-auth-flows.mjs` after anything near the auth path.

## What is explicitly already DONE (not on this roadmap)
Auth + RBAC (backend-enforced), audit logging, the Postgres document-store migration,
strict typing (zero `any`), security headers, adapter-based SMS/email/rate-limit seams,
branding + website↔OS separation, the workspace launcher, dark mode across staff
surfaces, skeleton loaders, the OS route rename + sidebar navigation, density pass,
Hindi booking/portal flows, live IST clock + weather, and the PDF generation feature.
