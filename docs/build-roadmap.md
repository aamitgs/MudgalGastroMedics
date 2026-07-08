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

## TRACK 0 — Clinical Safety  *(highest priority)*
*Added after the Part 8 constitution, whose decision hierarchy ranks **Patient Safety
first, Visual Design last**. These are partial or missing today and outrank the
enterprise-UX tracks below. Every alert must be **explainable** (say why it fired) and
**non-blocking-by-default** for non-critical cases — warn, don't obstruct the clinician.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 0.1 | ✅ **Active allergy alert at prescribe time** | Done. `AllergyGuard` (`components/DoctorPortalWorkspace.tsx`) shows a red, non-blocking alert per visit when the patient has a recorded allergy; acknowledgement is audit-logged (`clinical.allergy.acknowledged`). Closed the one gap found on 2026-07-07 audit: acknowledgement now captures an optional free-text reason (e.g. "switched to alternative drug"), sent to `app/api/clinical/allergy-acknowledged` and stored in audit metadata (`"Not specified"` when omitted) — matches "log the override with reason" without turning acknowledgement itself into a blocking gate | **Critical** | S | — |
| 0.2 | ✅ **Critical lab-result flagging** | Done — found already fully built on 2026-07-07 audit (roadmap was stale here). `lib/clinical/lab-critical.ts` auto-flags out-of-range results via threshold rules on save (`lib/lab-store.ts`); red badges in the lab queue and patient timeline; doctor notification via `lib/notification-rules.ts`; acknowledgement audited (`lab.critical.acknowledged`) | **Critical** | — | — |
| 0.3 | ✅ **Duplicate-patient prompt at registration** | Done. `app/api/patients/match` + the "Possible existing patient" banner (`components/AdminPatients.tsx`) already warned staff before saving. Closed the real gap found on 2026-07-07 audit: the backend used to **silently always merge** on phone match with no way to register a genuinely different person sharing a number (e.g. a family member) — a real data-integrity hazard (two people's clinical records could get conflated under one UHID). Added an explicit "Same person — update existing record" vs. "Different person — create a new record" choice; the latter sends `forceNew: true` (`lib/patient-store.ts`'s `createPatient`) and is audit-logged (`patient.created.duplicate_phone_confirmed`, linking both patient IDs) since it's a clinically significant deliberate override. Default behavior (merge) is unchanged | **High** | M | — |
| 0.4 | ✅ **Duplicate-medication detection** | Done — found already fully built on 2026-07-07 audit (roadmap was stale here). `lib/clinical/medication-overlap.ts` (`detectMedicationOverlap`) live-checks the new prescription against `currentMedicines` and shows an advisory amber alert in `components/DoctorPortalWorkspace.tsx`'s `PrescriptionField` | High | — | — |
| 0.5 | ✅ **Drug–drug interaction alerts** | Done (2026-07-08). `lib/clinical/drug-interactions.ts`: 11 curated, well-established high-risk pairs relevant to a general/GI hospital (warfarin×NSAIDs, warfarin×metronidazole, warfarin×macrolides, methotrexate×NSAIDs, statins×macrolides, domperidone×QT-prolonging drugs, tramadol×SSRIs, ACE-inhibitors×spironolactone, digoxin×loop-diuretics, sucralfate×fluoroquinolones, tramadol×ondansetron), each with an explainable mechanism + clinical guidance, not just "interaction detected." `detectDrugInteractions()` reuses `medication-overlap.ts`'s tokenizer (now exported as `drugTokens`) and checks three cases: new drug vs. current medicine, or two interacting drugs newly co-prescribed. Severity-tiered UI in `DoctorPortalWorkspace.tsx`'s `PrescriptionField`: `"high"` severity renders a new `InteractionGuard` (mirrors `AllergyGuard`, Track 0.1 — red alert, explicit "Acknowledge — reviewed" action, audit-logged per drug pair via a new `app/api/clinical/interaction-acknowledged` route, `clinical.interaction.acknowledged`); `"moderate"` severity stays a passive advisory (mirrors the Track 0.4 duplicate-medication check) so routine warnings don't dilute attention to the serious ones — alert fatigue is itself a safety risk. Never blocks; prescription autosave is unaffected either way. Fixed the sibling `allergy-acknowledged` route's audit call in passing: it was still spreading `auditRequestMetadata()` into flat `metadata` instead of the typed `device` field (the Track 1.6 pattern). 8 new unit tests; verified live end-to-end (high-risk alert renders → acknowledge → audit event has real `device` context; moderate match shows with no acknowledgement gate) | Start with a curated high-risk interaction list (explainable, sourced), alert at prescribe time; expand data source later. Never auto-block — warn + require acknowledgement | High | L | drug reference data |
| 0.6 | **Patient identity verification** | None | Lightweight confirm-identity step (name + phone/DOB) before clinical write actions on a record; audited | Med | M | — |
| 0.7 | **Consent capture & verification** | `consent` exists as a field/concept only | Real captured+audited consent step for procedures and admission (digital acknowledgement); block the workflow until consent recorded | Med | M | — |
| 0.8 | ✅ **Inventory batch/lot/expiry foundation** *(audit addendum)* | Found already fully built on 2026-07-08 audit — the roadmap was stale here (real commit `d7464ff`, "batch/lot/expiry foundation for stock traceability", predates this conversation). `lib/inventory-types.ts` has `batchNumber`/`lotNumber`/`expiryDate` plus an explainable `inventoryExpiryStatus()` (expired / expiring-soon within a 30-day window / not flagged); `lib/inventory-store.ts` persists all three on create/update; `app/api/inventory/route.ts` computes an `expiryAlerts` stat and supports an `expiryOnly` query filter; `components/AdminInventory.tsx` has entry-form inputs for all three, a combined Batch/Lot table column, an Expiry column with expired/expiring-soon badges, an "Expiry alerts" filter checkbox, and includes them in the CSV export. Verified live: created an expired item and an expiring-soon item, confirmed both badges render and the `expiryAlerts` stat counts them correctly | Add optional `batchNumber`/`lotNumber`/`expiryDate` to the inventory model + entry UI; surfaces expiring/expired stock so pharmacy expiry monitoring (P4) becomes buildable. Additive, backward-compatible | **High** | S | — |

**Track 0 outcome:** the platform actively prevents the highest-risk clinical mistakes —
allergy/interaction/duplicate-medication at prescribe time, critical results never missed,
no duplicate patient identities, consent always on file. This is the constitution's #1
priority and precedes cosmetic/enterprise-feel work.

> **Note on HDU vitals escalation** — already built (`computeHduEscalation`): flags
> overdue/out-of-threshold HDU vitals for staff attention. It is a staff-attention flag,
> never a diagnosis, and stays that way.

---

## TRACK 1 — Finish the Foundation
*Cheap, high-visibility, zero backend risk. Closes the most Part 1/2/6 gaps fastest.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 1.1 | ✅ **Enterprise staff footer** | Done — confirmed on 2026-07-07 audit. `components/StaffFooter.tsx` (rendered by `StaffChrome.tsx`) has all 12 spec elements: OS name, tagline, category, live-`/api/health`-sourced Version/Environment/System Status, Last Sync, Privacy/Terms/Support links, Keyboard Shortcuts dialog, copyright | High | S | — |
| 1.2 | ✅ **Grouped sidebar IA** | Done — confirmed on 2026-07-07 audit. `HospitalOperatingSystem.tsx` renders `navGroupOrder.map(...)`, a genuine `role="group"` block per section with a visible header, not a flat list | High | M | — |
| 1.3 | **Adopt the shared `Button`** | DONE, closed out 2026-07-08 after a full sweep of every staff-facing file with a raw `<button>`. Migrated: `DoctorPortalWorkspace.tsx` (9 → 2), `AccessLogin.tsx` (6 → 2, all 4 `buttonClass` submit buttons across the credentials/password-change/MFA-setup/MFA-verify steps now share `ActionButton variant="primary"`; the now-dead `buttonClass` constant removed), `StaffChrome.tsx` (3 → 0: the header's search-palette trigger, dark-mode toggle and sign-out button were an exact hand-rolled duplicate — `border border-line ... text-muted ... hover:border-brand hover:text-brand` — repeated identically 3 times in this one file and again in `NotificationCenter.tsx`'s bell trigger; added a new **`outline` variant** to `ActionButton` carrying that exact class string rather than forcing an ill-fitting existing variant, a zero-visual-change de-duplication, not a redesign), and `DoctorLogin.tsx` (1 → 0: its submit button's gradient/shadow classes were a near-exact match for the existing `primary` variant). **Scope correction** (carried from earlier in this track): `ActionButton` is documented as the *staff*-facing button and has never touched a public page, so `PatientPortalAccess.tsx`, `PatientHealthDashboard.tsx`, `GalleryGrid.tsx`, `Header.tsx`, `AppointmentForm.tsx` and `LanguageToggle.tsx` (mounted only inside `Header.tsx`) are **out of scope** — migrating them would blur the "two products, never mixed" boundary. Every remaining raw `<button>` across the codebase (audited file-by-file: `WorkspaceLauncher.tsx`, `AdminPatients.tsx`, `HospitalOperatingSystem.tsx`, and the ~10 DataTable-converted `AdminX.tsx` modules — AiReviews/Appointments/Automation/BillingSummary/Communication/DoctorWorkflow/EnterpriseModules/Finance/HR/IpdBeds/Lab/OpdQueue/Pharmacy/Procedures — plus `GlobalCommandPalette.tsx` and `PatientClinicalSnapshot.tsx`) is a legitimate, deliberate exclusion, not remaining debt: the repeated bare "Open patient summary" name-cell link (same exact class string in ~10 modules, a text link with no border/background — no `ActionButton` "link" variant exists), `aria-pressed` card/pill selectors (template pickers, module pickers, common-test toggles, duplicate-patient confirm pair — active/inactive selection state doesn't fit ActionButton's plain-action shape), bare icon-only toggles with no border/background (password-visibility, command-palette favourite star), one invisible mobile-nav backdrop overlay, and `WorkspaceLauncher.tsx`'s public-site-token `bg-brand` "Continue" button (confirmed via grep to be shared only with `Footer.tsx`/`app/life-at-mgm/page.tsx`/`app/contact/page.tsx`, not a hand-rolled `ActionButton` duplicate) | Migrate remaining staff-facing raw buttons module-by-module; leave public-facing components on their own button styling | High | M | — |
| 1.4 | ✅ **Finish empty states** | Done (2026-07-08). The 18 Track-3.1-converted `AdminX.tsx` modules already got real empty states for free via `DataTable`'s `emptyState` prop. The 5 non-DataTable dashboards (`AdminReports`, `AdminAnalytics`, `AdminProductionReadiness`, `AdminEnterpriseModules`, `AdminSettings`) previously dropped ALL page content and showed only a bare red error paragraph when their initial fetch failed (a real gap vs. CLAUDE.md's "icon + why + how + actions" empty-state contract). Fixed in all 5: when there's no data at all and the load failed, render `ModuleEmptyState` (`AlertTriangle` icon, a specific title, `error` as the description, and a "Retry" action wired to the existing reload function) instead of a blank panel. When data *is* already loaded and only a background refresh fails, kept the existing lightweight inline banner above the stale-but-still-useful data, rather than replacing visible content with a full-panel error. `AdminEnterpriseModules` additionally needed its stats grid + module-list grid wrapped in `{modules.length > 0 ? … : null}` (it has no single "loaded" object to gate on, just `modules`/`records` arrays defaulting to `[]`). Verified live: normal load unaffected, simulated API failure shows the empty state + working Retry button, Retry recovers real content once the backend responds again | Bring the 5 remaining dashboards to a real empty/error state where meaningful | High | M | 1.3 |
| 1.5 | ✅ **Toast categories** | Done, exceeds spec — confirmed on 2026-07-07 audit. `lib/notify.ts` has 7 methods (success/info/warning/error/saved/loading/undo); called 59× across 18 files (up from 9) | Med | S | — |
| 1.6 | ✅ **Audit before/after + device** | Done (2026-07-08), scope corrected on investigation: the actual gap was worse than "missing before/after" — `app/api/opd/route.ts` (prescriptions, clinical notes, billing status/payment) and `app/api/ipd/route.ts` (bed status, admissions, transfers, escalation) called `recordAuditEvent` **zero times**, a real hole against CLAUDE.md's frozen "every mutation stays audited" contract. Fixed: `app/api/patients/route.ts` (POST now audits normal creates as `patient.created`, not just the duplicate-phone edge case; PATCH now audits `patient.updated` — previously unaudited entirely), `app/api/opd/route.ts` (POST → `opd.visit.created`; PATCH now splits into `opd.prescription.updated`/`opd.billing.updated`/`opd.visit.updated` by which fields changed, mirroring the existing field-level authorization split, severity `warning` for prescription changes), `app/api/ipd/route.ts` (admission create, bed status, transfer, escalation, and admission update/discharge all now audited; vitals deliberately left unaudited — high-frequency telemetry, not a record mutation, would drown the trail in noise). Also fixed a real correctness bug found in passing: `lib/ipd-store.ts`'s `transferBed` had its own `recordAuditEvent` call hardcoding `actorRole: "admin"` for every transfer regardless of who actually moved the patient, with no device context — moved that audit call up into the route handler where the real actor/device context lives. **Second bug found during live verification**: the document store caches records in memory and every `updateX()` mutates the found object in place, so a naive `before = await getXById(id)` taken right before calling `updateX()` ends up pointing at the *same* object `updateX` then mutates — before and after were identical by the time `recordAuditEvent` diffed them, silently producing empty change-sets. Fixed by wrapping every "before" snapshot in `structuredClone()` before the mutating call runs. Verified live end-to-end: created/updated a patient, prescription, billing status, admission and escalation, then read `/api/audit` directly and confirmed real field-level diffs (e.g. `billingStatus: "Not Started" → "Paid"`) and real `device` (`ip`/`userAgent`/`method`/`path`) on every event | Add `previousValue`/`newValue`/`device` to the audit event on create/edit/delete of Patients, Prescriptions, Billing, Beds (P4/P5) | Med | M | — |
| 1.7 | **Feature-folder components** | PARTIAL, re-measured 2026-07-07: still 49 files flat in `components/` root. Subfolders exist and are used (`components/hospital-os/` 5 files, `components/design-system/` 7 files, `components/ui/` shadcn primitives) but the bulk of domain components (all `Admin*.tsx`, portals) haven't moved | Move `AdminX.tsx` into `components/{patients,appointments,billing,pharmacy,laboratory,ipd,hr,…}` (P6). Pure move + import fixes | Med | M | — |
| 1.8 | **Reduced-motion + token cleanup** | PARTIAL, re-measured 2026-07-07: `prefers-reduced-motion`/`useReducedMotion` in 4 files (`GalleryGrid.tsx`, `MotionReveal.tsx`, `HospitalOperatingSystem.tsx`, `Header.tsx`) — a shared `MotionReveal` wrapper exists but isn't universal; 75 hardcoded hex colors remain in `components/*.tsx` | Extend `prefers-reduced-motion` to admin; move stray hex to tokens (keep intentional CTA gradients documented) | Low | S | — |

**Track 1 outcome:** staff surfaces look and behave like one enterprise product;
navigation is grouped; one Button everywhere; every table/list has a real empty state.

### Track 1 addenda — July 2026 full-prompt audit
*Verified against the codebase on 2026-07-06. Items 1.3/1.4/1.5 shipped their
primitives but not full adoption; the audit also surfaced small spec gaps and two
cheap Part 1/3 violations. All additive, zero backend risk.*

| # | Item | Current state | Build | Pri | Effort | Depends on |
|---|---|---|---|---|---|---|
| 1.9 | ✅ **De-mock the OS dashboard metrics/trend/feed** | Done (2026-07-08), scope corrected on investigation: `dashboardMetrics`/`analyticsSeries` turned out to be dead fallback code already — `/api/hospital-os/snapshot` always computes real metrics/trend live via `createAnalyticsSnapshot()`, never omits them. The actual bug was two *initial-state placeholders* shown before the first fetch resolved: the `useQuery` default `data` (fake "42 OPD / 76% beds / Rs 4.8L") and `realtimeMessages`' initial state (fake specific events like "Nurse Priya S..."). Fixed: `HospitalOperatingSystem.tsx`'s `DashboardOverview` now takes `isLoading` and renders `<Skeleton>` placeholders (reusing the existing shadcn primitive, not fabricated numbers) for the metric tiles and both charts; the realtime feed shows a neutral "No recent activity yet" / "Connecting to live activity…" message when empty instead of canned events. The three now-fully-dead constants were deleted from `lib/hospital-os-data.ts`. Also fixed in passing (same block, pre-existing bug this session repeatedly saw in e2e console output): `realtimeMessages` used the message text itself as the React list key, causing "duplicate key" warnings whenever the same event text recurred — now a generated `{id, text}` pair. **Follow-up also fixed (2026-07-08)**: `PatientWorkspace`'s summary tab — both the `ClinicalBrief` card (hardcoded "Age/Sex 42/Male, Abdominal pain, reflux, Risk Moderate, Star Health preauth pending" for *every* patient, worse than the metrics bug since `age`/`risk`/`insurance` were already real fields sitting unused on the same `activePatient` prop) and the "Vitals"/"Prescription"/"Next action" cards (same "BP 126/82..." text for every patient) — were the more clinically sensitive of the two Track 1.9 issues, since they looked like real per-patient data rather than a dashboard-wide number. Fixed by extracting `components/hospital-os/PatientClinicalSnapshot.tsx` (same extraction pattern as `PatientTimelinePanel`, toward 4.10), reusing `/api/patients/summary` (already built for the Global Patient Drawer, Track 2.1 — zero backend changes needed): Age/Sex/Risk/Insurance now read from real `activePatient`/patient-record fields; "Primary Concern" from the visit's recorded `symptoms`; "Clinical Note" and "Prescription" cards (renamed from "Vitals" — no discrete vitals data source exists for OPD-context patients, and mislabeling free-text `clinicalNote` as structured vitals would itself be misleading) from the visit's real `clinicalNote`/`prescription` fields; "Next action" synthesized from real signals in priority order (unacknowledged critical labs → follow-up date → outstanding balance → next appointment → "No pending action flagged"). Verified two different seeded patients render provably different content end-to-end | **High** | S–M | — |
| 1.10 | ✅ **Primitive completions** | Done — found already fully built on 2026-07-07 audit (roadmap was stale here). `ActionButton` has a `"warning"` variant; `notify.ts` has `loading`/`undo`; `ModuleEmptyState` has `secondaryAction`/`helpHref` props | High | S | — |
| 1.11 | ✅ **Retire HMS/ERP positioning language** | Done (2026-07-08). Moved `app/hms-erp/page.tsx` → `app/operations/page.tsx` (new canonical route, matching the page's own existing "Operations dashboard" framing) with a permanent redirect `/hms-erp` → `/operations` in `next.config.mjs` for SEO continuity. Reworded every "HMS"/"ERP"/"Hospital ERP" mention across `app/operations/page.tsx`, `app/platform/page.tsx`, `app/ai-planning/page.tsx`, `app/admin/page.tsx`'s metadata, and `lib/platform-data.ts` (renamed `hmsFeatures` → `operationsFeatures`) to "Enterprise Healthcare Platform"/"Operations Platform"/"hospital operations" language. Deliberately left internal-only code untouched (`lib/hms-modules.ts`, `app/api/hms/route.ts`, `lib/rbac.ts` comments) — those are technical identifiers for the authenticated "Enterprise Modules" admin screen, never shown to the public, and renaming them would be unrelated internal churn with no positioning benefit | Med | S | — |
| 1.12 | **Zod convergence on REST routes** | IN PROGRESS, started 2026-07-08. Five slices done — **Patients, OPD, IPD, HR, Procedures schedule** — all onto per-route files in `lib/validation/` plus a shared `lib/validation/http.ts` (`firstZodIssueMessage`, mapping a `ZodError` to the single string the `{ ok, error }` REST shape expects). Key lessons carried forward from the first slices: (1) **always live-verify against the real calling component**, not hand-picked API payloads — Patients' client sends `forceNew: duplicateMatch && confirmedNewPatient`, which is JS `null` (not `false`) with no duplicate match, and `.optional()` rejected that with a 400 on every ordinary create until fixed with `.nullish()`; (2) where a route inspects the body *before* `authorize()` to pick which permission to check (OPD's clinical/billing split, IPD's per-`type` branch), parse first and read the resource from the typed result, preserving the exact existing order; (3) preserve intentionally-lenient existing fallbacks (invalid enum silently defaults rather than rejects) as `.default(...)` where the real caller can't trigger the distinction anyway (HR's role/shift/status). **Procedures schedule** (`app/api/procedures/schedule/route.ts` + `lib/validation/procedures.ts`) added a `procedureChecklistSchema` (`z.object({...8 boolean fields}).partial()`) for the `Partial<ProcedureChecklist>` PATCH payload (e.g. `{ consent: true }` from a single checkbox toggle) — verified live via the real schedule-creation form plus status/checklist/findings PATCH updates. **Follow-up noted from the IPD slice, still not fixed**: `lib/audit-diff.ts`'s default redact list treats any field named `token` as a secret, incorrectly redacting `IpdAdmission.token` (a public queue number, not a secret) — cosmetic only. 57 of 62 route files remain; continue module-by-module, always with a live UI check | Migrate route bodies onto shared Zod schemas module-by-module (P5 "validate everything", one validation culture) | Med | M | — |

**Adoption completion (amend 1.3/1.4/1.5), re-measured 2026-07-07:** 63 raw `<button>`s
remain across 27 files (`ActionButton` itself is healthy — 25 files, 83 sites); 18/23
DataTable-converted modules get real empty states via `DataTable`'s `emptyState` prop,
5 non-list dashboards don't; `notify` used in 18 files (up from 9). Finish 1.3's rollout
module-by-module alongside other Track 1/2 work.

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
| 3.1 | **Shared enterprise DataTable** | ✅ Primitive built. ✅ **Patients**, ✅ **Appointments**, ✅ **Laboratory**, ✅ **OPD Queue**, ✅ **Pharmacy**, ✅ **IPD & Beds**, ✅ **Inventory**, ✅ **HR**, ✅ **Finance**, ✅ **Procedures**, ✅ **Communication**, ✅ **CMS**, ✅ **Doctor Workflow**, ✅ **Billing Summary**, ✅ **AI Reviews**, ✅ **Audit Log**, ✅ **Automation**, ✅ **User Management/Access** adopted (`lib/*-query.ts` per module) — **18 of 23 admin modules**, every one that is genuinely a searchable/sortable list of records. User Management: client-paginated (small realistic staff-account volume, same reasoning as HR), consolidates the 4-5 per-row security actions (reset password, reset MFA, suspend/reactivate, role-change request) behind one "Manage" detail panel with every `disabled={!isSuperAdmin}` condition (plus the finer-grained ones — can't suspend self, can't reset MFA never set up) preserved verbatim; the one-time-credential and two-person-rule approval banners stay untouched as persistent inline banners, not toasts, since they carry instructions an admin needs time to read/act on. Verified live with a non-super-admin ("admin" role, MFA completed via `otplib` in the test script) session: "Viewing only" banner shows, every mutation button renders disabled (never hidden) — backend `authorize()`/RBAC is unchanged regardless. **Remaining 5 evaluated and correctly not converted** (dashboards/fixed reference data, not lists): Reports, Analytics, Enterprise Modules, Production Readiness, Settings — see prior audit notes. Track 3.1 is complete | Track 3.1 complete. Next: 3.2 (advanced forms) or another track | **High** | L | — |
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
| 4.9 | ~~**Token-system unification**~~ *(audit addendum — DONE)* | ~~Two token vocabularies~~ `--hos-*` OS shell colors now alias `--site-*` role-for-role (primary→brand, success→teal, warning→gold, danger→coral, bg/surface/muted/border/text/muted-text→mist/surface/soft/line/ink/muted); dark mode needs no color values of its own, only `color-scheme: dark` — verified via screenshot in both modes | Remaining: `EmptyState`/`ModuleEmptyState` and the two Button components are still separate (deliberately — different prop contracts for different surfaces); revisit only if that duplication becomes a real maintenance cost | — | — | — |
| 4.10 | **Decompose `HospitalOperatingSystem.tsx`** *(audit addendum)* | 2,188-line monolith (shell + dashboard + workspaces + palette + tables); next-largest file is 614 lines | Behavior-preserving extraction into `components/hospital-os/` feature modules; do incrementally whenever the file is touched (P7 "no god components") | Med | M–L | pairs well with 1.7 |
| 4.11 | **Smart widgets + announcements decision** *(audit addendum)* | In the Master Prompt (P3) but absent here: movable/resizable dashboard widgets; hospital announcements surface | Product decision: build or consciously defer. Widgets: after 2.3 role dashboards. Announcements: could ride on the CMS + notification inbox (2.4) | Low | — | 2.3, 2.4 |

---

## Recommended execution order

*Reordered to honor the Part 8 decision hierarchy (Patient Safety → … → Visual Design last).*

1. **Track 0: 0.1 (allergy alert) + 0.3 (duplicate-patient prompt) + 0.4 (duplicate meds)** —
   highest-value safety wins, mostly S/M effort; do these first regardless of visual polish.
2. **Track 1 in full** (about a week) — biggest visible lift for least risk; makes the
   platform *feel* like one enterprise product. Runs alongside the rest of Track 0.
3. **Track 2: 2.4 (notifications) → 0.2 (critical-lab flagging, which depends on it) →
   2.1 (Patient Drawer) + 2.2 (role-filtered modules)** — safety + the items that most
   change day-to-day work.
4. **Track 3: 3.1 (DataTable)** — the single largest lever for real-hospital data volume;
   independent, can run in parallel with late Track 2.
5. **Track 0: 0.5–0.7 (interactions, identity, consent) + Track 4** — pull in as data
   sources, clinical scope, and growth (multi-branch, observability) demand.

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
