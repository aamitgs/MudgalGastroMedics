import { describe, expect, it } from "vitest";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { evaluateDecisionSupport, type CdsContext } from "@/lib/clinical/decision-support";

function makeVisit(partial: Partial<OpdVisit> = {}): OpdVisit {
  return {
    id: "V1",
    token: "T1",
    appointmentId: "A1",
    createdAt: new Date().toISOString(),
    status: "In Consultation",
    patientName: "Test Patient",
    phone: "9999999999",
    service: "OPD",
    symptoms: [],
    billingStatus: "Not Started",
    ...partial
  };
}

function makePatient(partial: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id: "P1",
    uhid: "UH1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "Active",
    name: "Test Patient",
    phone: "9999999999",
    ...partial
  };
}

function ctx(partial: Partial<CdsContext> & { visit: OpdVisit }): CdsContext {
  return { pastVisits: [], ...partial };
}

function ids(ctxInput: CdsContext): string[] {
  return evaluateDecisionSupport(ctxInput).map((rec) => rec.ruleId);
}

describe("evaluateDecisionSupport", () => {
  it("returns nothing for an empty visit with no context to act on", () => {
    expect(evaluateDecisionSupport(ctx({ visit: makeVisit() }))).toEqual([]);
  });

  it("flags high blood pressure as a warning", () => {
    const recs = evaluateDecisionSupport(ctx({ visit: makeVisit({ vitalsBp: "160/100" }) }));
    const bp = recs.find((rec) => rec.ruleId === "risk-high-bp");
    expect(bp?.severity).toBe("warning");
    expect(bp?.why).toContain("160/100");
  });

  it("flags an obese BMI with a lifestyle-advice action", () => {
    const recs = evaluateDecisionSupport(ctx({ visit: makeVisit({ vitalsHeight: "160", vitalsWeight: "90" }) }));
    const bmi = recs.find((rec) => rec.ruleId === "risk-abnormal-bmi");
    expect(bmi?.severity).toBe("warning");
    expect(bmi?.action).toEqual({ kind: "insert-advice", text: expect.stringContaining("weight reduction") });
  });

  it("flags uncontrolled diabetes only when both high sugar and a diabetes diagnosis are present", () => {
    const withDiabetes = ids(ctx({ visit: makeVisit({ vitalsBloodSugar: "260", diagnosis: "Type 2 Diabetes Mellitus" }) }));
    expect(withDiabetes).toContain("risk-uncontrolled-diabetes");
    const highSugarNoDx = ids(ctx({ visit: makeVisit({ vitalsBloodSugar: "260" }) }));
    expect(highSugarNoDx).not.toContain("risk-uncontrolled-diabetes");
  });

  it("suggests investigations for a recognized diagnosis when none are recorded", () => {
    const recs = evaluateDecisionSupport(ctx({ visit: makeVisit({ diagnosis: "GERD with reflux" }) }));
    const inv = recs.find((rec) => rec.ruleId === "investigation-for-diagnosis");
    expect(inv?.action).toEqual({ kind: "insert-investigation", text: expect.stringContaining("Upper GI Endoscopy") });
  });

  it("does not re-suggest investigations once the doctor has recorded some", () => {
    const recs = ids(ctx({ visit: makeVisit({ diagnosis: "GERD", investigationAdvice: "CBC done" }) }));
    expect(recs).not.toContain("investigation-for-diagnosis");
  });

  it("flags long-term PPI use across visits", () => {
    const past = makeVisit({ id: "V0", prescription: "Tab Pantoprazole 40 OD" });
    const recs = ids(ctx({ visit: makeVisit({ prescription: "Tab Pantoprazole 40 OD" }), pastVisits: [past] }));
    expect(recs).toContain("med-review-long-term-ppi");
  });

  it("does not flag long-term PPI from a single visit", () => {
    const recs = ids(ctx({ visit: makeVisit({ prescription: "Tab Pantoprazole 40 OD" }) }));
    expect(recs).not.toContain("med-review-long-term-ppi");
  });

  it("warns about NSAID GI risk from the current medication list", () => {
    const recs = evaluateDecisionSupport(ctx({ visit: makeVisit(), patient: makePatient({ currentMedicines: "Diclofenac 50mg BD" }) }));
    const nsaid = recs.find((rec) => rec.ruleId === "med-review-nsaid-gi-risk");
    expect(nsaid?.severity).toBe("warning");
  });

  it("flags polypharmacy at five or more current medicines", () => {
    const patient = makePatient({ currentMedicines: "Metformin, Amlodipine, Atorvastatin, Telmisartan, Aspirin" });
    expect(ids(ctx({ visit: makeVisit(), patient }))).toContain("med-review-polypharmacy");
  });

  it("suggests colorectal screening for a 45+ patient with lower-GI symptoms and no colonoscopy on record", () => {
    const recs = ids(ctx({ visit: makeVisit({ diagnosis: "Haemorrhoids with rectal bleeding" }), patient: makePatient({ age: "52" }) }));
    expect(recs).toContain("preventive-crc-screening");
  });

  it("does not suggest colorectal screening when a colonoscopy is already recorded", () => {
    const recs = ids(ctx({ visit: makeVisit({ diagnosis: "Constipation", priorInvestigation: "Colonoscopy normal 2024" }), patient: makePatient({ age: "60" }) }));
    expect(recs).not.toContain("preventive-crc-screening");
  });

  it("suggests Hepatitis A/B vaccination for chronic liver disease", () => {
    const recs = ids(ctx({ visit: makeVisit({ diagnosis: "Cirrhosis of liver" }) }));
    expect(recs).toContain("vaccination-chronic-liver");
  });

  it("nudges to set a follow-up when a plan exists but no date is set", () => {
    const recs = evaluateDecisionSupport(ctx({ visit: makeVisit({ diagnosis: "GERD", investigationAdvice: "done" }) }));
    const followUp = recs.find((rec) => rec.ruleId === "follow-up-not-set");
    expect(followUp?.action).toEqual({ kind: "set-follow-up", days: 7 });
  });

  it("does not nudge follow-up once a date is set", () => {
    const recs = ids(ctx({ visit: makeVisit({ diagnosis: "GERD", followUpDate: "2026-08-01" }) }));
    expect(recs).not.toContain("follow-up-not-set");
  });

  it("reuses the critical-lab evaluator when recent lab text is supplied", () => {
    const recs = ids(ctx({ visit: makeVisit(), recentLabResultText: "Potassium 6.8 mmol/L" }));
    expect(recs).toContain("risk-critical-lab");
  });

  it("sorts warnings before info and gives every recommendation an explainable why", () => {
    const recs = evaluateDecisionSupport(
      ctx({
        visit: makeVisit({ vitalsBp: "160/100", diagnosis: "GERD" }),
        patient: makePatient()
      })
    );
    const firstInfo = recs.findIndex((rec) => rec.severity === "info");
    const lastWarning = recs.map((rec) => rec.severity).lastIndexOf("warning");
    if (firstInfo !== -1 && lastWarning !== -1) expect(lastWarning).toBeLessThan(firstInfo);
    for (const rec of recs) expect(rec.why.length).toBeGreaterThan(10);
  });
});
