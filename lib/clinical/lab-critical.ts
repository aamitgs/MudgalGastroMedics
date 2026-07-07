/**
 * Critical (panic) value detection for lab results (Track 0.2).
 *
 * Curated, conservative panic thresholds for analytes relevant to a GI
 * hospital. These are widely published critical-notification values, kept
 * deliberately conservative — they flag for HUMAN review, they never diagnose,
 * and they should be aligned with the laboratory's own reference intervals
 * before being tightened. Detection parses the free-text result summary
 * conservatively: a value only counts when it sits directly next to a known
 * analyte name, so nothing is ever guessed.
 */

export type LabCriticalThreshold = {
  analyte: string;
  /** Names/abbreviations recognised in result text (case-insensitive). */
  aliases: string[];
  unit: string;
  low?: number;
  high?: number;
};

export const labCriticalThresholds: LabCriticalThreshold[] = [
  { analyte: "Potassium", aliases: ["potassium", "k\\+", "serum k"], unit: "mmol/L", low: 2.8, high: 6.2 },
  { analyte: "Sodium", aliases: ["sodium", "na\\+", "serum na"], unit: "mmol/L", low: 120, high: 160 },
  { analyte: "Hemoglobin", aliases: ["hemoglobin", "haemoglobin", "hb", "hgb"], unit: "g/dL", low: 7, high: 20 },
  { analyte: "Platelets", aliases: ["platelets?", "plt"], unit: "x10^3/uL", low: 50, high: 1000 },
  { analyte: "Glucose", aliases: ["glucose", "rbs", "fbs", "blood sugar"], unit: "mg/dL", low: 50, high: 450 },
  { analyte: "Creatinine", aliases: ["creatinine", "creat"], unit: "mg/dL", high: 7 },
  { analyte: "Total bilirubin", aliases: ["total bilirubin", "bilirubin", "t\\.? ?bili"], unit: "mg/dL", high: 15 },
  { analyte: "INR", aliases: ["inr"], unit: "", high: 5 },
  { analyte: "WBC", aliases: ["wbc", "white cell count", "tlc"], unit: "x10^3/uL", low: 2, high: 30 },
  { analyte: "Amylase", aliases: ["amylase"], unit: "U/L", high: 600 },
  { analyte: "Lipase", aliases: ["lipase"], unit: "U/L", high: 1000 },
  { analyte: "Ammonia", aliases: ["ammonia", "nh3"], unit: "umol/L", high: 100 }
];

export type LabCriticalFinding = {
  analyte: string;
  value: number;
  bound: "low" | "high";
  threshold: number;
  unit: string;
};

export type LabCriticalEvaluation = {
  critical: boolean;
  findings: LabCriticalFinding[];
  /** Explainability: one human-readable sentence per finding. */
  reasons: string[];
};

function describe(finding: LabCriticalFinding) {
  const direction = finding.bound === "low" ? "below the critical low of" : "above the critical high of";
  const unit = finding.unit ? ` ${finding.unit}` : "";
  return `${finding.analyte} ${finding.value}${unit} is ${direction} ${finding.threshold}${unit}.`;
}

/** Evaluates free result text against the curated panic thresholds. */
export function evaluateLabCritical(resultText: string): LabCriticalEvaluation {
  const findings: LabCriticalFinding[] = [];
  const seen = new Set<string>();
  const text = resultText.toLowerCase();

  for (const threshold of labCriticalThresholds) {
    if (seen.has(threshold.analyte)) continue;
    for (const alias of threshold.aliases) {
      const pattern = new RegExp(`(?:^|[^a-z])${alias}[\\s:=-]*(\\d+(?:\\.\\d+)?)`, "i");
      const match = pattern.exec(text);
      if (!match) continue;
      const value = Number(match[1]);
      if (!Number.isFinite(value)) continue;
      if (threshold.low !== undefined && value < threshold.low) {
        findings.push({ analyte: threshold.analyte, value, bound: "low", threshold: threshold.low, unit: threshold.unit });
        seen.add(threshold.analyte);
      } else if (threshold.high !== undefined && value > threshold.high) {
        findings.push({ analyte: threshold.analyte, value, bound: "high", threshold: threshold.high, unit: threshold.unit });
        seen.add(threshold.analyte);
      }
      break;
    }
  }

  return { critical: findings.length > 0, findings, reasons: findings.map(describe) };
}
