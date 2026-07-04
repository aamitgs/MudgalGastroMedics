import { describe, expect, it } from "vitest";
import { detectMedicationOverlap } from "@/lib/clinical/medication-overlap";

describe("detectMedicationOverlap", () => {
  it("flags a drug prescribed that is already in current medicines", () => {
    const overlap = detectMedicationOverlap(
      "Tab Pantoprazole 40mg OD x 14 days",
      "Pantoprazole 40mg, Metformin 500mg"
    );
    expect(overlap).toContain("pantoprazole");
  });

  it("ignores dosage forms, units and frequency noise words", () => {
    const overlap = detectMedicationOverlap(
      "Tab Amoxicillin 500mg TDS x 5 days",
      "Tablet Paracetamol 650mg BD"
    );
    // "tab"/"tablet"/"mg"/"tds"/"bd"/"days" must not count as matches
    expect(overlap).toEqual([]);
  });

  it("returns empty when either input is blank", () => {
    expect(detectMedicationOverlap("", "Pantoprazole")).toEqual([]);
    expect(detectMedicationOverlap("Pantoprazole", "")).toEqual([]);
  });

  it("matches case-insensitively and across punctuation", () => {
    const overlap = detectMedicationOverlap("SYP SUCRALFATE 10ml", "sucralfate suspension");
    expect(overlap).toContain("sucralfate");
  });

  it("does not false-match on shared instruction words only", () => {
    const overlap = detectMedicationOverlap("Take with food after meals", "take before food daily");
    expect(overlap).toEqual([]);
  });
});
