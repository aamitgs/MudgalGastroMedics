/**
 * BMI derivation and conservative adult-normal-range flagging for vitals
 * (Track: reception vitals). Vitals are stored as free-text strings (e.g.
 * "62 kg", "120/80") to match the existing BP/Pulse/Weight fields, so every
 * helper here parses the leading number out rather than assuming a strict
 * numeric format. Advisory only — flags for doctor review, never blocks or
 * diagnoses, same posture as lib/clinical/lab-critical.ts.
 */

export type VitalFlag = "low" | "high" | null;

export function parseLeadingNumber(value?: string): number | undefined {
  const match = value?.match(/\d+(\.\d+)?/);
  if (!match) return undefined;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : undefined;
}

/** Height in cm, weight in kg — both already the units used on this pad's placeholders. */
export function computeBmi(heightInput?: string, weightInput?: string): number | undefined {
  const heightCm = parseLeadingNumber(heightInput);
  const weightKg = parseLeadingNumber(weightInput);
  if (!heightCm || !weightKg) return undefined;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number.isFinite(bmi) ? Math.round(bmi * 10) / 10 : undefined;
}

export function bmiCategory(bmi: number): "Underweight" | "Normal" | "Overweight" | "Obese" {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function flagPulse(value?: string): VitalFlag {
  const num = parseLeadingNumber(value);
  if (num === undefined) return null;
  if (num < 60) return "low";
  if (num > 100) return "high";
  return null;
}

export function flagRespiratoryRate(value?: string): VitalFlag {
  const num = parseLeadingNumber(value);
  if (num === undefined) return null;
  if (num < 12) return "low";
  if (num > 20) return "high";
  return null;
}

/** Assumes °F, the convention already on this pad. */
export function flagTemperature(value?: string): VitalFlag {
  const num = parseLeadingNumber(value);
  if (num === undefined) return null;
  if (num < 97) return "low";
  if (num > 99.5) return "high";
  return null;
}

export function flagSpo2(value?: string): VitalFlag {
  const num = parseLeadingNumber(value);
  if (num === undefined) return null;
  if (num < 95) return "low";
  return null;
}

/** Random/non-fasting-agnostic conservative band — flags for doctor review, not a diagnosis. */
export function flagBloodSugar(value?: string): VitalFlag {
  const num = parseLeadingNumber(value);
  if (num === undefined) return null;
  if (num < 70) return "low";
  if (num > 140) return "high";
  return null;
}

export function flagBp(value?: string): VitalFlag {
  const match = value?.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (systolic >= 140 || diastolic >= 90) return "high";
  if (systolic < 90 || diastolic < 60) return "low";
  return null;
}
