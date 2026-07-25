import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { bmiCategory, computeBmi, flagBloodSugar, flagBp, parseLeadingNumber } from "@/lib/clinical/vitals";
import { evaluateLabCritical } from "@/lib/clinical/lab-critical";
import { drugTokens } from "@/lib/clinical/medication-overlap";
import { prescriptionSummaryText } from "@/lib/prescription-instructions";

/**
 * Clinical Decision Support (CDS) — the proactive, deterministic advisory layer
 * of the OPD consultation (spec item F + Risk Alerts). Full design:
 * docs/clinical-decision-support.md.
 *
 * A curated, conservative rules engine, NOT an LLM feature — every existing
 * safety check in this codebase (drug-interactions, max-dose, lab-critical,
 * vitals, recall) is a pure-function rule table, and CDS follows the same
 * posture because the constitution requires clinical alerts to be explainable
 * (say *why*), non-blocking-by-default, and auditable — none of which an LLM in
 * the decision path can guarantee. AiVisitAssistant stays the reactive Q&A
 * layer; this is the proactive one.
 *
 * Each rule is a pure `(ctx) => CdsRecommendation | null`. The engine runs them
 * all client-side (no network, no schema read — every input is already loaded
 * in the doctor workspace), drops nulls, and sorts warnings before info. Rules
 * are deliberately narrow and reuse the existing clinical primitives rather
 * than reimplementing thresholds. Advisory only: recommendations never
 * auto-apply and never block completing the consultation.
 */

export type CdsCategory =
  | "investigation"
  | "vaccination"
  | "follow-up"
  | "medication-review"
  | "preventive-care"
  | "risk-alert";

export type CdsSeverity = "info" | "warning";

/** Optional one-click action a recommendation card can offer; wired to the same insert/commit plumbing the consultation form already uses. */
export type CdsAction =
  | { kind: "insert-investigation"; text: string }
  | { kind: "insert-advice"; text: string }
  | { kind: "set-follow-up"; days: number };

export type CdsRecommendation = {
  ruleId: string;
  category: CdsCategory;
  severity: CdsSeverity;
  title: string;
  /** Explainability — one human-readable sentence on why this fired. */
  why: string;
  action?: CdsAction;
};

export type CdsContext = {
  visit: OpdVisit;
  patient?: PatientRecord;
  /** Prior visits for the same patient — recall, long-term-medication and screening-interval rules read history, not just the current visit. */
  pastVisits: OpdVisit[];
  /** Free-text summary of the most recent lab report, when available; feeds the critical-lab reuse. Optional so the engine works without a lab fetch. */
  recentLabResultText?: string;
};

function lower(value?: string): string {
  return (value ?? "").toLowerCase();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function hasAnyDrug(tokens: Set<string>, generics: string[]): boolean {
  return generics.some((name) => tokens.has(name));
}

function visitMedicationText(visit: OpdVisit): string {
  return prescriptionSummaryText({ prescription: visit.prescription, prescriptionItems: visit.prescriptionItems });
}

// Distinctive generic names only (≥5 chars) — short brand abbreviations are
// omitted so drugTokens (which drops <4-char tokens) never false-positives a
// class check on an unrelated word.
const ppiGenerics = ["pantoprazole", "omeprazole", "esomeprazole", "rabeprazole", "lansoprazole", "dexlansoprazole"];
const nsaidGenerics = ["ibuprofen", "diclofenac", "aceclofenac", "naproxen", "ketorolac", "aspirin", "nimesulide", "etoricoxib", "indomethacin", "piroxicam"];

/**
 * Curated diagnosis→investigation suggestions. Independent, client-safe rule
 * table — deliberately NOT the server-only, doctor-editable clinical-template
 * store: this is a fixed CDS association (what to consider ordering), not the
 * template's editable documentation prose. Kept aligned with the starter
 * templates so the two never contradict.
 */
const investigationByCondition: { keywords: string[]; label: string; tests: string }[] = [
  { keywords: ["gerd", "reflux", "gastroesophageal"], label: "GERD", tests: "CBC, H. pylori test, Upper GI Endoscopy" },
  { keywords: ["fatty liver", "nafld", "steatosis"], label: "fatty liver disease", tests: "LFT, Lipid profile, Fasting blood sugar/HbA1c, USG abdomen" },
  { keywords: ["hepatitis"], label: "hepatitis", tests: "LFT, Viral hepatitis panel (HAV/HBV/HCV/HEV), PT/INR, USG abdomen" },
  { keywords: ["ibs", "irritable bowel"], label: "IBS", tests: "CBC, ESR/CRP, TSH, Stool routine/microscopy" },
  { keywords: ["gastritis"], label: "gastritis", tests: "CBC, H. pylori test, Upper GI Endoscopy if alarm symptoms" },
  { keywords: ["gall stone", "gallstone", "cholelithiasis", "cholecystitis"], label: "gallstone disease", tests: "LFT, USG abdomen, CBC" },
  { keywords: ["constipation"], label: "functional constipation", tests: "CBC, TSH, Electrolytes, Colonoscopy if red-flag features or age over 45" },
  { keywords: ["piles", "haemorrhoid", "hemorrhoid"], label: "haemorrhoids", tests: "CBC, Proctoscopy, Colonoscopy if age over 45 or red-flag features" },
  { keywords: ["fissure"], label: "anal fissure", tests: "Per-rectal / proctoscopic examination" }
];

const diabetesKeywords = ["diabet", "mellitus", "t2dm", "t1dm", "dyslipidemi"];
const chronicLiverKeywords = ["cirrhosis", "chronic liver disease", "cld", "nafld", "fatty liver", "hepatitis", "chronic hepatitis", "liver disease"];
const lowerGiSymptomKeywords = ["constipation", "piles", "haemorrhoid", "hemorrhoid", "rectal bleed", "bleeding pr", "pr bleed", "altered bowel", "change in bowel", "hematochezia", "blood in stool"];

type CdsRule = (ctx: CdsContext) => CdsRecommendation | null;

const rules: CdsRule[] = [
  // ── Risk alerts ─────────────────────────────────────────────────────────
  function highBloodPressure(ctx) {
    if (flagBp(ctx.visit.vitalsBp) !== "high") return null;
    return {
      ruleId: "risk-high-bp",
      category: "risk-alert",
      severity: "warning",
      title: "Elevated blood pressure",
      why: `Recorded blood pressure ${ctx.visit.vitalsBp} is in the hypertensive range (≥140/90 mmHg).`
    };
  },
  function abnormalBmi(ctx) {
    const bmi = computeBmi(ctx.visit.vitalsHeight, ctx.visit.vitalsWeight);
    if (bmi === undefined) return null;
    const category = bmiCategory(bmi);
    if (category === "Obese") {
      return {
        ruleId: "risk-abnormal-bmi",
        category: "risk-alert",
        severity: "warning",
        title: "BMI in obese range",
        why: `BMI ${bmi} is in the obese range (≥30).`,
        action: { kind: "insert-advice", text: "Advise weight reduction, regular exercise and dietary modification." }
      };
    }
    if (category === "Underweight") {
      return {
        ruleId: "risk-abnormal-bmi",
        category: "risk-alert",
        severity: "info",
        title: "BMI in underweight range",
        why: `BMI ${bmi} is in the underweight range (<18.5).`
      };
    }
    return null;
  },
  function uncontrolledDiabetes(ctx) {
    if (flagBloodSugar(ctx.visit.vitalsBloodSugar) !== "high") return null;
    const conditions = `${lower(ctx.visit.diagnosis)} ${lower(ctx.patient?.chronicConditions)}`;
    const hasDiabetes = includesAny(conditions, diabetesKeywords) || /\bdm\b/.test(conditions);
    if (!hasDiabetes) return null;
    return {
      ruleId: "risk-uncontrolled-diabetes",
      category: "risk-alert",
      severity: "warning",
      title: "Possibly uncontrolled diabetes",
      why: `Blood sugar ${ctx.visit.vitalsBloodSugar} is elevated in a patient with recorded diabetes.`
    };
  },
  function criticalLab(ctx) {
    if (!ctx.recentLabResultText?.trim()) return null;
    const evaluation = evaluateLabCritical(ctx.recentLabResultText);
    if (!evaluation.critical) return null;
    return {
      ruleId: "risk-critical-lab",
      category: "risk-alert",
      severity: "warning",
      title: "Critical lab value on record",
      why: evaluation.reasons.join(" ")
    };
  },

  // ── Investigation ───────────────────────────────────────────────────────
  function investigationForDiagnosis(ctx) {
    const diagnosis = lower(ctx.visit.diagnosis);
    if (!diagnosis.trim()) return null;
    // Only nudge when nothing has been recorded yet — never nag over a plan
    // the doctor has already written.
    if (ctx.visit.investigationAdvice?.trim()) return null;
    const condition = investigationByCondition.find((entry) => includesAny(diagnosis, entry.keywords));
    if (!condition) return null;
    return {
      ruleId: "investigation-for-diagnosis",
      category: "investigation",
      severity: "info",
      title: `Suggested investigations for ${condition.label}`,
      why: `A working diagnosis of ${condition.label} is recorded but no investigations are noted yet.`,
      action: { kind: "insert-investigation", text: condition.tests }
    };
  },

  // ── Medication review ───────────────────────────────────────────────────
  function longTermPpi(ctx) {
    const allVisits = [ctx.visit, ...ctx.pastVisits];
    const ppiVisitCount = allVisits.filter((visit) => hasAnyDrug(drugTokens(visitMedicationText(visit)), ppiGenerics)).length;
    const ppiInCurrentMeds = hasAnyDrug(drugTokens(lower(ctx.patient?.currentMedicines)), ppiGenerics);
    const longTerm = ppiVisitCount >= 2 || (ppiInCurrentMeds && ppiVisitCount >= 1);
    if (!longTerm) return null;
    return {
      ruleId: "med-review-long-term-ppi",
      category: "medication-review",
      severity: "info",
      title: "Review long-term PPI use",
      why: "A proton-pump inhibitor has been used across multiple visits — periodically review the continued need and lowest effective dose."
    };
  },
  function chronicNsaid(ctx) {
    const currentText = `${lower(ctx.patient?.currentMedicines)} ${visitMedicationText(ctx.visit)}`;
    if (!hasAnyDrug(drugTokens(currentText), nsaidGenerics)) return null;
    return {
      ruleId: "med-review-nsaid-gi-risk",
      category: "medication-review",
      severity: "warning",
      title: "NSAID use — GI risk",
      why: "An NSAID is on the medication list; consider GI bleeding risk and gastroprotection, especially with reflux/gastritis or anticoagulation.",
      action: { kind: "insert-advice", text: "Review NSAID need; add gastroprotection (PPI) and counsel on GI bleeding warning signs." }
    };
  },
  function polypharmacy(ctx) {
    const distinctDrugs = drugTokens(lower(ctx.patient?.currentMedicines)).size;
    if (distinctDrugs < 5) return null;
    return {
      ruleId: "med-review-polypharmacy",
      category: "medication-review",
      severity: "info",
      title: "Polypharmacy",
      why: `About ${distinctDrugs} current medicines are recorded — consider a medication reconciliation and deprescribing review.`
    };
  },

  // ── Preventive care ─────────────────────────────────────────────────────
  function colorectalScreening(ctx) {
    const age = parseLeadingNumber(ctx.patient?.age);
    if (age === undefined || age < 45) return null;
    const diagnosis = lower(ctx.visit.diagnosis);
    if (!includesAny(diagnosis, lowerGiSymptomKeywords)) return null;
    const recordText = [ctx.visit, ...ctx.pastVisits]
      .map((visit) => `${lower(visit.priorInvestigation)} ${lower(visit.investigationAdvice)} ${lower(visit.history)} ${lower(visit.clinicalNote)}`)
      .join(" ");
    if (recordText.includes("colonoscopy")) return null;
    return {
      ruleId: "preventive-crc-screening",
      category: "preventive-care",
      severity: "info",
      title: "Consider colorectal cancer screening",
      why: `Patient is ${age} with lower-GI symptoms and no colonoscopy on record — colorectal cancer screening may be indicated.`,
      action: { kind: "insert-advice", text: "Advise colorectal cancer screening (colonoscopy)." }
    };
  },
  function alcoholCounseling(ctx) {
    const text = `${lower(ctx.visit.diagnosis)} ${lower(ctx.visit.history)} ${lower(ctx.patient?.chronicConditions)}`;
    if (!includesAny(text, ["alcohol", "etoh"])) return null;
    return {
      ruleId: "preventive-alcohol-counseling",
      category: "preventive-care",
      severity: "info",
      title: "Alcohol counseling",
      why: "Alcohol use is noted — brief cessation counseling and follow-up LFT are advisable.",
      action: { kind: "insert-advice", text: "Advise alcohol cessation; repeat LFT at follow-up." }
    };
  },

  // ── Vaccination (condition-triggered — no immunization data model) ───────
  function chronicLiverVaccination(ctx) {
    const conditions = `${lower(ctx.visit.diagnosis)} ${lower(ctx.patient?.chronicConditions)}`;
    if (!includesAny(conditions, chronicLiverKeywords)) return null;
    return {
      ruleId: "vaccination-chronic-liver",
      category: "vaccination",
      severity: "info",
      title: "Consider Hepatitis A & B vaccination",
      why: "Chronic liver disease is recorded — Hepatitis A and B vaccination is recommended if the patient is not already immune."
    };
  },
  function splenectomyVaccination(ctx) {
    const conditions = `${lower(ctx.visit.diagnosis)} ${lower(ctx.visit.history)} ${lower(ctx.patient?.chronicConditions)}`;
    if (!includesAny(conditions, ["splenectom", "asplenia", "asplenic"])) return null;
    return {
      ruleId: "vaccination-asplenia",
      category: "vaccination",
      severity: "info",
      title: "Consider vaccination for asplenia",
      why: "Splenectomy / asplenia is noted — pneumococcal, meningococcal and Hib vaccination is recommended if not already given."
    };
  },

  // ── Follow-up ───────────────────────────────────────────────────────────
  function followUpNotSet(ctx) {
    if (ctx.visit.followUpDate?.trim()) return null;
    const hasPlan = Boolean(ctx.visit.diagnosis?.trim()) || Boolean(visitMedicationText(ctx.visit).trim());
    if (!hasPlan) return null;
    return {
      ruleId: "follow-up-not-set",
      category: "follow-up",
      severity: "info",
      title: "No follow-up date set",
      why: "A diagnosis or prescription is recorded but no follow-up date has been set.",
      action: { kind: "set-follow-up", days: 7 }
    };
  }
];

const severityRank: Record<CdsSeverity, number> = { warning: 0, info: 1 };

/**
 * Runs every rule against the context and returns the surviving
 * recommendations, warnings first. Deterministic and side-effect-free.
 */
export function evaluateDecisionSupport(ctx: CdsContext): CdsRecommendation[] {
  const recommendations: CdsRecommendation[] = [];
  for (const rule of rules) {
    const result = rule(ctx);
    if (result) recommendations.push(result);
  }
  return recommendations.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
