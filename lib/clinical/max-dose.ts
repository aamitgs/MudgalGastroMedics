import type { PrescriptionItem } from "@/lib/opd-types";

/**
 * Maximum-daily-dose alerts (Clinical Safety — completes the item-12 quartet
 * alongside allergy (Track 0.1), duplicate-medication (Track 0.4) and drug–
 * drug interaction (Track 0.5) checks).
 *
 * A curated, conservative starter list of adult daily-dose ceilings for drugs
 * where exceeding the cap causes real, well-established harm — led by
 * paracetamol, whose hepatotoxicity ceiling matters most in a GI/hepatology
 * practice and is classically breached by the same ingredient hiding in two
 * products at once. Each rule carries an explainable rationale and clinical
 * guidance so the alert says *why* it fired, never just "dose exceeded."
 *
 * Deliberately narrow to avoid alert fatigue (itself a safety risk):
 *  - Only the STRUCTURED Rx rows are evaluated — they carry a discrete strength
 *    and a frequency, so a real daily total can be computed. Free-text
 *    prescription notes are not parsed for dosing; there is nothing reliable to
 *    compute from them.
 *  - Doses are AGGREGATED per active ingredient across all rows, catching the
 *    split-across-two-products case that single-row checks miss.
 *  - When strength or frequency can't be parsed (e.g. SOS/PRN, blank strength),
 *    the row is skipped rather than guessed at — no false alarm.
 *  - Fires only when the ceiling is strictly exceeded (a dose exactly at the
 *    max is a valid maximum, not an overdose).
 *
 * Advisory only: like the interaction check it warns and, because a breached
 * ceiling is serious by definition, requires an explicit acknowledgement — but
 * it never blocks prescribing.
 */

export type MaxDoseRule = {
  id: string;
  /** Display name for the alert. */
  label: string;
  /** Normalized-lowercase generic + common Indian brand names (single-ingredient only — combination brands are omitted to avoid mis-attributing a dose). */
  aliases: string[];
  /** Adult ceiling in milligrams per day. */
  maxDailyMg: number;
  /** Explainability: why exceeding this ceiling is harmful. */
  rationale: string;
  /** What the prescriber should do about it. */
  guidance: string;
};

export const maxDoseRules: MaxDoseRule[] = [
  {
    id: "paracetamol",
    label: "Paracetamol",
    aliases: ["paracetamol", "acetaminophen", "pcm", "dolo", "calpol", "crocin", "metacin", "pacimol", "pyrigesic", "sumo"],
    maxDailyMg: 4000,
    rationale: "Above ~4 g/day paracetamol causes dose-dependent hepatotoxicity; the risk is higher still in liver disease, chronic alcohol use, the elderly and low body weight.",
    guidance: "Keep the total at or below 4 g/day (consider 3 g/day in hepatic impairment, low weight or the elderly). Check for paracetamol also hidden in combination products before increasing."
  },
  {
    id: "ibuprofen",
    label: "Ibuprofen",
    aliases: ["ibuprofen", "brufen", "ibugesic"],
    maxDailyMg: 2400,
    rationale: "Beyond ~2.4 g/day ibuprofen sharply raises the risk of GI bleeding, renal impairment and cardiovascular events without added analgesic benefit.",
    guidance: "Keep at or below 2.4 g/day, use the lowest effective dose for the shortest duration, and add gastroprotection in at-risk patients."
  },
  {
    id: "diclofenac",
    label: "Diclofenac",
    aliases: ["diclofenac", "voveran", "voltaren", "dynapar"],
    maxDailyMg: 150,
    rationale: "Above 150 mg/day diclofenac carries a well-documented rise in GI bleeding and thrombotic cardiovascular risk.",
    guidance: "Keep at or below 150 mg/day; prefer paracetamol or a safer analgesic where the patient has GI or cardiovascular risk factors."
  },
  {
    id: "tramadol",
    label: "Tramadol",
    aliases: ["tramadol", "tramazac", "domadol", "contramal"],
    maxDailyMg: 400,
    rationale: "Above 400 mg/day tramadol markedly increases the risk of seizures and serotonin toxicity.",
    guidance: "Keep at or below 400 mg/day (lower in the elderly or renal impairment); reassess the pain regimen rather than escalating further."
  },
  {
    id: "domperidone",
    label: "Domperidone",
    aliases: ["domperidone", "domstal", "motilium", "vomistop"],
    maxDailyMg: 30,
    rationale: "Above 30 mg/day domperidone prolongs the QT interval and raises the risk of serious cardiac arrhythmia and sudden cardiac death.",
    guidance: "Keep at or below 30 mg/day for the shortest duration; review cardiac risk and avoid combining with other QT-prolonging drugs."
  },
  {
    id: "metoclopramide",
    label: "Metoclopramide",
    aliases: ["metoclopramide", "perinorm", "reglan", "maxeron"],
    maxDailyMg: 30,
    rationale: "Above 30 mg/day (or courses beyond 5 days) metoclopramide raises the risk of extrapyramidal reactions and tardive dyskinesia.",
    guidance: "Keep at or below 30 mg/day and limit to 5 days; watch for acute dystonia, especially in younger patients and the elderly."
  },
  {
    id: "ondansetron",
    label: "Ondansetron",
    aliases: ["ondansetron", "emeset", "ondem", "vomikind", "zofran", "osetron"],
    maxDailyMg: 24,
    rationale: "Above 24 mg/day (oral) ondansetron causes dose-dependent QT prolongation and torsades de pointes risk.",
    guidance: "Keep at or below 24 mg/day; correct electrolytes and avoid combining with other QT-prolonging drugs."
  }
];

export type MaxDoseMatch = {
  ruleId: string;
  drug: string;
  /** Computed total daily dose, milligrams, rounded for display. */
  dailyDoseMg: number;
  maxDailyMg: number;
  rationale: string;
  guidance: string;
  /** Per-row breakdown of how the total was reached, e.g. "650 mg × 3/day + 500 mg × 2/day". */
  detail: string;
};

function nameTokens(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z]+/).filter(Boolean));
}

function matchRule(medicine: string): MaxDoseRule | null {
  const tokens = nameTokens(medicine);
  if (!tokens.size) return null;
  for (const rule of maxDoseRules) {
    if (rule.aliases.some((alias) => tokens.has(alias))) return rule;
  }
  return null;
}

/**
 * Per-dose strength in milligrams. Reads the strength field first, falling
 * back to a strength embedded in the medicine name (e.g. "Dolo 650"). Returns
 * null when nothing numeric is present — the row is then skipped, never guessed.
 */
function parsePerDoseMg(item: PrescriptionItem): number | null {
  const source = (item.strength ?? "").trim() || item.medicine;
  const match = source.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|gm|gram|grams|g)?/i);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = (match[2] ?? "mg").toLowerCase();
  if (unit === "mcg") return value / 1000;
  if (unit === "g" || unit === "gm" || unit === "gram" || unit === "grams") return value * 1000;
  return value;
}

/**
 * Doses per day and the tablet fraction implied by the instruction. Handles
 * the prescription-pad presets plus common free-typed shorthand (OD/BD/TDS/
 * QID and their variants). Returns null for as-needed dosing (SOS/PRN) or when
 * no recognizable frequency is present, so those rows don't contribute a
 * fabricated daily total.
 */
function parseDailyFrequency(instruction: string): { dosesPerDay: number; fraction: number } | null {
  const presets: Record<string, { dosesPerDay: number; fraction: number }> = {
    bd: { dosesPerDay: 2, fraction: 1 },
    "half-bd": { dosesPerDay: 2, fraction: 0.5 },
    "od-breakfast": { dosesPerDay: 1, fraction: 1 },
    "od-daily": { dosesPerDay: 1, fraction: 1 }
    // sos / half-sos are as-needed — intentionally absent (no deterministic daily total).
  };
  if (instruction in presets) return presets[instruction];

  const text = instruction.toLowerCase();
  if (/\bsos\b|\bprn\b|as needed|as required/.test(text)) return null;
  const fraction = /\bhalf\b|½|1\/2/.test(text) ? 0.5 : 1;

  let dosesPerDay: number | null = null;
  if (/\bqid\b|\bqds\b|\bq6h\b|four times|4 times/.test(text)) dosesPerDay = 4;
  else if (/\btds\b|\btid\b|\bq8h\b|thrice|three times|3 times/.test(text)) dosesPerDay = 3;
  else if (/\bbd\b|\bbid\b|\bq12h\b|twice|2 times/.test(text)) dosesPerDay = 2;
  else if (/\bod\b|\bhs\b|\bqhs\b|\bq24h\b|\bonce\b|\bdaily\b|1 time/.test(text)) dosesPerDay = 1;
  if (dosesPerDay === null) return null;

  return { dosesPerDay, fraction };
}

function formatMg(value: number): string {
  const rounded = Math.round(value);
  return rounded >= 1000 && rounded % 1000 === 0 ? `${rounded / 1000} g` : `${rounded} mg`;
}

/**
 * Aggregates the structured Rx rows by active ingredient and returns the drugs
 * whose computed total daily dose strictly exceeds their curated ceiling.
 * Rows with an unrecognized drug, unparseable strength, or as-needed frequency
 * contribute nothing and never trigger a false alarm.
 */
export function detectMaxDoseExceedances(items: PrescriptionItem[]): MaxDoseMatch[] {
  const totals = new Map<string, { rule: MaxDoseRule; dailyMg: number; contributors: string[] }>();

  for (const item of items) {
    if (!item.medicine.trim()) continue;
    const rule = matchRule(item.medicine);
    if (!rule) continue;
    const perDose = parsePerDoseMg(item);
    if (perDose === null) continue;
    const frequency = parseDailyFrequency(item.instruction);
    if (!frequency) continue;
    const dailyMg = perDose * frequency.dosesPerDay * frequency.fraction;
    if (dailyMg <= 0) continue;

    const entry = totals.get(rule.id) ?? { rule, dailyMg: 0, contributors: [] };
    entry.dailyMg += dailyMg;
    entry.contributors.push(`${formatMg(perDose)} × ${frequency.dosesPerDay}/day${frequency.fraction !== 1 ? " (half tablet)" : ""}`);
    totals.set(rule.id, entry);
  }

  const matches: MaxDoseMatch[] = [];
  for (const { rule, dailyMg, contributors } of totals.values()) {
    if (dailyMg > rule.maxDailyMg) {
      matches.push({
        ruleId: rule.id,
        drug: rule.label,
        dailyDoseMg: Math.round(dailyMg),
        maxDailyMg: rule.maxDailyMg,
        rationale: rule.rationale,
        guidance: rule.guidance,
        detail: contributors.join(" + ")
      });
    }
  }
  return matches;
}
