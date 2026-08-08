# Privacy, Consent, Retention and Access-Log Review

Technical privacy assessment of MudgalGastromedics OS, written against the
Digital Personal Data Protection Act, 2023 (DPDP) and the record-keeping duties
in the Clinical Establishments Act / NMC regulations.

This document is the **engineering half** of the `privacy` production-readiness
check. It states what the system actually does today, evidenced against code,
and lists what a human reviewer must decide. It is not itself legal sign-off —
see §8.

Status: **Draft, pending human sign-off.**
Prepared: 2026-08-07.

---

## 1. What personal data the system processes

| Category | Examples | Where |
| --- | --- | --- |
| Identifiers | Name, UHID, phone, email, address, age, gender | `lib/patient-store.ts`, `appointments` |
| Health data (sensitive) | Symptoms, diagnosis + ICD-10, prescriptions, vitals, lab orders, endoscopy/procedure notes, discharge summaries | `lib/opd-store.ts`, `lib/ipd-store.ts`, `lib/lab-store.ts` |
| Financial | Invoices, payments, payment method, refunds, insurance claims | `lib/billing-store.ts` |
| Uploaded documents | Patient-supplied reports, scans | `lib/patient-file-store.ts` |
| Authentication | Staff password hashes, patient OTP challenges, sessions | `lib/access/`, `lib/patient-access/` |
| Accountability | Audit events incl. actor IP + user agent | `lib/audit-store.ts` |

Health data is **sensitive personal data**. Every control below is scoped to
protect that category first.

## 2. Lawful basis and consent

**Findings:**

- Clinical care is delivered on the basis of the patient's engagement with the
  hospital; DPDP §7(a) (voluntary provision for the stated purpose) covers
  treatment-related processing.
- Procedure and IPD consent **is** modelled in code: `consentRecorded` /
  `consentRecordedAt` on the admission/procedure records
  (`lib/ipd-types.ts:51-52`, `lib/procedure-types.ts`). This is the
  procedure-specific informed-consent flag, captured at the point of care.
- Patient-portal access is separately authenticated by mobile OTP
  (`lib/patient-access/`), so a patient viewing their own record proves control
  of the registered phone number first.

**Gaps a reviewer must close:**

1. **No general data-processing consent notice is recorded at registration.**
   Procedure consent ≠ DPDP notice. A DPDP §5 notice (what is collected, why,
   how to withdraw, how to complain) should be presented at patient
   registration and its acceptance stored, in the patient's language
   (English/Hindi — see the i18n scope).
2. **No recorded consent for outbound communication.** Appointment emails and
   OTP SMS are transactional and defensible; any marketing or recall messaging
   needs separate, withdrawable consent.
3. **Withdrawal mechanism is undefined.** DPDP requires withdrawal to be as
   easy as giving consent. Note that withdrawal cannot delete a medical record
   still under statutory retention (§5) — the notice must say so plainly.

## 3. Access control

**Findings — this area is in good shape:**

- RBAC is **backend-enforced**: every API route calls `authorize()` before
  acting (`lib/access/guard.ts`); UI visibility is never the only gate.
- Authorization is field-sensitive, not just route-level. In
  `app/api/opd/route.ts`, clinical fields require `prescriptions:edit`, billing
  fields require `billing:edit`, and vitals deliberately require only
  `appointments:edit` because Reception records them before the doctor sees the
  patient. Least privilege is actually modelled, not approximated.
- Sessions are server-side and revocable; MFA is required for Super Admin and
  Admin; break-glass access and two-person role approvals exist.
- Patient portal sessions are scoped to the authenticated patient, and the
  billing e2e suite explicitly tests that one patient's insurance cover cannot
  settle another patient's bill — cross-patient access is regression-tested.

**Gap:** there is no periodic access review. Staff who leave must be
deactivated promptly; recommend a documented quarterly review of
`access-users`, tied to the HR leaver process.

## 4. Access logs and auditability

**Findings — strong:**

- Every mutation is audited (`lib/audit-store.ts`, fully relational) with
  actor role, actor id, action, entity type/id, severity, and a field-level
  before/after change-set (`lib/audit-diff.ts`).
- Device context — IP, user agent, method, path — is captured per
  request-scoped action (`AuditDeviceContext`, `lib/audit-types.ts:15-21`).
- Credentials are **redacted before storage**: `password`, `passwordHash`,
  `otp`, `otpHash`, `token`, `secret` and similar never enter the audit trail
  in plaintext (`DEFAULT_REDACT`, `lib/audit-diff.ts`).

**Read access is logged for named-patient reads.** Every endpoint returning one
identified patient's clinical record records an access event with actor, role,
IP, user agent and which kind of record was opened
(`lib/audit-patient-access.ts`):

| Endpoint | What it discloses | Audit action |
| --- | --- | --- |
| `GET /api/patients/summary` | Full patient context drawer | `patient.summary.viewed` |
| `GET /api/hospital-os/patient-timeline` | Cross-module clinical narrative | `hospital_os.patient_timeline.viewed` |
| `GET /api/lab?phone=` | Lab orders and results | `patient.record.viewed` |
| `GET /api/opd/previous-prescription` | Prior medicines | `patient.record.viewed` |
| `GET /api/opd/previous-visit-snapshot` | Prior vitals, diagnosis, advice | `patient.record.viewed` |
| `GET /api/patients/match` | Identity, allergies, blood group | `patient.record.viewed` |

Two scoping rules keep the trail usable. List and worklist views (the OPD
queue, paginated patient lists) are **not** logged, because routine navigation
would bury the named-patient reads. And `/api/patients/match` logs only once a
patient was actually matched — it fires while staff type a phone number, and a
lookup that disclosed nothing is not an access.

**Gaps a reviewer must still close:**

1. **The audit log has no defined retention or tamper-evidence.** It grows
   without bound and any Postgres-level actor could edit it. Recommend an
   append-only constraint and a stated retention period (§5). Read logging
   makes this more pressing, not less — the log now grows faster.
2. Audit records contain IP addresses, which are personal data themselves —
   they must be inside the retention policy, not outside it.
3. **Access records are not deduplicated**, so a workspace that re-fetches
   writes repeat entries. Deliberate — dropping access records to save space is
   the wrong trade — but it makes retention in §5 the control that keeps volume
   sane.
4. **Nobody reviews the access log.** A trail no one reads deters nothing.
   Recommend a periodic "who opened which records" report, owned alongside the
   quarterly access review in §3.

## 5. Retention

**Finding: data is still kept indefinitely.** No purge job, no TTL and no
archival tier runs today. This remains the largest gap in this review.

The *decision* half now exists: `lib/retention/policy.ts` encodes the periods
below and answers, for any record, whether retention has expired. It contains
no deletion, and `POLICY_APPROVED` is `false` until counsel confirms the table.
It is surfaced on the readiness page as the `data-retention` check.

It is built to refuse rather than guess — the same principle
`lib/billing-backfill.ts` applies to financial records, because a wrong call
here destroys a medical record instead of mis-stating a total. Two schema gaps
currently make **every clinical record undecidable**, and both must be closed
before a purge tool can be written at all:

1. **No medico-legal marker.** Medico-legal cases are retained permanently or
   per court direction, and no record carries the flag. Absence of the flag is
   absence of evidence, not evidence of absence — so the policy will not expire
   any clinical record until one exists.
2. **No date of birth.** The patients store holds `age` captured once at
   registration. A minor's record runs to three years past majority, which
   cannot be computed from an age that was true on some earlier date.

A third gap is procedural: there is no log of DPDP erasure requests, so
retention decisions and patients' exercised rights cannot be reconciled.

Statutory baseline for an Indian hospital, to be confirmed by counsel:

| Data | Proposed retention | Basis |
| --- | --- | --- |
| Outpatient / inpatient medical records | 3 years from last entry (longer if litigation is contemplated) | Clinical Establishments Act record-keeping; MCI/NMC guidance |
| Medico-legal case records | Permanent, or per court direction | Medico-legal practice |
| Records of minors | Until 3 years past majority | Limitation period runs from majority |
| Financial / tax records (invoices, claims) | 8 years | Income Tax Act |
| Audit and access logs | 3 years minimum | Must outlive the records they attest to |
| OTP challenges, expired sessions | Minutes / days — purge aggressively | No ongoing purpose |
| Backups | Per `docs/backup-policy.md` (30 days daily, 12 months monthly) | Recovery only |

**Required actions, in order.** DPDP §8(7) requires erasure once the purpose is
served and retention is no longer legally required — indefinite retention is
not a neutral default, it is a compliance failure.

1. Confirm the periods above with counsel, then set `POLICY_APPROVED` to `true`
   in `lib/retention/policy.ts`.
2. Add a medico-legal flag to OPD visits and IPD admissions, captured at
   registration/admission.
3. Capture date of birth on the patient record (keep `age` for display; derive
   it from DOB where present).
4. Log erasure requests and their outcomes.
5. Only then write the purge/archival job — and have it refuse to run while
   `POLICY_APPROVED` is false or any record assesses as `undecidable`.

Steps 2 and 3 are additive schema changes, which the standing contract allows;
neither breaks an existing record.

## 6. Security of processing

- Transport: TLS enforced to the database (`DATABASE_SSL=true`).
- Secrets live in the host secret store, never the repository; `.env.example`
  documents each one and ships no values.
- Errors never expose stack traces or internals to users (standing contract in
  `CLAUDE.md`), which also prevents data leakage through error text.
- Backups are encrypted before leaving the host (`docs/backup-policy.md` §2).
- **Gap:** no documented breach-notification runbook. DPDP requires notifying
  the Data Protection Board and affected patients. Recommend adding it to the
  on-call sheet alongside the restore procedure.

## 7. Data principal rights

DPDP grants access, correction, erasure, grievance redressal and nomination.

- **Access** — served by the patient portal (OTP-authenticated).
- **Correction** — possible via staff, and audited. No patient-initiated
  correction request flow exists.
- **Erasure** — not implemented; also constrained by §5 retention.
- **Grievance redressal** — **no published contact.** DPDP requires a named
  Data Protection Officer or equivalent contact point. This is a blocker for
  the public site, not just the OS.
- **Nomination** — not implemented.

## 8. Conclusion and sign-off

The system's **access control and audit posture are strong** and exceed what is
typical at this scale. Reads of a named patient's record are now logged
alongside writes (§4), which closes what was the largest accountability gap.

Two deficits remain:

1. **Retention** — nothing is ever deleted (§5). Highest priority, and now
   doubly so: the access log grows faster than the records it protects.
2. **Notice, grievance contact and erasure** — the patient-facing half of DPDP
   is largely absent (§2, §7). The missing published grievance contact is the
   cheapest of these to fix and is a straightforward legal requirement.

Neither is a defect in the code that exists; they are functionality not yet
built. A reviewer must decide which are acceptable at go-live for the current
patient volume, and which block it.

**This document does not itself constitute the legal review.** It is the
technical input to one. `PRIVACY_REVIEWED_AT` should be set only once a
qualified reviewer has read this, resolved the gaps in §2, §4, §5 and §7, and
signed below.

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Hospital Administrator | | | |
| Legal / DPDP adviser | | | |
| Technical owner | | | |
