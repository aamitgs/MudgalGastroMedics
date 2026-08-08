/**
 * Data retention policy (DPDP §8(7) / docs/privacy-review.md §5).
 *
 * Nothing in this system is ever deleted today, and indefinite retention of
 * patient data is not a neutral default — it is a compliance failure. This
 * module is the first half of fixing that: it decides, for a given record,
 * whether retention has expired. It deliberately contains **no deletion**.
 *
 * It follows the principle `lib/billing-backfill.ts` already establishes for
 * financial records — "a backfill that guesses is worse than one that refuses"
 * — because the stakes here are higher still. A wrong decision does not
 * mis-state a total; it destroys a medical record that cannot be recovered.
 * So `assessRetention` returns `undecidable` wherever it cannot prove the
 * answer, and only ever returns `eligible` when it can.
 *
 * The periods below are PROPOSED, not approved. They are drawn from the
 * statutory baseline in docs/privacy-review.md §5 and must be confirmed by
 * counsel before anything acts on them — which is why `POLICY_APPROVED` is
 * false and `retentionPolicyBlockers()` reports what still stands in the way.
 */

export type RetentionCategory =
  | "outpatient-record"
  | "inpatient-record"
  | "financial-record"
  | "audit-log"
  | "appointment"
  | "transient-auth";

export type RetentionRule = {
  category: RetentionCategory;
  label: string;
  /** Retention measured from the record's last activity. */
  years: number;
  /** The obligation the period comes from — never invent one. */
  basis: string;
};

/**
 * Set to true only once counsel has signed off docs/privacy-review.md §5.
 * Any future purge tool must refuse to run while this is false.
 */
export const POLICY_APPROVED = false;

export const RETENTION_RULES: Record<RetentionCategory, RetentionRule> = {
  "outpatient-record": {
    category: "outpatient-record",
    label: "Outpatient clinical record",
    years: 3,
    basis: "Clinical Establishments Act record-keeping; NMC guidance (3 years from last entry)"
  },
  "inpatient-record": {
    category: "inpatient-record",
    label: "Inpatient clinical record",
    years: 3,
    basis: "Clinical Establishments Act record-keeping; NMC guidance (3 years from last entry)"
  },
  "financial-record": {
    category: "financial-record",
    label: "Invoice, payment or insurance claim",
    years: 8,
    basis: "Income Tax Act record-keeping"
  },
  "audit-log": {
    category: "audit-log",
    label: "Audit and access log",
    years: 3,
    basis: "Must outlive the clinical records it attests to"
  },
  appointment: {
    category: "appointment",
    label: "Appointment booking",
    years: 3,
    basis: "Tracks alongside the clinical record it belongs to"
  },
  "transient-auth": {
    category: "transient-auth",
    label: "OTP challenge or expired session",
    years: 0,
    basis: "No ongoing purpose once used or expired — purge aggressively"
  }
};

export type RetentionAssessment =
  | { status: "retain"; retainUntil: string; rule: RetentionRule }
  | { status: "eligible"; retainUntil: string; rule: RetentionRule }
  | { status: "undecidable"; reason: string; rule: RetentionRule };

export type RetentionInput = {
  category: RetentionCategory;
  /** Last entry on the record — creation is not enough; activity extends retention. */
  lastActivityAt: string | undefined;
  /**
   * Age recorded at registration, as the patients store holds it (a string,
   * captured once). Only consulted for clinical categories.
   */
  patientAgeAtRegistration?: string;
  /** True when the record is flagged as a medico-legal case. */
  medicoLegal?: boolean;
};

function addYears(iso: string, years: number) {
  const date = new Date(iso);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

/**
 * Whether a record's retention has expired.
 *
 * Returns `undecidable` — never `eligible` — whenever the data needed to be
 * certain is missing. Each such case is a schema gap reported by
 * `retentionPolicyBlockers()`, not a judgement call to be made per record.
 */
export function assessRetention(input: RetentionInput, now = new Date()): RetentionAssessment {
  const rule = RETENTION_RULES[input.category];

  if (!input.lastActivityAt || Number.isNaN(new Date(input.lastActivityAt).getTime())) {
    return { status: "undecidable", reason: "No usable last-activity date, so retention cannot be measured from anything.", rule };
  }

  const clinical = input.category === "outpatient-record" || input.category === "inpatient-record";

  if (clinical) {
    // Medico-legal records are kept permanently or per court direction. The
    // stores carry no such flag today, so absence of the flag is absence of
    // evidence, not evidence of absence.
    if (input.medicoLegal === undefined) {
      return {
        status: "undecidable",
        reason: "No medico-legal marker exists on this record, and medico-legal cases must be retained permanently.",
        rule
      };
    }
    if (input.medicoLegal) {
      return { status: "undecidable", reason: "Medico-legal case — retained permanently or per court direction.", rule };
    }

    // A minor's record runs until three years past majority, which needs a
    // date of birth. The patients store holds `age` captured once at
    // registration, which cannot be aged forward reliably.
    const age = Number(String(input.patientAgeAtRegistration ?? "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(age) || age === 0) {
      return { status: "undecidable", reason: "Patient age is unknown, so a minor's extended retention cannot be ruled out.", rule };
    }
    if (age < 18) {
      return {
        status: "undecidable",
        reason: "Patient was a minor at registration; retention runs to three years past majority, which needs a date of birth the record does not hold.",
        rule
      };
    }
  }

  const retainUntil = addYears(input.lastActivityAt, rule.years);
  return {
    status: new Date(retainUntil).getTime() > now.getTime() ? "retain" : "eligible",
    retainUntil,
    rule
  };
}

export type RetentionBlocker = { id: string; summary: string; fix: string };

/**
 * What must be resolved before any purge tool may run.
 *
 * Reported as policy-level blockers rather than per-record noise: each is a
 * missing capability, and no amount of per-record care compensates for one.
 */
export function retentionPolicyBlockers(): RetentionBlocker[] {
  const blockers: RetentionBlocker[] = [
    {
      id: "medico-legal-marker",
      summary: "No medico-legal case marker exists on clinical records.",
      fix: "Add a medicoLegal flag to OPD visits and IPD admissions, set at registration/admission. Until then every clinical record is undecidable."
    },
    {
      id: "date-of-birth",
      summary: "Patients store an age captured at registration, not a date of birth.",
      fix: "Capture date of birth so a minor's retention (to three years past majority) can be computed. Age alone cannot be aged forward."
    },
    {
      id: "erasure-requests",
      summary: "There is no record of patient erasure requests to honour or refuse.",
      fix: "Log DPDP erasure requests with their outcome, so retention decisions and patient rights are reconcilable."
    }
  ];

  if (!POLICY_APPROVED) {
    blockers.unshift({
      id: "policy-unapproved",
      summary: "Retention periods are proposed, not approved by counsel.",
      fix: "Confirm the periods in docs/privacy-review.md §5, then set POLICY_APPROVED to true."
    });
  }

  return blockers;
}
