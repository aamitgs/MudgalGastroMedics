import { describe, expect, it } from "vitest";
import { evaluateLabCritical } from "@/lib/clinical/lab-critical";

describe("evaluateLabCritical", () => {
  it("returns nothing for normal results", () => {
    const result = evaluateLabCritical("Hb 13.2, WBC 7.4, platelets 240, K+ 4.1, Na 139. Unremarkable panel.");
    expect(result.critical).toBe(false);
    expect(result.findings).toEqual([]);
  });

  it("flags a critical high with an explainable reason", () => {
    const result = evaluateLabCritical("Serum potassium: 6.9 mmol/L, rest of panel normal");
    expect(result.critical).toBe(true);
    expect(result.findings).toEqual([
      { analyte: "Potassium", value: 6.9, bound: "high", threshold: 6.2, unit: "mmol/L" }
    ]);
    expect(result.reasons[0]).toContain("above the critical high of 6.2");
  });

  it("flags a critical low", () => {
    const result = evaluateLabCritical("Hb 5.8 g/dL — severe anemia");
    expect(result.findings[0]).toMatchObject({ analyte: "Hemoglobin", bound: "low", threshold: 7 });
  });

  it("collects multiple findings from one summary", () => {
    const result = evaluateLabCritical("Bilirubin 18.2, INR 6.1, creatinine 2.0");
    expect(result.findings.map((f) => f.analyte)).toEqual(["Total bilirubin", "INR"]);
    expect(result.reasons).toHaveLength(2);
  });

  it("never guesses: numbers without a recognised analyte name are ignored", () => {
    expect(evaluateLabCritical("Sample collected at 6.9 am, room 160").critical).toBe(false);
  });

  it("handles separator variants (colon, equals, dash)", () => {
    expect(evaluateLabCritical("lipase= 1450").critical).toBe(true);
    expect(evaluateLabCritical("Ammonia - 130 umol/L").critical).toBe(true);
    expect(evaluateLabCritical("glucose:39").critical).toBe(true);
  });

  it("does not fire inside unrelated words", () => {
    // "sink" contains no standalone analyte token; "drink 30" must not match INR etc.
    expect(evaluateLabCritical("patient advised to drink 30 ml water hourly").critical).toBe(false);
  });
});
