# Clinical Decision Support (CDS) — Build Scope

Scope for the proactive Clinical Decision Support layer of the OPD Consultation module
(spec item F + the "Clinical Decision Support" and "Risk Alerts" enhancements). Every
building block referenced below was verified against the running codebase, not assumed.

**Governing rule:** CDS is **pure UI + client-side rule evaluation over already-loaded
data + one additive audit action**. It touches **no** authentication, RBAC, API
contract, database schema, or existing workflow. It follows the Part 8 decision
hierarchy — Patient Safety first, Visual Design last — and the standing rule that every
clinical alert must be **explainable** (say *why* it fired) and **non-blocking-by-default**
(warn, don't obstruct; log overrides).

**Locked decisions** (from scoping):
- **Vaccination:** condition-triggered reminders only — **no immunization data model**.
- **v1 catalog:** all six categories, ~12 curated rules.
- **Dismissals:** session-local + audit — **no schema change**.
- Net result: **the entire MVP is zero-schema-change.**

---

## 0. The governing architectural decision

**CDS is a deterministic rules engine, not an LLM feature.** Every existing safety check
in this codebase — `lib/clinical/drug-interactions.ts`, `max-dose.ts`, `lab-critical.ts`,
`vitals.ts`, `recall.ts` — is a curated, pure-function rule table with explainable
output. CDS follows that exact posture, because the constitution requires clinical alerts
to be explainable, non-blocking, and auditable — properties an LLM in the decision path
cannot guarantee (hallucination, non-determinism, untestable).

The existing `components/opd/AiVisitAssistant.tsx` stays as the **reactive Q&A** layer.
CDS is the **proactive, deterministic** layer. AI may optionally help *author* rule
content offline, but never decides at runtime. This also makes the whole engine
unit-testable exactly like `tests/unit/max-dose.test.ts`.

---

## 1. Reuse map — what exists vs. what is genuinely new

CDS is mostly an **orchestration + surfacing** layer over primitives that already exist.
It must not reimplement them.

| Capability | Already exists | CDS's job |
|---|---|---|
| Vitals flagging (BP, pulse, RR, temp, SpO₂, sugar) | `lib/clinical/vitals.ts` (`flagBp`, `flagBloodSugar`, …) | Consume flags into risk cards |
| BMI compute + category | `computeBmi` / `bmiCategory` in `vitals.ts` | **New:** turn abnormal BMI into a risk card — computed today, never *flagged* (item G gap) |
| Critical labs | `lib/clinical/lab-critical.ts` + `RecentLabsStrip` | Consume into risk cards |
| Drug allergy / interaction / max-dose | the guard quartet (`AllergyGuard`, `InteractionGuard`, `MaxDoseGuard`) | Reference only — they stay at prescribe-time, not duplicated |
| Follow-up recall | `lib/clinical/recall.ts` (`evaluateRecall`) + `RecallAlert` | Fold overdue/due-soon into the follow-up reminder card |
| Diagnosis→investigation suggestion | ⚠️ manual via `ClinicalTemplateMenu` | **New:** auto-trigger from the typed diagnosis (also closes the audit's ⚠️ gap) |
| Vaccination / immunization data | ❌ no data model | Condition-triggered reminders only (locked decision) |

---

## 2. Engine design

New file `lib/clinical/decision-support.ts`, mirroring the shape of the existing rule
modules.

```ts
export type CdsCategory =
  | "investigation" | "vaccination" | "follow-up"
  | "medication-review" | "preventive-care" | "risk-alert";

export type CdsSeverity = "info" | "warning";   // never blocking/"critical"

export type CdsContext = {
  visit: OpdVisit;
  patient?: PatientRecord;
  pastVisits: OpdVisit[];        // same patient — recall, polypharmacy, screening intervals
  recentLabResultText?: string;  // feeds the lab-critical reuse
};

export type CdsAction =
  | { kind: "insert-investigation"; text: string }
  | { kind: "insert-advice"; text: string }
  | { kind: "set-follow-up"; days: number };

export type CdsRecommendation = {
  ruleId: string;
  category: CdsCategory;
  severity: CdsSeverity;
  title: string;   // "Consider Hep A/B vaccination"
  why: string;     // explainability — one sentence, like lab-critical's reasons[]
  action?: CdsAction;
};

export function evaluateDecisionSupport(ctx: CdsContext): CdsRecommendation[];
```

Each rule is a pure `(ctx) => CdsRecommendation | null`, registered in an array exactly
like `drugInteractionRules`. `evaluateDecisionSupport` runs them all, drops nulls, and
sorts by severity (warning before info). Fully deterministic, fully testable.

---

## 3. v1 rule catalog (~12 rules — deliberately small, conservative, GI/hepatology-first)

Thresholds align to the existing modules; start narrow and grow.

- **Investigation** (diagnosis-triggered): GERD → `CBC, H. pylori, Upper GI Endoscopy`;
  Fatty liver → `LFT, USG abdomen, lipid profile, HbA1c`; etc. Reuse the
  diagnosis→investigation associations implied by `ClinicalTemplateMenu`.
  Action: `insert-investigation`.
- **Preventive care**: abnormal BMI (obese / underweight) → lifestyle-counseling card
  (reuses `bmiCategory`); age ≥ 45 with no colonoscopy in history → CRC-screening prompt;
  fatty-liver / alcohol mention → alcohol-cessation + repeat-LFT advice.
- **Medication review**: PPI in `currentMedicines` sustained across ≥ N prior visits →
  "review long-term PPI need"; chronic NSAID → gastroprotection review; polypharmacy
  (≥ M current medicines).
- **Follow-up**: wrap `evaluateRecall(visit, pastVisits)` → overdue / due-soon card with a
  `set-follow-up` action.
- **Vaccination** (condition-triggered): chronic-liver-disease dx → Hep A/B reminder;
  splenectomy → pneumococcal. Acknowledged, not tracked — may re-fire next visit (the
  accepted trade-off of the no-schema decision).
- **Risk alert**: consolidates high BP (`flagBp`), abnormal BMI, and **new** "uncontrolled
  diabetes" (`flagBloodSugar` = high *and* diabetes in dx/conditions); allergy and
  critical-lab risks are already surfaced by their own components and are only referenced.

Every rule ships with its `why` string and a unit test asserting fire / no-fire +
explainability, like the existing clinical tests.

---

## 4. UI / UX

A single **non-blocking, collapsible "Clinical Decision Support" panel** in
`components/doctor-portal/DoctorConsultationCard.tsx`, placed after the checklist / near
the AI panels. Per the decision hierarchy (workflow first, appearance last) and the
anti-alert-fatigue posture:

- Each recommendation is a compact card: **title · why · [one-click action] · [Dismiss]**.
- Info-severity collapsed by default; warning-severity expanded. Never a modal; never
  gates "Complete Consultation."
- Actions reuse existing plumbing: `insert-investigation` → the same blank-guard insert
  used by the investigation favourites; `set-follow-up` → the `FollowUpQuickPicks` commit
  path.
- **Dismiss** clears the card for the session and is audit-logged (§5). Cards may
  re-evaluate on reload — accepted per the session-only decision.
- Colors: amber = warning, blue = info (status-color contract). Honors reduced-motion,
  WCAG AA, keyboard/focus.

---

## 5. Backend / API / audit

- **No new read API.** All inputs (`visit`, `patient`, `pastVisits`, recent labs) are
  already loaded in the doctor workspace. The engine runs client-side in a `useMemo`,
  exactly like the interaction / max-dose checks — zero added latency, no extra reads.
- **One new audit route:** `app/api/clinical/cds-recommendation/route.ts`, mirroring
  `app/api/clinical/max-dose-acknowledged/route.ts`: `authorize("prescriptions","edit")`
  → `recordAuditEvent` with action `clinical.cds.dismissed` (and, phase 2,
  `clinical.cds.accepted`), metadata `{ ruleId, category, reason }`. Satisfies "log
  overrides." Validated by a new `cdsRecommendationSchema` in `lib/validation/clinical.ts`.

---

## 6. Data model

**Zero schema change.** The engine reads existing `OpdVisit` / `PatientRecord` fields;
vaccination is condition-triggered; dismissals are session-local + audit. Backward-
compatible by construction (additive UI + one additive audit action).

Deferred (only if practice shows a need):
- `PatientRecord.immunizations?` — would let vaccination reminders suppress once recorded
  (turns the re-firing reminder into a tracked one). Additive; adds edit UI + RBAC.
- `OpdVisit.dismissedCdsRuleIds?` — would persist dismissals per visit (quieter UX).
  Additive.

---

## 7. Non-negotiables this design keeps

Explainable (every card carries `why`) · non-blocking (advisory panel, never gates
Complete) · audited (dismiss/accept logged with actor/reason) · **no LLM in the decision
path** · conservative curated rules aligned to existing thresholds · zero added
page-load cost (client-side `useMemo`) · additive / backward-compatible · WCAG AA +
reduced-motion.

---

## 8. Phasing

1. **MVP** — engine + ~12 rules over existing data + the CDS panel + dismiss-audit route +
   unit tests. Zero schema change.
2. **Expand** — grow the rule catalog; add the `accepted` audit event + light "recommendation
   acceptance rate" analytics into the existing `DoctorAnalyticsPanel`.
3. **Optional** — immunization field and/or persisted dismissals if re-firing proves noisy
   in real use.

---

## 9. Verification (per CLAUDE.md, before calling MVP done)

```sh
npm run typecheck
npm run test        # incl. new tests/unit/decision-support.test.ts
npm run test:e2e
```
Plus driving the consultation flow in `npm run dev` with a patient who triggers several
rules (abnormal BMI + overdue follow-up + a diagnosis with investigation suggestions).
