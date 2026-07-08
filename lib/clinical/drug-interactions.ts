import { drugTokens } from "@/lib/clinical/medication-overlap";

/**
 * Drug–drug interaction alerts (Clinical Safety, Track 0.5).
 *
 * A curated, conservative starter list of well-established high-risk
 * interaction pairs relevant to a general/GI hospital — the kind flagged in
 * standard drug-interaction references, not an exhaustive database. Each rule
 * carries an explainable mechanism and clinical guidance so the alert says
 * *why* it fired, never just "interaction detected." Advisory only: this is a
 * free-text heuristic over prescription/current-medicines notes, so it can
 * miss things and must never auto-block prescribing — it warns, and for
 * `"high"` severity, requires an explicit acknowledgement (mirroring the
 * allergy alert, Track 0.1). `"moderate"` matches stay a passive advisory
 * (mirroring the duplicate-medication check, Track 0.4) so routine warnings
 * don't dilute attention to the serious ones — alert fatigue is itself a
 * safety risk.
 */

export type DrugInteractionSeverity = "high" | "moderate";

export type DrugInteractionRule = {
  id: string;
  /** Display name + free-text aliases (generic and common brand names). */
  drugA: { label: string; aliases: string[] };
  drugB: { label: string; aliases: string[] };
  severity: DrugInteractionSeverity;
  /** Explainability: why this pairing is risky. */
  mechanism: string;
  /** What the prescriber should do about it. */
  guidance: string;
};

export const drugInteractionRules: DrugInteractionRule[] = [
  {
    id: "warfarin-nsaid",
    drugA: { label: "Warfarin", aliases: ["warfarin", "coumadin"] },
    drugB: { label: "NSAIDs", aliases: ["ibuprofen", "diclofenac", "aceclofenac", "naproxen", "ketorolac", "aspirin"] },
    severity: "high",
    mechanism: "NSAIDs displace warfarin from protein binding and independently damage the GI mucosa, compounding anticoagulant-related bleeding risk.",
    guidance: "Avoid combining. Prefer paracetamol for analgesia; if an NSAID is unavoidable, involve a physician and consider gastroprotection + closer INR monitoring."
  },
  {
    id: "warfarin-metronidazole",
    drugA: { label: "Warfarin", aliases: ["warfarin", "coumadin"] },
    drugB: { label: "Metronidazole", aliases: ["metronidazole", "metrogyl", "flagyl"] },
    severity: "high",
    mechanism: "Metronidazole inhibits warfarin metabolism (CYP2C9), sharply raising INR and bleeding risk.",
    guidance: "Avoid if possible; if metronidazole is clinically necessary, check INR more frequently and be ready to adjust the warfarin dose."
  },
  {
    id: "warfarin-macrolide",
    drugA: { label: "Warfarin", aliases: ["warfarin", "coumadin"] },
    drugB: { label: "Macrolide antibiotics", aliases: ["clarithromycin", "erythromycin"] },
    severity: "high",
    mechanism: "Macrolides inhibit warfarin metabolism, raising INR and bleeding risk.",
    guidance: "Prefer a non-interacting antibiotic where clinically appropriate; otherwise monitor INR closely during and after the course."
  },
  {
    id: "methotrexate-nsaid",
    drugA: { label: "Methotrexate", aliases: ["methotrexate"] },
    drugB: { label: "NSAIDs", aliases: ["ibuprofen", "diclofenac", "aceclofenac", "naproxen", "ketorolac", "aspirin"] },
    severity: "high",
    mechanism: "NSAIDs reduce renal clearance of methotrexate, risking methotrexate toxicity (marrow suppression, mucositis, hepatotoxicity).",
    guidance: "Avoid combining, particularly at higher methotrexate doses. Use paracetamol for pain relief instead."
  },
  {
    id: "statin-macrolide",
    drugA: { label: "Statins", aliases: ["simvastatin", "atorvastatin", "rosuvastatin", "lovastatin"] },
    drugB: { label: "Macrolide antibiotics", aliases: ["clarithromycin", "erythromycin"] },
    severity: "high",
    mechanism: "Macrolides strongly inhibit statin metabolism (CYP3A4), markedly raising statin levels and rhabdomyolysis risk.",
    guidance: "Hold the statin for the duration of the antibiotic course, or use azithromycin (a non-interacting alternative) instead."
  },
  {
    id: "domperidone-qt",
    drugA: { label: "Domperidone", aliases: ["domperidone"] },
    drugB: { label: "QT-prolonging / strong CYP3A4 inhibitors", aliases: ["clarithromycin", "erythromycin", "ketoconazole", "fluconazole", "ondansetron"] },
    severity: "high",
    mechanism: "Both domperidone and this class can prolong the QT interval / raise domperidone levels, increasing the risk of serious cardiac arrhythmia.",
    guidance: "Avoid combining. If both are clinically needed, involve a physician and consider a baseline ECG."
  },
  {
    id: "tramadol-ssri",
    drugA: { label: "Tramadol", aliases: ["tramadol"] },
    drugB: { label: "SSRIs", aliases: ["fluoxetine", "sertraline", "paroxetine", "escitalopram", "citalopram"] },
    severity: "high",
    mechanism: "Both raise serotonin activity; combining them risks serotonin syndrome (agitation, tremor, hyperthermia, autonomic instability).",
    guidance: "Avoid combining where possible. If both are necessary, warn the patient about serotonin syndrome symptoms and review promptly if they appear."
  },
  {
    id: "ace-inhibitor-spironolactone",
    drugA: { label: "ACE inhibitors", aliases: ["enalapril", "ramipril", "lisinopril", "captopril"] },
    drugB: { label: "Spironolactone", aliases: ["spironolactone"] },
    severity: "high",
    mechanism: "Both raise serum potassium; combined use risks clinically significant hyperkalemia, especially with renal impairment.",
    guidance: "Check renal function and serum potassium before and shortly after starting the combination."
  },
  {
    id: "digoxin-loop-diuretic",
    drugA: { label: "Digoxin", aliases: ["digoxin"] },
    drugB: { label: "Loop diuretics", aliases: ["furosemide", "lasix", "torsemide"] },
    severity: "moderate",
    mechanism: "Loop diuretics can cause hypokalemia, which increases the risk of digoxin toxicity even at normal digoxin levels.",
    guidance: "Monitor serum potassium and consider potassium supplementation or a digoxin level check if the patient has symptoms of toxicity."
  },
  {
    id: "sucralfate-fluoroquinolone",
    drugA: { label: "Sucralfate", aliases: ["sucralfate"] },
    drugB: { label: "Fluoroquinolones", aliases: ["ciprofloxacin", "levofloxacin", "ofloxacin", "norfloxacin"] },
    severity: "moderate",
    mechanism: "Sucralfate binds fluoroquinolones in the gut and markedly reduces their absorption, weakening the antibiotic's effect.",
    guidance: "Separate dosing by at least 2 hours (fluoroquinolone first, sucralfate after)."
  },
  {
    id: "tramadol-ondansetron",
    drugA: { label: "Tramadol", aliases: ["tramadol"] },
    drugB: { label: "Ondansetron", aliases: ["ondansetron"] },
    severity: "moderate",
    mechanism: "Ondansetron can blunt tramadol's analgesic effect and, combined with tramadol's serotonergic activity, adds a small serotonin syndrome risk.",
    guidance: "Monitor analgesia adequacy; watch for serotonin syndrome symptoms if other serotonergic drugs are also on board."
  }
];

export type DrugInteractionMatch = {
  ruleId: string;
  drugA: string;
  drugB: string;
  severity: DrugInteractionSeverity;
  mechanism: string;
  guidance: string;
};

function ruleSideMatches(side: DrugInteractionRule["drugA"], tokens: Set<string>): boolean {
  return side.aliases.some((alias) => tokens.has(alias));
}

/**
 * Checks the new prescription against the patient's current-medicines note
 * for known high-risk pairings — either a newly prescribed drug against an
 * existing one, or two interacting drugs both being newly prescribed together.
 */
export function detectDrugInteractions(prescription: string, currentMedicines: string): DrugInteractionMatch[] {
  const prescribed = drugTokens(prescription);
  const current = drugTokens(currentMedicines);
  if (!prescribed.size) return [];

  const matches: DrugInteractionMatch[] = [];
  for (const rule of drugInteractionRules) {
    const aInPrescribed = ruleSideMatches(rule.drugA, prescribed);
    const bInPrescribed = ruleSideMatches(rule.drugB, prescribed);
    const aInCurrent = ruleSideMatches(rule.drugA, current);
    const bInCurrent = ruleSideMatches(rule.drugB, current);

    const interacts = (aInPrescribed && bInCurrent) || (bInPrescribed && aInCurrent) || (aInPrescribed && bInPrescribed);
    if (!interacts) continue;

    matches.push({
      ruleId: rule.id,
      drugA: rule.drugA.label,
      drugB: rule.drugB.label,
      severity: rule.severity,
      mechanism: rule.mechanism,
      guidance: rule.guidance
    });
  }
  return matches;
}
