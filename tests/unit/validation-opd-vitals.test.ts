import { describe, expect, it } from "vitest";
import { opdVisitUpdateSchema } from "@/lib/validation/opd";

/**
 * Vitals validation exists because live clinical records were found holding
 * vitalsBp "fdgfd", vitalsPulse "gfdgfdg" and vitalsWeight "dfgfdg" on a
 * patient under work-up for a GI bleed with chronic liver disease. Every
 * vitals field was a plain optional string, so keyboard noise stored cleanly
 * and then displayed as though a measurement had been taken.
 *
 * The two halves of the rule matter equally: reject noise, and never reject a
 * clinician's annotation. The second half is the one that would quietly make
 * staff fight the software, so it is tested at least as hard as the first.
 */

function parseVitals(vitals: Record<string, string>) {
  return opdVisitUpdateSchema.safeParse({ id: "OPD-1", ...vitals });
}

describe("OPD vitals validation", () => {
  it("rejects the exact values found in the live records", () => {
    expect(parseVitals({ vitalsBp: "fdgfd" }).success).toBe(false);
    expect(parseVitals({ vitalsPulse: "gfdgfdg" }).success).toBe(false);
    expect(parseVitals({ vitalsWeight: "dfgfdg" }).success).toBe(false);
  });

  it("accepts plain numbers", () => {
    expect(parseVitals({ vitalsBp: "127/96", vitalsPulse: "84", vitalsWeight: "78", vitalsSpo2: "98" }).success).toBe(true);
  });

  // The whole point of leaving these fields free text: staff qualify readings,
  // and a validator that rejected these would obstruct the clinical workflow
  // it is supposed to protect.
  it("accepts the annotations clinicians actually type", () => {
    const annotated: Record<string, string>[] = [
      { vitalsBp: "120/80 mmHg" },
      { vitalsBp: "130/90 (left arm)" },
      { vitalsPulse: "84 bpm" },
      { vitalsPulse: "72, irregular" },
      { vitalsSpo2: "98% on room air" },
      { vitalsTemperature: "37.2 C axillary" },
      { vitalsWeight: "78.5 kg" },
      { vitalsBloodSugar: "110 mg/dL (fasting)" },
      { vitalsRespiratoryRate: "16/min" }
    ];
    for (const vitals of annotated) {
      expect(parseVitals(vitals), `should accept ${JSON.stringify(vitals)}`).toMatchObject({ success: true });
    }
  });

  it("accepts genuinely extreme but real readings, so emergencies are recordable", () => {
    expect(parseVitals({ vitalsBp: "220/120", vitalsSpo2: "62%", vitalsPulse: "180" }).success).toBe(true);
  });

  it("treats an empty string as not recorded rather than invalid", () => {
    expect(parseVitals({ vitalsBp: "", vitalsPulse: "", vitalsWeight: "" }).success).toBe(true);
  });

  it("omitting vitals entirely stays valid — most updates do not touch them", () => {
    expect(opdVisitUpdateSchema.safeParse({ id: "OPD-1", diagnosis: "CLD (ALD)" }).success).toBe(true);
  });

  it("requires both numbers in a blood pressure, since a lone figure is ambiguous", () => {
    expect(parseVitals({ vitalsBp: "120" }).success).toBe(false);
    expect(parseVitals({ vitalsBp: "120/" }).success).toBe(false);
    expect(parseVitals({ vitalsBp: "120/80" }).success).toBe(true);
  });

  it("explains what is wrong instead of just refusing", () => {
    const result = parseVitals({ vitalsPulse: "gfdgfdg" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message).toContain("Pulse");
      expect(message).toContain("84");
    }
  });
});
