import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AccessRole } from "@/lib/access/matrix";
import type { ClinicalTemplate } from "@/lib/clinical-template-types";

type ClinicalTemplateStore = { templates: ClinicalTemplate[] };

/**
 * Starter set for a GI/hepatology OPD — seeded once on first load, then
 * fully doctor-owned (create/edit/delete like any other template). Every
 * field here is a starting draft for the clinician to review and edit, not
 * a diagnostic or prescribing decision — the app never applies this text
 * without an explicit doctor click, and the doctor edits before saving.
 */
function seedTemplates(): ClinicalTemplate[] {
  const now = new Date().toISOString();
  const seed = (
    name: string,
    diagnosis: string,
    history: string,
    generalExamination: string,
    perAbdomen: string,
    investigationAdvice: string,
    clinicalNote: string
  ): ClinicalTemplate => ({
    id: generateId("CLT"),
    createdAt: now,
    updatedAt: now,
    name,
    tag: "Starter",
    diagnosis,
    history,
    generalExamination,
    perAbdomen,
    investigationAdvice,
    clinicalNote,
    createdBy: "System",
    createdByRole: "super-admin"
  });

  return [
    seed(
      "GERD",
      "Gastroesophageal Reflux Disease (GERD)",
      "Burning retrosternal pain/heartburn, worse after meals and on lying down. Regurgitation of acid/sour material. Note duration and frequency.",
      "Conscious, Cooperative, Afebrile, No pallor/icterus",
      "Soft, Non Tender, No Guarding, No Rigidity, No Organomegaly",
      "Investigations: CBC, LFT, RFT, Upper GI Endoscopy, H. pylori test.\nAdvice: Avoid spicy/oily/fried food and caffeine, small frequent meals, avoid lying down for 2-3 hours after meals, elevate head end of bed, weight reduction if overweight.",
      "Working diagnosis GERD based on classical reflux symptoms. Plan: PPI trial, lifestyle/dietary modification, endoscopy if red-flag symptoms or no response to therapy."
    ),
    seed(
      "IBS",
      "Irritable Bowel Syndrome (IBS)",
      "Recurrent abdominal pain associated with altered bowel habits (diarrhoea/constipation/mixed), relieved by defecation. No nocturnal symptoms, weight loss or rectal bleeding.",
      "Conscious, Cooperative, Afebrile, No pallor",
      "Soft, Mild tenderness, No Guarding, No Rigidity, No Organomegaly, Bowel sounds present",
      "Investigations: CBC, ESR/CRP, TSH, Stool routine/microscopy, Celiac serology if indicated.\nAdvice: High-fibre/low-FODMAP diet as tolerated, adequate hydration, regular physical activity, stress management, avoid known trigger foods.",
      "Working diagnosis IBS (Rome IV criteria) after excluding red-flag features. Plan: symptomatic treatment, dietary counselling, review if red flags develop."
    ),
    seed(
      "Fatty Liver",
      "Non-Alcoholic Fatty Liver Disease (NAFLD)",
      "Often asymptomatic or vague right upper quadrant discomfort/fatigue. Assess risk factors: obesity, diabetes, dyslipidemia, alcohol intake.",
      "Conscious, Cooperative, Afebrile, BMI to be recorded",
      "Soft, Non Tender, Liver may be mildly enlarged, No free fluid",
      "Investigations: LFT, Lipid profile, Fasting blood sugar/HbA1c, USG abdomen, Repeat LFT in follow-up.\nAdvice: Weight reduction, exercise, low-fat diet, avoid alcohol, control diabetes/lipids if present.",
      "Working diagnosis Non-Alcoholic Fatty Liver Disease based on history/imaging. Plan: lifestyle modification, metabolic risk-factor control, follow-up LFT."
    ),
    seed(
      "Constipation",
      "Functional Constipation",
      "Infrequent bowel movements (<3/week), straining, hard stools, sensation of incomplete evacuation. Note duration, diet, fluid intake and activity level.",
      "Conscious, Cooperative, Afebrile",
      "Soft, Non Tender, No Guarding, No Rigidity, Stool felt in colon on palpation (if present)",
      "Investigations: CBC, TSH, Electrolytes, Colonoscopy if red-flag features or age over 45.\nAdvice: Increase dietary fibre and fluid intake, regular physical activity, establish regular bowel routine, avoid long-term laxative overuse.",
      "Working diagnosis functional constipation after excluding secondary causes. Plan: dietary/lifestyle modification, laxatives if required, review in 2 weeks."
    ),
    seed(
      "Gastritis",
      "Gastritis",
      "Epigastric pain/burning, nausea, occasional vomiting, often related to meals, NSAID use or alcohol intake.",
      "Conscious, Cooperative, Afebrile",
      "Soft, Epigastric tenderness, No Guarding, No Rigidity, No Organomegaly",
      "Investigations: CBC, H. pylori test, Upper GI Endoscopy if persistent/alarm symptoms.\nAdvice: Avoid NSAIDs/alcohol/spicy food, small frequent meals, acid suppression as prescribed.",
      "Working diagnosis Gastritis based on symptoms. Plan: acid suppression therapy, H. pylori testing/eradication if positive, review if symptoms persist."
    ),
    seed(
      "Acute Gastroenteritis",
      "Acute Gastroenteritis",
      "Acute onset loose stools with/without vomiting, abdominal cramps, fever. Assess hydration status, food/water source, duration and frequency.",
      "Conscious, Cooperative, assess for signs of dehydration (dry mucosa, tachycardia, sunken eyes)",
      "Soft, Mild diffuse tenderness, No Guarding, No Rigidity, Increased bowel sounds",
      "Investigations: CBC, Electrolytes, Stool routine/microscopy if severe or persistent.\nAdvice: Oral rehydration solution, adequate fluid intake, bland/light diet, hand hygiene, review if blood in stool, high fever or dehydration develop.",
      "Working diagnosis Acute Gastroenteritis, likely infective. Plan: supportive/rehydration therapy, antiemetics/antidiarrheals as needed, review in 48-72 hours if not improving."
    ),
    seed(
      "Hepatitis",
      "Acute Hepatitis",
      "Fatigue, anorexia, nausea, jaundice, dark urine, right upper quadrant discomfort. Ask about travel, transfusion, IV drug use, alcohol, medications.",
      "Conscious, Cooperative, Icterus to be assessed",
      "Soft, Mild hepatomegaly may be present, Non Tender/Mild tenderness, No free fluid",
      "Investigations: LFT, Viral hepatitis panel (HAV/HBV/HCV/HEV), PT/INR, USG abdomen.\nAdvice: Adequate rest, avoid alcohol and hepatotoxic drugs, high-calorie easily digestible diet, follow-up LFT.",
      "Working diagnosis Acute Hepatitis pending viral markers. Plan: supportive care, avoid hepatotoxic drugs, monitor LFT/PT-INR, review urgently if worsening jaundice or coagulopathy."
    ),
    seed(
      "Gall Stones",
      "Symptomatic Cholelithiasis",
      "Episodic right upper quadrant/epigastric pain, often after fatty meals, may radiate to back/right shoulder. Associated nausea/vomiting.",
      "Conscious, Cooperative, Afebrile",
      "Soft, Right upper quadrant tenderness, Murphy's sign to be checked, No Rigidity",
      "Investigations: LFT, USG abdomen, CBC.\nAdvice: Low-fat diet, avoid fatty/fried foods, surgical consultation for cholecystectomy if symptomatic, urgent review if fever/jaundice develops.",
      "Working diagnosis Symptomatic Cholelithiasis based on history/USG. Plan: dietary advice, analgesia, surgical referral for elective cholecystectomy."
    ),
    seed(
      "Piles",
      "Haemorrhoids",
      "Painless bleeding per rectum (bright red, on/after defecation), perianal discomfort/prolapse. Assess bowel habits and straining.",
      "Conscious, Cooperative, Afebrile",
      "Soft, Non Tender, No Guarding, No Rigidity, No Organomegaly",
      "Investigations: CBC, Proctoscopy/per-rectal examination, Colonoscopy if age over 45 or red-flag features.\nAdvice: High-fibre diet, adequate fluid intake, avoid straining, warm sitz baths, topical medication as prescribed.",
      "Working diagnosis Haemorrhoids based on history and proctoscopic findings. Plan: conservative management with dietary/lifestyle modification, review if symptoms persist for procedural options."
    ),
    seed(
      "Fissure",
      "Anal Fissure",
      "Sharp anal pain during and after defecation, often with minor bleeding, associated with constipation/hard stools.",
      "Conscious, Cooperative, Afebrile",
      "Soft, Non Tender, No Guarding, No Rigidity",
      "Investigations: Per-rectal/proctoscopic examination as tolerated.\nAdvice: High-fibre diet, adequate fluid intake, stool softeners, warm sitz baths, topical medication as prescribed, avoid straining.",
      "Working diagnosis Anal Fissure based on history and local examination. Plan: conservative management (stool softeners, topical therapy), review in 2 weeks; surgical referral if chronic/non-healing."
    )
  ];
}

const store = createDocumentStore<ClinicalTemplateStore>("clinical-templates", (parsed) => {
  const doc = parsed as Partial<ClinicalTemplateStore> | undefined;
  if (!doc) return { templates: seedTemplates() };
  return { templates: Array.isArray(doc.templates) ? (doc.templates as ClinicalTemplate[]) : [] };
});

export async function listClinicalTemplates() {
  return (await store.load()).templates;
}

export async function createClinicalTemplate(input: {
  name: string;
  tag?: string;
  diagnosis: string;
  history?: string;
  generalExamination?: string;
  perAbdomen?: string;
  investigationAdvice?: string;
  clinicalNote?: string;
  createdBy: string;
  createdByRole: AccessRole;
}) {
  const doc = await store.load();
  const now = new Date().toISOString();
  const template: ClinicalTemplate = {
    id: generateId("CLT"),
    createdAt: now,
    updatedAt: now,
    name: input.name,
    tag: input.tag,
    diagnosis: input.diagnosis,
    history: input.history,
    generalExamination: input.generalExamination,
    perAbdomen: input.perAbdomen,
    investigationAdvice: input.investigationAdvice,
    clinicalNote: input.clinicalNote,
    createdBy: input.createdBy,
    createdByRole: input.createdByRole
  };
  doc.templates.unshift(template);
  await store.save(doc);
  return template;
}

export async function deleteClinicalTemplate(id: string) {
  const doc = await store.load();
  const index = doc.templates.findIndex((item) => item.id === id);
  if (index === -1) return false;
  doc.templates.splice(index, 1);
  await store.save(doc);
  return true;
}
