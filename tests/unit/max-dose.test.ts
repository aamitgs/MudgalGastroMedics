import { describe, expect, it } from "vitest";
import type { PrescriptionItem } from "@/lib/opd-types";
import { detectMaxDoseExceedances } from "@/lib/clinical/max-dose";

function item(partial: Partial<PrescriptionItem>): PrescriptionItem {
  return { id: crypto.randomUUID(), medicine: "", instruction: "", ...partial };
}

describe("detectMaxDoseExceedances", () => {
  it("does not flag paracetamol under the ceiling", () => {
    // 1000×2 + 1000×1 = 3000 mg/day, under 4 g.
    const matches = detectMaxDoseExceedances([item({ medicine: "Paracetamol", strength: "1000 mg", instruction: "bd" }), item({ medicine: "Dolo", strength: "1000 mg", instruction: "od-daily" })]);
    expect(matches).toEqual([]);
  });

  it("does not flag a dose sitting exactly at the ceiling", () => {
    // 1000 × 4 = 4000 mg/day — a valid maximum, not an overdose.
    const matches = detectMaxDoseExceedances([item({ medicine: "Dolo 1000", instruction: "custom qid" })]);
    expect(matches).toEqual([]);
  });

  it("flags a single row strictly over the ceiling", () => {
    // 1500 × 3 = 4500 mg/day.
    const matches = detectMaxDoseExceedances([item({ medicine: "Paracetamol", strength: "1500 mg", instruction: "custom tds" })]);
    const match = matches.find((entry) => entry.ruleId === "paracetamol");
    expect(match?.dailyDoseMg).toBe(4500);
    expect(match?.maxDailyMg).toBe(4000);
  });

  it("aggregates the same ingredient split across two rows (the hidden-combo trap)", () => {
    const matches = detectMaxDoseExceedances([
      item({ medicine: "Dolo 650", instruction: "custom TDS" }), // 650 × 3 = 1950
      item({ medicine: "Crocin", strength: "1 g", instruction: "custom TDS" }) // 1000 × 3 = 3000
    ]);
    const match = matches.find((entry) => entry.ruleId === "paracetamol");
    expect(match).toBeDefined();
    expect(match?.dailyDoseMg).toBe(4950);
    expect(match?.maxDailyMg).toBe(4000);
  });

  it("parses the strength embedded in the medicine name when the strength field is blank", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Dolo 650", instruction: "custom qid" })]); // 650 × 4 = 2600
    expect(matches).toEqual([]);
  });

  it("does not flag as-needed (SOS) dosing, which has no deterministic daily total", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Paracetamol", strength: "1000 mg", instruction: "sos" })]);
    expect(matches).toEqual([]);
  });

  it("skips rows with an unparseable strength rather than guessing", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Paracetamol", strength: "", instruction: "bd" })]);
    expect(matches).toEqual([]);
  });

  it("flags ibuprofen above 2.4 g/day", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Brufen", strength: "800 mg", instruction: "custom qid" })]); // 800 × 4 = 3200
    const match = matches.find((entry) => entry.ruleId === "ibuprofen");
    expect(match?.dailyDoseMg).toBe(3200);
  });

  it("handles gram units and the half-tablet preset", () => {
    // 0.5 × 1000 mg × 2/day = 1000 mg/day of tramadol — under the 400 ceiling? No: 1000 > 400.
    const matches = detectMaxDoseExceedances([item({ medicine: "Tramadol", strength: "1 g", instruction: "half-bd" })]);
    const match = matches.find((entry) => entry.ruleId === "tramadol");
    expect(match?.dailyDoseMg).toBe(1000);
    expect(match?.maxDailyMg).toBe(400);
  });

  it("ignores drugs not on the curated list", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Pantoprazole", strength: "40 mg", instruction: "custom tds" })]);
    expect(matches).toEqual([]);
  });

  it("includes an explainable rationale and guidance for every match", () => {
    const matches = detectMaxDoseExceedances([item({ medicine: "Domperidone", strength: "20 mg", instruction: "custom qid" })]); // 20 × 4 = 80 > 30
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.rationale.length).toBeGreaterThan(10);
      expect(match.guidance.length).toBeGreaterThan(10);
      expect(match.detail.length).toBeGreaterThan(0);
    }
  });
});
