export type Icd10Entry = { code: string; label: string };

/**
 * Curated GI/hepatology ICD-10-CM subset (Track: ICD-10 coding) — real,
 * published codes for the conditions this hospital actually treats, not the
 * full national catalog (tens of thousands of codes across every
 * specialty) and not SNOMED CT, which is separately, restrictively
 * licensed in most countries and isn't something this app can ship without
 * acquiring that license first. Attaching a code is optional and doctor-
 * chosen — never inferred automatically from the free-text diagnosis.
 */
export const icd10Codes: Icd10Entry[] = [
  { code: "K21.9", label: "Gastro-esophageal reflux disease without esophagitis" },
  { code: "K21.0", label: "Gastro-esophageal reflux disease with esophagitis" },
  { code: "K22.10", label: "Ulcer of esophagus without bleeding" },
  { code: "K29.0", label: "Acute gastritis" },
  { code: "K29.50", label: "Chronic gastritis, unspecified, without bleeding" },
  { code: "K29.7", label: "Gastritis, unspecified" },
  { code: "K25.9", label: "Gastric ulcer, unspecified, without hemorrhage or perforation" },
  { code: "K27.9", label: "Peptic ulcer, site unspecified" },
  { code: "K30", label: "Functional dyspepsia" },
  { code: "K58.0", label: "Irritable bowel syndrome with diarrhea" },
  { code: "K58.9", label: "Irritable bowel syndrome without diarrhea" },
  { code: "K59.00", label: "Constipation, unspecified" },
  { code: "K52.9", label: "Noninfective gastroenteritis and colitis, unspecified" },
  { code: "A09", label: "Infectious gastroenteritis and colitis, unspecified" },
  { code: "K76.0", label: "Fatty (change of) liver, not elsewhere classified" },
  { code: "K74.60", label: "Unspecified cirrhosis of liver" },
  { code: "K70.30", label: "Alcoholic cirrhosis of liver without ascites" },
  { code: "K75.9", label: "Inflammatory liver disease, unspecified" },
  { code: "B15.9", label: "Hepatitis A without hepatic coma" },
  { code: "B16.9", label: "Acute hepatitis B without delta-agent and without hepatic coma" },
  { code: "B17.10", label: "Acute hepatitis C without hepatic coma" },
  { code: "B19.20", label: "Unspecified viral hepatitis C without hepatic coma" },
  { code: "K80.00", label: "Calculus of gallbladder with acute cholecystitis, without obstruction" },
  { code: "K80.20", label: "Calculus of gallbladder without cholecystitis, without obstruction" },
  { code: "K81.9", label: "Cholecystitis, unspecified" },
  { code: "K85.9", label: "Acute pancreatitis, unspecified" },
  { code: "K86.1", label: "Other chronic pancreatitis" },
  { code: "K64.9", label: "Unspecified hemorrhoids" },
  { code: "K60.2", label: "Anal fissure, unspecified" },
  { code: "K62.5", label: "Hemorrhage of anus and rectum" },
  { code: "K51.90", label: "Ulcerative colitis, unspecified, without complications" },
  { code: "K50.90", label: "Crohn's disease, unspecified, without complications" },
  { code: "K56.60", label: "Unspecified intestinal obstruction" },
  { code: "K92.2", label: "Gastrointestinal hemorrhage, unspecified" },
  { code: "K44.9", label: "Diaphragmatic hernia without obstruction or gangrene" },
  { code: "R10.4", label: "Other and unspecified abdominal pain" },
  { code: "R11.10", label: "Vomiting, unspecified" }
];

export function searchIcd10(query: string, limit = 8): Icd10Entry[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];
  return icd10Codes.filter((entry) => entry.code.toLowerCase().includes(trimmed) || entry.label.toLowerCase().includes(trimmed)).slice(0, limit);
}
