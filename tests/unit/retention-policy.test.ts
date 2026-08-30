import { describe, expect, it } from "vitest";
import { POLICY_APPROVED, assessRetention, retentionPolicyBlockers } from "@/lib/retention/policy";

/**
 * The safety property under test is not "does it compute the right date" but
 * "does it ever say `eligible` when it should not". A wrong `eligible` on a
 * clinical record means destroying a medical record that cannot be recovered,
 * so every branch that lacks the data to be certain must return `undecidable`.
 */

const NOW = new Date("2026-08-08T00:00:00.000Z");
const LONG_AGO = "2015-01-01T00:00:00.000Z";
const RECENT = "2026-01-01T00:00:00.000Z";

describe("assessRetention — clinical records", () => {
  const adult = { patientAgeAtRegistration: "44", medicoLegal: false } as const;

  it("marks an adult's outpatient record eligible once the period has run", () => {
    const result = assessRetention({ category: "outpatient-record", lastActivityAt: LONG_AGO, ...adult }, NOW);
    expect(result.status).toBe("eligible");
  });

  it("retains an adult's record while the period is still running", () => {
    const result = assessRetention({ category: "outpatient-record", lastActivityAt: RECENT, ...adult }, NOW);
    expect(result.status).toBe("retain");
  });

  // Absence of the flag is absence of evidence, not evidence of absence: the
  // stores carry no medico-legal marker at all today.
  it("refuses to decide when no medico-legal marker is present", () => {
    const result = assessRetention(
      { category: "outpatient-record", lastActivityAt: LONG_AGO, patientAgeAtRegistration: "44" },
      NOW
    );
    expect(result.status).toBe("undecidable");
    if (result.status === "undecidable") expect(result.reason).toMatch(/medico-legal/i);
  });

  it("never expires a medico-legal record, however old", () => {
    const result = assessRetention(
      { category: "outpatient-record", lastActivityAt: "1990-01-01T00:00:00.000Z", patientAgeAtRegistration: "44", medicoLegal: true },
      NOW
    );
    expect(result.status).toBe("undecidable");
  });

  it("refuses to decide for a patient who was a minor at registration", () => {
    const result = assessRetention(
      { category: "outpatient-record", lastActivityAt: LONG_AGO, patientAgeAtRegistration: "9", medicoLegal: false },
      NOW
    );
    expect(result.status).toBe("undecidable");
    if (result.status === "undecidable") expect(result.reason).toMatch(/minor/i);
  });

  it("refuses to decide when age is missing or unparseable", () => {
    for (const patientAgeAtRegistration of [undefined, "", "unknown"]) {
      const result = assessRetention(
        { category: "outpatient-record", lastActivityAt: LONG_AGO, patientAgeAtRegistration, medicoLegal: false },
        NOW
      );
      expect(result.status, `age ${JSON.stringify(patientAgeAtRegistration)} must not be decidable`).toBe("undecidable");
    }
  });

  it("applies the same caution to inpatient records", () => {
    const result = assessRetention({ category: "inpatient-record", lastActivityAt: LONG_AGO }, NOW);
    expect(result.status).toBe("undecidable");
  });
});

describe("assessRetention — non-clinical records", () => {
  it("keeps financial records for the longer tax period, not the clinical one", () => {
    // Same date that is already eligible as a clinical record (3y) is still
    // retained as a financial one (8y) — the categories must not be conflated.
    const date = "2020-01-01T00:00:00.000Z";
    expect(assessRetention({ category: "financial-record", lastActivityAt: date }, NOW).status).toBe("retain");
    expect(
      assessRetention({ category: "outpatient-record", lastActivityAt: date, patientAgeAtRegistration: "44", medicoLegal: false }, NOW).status
    ).toBe("eligible");
  });

  it("expires audit logs and appointments on their own clocks", () => {
    expect(assessRetention({ category: "audit-log", lastActivityAt: LONG_AGO }, NOW).status).toBe("eligible");
    expect(assessRetention({ category: "appointment", lastActivityAt: RECENT }, NOW).status).toBe("retain");
  });

  it("treats transient auth records as immediately expired", () => {
    expect(assessRetention({ category: "transient-auth", lastActivityAt: "2026-08-07T23:00:00.000Z" }, NOW).status).toBe("eligible");
  });

  it("refuses to decide without a usable last-activity date", () => {
    for (const lastActivityAt of [undefined, "", "not a date"]) {
      expect(assessRetention({ category: "financial-record", lastActivityAt }, NOW).status).toBe("undecidable");
    }
  });
});

describe("retention policy blockers", () => {
  // A purge tool that ran against unapproved periods would be deleting medical
  // records on my say-so rather than counsel's.
  it("reports the policy as unapproved until counsel signs off", () => {
    expect(POLICY_APPROVED).toBe(false);
    expect(retentionPolicyBlockers().map((blocker) => blocker.id)).toContain("policy-unapproved");
  });

  // medicoLegal and dateOfBirth were added to OpdVisit/IpdAdmission/PatientRecord,
  // closing these two as policy-level blockers — assessRetention() still
  // correctly refuses per-record when a legacy record predates the fields
  // (covered above), which is a data gap, not a missing capability.
  it("no longer blocks on medico-legal marker or date of birth — both fields now exist", () => {
    const ids = retentionPolicyBlockers().map((blocker) => blocker.id);
    expect(ids).not.toContain("medico-legal-marker");
    expect(ids).not.toContain("date-of-birth");
  });

  it("still names the remaining real gaps", () => {
    const ids = retentionPolicyBlockers().map((blocker) => blocker.id);
    expect(ids).toContain("erasure-requests");
  });

  it("gives every blocker an actionable fix rather than just a complaint", () => {
    for (const blocker of retentionPolicyBlockers()) {
      expect(blocker.fix.length, `${blocker.id} needs a fix`).toBeGreaterThan(20);
    }
  });
});
