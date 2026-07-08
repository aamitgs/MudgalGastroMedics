import { describe, expect, it } from "vitest";
import { detectDrugInteractions } from "@/lib/clinical/drug-interactions";

describe("detectDrugInteractions", () => {
  it("flags a high-risk pair when the new prescription interacts with a current medicine", () => {
    const matches = detectDrugInteractions("Tab Ibuprofen 400mg TDS", "Warfarin 5mg OD");
    expect(matches.some((match) => match.ruleId === "warfarin-nsaid")).toBe(true);
    expect(matches.find((match) => match.ruleId === "warfarin-nsaid")?.severity).toBe("high");
  });

  it("flags two interacting drugs newly prescribed together", () => {
    const matches = detectDrugInteractions("Tab Tramadol 50mg + Cap Fluoxetine 20mg", "");
    expect(matches.some((match) => match.ruleId === "tramadol-ssri")).toBe(true);
  });

  it("matches a drug class alias against any member (NSAID class vs methotrexate)", () => {
    const matches = detectDrugInteractions("Tab Diclofenac 50mg BD", "Methotrexate 10mg weekly");
    expect(matches.some((match) => match.ruleId === "methotrexate-nsaid")).toBe(true);
  });

  it("returns a moderate-severity match for the sucralfate/fluoroquinolone pair", () => {
    const matches = detectDrugInteractions("Syp Sucralfate 10ml", "Ciprofloxacin 500mg BD");
    const match = matches.find((entry) => entry.ruleId === "sucralfate-fluoroquinolone");
    expect(match?.severity).toBe("moderate");
  });

  it("returns empty when there is no known interaction", () => {
    const matches = detectDrugInteractions("Tab Pantoprazole 40mg OD", "Metformin 500mg BD");
    expect(matches).toEqual([]);
  });

  it("returns empty when the prescription is blank", () => {
    expect(detectDrugInteractions("", "Warfarin 5mg OD")).toEqual([]);
  });

  it("does not flag a drug against itself", () => {
    const matches = detectDrugInteractions("Tab Warfarin 5mg OD", "Warfarin 5mg OD");
    expect(matches).toEqual([]);
  });

  it("includes an explainable mechanism and guidance for every match", () => {
    const matches = detectDrugInteractions("Tab Ibuprofen 400mg TDS", "Warfarin 5mg OD");
    for (const match of matches) {
      expect(match.mechanism.length).toBeGreaterThan(10);
      expect(match.guidance.length).toBeGreaterThan(10);
    }
  });
});
