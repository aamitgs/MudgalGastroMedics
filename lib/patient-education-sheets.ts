import { getPrepChecklist } from "@/lib/procedure-prep";

export type PatientEducationSheet = {
  key: string;
  title: string;
  points: string[];
};

/**
 * Diagnosis-based diet/lifestyle handouts (Track: patient education sheets)
 * — general, non-prescriptive advice (no dosing, no diagnosis-specific
 * medical claims this app isn't positioned to assert), same conservative
 * tone as lib/procedure-prep.ts. Standard published lifestyle guidance for
 * these conditions, meant to be handed to the patient alongside — never
 * instead of — the doctor's own verbal advice.
 */
const dietSheets: PatientEducationSheet[] = [
  {
    key: "gerd-diet",
    title: "GERD Diet & Lifestyle Advice",
    points: [
      "Eat smaller, more frequent meals instead of large ones.",
      "Avoid spicy, fried, and fatty foods.",
      "Limit tea, coffee, chocolate, and carbonated drinks.",
      "Avoid lying down for 2-3 hours after eating.",
      "Elevate the head end of your bed by 6-8 inches.",
      "Avoid tight clothing around the waist.",
      "If overweight, gradual weight loss can help significantly.",
      "Avoid smoking and alcohol."
    ]
  },
  {
    key: "fatty-liver-diet",
    title: "Fatty Liver Diet & Lifestyle Advice",
    points: [
      "Aim for gradual weight loss (0.5-1 kg per week) if overweight.",
      "Choose whole grains over refined flour and sugar.",
      "Limit fried and oily food; use minimal oil in cooking.",
      "Avoid alcohol completely.",
      "Include more vegetables, fruits, and fibre in your diet.",
      "Exercise at least 30 minutes a day, 5 days a week.",
      "Keep blood sugar and cholesterol under control.",
      "Get liver function tests repeated as advised."
    ]
  },
  {
    key: "ibs-diet",
    title: "IBS Diet & Lifestyle Advice",
    points: [
      "Eat meals at regular times each day.",
      "Identify and avoid foods that trigger your symptoms.",
      "Limit caffeine, carbonated drinks, and artificial sweeteners.",
      "Increase soluble fibre gradually (oats, fruits) if constipated.",
      "Drink plenty of water through the day.",
      "Practice stress-reduction techniques — stress often worsens IBS.",
      "Regular physical activity can help regulate bowel habits.",
      "Keep a food-symptom diary to identify your personal triggers."
    ]
  }
];

/**
 * Procedure-prep sheets reuse lib/procedure-prep.ts's existing bilingual
 * checklist generator (already the single source of truth for the public
 * procedure page and its own downloadable PDF) instead of maintaining a
 * second copy of the same instructions — only the English line is used
 * here since this PDF matches the clinical-document branding, not the
 * public site's bilingual layout.
 */
function procedureSheet(key: string, slug: string, title: string): PatientEducationSheet {
  return {
    key,
    title,
    points: getPrepChecklist(slug).map((item) => `${item.timing}: ${item.instruction}`)
  };
}

export function getPatientEducationSheets(): PatientEducationSheet[] {
  return [
    ...dietSheets,
    procedureSheet("endoscopy-instructions", "endoscopy", "Upper GI Endoscopy — Instructions"),
    procedureSheet("colonoscopy-preparation", "colonoscopy", "Colonoscopy — Preparation Instructions")
  ];
}

export function getPatientEducationSheet(key: string): PatientEducationSheet | undefined {
  return getPatientEducationSheets().find((sheet) => sheet.key === key);
}
