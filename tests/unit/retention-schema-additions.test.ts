import { describe, expect, it } from "vitest";
import { patientCreateSchema } from "@/lib/validation/patients";
import { opdVisitCreateSchema } from "@/lib/validation/opd";
import { ipdAdmissionCreateSchema } from "@/lib/validation/ipd";

/**
 * lib/retention/policy.ts's assessRetention() treats a missing medico-legal
 * flag or date of birth as undecidable rather than eligible for purge — see
 * retentionPolicyBlockers(). These three additive fields are what closes that
 * gap on new records; this file guards the intake contract for each.
 */

describe("patient date of birth", () => {
  const base = { name: "Test Patient", phone: "9876543210" };

  it("accepts a real past date", () => {
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: "1990-05-14" }).success).toBe(true);
  });

  it("accepts omitting it entirely — age remains the primary field", () => {
    expect(patientCreateSchema.safeParse(base).success).toBe(true);
  });

  it("treats an empty string as not recorded", () => {
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: "" }).success).toBe(true);
  });

  it("rejects a malformed date", () => {
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: "14/05/1990" }).success).toBe(false);
  });

  it("rejects a date in the future", () => {
    const nextYear = String(new Date().getFullYear() + 1);
    expect(patientCreateSchema.safeParse({ ...base, dateOfBirth: `${nextYear}-01-01` }).success).toBe(false);
  });
});

describe("OPD visit medico-legal flag", () => {
  const walkIn = { patientName: "Test Patient", phone: "9876543210", service: "OPD" };

  it("accepts a real boolean, sent as JSON by WalkInVisitForm", () => {
    const result = opdVisitCreateSchema.safeParse({ ...walkIn, medicoLegal: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.medicoLegal).toBe(true);
  });

  it("stays valid when omitted — createOpdVisit defaults it to false", () => {
    expect(opdVisitCreateSchema.safeParse(walkIn).success).toBe(true);
  });
});

describe("IPD admission medico-legal flag", () => {
  const admission = { patientName: "Test Patient", phone: "9876543210", bedId: "BED-1", consentRecorded: "true" as const };

  it("accepts the FormData-checkbox convention (string \"true\")", () => {
    expect(ipdAdmissionCreateSchema.safeParse({ ...admission, medicoLegal: "true" }).success).toBe(true);
  });

  it("is not required — unlike consentRecorded, an unchecked box must not block admission", () => {
    expect(ipdAdmissionCreateSchema.safeParse(admission).success).toBe(true);
  });

  it("rejects a real boolean — this form only ever sends FormData strings", () => {
    expect(ipdAdmissionCreateSchema.safeParse({ ...admission, medicoLegal: true }).success).toBe(false);
  });
});
