import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarCheck, ClipboardList, FileText, HeartPulse, MessageCircle, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
import { seoBlogPosts } from "@/lib/blog-posts";
import { getPublicProcedure, getPublicProcedures } from "@/lib/cms-public";
import { site } from "@/lib/site-data";

type ProcedurePageProps = {
  params: Promise<{ slug: string }>;
};

type PageCopy = {
  overview: string;
  consultCues: string[];
  relatedTerms: string[];
  pathway: Array<{ title: string; text: string }>;
};

type ArticleSection = {
  title: string;
  text: string;
  items?: string[];
};

type ArticleFaq = {
  question: string;
  answer: string;
};

type ProcedureArticle = {
  sections: ArticleSection[];
  faqs: ArticleFaq[];
};

const diseaseSlugs = new Set([
  "varices",
  "liver-cirrhosis",
  "fatty-liver",
  "liver-fibrosis",
  "obstructive-jaundice",
  "bile-duct-stricture",
  "pancreatic-disorders",
  "acidity-gerd",
  "peptic-ulcer-disease",
  "difficulty-swallowing",
  "gi-stricture",
  "colon-polyps",
  "ibd-colitis",
  "ibs",
  "chronic-constipation",
  "chronic-diarrhea",
  "ascites"
]);

const pageCopyBySlug: Record<string, PageCopy> = {
  "endoscopy": {
    overview: "Upper GI endoscopy helps examine the food pipe, stomach and first part of the small intestine for acidity-related damage, ulcers, bleeding, narrowing, growths or swallowing difficulty. At Mudgal Gastromedics Hospital, the procedure is planned with clear preparation instructions and post-procedure guidance.",
    consultCues: ["Long-standing acidity, reflux or burning chest discomfort", "Upper abdominal pain, nausea, bloating or repeated vomiting", "Difficulty swallowing, food sticking sensation or unexplained weight loss", "Black stools, anemia, suspected ulcer or doctor-advised biopsy"],
    relatedTerms: ["Upper GI endoscopy in Agra", "Gastroscopy in Agra", "Acidity endoscopy Agra", "Stomach ulcer diagnosis Agra"],
    pathway: [
      { title: "Symptom review", text: "Acidity, pain, vomiting, swallowing difficulty and previous reports are reviewed before advising endoscopy." },
      { title: "Endoscopy preparation", text: "Fasting, medicine instructions and attendant requirements are explained before the procedure." },
      { title: "Report guidance", text: "Findings, biopsy advice if needed and treatment steps are discussed after the procedure." }
    ]
  },
  "colonoscopy": {
    overview: "Colonoscopy examines the large intestine and rectum to evaluate bleeding, bowel habit changes, polyps, inflammation and cancer-screening needs. The care team guides bowel preparation, procedure expectations and follow-up reporting.",
    consultCues: ["Blood in stool, black stool or unexplained anemia", "Chronic diarrhea, constipation or change in bowel habits", "Suspected polyps, colitis or inflammatory bowel disease", "Colon cancer screening or family history of colon cancer"],
    relatedTerms: ["Colonoscopy in Agra", "Colon cancer screening Agra", "Blood in stool doctor Agra", "Colitis specialist Agra"],
    pathway: [
      { title: "Bowel symptom review", text: "Bleeding, stool changes, pain and prior reports are reviewed to plan the right investigation." },
      { title: "Bowel preparation", text: "Diet, laxative timing, fasting and medicine instructions are explained clearly." },
      { title: "Polyp and biopsy follow-up", text: "Findings, biopsy reports and future surveillance timing are planned after colonoscopy." }
    ]
  },
  "enteroscopy": {
    overview: "Enteroscopy helps assess the small intestine when routine endoscopy and colonoscopy do not fully explain symptoms such as obscure bleeding, anemia or suspected small bowel lesions.",
    consultCues: ["Unexplained anemia or suspected small bowel bleeding", "Black stools with unclear source after initial tests", "Suspected small bowel ulcers, lesions or strictures", "Doctor-advised small bowel evaluation after prior reports"],
    relatedTerms: ["Enteroscopy in Agra", "Small bowel bleeding Agra", "Obscure GI bleeding Agra", "Small intestine specialist Agra"],
    pathway: [
      { title: "Report review", text: "Prior endoscopy, colonoscopy, scans and blood reports are reviewed before enteroscopy planning." },
      { title: "Small bowel evaluation", text: "The appropriate approach is selected based on symptoms, suspected site and patient condition." },
      { title: "Targeted treatment plan", text: "Findings guide biopsy, bleeding control, medicine or further imaging decisions." }
    ]
  },
  "ercp": {
    overview: "ERCP is an advanced endoscopic procedure used for bile duct and pancreatic duct problems such as stones, jaundice, strictures, infection and selected stenting needs.",
    consultCues: ["Jaundice with suspected bile duct blockage", "CBD stone, bile duct infection or abnormal liver reports", "Bile duct stricture or post-surgery bile leak", "Pancreatic duct stone or recurrent pancreatic symptoms"],
    relatedTerms: ["ERCP in Agra", "CBD stone ERCP Agra", "Jaundice treatment Agra", "Bile duct specialist Agra"],
    pathway: [
      { title: "Imaging review", text: "Ultrasound, CT, MRCP and liver reports are reviewed before ERCP planning." },
      { title: "Duct treatment planning", text: "Stone removal, sphincterotomy, drainage or stenting is planned according to the condition." },
      { title: "Recovery monitoring", text: "Post-procedure symptoms, diet, medicines and warning signs are explained before discharge." }
    ]
  },
  "gastrointestinal-bleeding-management": {
    overview: "GI bleeding needs timely evaluation because bleeding may arise from ulcers, varices, vascular lesions, polyps, tumors or inflammation. Endoscopy or colonoscopy may be required urgently depending on symptoms and stability.",
    consultCues: ["Vomiting blood or coffee-ground material", "Black stools, red blood in stool or unexplained anemia", "Dizziness, weakness or recurrent bleeding symptoms", "Known liver disease with suspected variceal bleeding"],
    relatedTerms: ["GI bleeding treatment Agra", "Vomiting blood doctor Agra", "Black stool treatment Agra", "Emergency endoscopy Agra"],
    pathway: [
      { title: "Urgency assessment", text: "Bleeding severity, blood pressure, pulse, hemoglobin and liver history are reviewed quickly." },
      { title: "Bleeding source control", text: "Endoscopy, colonoscopy, banding, injection, clipping or other therapy is planned when suitable." },
      { title: "Prevention plan", text: "Medicines, repeat endoscopy, liver care or follow-up testing are planned to reduce recurrence." }
    ]
  },
  "variceal-banding": {
    overview: "Variceal banding is an endoscopic treatment for enlarged veins in the food pipe, usually related to portal hypertension and chronic liver disease, to reduce bleeding risk or control active bleeding.",
    consultCues: ["Known cirrhosis with varices on endoscopy", "Vomiting blood or black stools with liver disease", "Doctor-advised repeat banding session", "Low platelets, enlarged spleen or portal hypertension"],
    relatedTerms: ["Variceal banding Agra", "Esophageal varices treatment Agra", "Cirrhosis bleeding Agra", "Liver varices doctor Agra"],
    pathway: [
      { title: "Bleeding risk review", text: "Liver status, prior bleeding, platelet count and previous endoscopy findings are reviewed." },
      { title: "Banding session", text: "Bands are placed endoscopically on suitable varices to reduce bleeding risk." },
      { title: "Repeat surveillance", text: "Follow-up sessions, medicines and liver care are planned based on variceal size." }
    ]
  },
  "sclerotherapy": {
    overview: "Sclerotherapy is an injection-based endoscopic therapy used in selected bleeding varices or vascular lesions when clinically appropriate.",
    consultCues: ["Selected bleeding varices needing injection therapy", "Vascular lesions with recurrent bleeding", "Bleeding not suitable for simpler medical treatment alone", "Doctor-advised therapeutic endoscopy"],
    relatedTerms: ["Sclerotherapy Agra", "Endoscopic injection therapy Agra", "Variceal bleeding treatment Agra", "GI vascular bleeding Agra"],
    pathway: [
      { title: "Bleeding source confirmation", text: "Endoscopic findings and bleeding pattern guide whether sclerotherapy is suitable." },
      { title: "Injection therapy", text: "The sclerosant is injected into selected lesions under endoscopic guidance." },
      { title: "Monitoring and prevention", text: "Follow-up endoscopy, medicines and recurrence prevention are planned after treatment." }
    ]
  },
  "foreign-body-removal": {
    overview: "Foreign body removal is used when swallowed objects or impacted food are stuck in the food pipe, stomach or upper digestive tract and need endoscopic retrieval.",
    consultCues: ["Swallowed coin, denture, bone, pin, battery or sharp object", "Food bolus stuck in the throat or chest", "Pain, drooling, vomiting or inability to swallow after ingestion", "Doctor-advised urgent endoscopic removal"],
    relatedTerms: ["Foreign body removal Agra", "Swallowed object endoscopy Agra", "Food bolus removal Agra", "Emergency endoscopy Agra"],
    pathway: [
      { title: "Object and timing review", text: "The type of object, time since swallowing and symptoms determine urgency." },
      { title: "Safe retrieval planning", text: "Endoscopic tools and airway precautions are selected based on object location." },
      { title: "Injury check", text: "The digestive lining is checked for cuts, ulcers or narrowing after removal." }
    ]
  },
  "polypectomy": {
    overview: "Polypectomy is endoscopic removal of selected stomach or colon polyps. It supports diagnosis, symptom evaluation and cancer-prevention planning when polyps are found.",
    consultCues: ["Polyp found during endoscopy or colonoscopy", "Colon cancer screening with suspected polyp", "Bleeding or anemia linked to possible polyp", "Biopsy or removal advised by the doctor"],
    relatedTerms: ["Polypectomy in Agra", "Colon polyp removal Agra", "Stomach polyp treatment Agra", "Endoscopic polyp removal Agra"],
    pathway: [
      { title: "Polyp assessment", text: "Size, site, shape and bleeding risk are reviewed before removal." },
      { title: "Endoscopic removal", text: "Suitable polyps are removed using appropriate endoscopic technique." },
      { title: "Biopsy follow-up", text: "Histopathology results guide future surveillance and treatment planning." }
    ]
  },
  "colon-polyp-removal": {
    overview: "Colon polyp removal is performed during colonoscopy when suitable polyps are found. Removing polyps can help diagnose symptoms, prevent bleeding and reduce future cancer risk depending on pathology.",
    consultCues: ["Polyp seen during colonoscopy or screening", "Family history of colon cancer or colon polyps", "Blood in stool, anemia or bowel habit changes", "Doctor-advised polyp removal or surveillance colonoscopy"],
    relatedTerms: ["Colon polyp removal Agra", "Colonoscopy polyp removal Agra", "Colon cancer prevention Agra", "Polypectomy specialist Agra"],
    pathway: [
      { title: "Polyp review", text: "Location, size, number and appearance of polyps are reviewed before removal." },
      { title: "Colonoscopy removal", text: "Suitable polyps are removed with snare, cautery or other endoscopic technique." },
      { title: "Surveillance plan", text: "Biopsy results guide medicines, diet advice and next colonoscopy timing." }
    ]
  },
  "endoscopic-biopsy": {
    overview: "Endoscopic biopsy collects small tissue samples from suspicious or inflamed areas during endoscopy or colonoscopy. It helps confirm diagnoses such as ulcers, infection, celiac disease, colitis, polyps or suspected growths.",
    consultCues: ["Ulcer, inflammation, polyp or growth seen on endoscopy", "Persistent symptoms needing tissue diagnosis", "Suspected H. pylori, celiac disease, colitis or malignancy", "Doctor-advised biopsy after abnormal imaging or reports"],
    relatedTerms: ["Endoscopic biopsy Agra", "Stomach biopsy Agra", "Colon biopsy Agra", "H pylori biopsy Agra"],
    pathway: [
      { title: "Target selection", text: "The suspicious or abnormal area is identified during endoscopy or colonoscopy." },
      { title: "Tissue sampling", text: "Small tissue samples are collected safely using endoscopic biopsy forceps." },
      { title: "Pathology follow-up", text: "Biopsy results guide diagnosis, medicines and further treatment decisions." }
    ]
  },
  "ryles-tube-placement": {
    overview: "Ryle's tube placement supports feeding, stomach decompression or inpatient care in selected patients who cannot eat safely or need gastric drainage.",
    consultCues: ["Need for temporary feeding support", "Repeated vomiting or stomach decompression requirement", "Swallowing difficulty with nutrition concerns", "Inpatient or procedure-related tube support advised"],
    relatedTerms: ["Ryle's tube placement Agra", "Feeding tube support Agra", "NG tube placement Agra", "Nutrition support gastro Agra"],
    pathway: [
      { title: "Need assessment", text: "Nutrition, swallowing ability, vomiting and inpatient needs are reviewed." },
      { title: "Tube placement", text: "Tube size, route and placement safety are checked during insertion." },
      { title: "Care instructions", text: "Feeding, flushing, position and warning signs are explained to attendants." }
    ]
  },
  "nasojejunal-tube-placement": {
    overview: "Nasojejunal tube placement provides feeding beyond the stomach in selected patients, often when gastric feeding is not tolerated or pancreatitis-related nutrition support is needed.",
    consultCues: ["Pancreatitis needing enteral nutrition support", "Poor tolerance of stomach feeding", "High aspiration risk or repeated vomiting", "Doctor-advised jejunal feeding route"],
    relatedTerms: ["Nasojejunal tube Agra", "NJ tube placement Agra", "Pancreatitis feeding support Agra", "Enteral nutrition Agra"],
    pathway: [
      { title: "Nutrition route planning", text: "The reason for jejunal feeding and patient stability are reviewed first." },
      { title: "Tube placement beyond stomach", text: "Placement is guided so feeding can reach the small intestine." },
      { title: "Feeding protocol", text: "Feed rate, flushing and care instructions are shared with caregivers." }
    ]
  },
  "peg-tube-placement": {
    overview: "PEG tube placement is an endoscopic feeding tube option for patients who need longer-term nutrition support when oral intake is unsafe or inadequate.",
    consultCues: ["Long-term swallowing difficulty", "Neurological or medical condition limiting safe oral intake", "Need for reliable nutrition support at home", "Doctor-advised endoscopic feeding tube"],
    relatedTerms: ["PEG tube placement Agra", "Endoscopic feeding tube Agra", "Long term feeding support Agra", "Gastrostomy tube Agra"],
    pathway: [
      { title: "Suitability check", text: "Nutrition need, infection risk, medicines and caregiver readiness are reviewed." },
      { title: "PEG placement", text: "The feeding tube is placed endoscopically through the abdominal wall into the stomach." },
      { title: "Home care guidance", text: "Tube cleaning, feeding, flushing and warning signs are explained before follow-up." }
    ]
  },
  "cbd-stone-removal": {
    overview: "CBD stone removal treats stones in the common bile duct, usually through ERCP, when stones cause jaundice, pain, fever, infection or abnormal liver reports.",
    consultCues: ["CBD stone seen on ultrasound, CT or MRCP", "Jaundice with upper abdominal pain", "Fever or infection with suspected bile duct blockage", "Recurrent biliary pain after gallbladder stone disease"],
    relatedTerms: ["CBD stone removal Agra", "Common bile duct stone Agra", "ERCP stone removal Agra", "Bile duct stone specialist Agra"],
    pathway: [
      { title: "Stone confirmation", text: "Imaging and liver tests are reviewed to confirm location and urgency." },
      { title: "ERCP removal", text: "Stone extraction, drainage or stenting is planned based on duct findings." },
      { title: "Recurrence prevention", text: "Gallbladder, infection and follow-up needs are discussed after treatment." }
    ]
  },
  "pancreatic-duct-stone-removal": {
    overview: "Pancreatic duct stone removal is considered in selected chronic pancreatitis cases where duct stones contribute to pain, duct blockage or recurrent pancreatic symptoms.",
    consultCues: ["Chronic pancreatitis with duct stone on imaging", "Recurrent upper abdominal pain radiating to the back", "Pancreatic duct blockage or dilation", "Doctor-advised ERCP-based pancreatic therapy"],
    relatedTerms: ["Pancreatic duct stone Agra", "Chronic pancreatitis treatment Agra", "Pancreatic ERCP Agra", "Pancreas specialist Agra"],
    pathway: [
      { title: "Pancreas imaging review", text: "CT, MRCP or prior reports are reviewed to locate stones and duct changes." },
      { title: "Duct therapy planning", text: "Stone extraction, stenting or staged treatment is considered based on suitability." },
      { title: "Pain and follow-up plan", text: "Diet, medicines, enzyme support and repeat treatment needs are discussed." }
    ]
  },
  "stricture-dilation": {
    overview: "Stricture dilation widens selected narrowed areas in the food pipe or GI tract to improve swallowing, passage of food or relief from obstruction symptoms.",
    consultCues: ["Difficulty swallowing solids or liquids", "Food sticking sensation or recurrent vomiting", "Known food-pipe, stomach outlet or intestinal narrowing", "Doctor-advised endoscopic dilation"],
    relatedTerms: ["Stricture dilation Agra", "Food pipe narrowing treatment Agra", "Esophageal dilation Agra", "GI narrowing treatment Agra"],
    pathway: [
      { title: "Narrowing assessment", text: "Symptoms, endoscopy findings and imaging are reviewed before dilation." },
      { title: "Dilation planning", text: "Balloon or bougie dilation is selected based on site, cause and safety." },
      { title: "Diet and repeat sessions", text: "Food progression, medicines and need for staged dilation are explained." }
    ]
  },
  "esophageal-dilation": {
    overview: "Esophageal dilation is used to widen selected narrowing in the food pipe that causes swallowing difficulty, food sticking or recurrent obstruction symptoms.",
    consultCues: ["Difficulty swallowing solids or liquids", "Food sticking in chest or throat", "Known food-pipe stricture, ring or reflux-related narrowing", "Need for repeat dilation after prior endoscopy"],
    relatedTerms: ["Esophageal dilation Agra", "Food pipe dilation Agra", "Dysphagia treatment Agra", "Esophageal stricture treatment Agra"],
    pathway: [
      { title: "Swallowing assessment", text: "Symptom progression, prior endoscopy and warning signs are reviewed first." },
      { title: "Dilation procedure", text: "Balloon or bougie dilation is selected based on narrowing type and location." },
      { title: "Diet progression", text: "Food texture, reflux medicines and repeat session need are discussed." }
    ]
  },
  "gi-stenting": {
    overview: "GI stenting helps relieve selected blockages or strictures in the digestive tract or bile duct, supporting swallowing, drainage, palliation or symptom relief.",
    consultCues: ["Food pipe, stomach, intestine or bile duct blockage", "Difficulty swallowing due to narrowing", "Obstructive jaundice needing drainage", "Doctor-advised palliative or bridge stenting"],
    relatedTerms: ["GI stenting Agra", "Esophageal stent Agra", "Bile duct stent Agra", "Intestinal blockage stent Agra"],
    pathway: [
      { title: "Blockage mapping", text: "Endoscopy, imaging and clinical status define the site and purpose of stenting." },
      { title: "Stent selection", text: "Stent type and placement approach are chosen according to the condition." },
      { title: "Post-stent care", text: "Diet, warning symptoms and follow-up imaging or endoscopy are planned." }
    ]
  },
  "bile-duct-stenting": {
    overview: "Bile duct stenting is an ERCP-guided procedure used to relieve blocked bile flow from stones, strictures, tumors or pancreaticobiliary disease. It can reduce jaundice, itching, infection risk and abnormal liver test changes.",
    consultCues: ["Obstructive jaundice with bile duct blockage", "Bile duct stricture or tumor-related narrowing", "Cholangitis, fever or infection with duct obstruction", "Temporary drainage needed before further treatment"],
    relatedTerms: ["Bile duct stenting Agra", "ERCP stent Agra", "Jaundice stenting Agra", "Biliary stent Agra"],
    pathway: [
      { title: "Obstruction review", text: "Liver tests, ultrasound, CT or MRCP help confirm the site and cause." },
      { title: "ERCP stent placement", text: "A suitable stent is placed to improve bile drainage when clinically appropriate." },
      { title: "Stent follow-up", text: "Repeat testing, stent change timing and warning symptoms are explained." }
    ]
  },
  "endoscopic-hemostasis": {
    overview: "Endoscopic hemostasis controls selected gastrointestinal bleeding using clips, injection therapy, thermal therapy or other endoscopic methods depending on the bleeding source.",
    consultCues: ["Vomiting blood, black stools or red blood in stool", "Bleeding ulcer or visible vessel on endoscopy", "Post-polypectomy bleeding or vascular bleeding lesion", "Anemia or recurrent bleeding needing endoscopic therapy"],
    relatedTerms: ["Endoscopic hemostasis Agra", "GI bleeding control Agra", "Bleeding ulcer treatment Agra", "Endoscopic clipping Agra"],
    pathway: [
      { title: "Bleeding source check", text: "Endoscopy or colonoscopy identifies the bleeding location and severity." },
      { title: "Hemostasis technique", text: "Clips, injection, cautery or combined therapy is selected based on the lesion." },
      { title: "Rebleeding prevention", text: "Medicines, monitoring, diet and repeat endoscopy need are planned." }
    ]
  },
  "argon-plasma-coagulation": {
    overview: "Argon Plasma Coagulation (APC) is a non-contact endoscopic coagulation technique used for selected superficial bleeding lesions, vascular malformations and radiation-related injury.",
    consultCues: ["Recurrent bleeding from vascular lesions", "Radiation proctitis or superficial bleeding areas", "Selected oozing lesions seen on endoscopy or colonoscopy", "Doctor-advised APC for controlled coagulation"],
    relatedTerms: ["Argon plasma coagulation Agra", "APC endoscopy Agra", "Radiation proctitis treatment Agra", "Vascular lesion bleeding Agra"],
    pathway: [
      { title: "Lesion assessment", text: "The site, depth and bleeding pattern are checked before APC is selected." },
      { title: "APC therapy", text: "Argon plasma energy is applied endoscopically to coagulate suitable tissue." },
      { title: "Follow-up planning", text: "Response, repeat sessions and bleeding recurrence are monitored." }
    ]
  },
  "intragastric-balloon-placement": {
    overview: "Intragastric balloon placement is a non-surgical endoscopic weight-loss support option for selected patients, combined with lifestyle and nutrition guidance.",
    consultCues: ["Need for non-surgical weight-loss support", "Obesity with metabolic risk factors", "Lifestyle program advised with endoscopic support", "Patient suitable after gastroenterology assessment"],
    relatedTerms: ["Intragastric balloon Agra", "Endoscopic weight loss Agra", "Non surgical obesity treatment Agra", "Gastric balloon Agra"],
    pathway: [
      { title: "Eligibility review", text: "BMI, medical history, eating pattern and contraindications are reviewed first." },
      { title: "Balloon placement", text: "The balloon is placed endoscopically with safety and recovery instructions." },
      { title: "Nutrition follow-up", text: "Diet stages, lifestyle changes and removal timing are planned." }
    ]
  },
  "fibroscan": {
    overview: "Fibroscan is a non-invasive test that estimates liver stiffness and fatty change, helping monitor fatty liver, fibrosis, cirrhosis risk and chronic liver disease.",
    consultCues: ["Fatty liver on ultrasound", "Abnormal liver function tests", "Diabetes, obesity or metabolic risk with liver concerns", "Chronic hepatitis, alcohol-related liver risk or fibrosis monitoring"],
    relatedTerms: ["Fibroscan in Agra", "Fatty liver test Agra", "Liver stiffness test Agra", "Liver fibrosis scan Agra"],
    pathway: [
      { title: "Risk assessment", text: "Weight, diabetes, alcohol history, viral markers and liver reports are reviewed." },
      { title: "Non-invasive scan", text: "Liver stiffness and fat parameters are measured without incision or sedation." },
      { title: "Liver plan", text: "Results guide lifestyle, medicines, monitoring frequency and further testing." }
    ]
  },
  "ascitic-fluid-tapping": {
    overview: "Ascitic fluid tapping helps diagnose or relieve abdominal fluid buildup, often linked with liver disease, infection or other medical conditions.",
    consultCues: ["Increasing abdominal swelling or tightness", "Known liver disease with fluid in abdomen", "Fever, pain or suspected infected ascitic fluid", "Doctor-advised fluid testing or therapeutic drainage"],
    relatedTerms: ["Ascitic fluid tapping Agra", "Ascites drainage Agra", "Abdominal fluid test Agra", "Liver ascites treatment Agra"],
    pathway: [
      { title: "Fluid assessment", text: "Cause, amount of fluid, infection risk and blood reports are reviewed." },
      { title: "Safe tapping", text: "Diagnostic or therapeutic fluid removal is planned with sterile precautions." },
      { title: "Cause treatment", text: "Liver care, medicines, salt restriction and follow-up testing are discussed." }
    ]
  },
  "varices": {
    overview: "Varices are enlarged veins in the food pipe or stomach, usually caused by portal hypertension from chronic liver disease. They need monitoring because they can bleed suddenly.",
    consultCues: ["Cirrhosis or chronic liver disease with suspected varices", "Vomiting blood, black stools or anemia", "Endoscopy report showing esophageal or gastric varices", "Need for screening or repeat surveillance endoscopy"],
    relatedTerms: ["Varices treatment Agra", "Esophageal varices Agra", "Portal hypertension Agra", "Liver varices specialist Agra"],
    pathway: [
      { title: "Liver risk review", text: "Cirrhosis stage, platelet count, spleen size and prior bleeding history are reviewed." },
      { title: "Endoscopic screening", text: "Endoscopy helps grade varices and decide medicines or banding need." },
      { title: "Bleeding prevention", text: "Surveillance, banding sessions and liver care reduce future bleeding risk." }
    ]
  },
  "liver-cirrhosis": {
    overview: "Liver cirrhosis is advanced liver scarring that can cause jaundice, swelling, fluid in the abdomen, bleeding varices, confusion and infection risk. Specialist follow-up helps detect complications early.",
    consultCues: ["Known cirrhosis, low platelets or enlarged spleen", "Jaundice, abdominal fluid, leg swelling or fatigue", "Vomiting blood, black stools or confusion", "Need for Fibroscan, endoscopy surveillance or long-term liver care"],
    relatedTerms: ["Liver cirrhosis doctor Agra", "Liver specialist Agra", "Cirrhosis treatment Agra", "Portal hypertension Agra"],
    pathway: [
      { title: "Stage and cause review", text: "Alcohol, fatty liver, viral hepatitis and autoimmune causes are assessed with reports." },
      { title: "Complication screening", text: "Varices, ascites, infection risk and liver cancer surveillance are planned." },
      { title: "Long-term care", text: "Medicines, diet, vaccinations, monitoring and emergency warning signs are discussed." }
    ]
  },
  "fatty-liver": {
    overview: "Fatty liver is commonly linked with obesity, diabetes, cholesterol, alcohol or metabolic risk. Early evaluation helps prevent progression to fibrosis and cirrhosis.",
    consultCues: ["Fatty liver seen on ultrasound", "Raised SGOT, SGPT or abnormal liver function tests", "Diabetes, obesity, high cholesterol or metabolic syndrome", "Need for Fibroscan and lifestyle-based liver plan"],
    relatedTerms: ["Fatty liver treatment Agra", "Fatty liver doctor Agra", "Liver fat scan Agra", "SGPT high treatment Agra"],
    pathway: [
      { title: "Metabolic risk review", text: "Weight, sugar, cholesterol, alcohol intake and liver reports are reviewed." },
      { title: "Fibrosis check", text: "Fibroscan or other tests help assess liver stiffness and progression risk." },
      { title: "Lifestyle plan", text: "Diet, exercise, weight loss targets and follow-up labs are planned." }
    ]
  },
  "liver-fibrosis": {
    overview: "Liver fibrosis means scarring in the liver from chronic injury. It can be caused by fatty liver, alcohol, hepatitis or other liver diseases and needs monitoring to prevent progression.",
    consultCues: ["Fibroscan or ultrasound suggesting fibrosis", "Long-standing fatty liver or abnormal liver tests", "Alcohol-related or viral hepatitis-related liver risk", "Need to monitor liver stiffness over time"],
    relatedTerms: ["Liver fibrosis Agra", "Fibroscan liver fibrosis Agra", "Liver scarring treatment Agra", "Chronic liver disease Agra"],
    pathway: [
      { title: "Cause identification", text: "Fatty liver, alcohol, viral hepatitis and other causes are checked." },
      { title: "Stiffness monitoring", text: "Fibroscan and blood tests help track fibrosis severity." },
      { title: "Progression prevention", text: "Risk control, medicines when needed and regular follow-up are planned." }
    ]
  },
  "obstructive-jaundice": {
    overview: "Obstructive jaundice occurs when bile flow is blocked by stones, strictures, tumors or pancreaticobiliary disease. It may need urgent evaluation if fever, pain or infection is present.",
    consultCues: ["Yellow eyes or urine with pale stool", "Jaundice with fever, chills or abdominal pain", "Bile duct blockage on ultrasound, CT or MRCP", "Suspected CBD stone, stricture or pancreaticobiliary obstruction"],
    relatedTerms: ["Obstructive jaundice Agra", "Jaundice specialist Agra", "Bile duct blockage Agra", "ERCP jaundice Agra"],
    pathway: [
      { title: "Blockage evaluation", text: "Liver tests and imaging identify the level and likely cause of obstruction." },
      { title: "Drainage planning", text: "ERCP, stenting or stone removal is considered based on cause and urgency." },
      { title: "Cause follow-up", text: "Further testing, biopsy or surgery referral is planned if required." }
    ]
  },
  "bile-duct-stricture": {
    overview: "Bile duct stricture is narrowing of the bile duct that can cause jaundice, itching, infection and abnormal liver reports. Evaluation focuses on the cause and whether drainage or stenting is needed.",
    consultCues: ["Recurrent jaundice or itching", "Bile duct narrowing on MRCP, CT or ERCP", "Repeated cholangitis or fever with abnormal liver tests", "Post-surgery or chronic pancreatitis-related bile duct narrowing"],
    relatedTerms: ["Bile duct stricture Agra", "Bile duct stenting Agra", "Cholangitis treatment Agra", "ERCP stenting Agra"],
    pathway: [
      { title: "Stricture cause review", text: "Imaging, prior surgery, pancreatitis and tumor risk are reviewed." },
      { title: "Drainage decision", text: "ERCP, dilation, brush cytology or stenting is planned when suitable." },
      { title: "Ongoing monitoring", text: "Liver tests, stent changes and recurrence symptoms are tracked." }
    ]
  },
  "pancreatic-disorders": {
    overview: "Pancreatic disorders include acute or chronic pancreatitis, duct stones, fluid collections and pancreaticobiliary problems. Care depends on pain pattern, imaging and complication risk.",
    consultCues: ["Recurrent upper abdominal pain radiating to the back", "History of acute or chronic pancreatitis", "Pancreatic duct stone, pseudocyst or fluid collection", "Weight loss, oily stools or diabetes with pancreatic disease"],
    relatedTerms: ["Pancreas specialist Agra", "Pancreatitis treatment Agra", "Pancreatic duct stone Agra", "Chronic pancreatitis Agra"],
    pathway: [
      { title: "Pancreas history review", text: "Pain, alcohol history, gallstones, diabetes and prior imaging are assessed." },
      { title: "Complication check", text: "Duct stones, narrowing, fluid collections and nutrition issues are evaluated." },
      { title: "Treatment planning", text: "Medicines, enzymes, diet, ERCP or referral decisions are planned." }
    ]
  },
  "acidity-gerd": {
    overview: "Acidity and GERD can cause heartburn, sour belching, chest discomfort, throat irritation and sleep disturbance. Long-standing or alarm symptoms may require endoscopy.",
    consultCues: ["Frequent heartburn, reflux or sour belching", "Symptoms despite regular acidity medicines", "Difficulty swallowing, vomiting, weight loss or anemia", "Long-standing GERD needing endoscopy evaluation"],
    relatedTerms: ["Acidity treatment Agra", "GERD specialist Agra", "Reflux doctor Agra", "Heartburn treatment Agra"],
    pathway: [
      { title: "Symptom pattern review", text: "Meal relation, night symptoms, medicines and alarm symptoms are reviewed." },
      { title: "Endoscopy decision", text: "Endoscopy is considered when symptoms are persistent or warning signs are present." },
      { title: "Lifestyle and medicine plan", text: "Diet timing, weight control, medicines and follow-up are personalized." }
    ]
  },
  "peptic-ulcer-disease": {
    overview: "Peptic ulcer disease affects the stomach or duodenum and may cause pain, acidity, vomiting, anemia, black stools or bleeding. Diagnosis often involves endoscopy and targeted medicines.",
    consultCues: ["Burning upper abdominal pain or pain related to meals", "Black stools, vomiting blood or unexplained anemia", "Painkiller use, acidity medicines or suspected H. pylori infection", "Recurrent ulcer symptoms or prior ulcer history"],
    relatedTerms: ["Peptic ulcer treatment Agra", "Stomach ulcer doctor Agra", "H pylori treatment Agra", "Black stool ulcer Agra"],
    pathway: [
      { title: "Risk review", text: "Painkillers, H. pylori risk, acidity symptoms and bleeding signs are assessed." },
      { title: "Endoscopy and testing", text: "Endoscopy and biopsy/testing may be planned to confirm cause." },
      { title: "Healing plan", text: "Medicines, H. pylori treatment and repeat evaluation are advised when needed." }
    ]
  },
  "difficulty-swallowing": {
    overview: "Difficulty swallowing can come from food-pipe narrowing, reflux injury, rings, strictures, motility problems or growths. Early evaluation is important when symptoms progress.",
    consultCues: ["Food sticking in throat or chest", "Progressive difficulty swallowing solids or liquids", "Weight loss, vomiting, anemia or chest discomfort", "Known stricture, reflux injury or suspected food-pipe narrowing"],
    relatedTerms: ["Difficulty swallowing Agra", "Dysphagia doctor Agra", "Food pipe narrowing Agra", "Esophageal stricture Agra"],
    pathway: [
      { title: "Swallowing history", text: "Solid/liquid difficulty, progression and warning symptoms are reviewed." },
      { title: "Endoscopy evaluation", text: "The food pipe is examined for narrowing, injury, inflammation or growth." },
      { title: "Dilation or treatment plan", text: "Dilation, biopsy, medicines or further tests are planned based on findings." }
    ]
  },
  "gi-stricture": {
    overview: "GI stricture means narrowing in part of the digestive tract or bile duct. It may cause swallowing difficulty, vomiting, obstruction, jaundice or recurrent symptoms depending on location.",
    consultCues: ["Known narrowing in food pipe, stomach, intestine, colon or bile duct", "Vomiting, bloating, obstruction symptoms or difficulty swallowing", "Jaundice due to duct narrowing", "Need for dilation, stenting or biopsy evaluation"],
    relatedTerms: ["GI stricture treatment Agra", "Digestive tract narrowing Agra", "Endoscopic dilation Agra", "GI stenting Agra"],
    pathway: [
      { title: "Site and cause assessment", text: "Endoscopy and imaging identify the level, length and likely cause of narrowing." },
      { title: "Dilation or stent planning", text: "Suitable strictures may need balloon dilation, stenting or biopsy." },
      { title: "Recurrence follow-up", text: "Repeat sessions, diet guidance and warning signs are reviewed." }
    ]
  },
  "colon-polyps": {
    overview: "Colon polyps are growths in the large intestine. Some polyps can become cancer over time, so colonoscopy-based removal and pathology follow-up are important.",
    consultCues: ["Polyp found on colonoscopy or scan", "Blood in stool or unexplained anemia", "Family history of colon cancer or polyps", "Need for screening colonoscopy or surveillance"],
    relatedTerms: ["Colon polyps treatment Agra", "Polyp removal Agra", "Colon cancer screening Agra", "Colonoscopy polypectomy Agra"],
    pathway: [
      { title: "Screening need review", text: "Age, family history, bleeding and prior colonoscopy findings are reviewed." },
      { title: "Polyp removal planning", text: "Suitable polyps are removed endoscopically and sent for pathology." },
      { title: "Surveillance schedule", text: "Future colonoscopy timing depends on number, size and biopsy type." }
    ]
  },
  "ibd-colitis": {
    overview: "IBD and colitis can cause chronic diarrhea, bleeding, abdominal pain, urgency, weight loss and anemia. Diagnosis and monitoring often need colonoscopy, biopsy and long-term care.",
    consultCues: ["Chronic diarrhea lasting weeks or months", "Blood or mucus in stool", "Abdominal pain, urgency, fever, weight loss or anemia", "Known ulcerative colitis or Crohn's disease needing monitoring"],
    relatedTerms: ["IBD specialist Agra", "Colitis treatment Agra", "Ulcerative colitis Agra", "Crohn's disease Agra"],
    pathway: [
      { title: "Inflammation assessment", text: "Symptoms, stool tests, blood reports and prior treatment are reviewed." },
      { title: "Colonoscopy and biopsy", text: "Colonoscopy helps define extent, severity and biopsy diagnosis." },
      { title: "Long-term control", text: "Medicines, diet, flare warning signs and surveillance are planned." }
    ]
  },
  "ibs": {
    overview: "IBS care focuses on recurrent abdominal pain, bloating, gas, constipation, diarrhea or mixed bowel habits when warning signs are absent or have been ruled out. The goal is to identify triggers, avoid unnecessary medicines and build a practical long-term symptom-control plan.",
    consultCues: ["Abdominal cramps linked with bowel movement", "Bloating, gas or urgency after meals", "Constipation, diarrhea or alternating bowel habits", "Symptoms worsened by stress, irregular meals or poor sleep"],
    relatedTerms: ["IBS treatment Agra", "Irritable bowel syndrome doctor Agra", "Bloating treatment Agra", "Digestive problems doctor Agra"],
    pathway: [
      { title: "Symptom and trigger review", text: "Pain pattern, stool frequency, diet, stress, sleep and medicine history are reviewed." },
      { title: "Warning sign check", text: "Blood in stool, anemia, weight loss, fever, night symptoms and family history are checked before labeling IBS." },
      { title: "Personalized control plan", text: "Diet, bowel routine, stress management and medicines are planned according to IBS type." }
    ]
  },
  "chronic-constipation": {
    overview: "Chronic constipation care evaluates hard stool, straining, incomplete evacuation, bloating and long-term laxative use. The plan may include diet correction, medicine review, bowel routine and colon evaluation when warning signs are present.",
    consultCues: ["Constipation lasting weeks or months", "Hard stool, straining or incomplete evacuation", "Bloating, abdominal discomfort or poor appetite", "Blood in stool, anemia, weight loss or new constipation in older age"],
    relatedTerms: ["Chronic constipation treatment Agra", "Constipation doctor Agra", "Colonoscopy for constipation Agra", "Digestive problems doctor Agra"],
    pathway: [
      { title: "Cause assessment", text: "Diet, hydration, activity, thyroid/diabetes risk and constipating medicines are reviewed." },
      { title: "Warning symptom evaluation", text: "Bleeding, anemia, weight loss, severe pain and age-related screening needs are checked." },
      { title: "Bowel plan", text: "Fiber, fluids, toilet routine and safe medicines are planned with follow-up." }
    ]
  },
  "chronic-diarrhea": {
    overview: "Chronic diarrhea care investigates loose stools lasting several weeks, urgency, mucus, blood, weight loss or night-time stools. Evaluation may include stool tests, blood tests, celiac screening, colonoscopy or biopsy depending on symptoms.",
    consultCues: ["Loose stools continuing for more than 3-4 weeks", "Blood or mucus in stool", "Night-time diarrhea, fever, anemia or weight loss", "Repeated antibiotics without lasting improvement"],
    relatedTerms: ["Chronic diarrhea treatment Agra", "Diarrhea specialist Agra", "Colitis evaluation Agra", "IBS diarrhea Agra"],
    pathway: [
      { title: "Pattern review", text: "Duration, frequency, blood, mucus, fever, food relation and weight changes are reviewed." },
      { title: "Targeted testing", text: "Stool tests, blood tests, celiac testing, colonoscopy or biopsy are selected based on warning signs." },
      { title: "Cause-based treatment", text: "Treatment is planned for infection, IBS, colitis, malabsorption or medicine-related diarrhea." }
    ]
  },
  "ascites": {
    overview: "Ascites is fluid buildup in the abdomen, most often related to liver disease but sometimes caused by infection, low protein states or other conditions. Evaluation identifies cause and complications.",
    consultCues: ["Increasing abdominal swelling or tightness", "Known liver disease with fluid in abdomen", "Breathlessness, leg swelling or reduced appetite due to fluid", "Fever, pain or suspected infection in ascitic fluid"],
    relatedTerms: ["Ascites treatment Agra", "Fluid in abdomen Agra", "Liver ascites doctor Agra", "Ascitic fluid tapping Agra"],
    pathway: [
      { title: "Cause evaluation", text: "Liver reports, ultrasound, kidney function and infection signs are reviewed." },
      { title: "Fluid testing or drainage", text: "Ascitic tapping may be planned for diagnosis or symptom relief." },
      { title: "Prevention care", text: "Salt restriction, medicines, monitoring and emergency warning signs are explained." }
    ]
  }
};

function getPageCopy(slug: string, title: string, isDisease: boolean): PageCopy {
  return pageCopyBySlug[slug] ?? {
    overview: `Mudgal Gastromedics Hospital provides focused ${isDisease ? "evaluation and treatment planning" : "procedure planning"} for ${title.toLowerCase()} with clear counselling, safety checks and follow-up care.`,
    consultCues: [
      "Persistent digestive symptoms or abdominal pain",
      "Jaundice, swallowing difficulty or bowel habit changes",
      "Unexplained anemia, bleeding symptoms or abnormal reports",
      "Doctor-advised screening, biopsy or follow-up care"
    ],
    relatedTerms: ["Gastroenterologist in Agra", "Liver specialist in Agra", "Endoscopy centre in Agra", "Digestive disease care Agra"],
    pathway: [
      { title: "Clinical evaluation", text: "History, examination and review of prior reports before recommending the next step." },
      { title: isDisease ? "Care planning" : "Procedure planning", text: isDisease ? "Clear guidance about medicines, tests, diet, procedures if needed and warning symptoms to watch." : "Clear instructions about preparation, fasting, medicines and attendant requirements." },
      { title: "Follow-up support", text: isDisease ? "Report review, monitoring advice and a personalized treatment plan after consultation." : "Reports, biopsy guidance if needed and a personalized treatment plan after the procedure." }
    ]
  };
}

function getCareMode(slug: string, isDisease: boolean) {
  const noSedation = new Set(["fibroscan", "ascitic-fluid-tapping"]);
  const therapeutic = new Set([
    "ercp",
    "cbd-stone-removal",
    "pancreatic-duct-stone-removal",
    "bile-duct-stenting",
    "variceal-banding",
    "sclerotherapy",
    "polypectomy",
    "colon-polyp-removal",
    "stricture-dilation",
    "esophageal-dilation",
    "gi-stenting",
    "peg-tube-placement",
    "endoscopic-hemostasis",
    "argon-plasma-coagulation",
    "foreign-body-removal",
    "intragastric-balloon-placement"
  ]);
  if (isDisease) return "consultation";
  if (noSedation.has(slug)) return "minor";
  if (therapeutic.has(slug)) return "therapeutic";
  return "diagnostic";
}

function getProcedureArticle(slug: string, title: string, isDisease: boolean, pageCopy: PageCopy): ProcedureArticle {
  const mode = getCareMode(slug, isDisease);
  const lowerTitle = title.toLowerCase();
  const isErcpLike = ["ercp", "cbd-stone-removal", "pancreatic-duct-stone-removal", "bile-duct-stenting"].includes(slug);
  const isColonLike = ["colonoscopy", "polypectomy", "colon-polyp-removal", "ibd-colitis", "colon-polyps", "ibs", "chronic-constipation", "chronic-diarrhea"].includes(slug);
  const isLiverLike = ["fibroscan", "fatty-liver", "liver-cirrhosis", "liver-fibrosis", "varices", "ascites", "ascitic-fluid-tapping"].includes(slug);

  const preparationItems = isDisease
    ? [
        "Bring previous prescriptions, blood reports, ultrasound/CT/MRCP reports, discharge summaries and endoscopy or colonoscopy reports.",
        "Carry a list of current medicines, allergies, diabetes or BP history and any blood thinner use such as aspirin, clopidogrel or warfarin.",
        "Do not stop important medicines on your own; reception or the doctor will guide changes if a procedure is planned.",
        "For urgent symptoms such as vomiting blood, black stool, severe pain or jaundice with fever, call reception before travelling."
      ]
    : [
        isColonLike ? "Follow the bowel preparation and diet plan exactly as advised; poor preparation can reduce report quality." : "Fasting is usually needed for 6-8 hours, but the final instruction depends on your procedure and medical condition.",
        "Inform the team if you have diabetes, high BP, heart disease, kidney disease, pregnancy, allergies or previous anesthesia problems.",
        "Tell the doctor about aspirin, clopidogrel, warfarin, apixaban, rivaroxaban or any other blood thinner before the procedure.",
        "Bring previous reports and come with an adult attendant if sedation or a therapeutic procedure is planned."
      ];

  const risks = isDisease
    ? [
        "Delay in evaluation may allow bleeding, jaundice, liver disease or intestinal inflammation to worsen.",
        "Some conditions need blood tests, imaging or endoscopy/colonoscopy before the final plan is clear.",
        "Treatment response varies by cause, stage of disease, age, diabetes, alcohol use and other medical problems."
      ]
    : [
        "Most procedures are completed safely, but uncommon risks may include bleeding, infection, medicine reaction or aspiration.",
        mode === "therapeutic" ? "Therapeutic procedures may carry additional risks depending on the site treated, biopsy, dilation, stent, stone removal or bleeding control." : "Diagnostic procedures may rarely need biopsy or additional therapy if an abnormality is found.",
        isErcpLike ? "ERCP-related procedures can rarely cause pancreatitis, infection, bleeding or perforation and may need observation or admission." : "Perforation is uncommon but important and needs urgent medical attention if it occurs."
      ];

  const recoveryItems = isDisease
    ? [
        "Follow the medicine, diet, lifestyle and testing plan explained during consultation.",
        "Keep follow-up dates, especially for liver disease, IBD, pancreatic disorders, bleeding symptoms or abnormal reports.",
        "Call reception if symptoms worsen before the planned review."
      ]
    : [
        mode === "minor" ? "Most patients can resume routine activity soon after observation, unless the doctor advises rest." : "Rest after sedation and avoid driving, alcohol, heavy machinery or important decisions for the rest of the day.",
        "Eating and medicines are restarted as advised after the report or procedure note is reviewed.",
        "Biopsy, stent, polyp or therapeutic procedure reports may need follow-up discussion and further planning."
      ];

  const sections: ArticleSection[] = [
    {
      title: "What Is It?",
      text: isDisease
        ? `${title} care at Mudgal Gastromedics Hospital focuses on identifying the cause of symptoms, reviewing reports and planning treatment for digestive, liver, pancreatic or intestinal disease. ${pageCopy.overview}`
        : `${title} is a gastroenterology service used to diagnose, monitor or treat selected digestive, liver, pancreatic, biliary or intestinal problems. ${pageCopy.overview}`
    },
    {
      title: "Why Is It Done?",
      text: `${title} may be advised when symptoms, blood reports, imaging or previous endoscopy/colonoscopy findings suggest that specialist gastroenterology review is needed.`,
      items: pageCopy.consultCues
    },
    {
      title: "Who May Need It?",
      text: "Indian patients commonly seek gastro care when symptoms are persistent, recurring, unexplained or affecting daily life.",
      items: [
        isLiverLike ? "Patients with fatty liver, jaundice, abnormal liver tests, hepatitis, alcohol-related liver risk or abdominal swelling." : "Patients with acidity, abdominal pain, bloating, vomiting, difficulty swallowing or unexplained weight loss.",
        isColonLike ? "Patients with blood in stool, black stool, chronic constipation, chronic diarrhea, anemia, polyps or family history of colon disease." : "Patients with blood in stool, black stool, anemia, jaundice, pancreatic pain or abnormal ultrasound/CT/MRCP findings.",
        "Patients from Agra, Shaheed Nagar, Tajganj, Fatehabad Road, Kamla Nagar, Sikandra, Mathura, Firozabad, Bharatpur and nearby areas looking for specialist digestive care."
      ]
    },
    {
      title: "How To Prepare",
      text: "Preparation depends on the procedure, symptoms and medical condition. The hospital team confirms final instructions before your visit.",
      items: preparationItems
    },
    {
      title: isDisease ? "What Happens During Consultation?" : "What Happens During The Procedure?",
      text: isDisease
        ? "The doctor reviews symptoms, previous records, medicines and risk factors, examines the patient when needed and explains whether tests, medicines, diet changes or procedures are required."
        : "The team verifies identity, reports, consent and fitness. Monitoring is done when required, the procedure is performed using appropriate equipment and the findings are explained after recovery.",
      items: [
        "Bring prior reports so the doctor can compare current findings with earlier disease status.",
        "Ask questions about the reason for the test, expected benefit, alternatives and follow-up plan.",
        "Available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra."
      ]
    },
    {
      title: "Is It Painful?",
      text: isDisease
        ? "Consultation itself is not painful. If a test or procedure is needed, comfort options and preparation are explained before scheduling."
        : mode === "minor"
          ? `${title} is usually done with local comfort measures or simple observation, depending on the service. The team explains what to expect before starting.`
          : `${title} may involve sedation or anesthesia support when appropriate. Most patients remember little discomfort, but throat irritation, bloating, mild cramps or tiredness can occur depending on the procedure.`
    },
    {
      title: "Risks & Safety",
      text: "The doctor balances benefit and risk before advising any test or procedure. Risks are usually uncommon but should be understood clearly.",
      items: risks
    },
    {
      title: "Recovery & Aftercare",
      text: "Recovery advice depends on whether the visit was a consultation, diagnostic test or therapeutic procedure.",
      items: recoveryItems
    },
    {
      title: "When To Call The Hospital Urgently",
      text: "Do not wait for a routine appointment if warning symptoms occur.",
      items: [
        "Fever with jaundice, chills, severe abdominal pain or persistent vomiting.",
        "Vomiting blood, black stool, fresh blood in stool, fainting or severe weakness.",
        "Breathing difficulty, chest discomfort, severe dehydration or worsening abdominal swelling.",
        "Severe pain after a procedure, repeated vomiting, inability to eat/drink or any symptom that feels unsafe."
      ]
    },
    {
      title: "Cost & Insurance Notes",
      text: "The cost depends on consultation type, procedure complexity, biopsy, stent, anesthesia, consumables, admission need and insurance or cashless process. Reception can guide estimated billing before scheduling where possible."
    }
  ];

  const faqs: ArticleFaq[] = [
    {
      question: `Is ${title} available in Agra?`,
      answer: `Yes. ${title} care is available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra, with gastroenterology consultation and procedure planning where clinically required.`
    },
    {
      question: `Do I need fasting for ${lowerTitle}?`,
      answer: isDisease
        ? "Fasting is usually not required for a routine consultation, but it may be advised if same-day tests or procedures are planned."
        : isColonLike
          ? "Colonoscopy-related procedures need bowel preparation and dietary restrictions. Follow the hospital instructions exactly."
          : "Fasting is commonly required for many endoscopy-related procedures, usually 6-8 hours, but the doctor or reception will confirm exact instructions."
    },
    {
      question: "Should I stop diabetes, BP or blood thinner medicines?",
      answer: "Do not stop medicines on your own. Tell the doctor about insulin, diabetes tablets, BP medicines, aspirin, clopidogrel, warfarin or other blood thinners so safe instructions can be given."
    },
    {
      question: "Do I need an attendant?",
      answer: mode === "diagnostic" || mode === "therapeutic"
        ? "An adult attendant is usually advised when sedation, anesthesia or a therapeutic procedure is planned."
        : "An attendant is helpful for elderly patients, weak patients, urgent symptoms or when procedures may be scheduled."
    },
    {
      question: "What reports should I bring?",
      answer: "Bring previous prescriptions, blood tests, ultrasound, CT, MRCP, FibroScan, endoscopy, colonoscopy, biopsy and discharge summaries if available."
    },
    {
      question: `Is ${lowerTitle} safe?`,
      answer: "The doctor advises it only when the expected benefit is greater than the risk. Most patients do well, but risks and safety instructions are explained before any procedure."
    },
    {
      question: "How do I book an appointment?",
      answer: `Call reception at ${site.mobile}, send a WhatsApp message, or use the appointment form on this website.`
    }
  ];

  return { sections, faqs };
}

export async function generateStaticParams() {
  return (await getPublicProcedures()).map((procedure) => ({ slug: procedure.slug }));
}

export async function generateMetadata({ params }: ProcedurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);

  if (!procedure) return {};

  return {
    title: procedure.seoTitle || `${procedure.title} in Agra`,
    description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
    alternates: { canonical: `/procedures/${procedure.slug}` },
    openGraph: {
      title: procedure.seoTitle || `${procedure.title} in Agra`,
      description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
      url: `${site.url}/procedures/${procedure.slug}`,
      type: "article",
      images: [`/procedures/${procedure.slug}/opengraph-image`]
    },
    twitter: {
      card: "summary_large_image",
      title: procedure.seoTitle || `${procedure.title} in Agra`,
      description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
      images: [`/procedures/${procedure.slug}/opengraph-image`]
    }
  };
}

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);
  if (!procedure) notFound();
  const isBleeding = procedure.slug === "gastrointestinal-bleeding-management";
  const isDisease = diseaseSlugs.has(procedure.slug);
  const pageCopy = getPageCopy(procedure.slug, procedure.title, isDisease);
  const article = getProcedureArticle(procedure.slug, procedure.title, isDisease, pageCopy);
  const relatedBlogPosts = seoBlogPosts.filter((post) => post.relatedHref === `/procedures/${procedure.slug}`);

  const heroImage = isBleeding ? "/images/hospital/cbd-stone-removal.jpg" : "/images/hospital/endoscopy-room.jpg";
  const quickFacts = [
    ["Specialty", "Gastroenterology"],
    ["Care Type", isBleeding ? "Urgent endoscopic care" : isDisease ? "Consultation and treatment planning" : "Consultation and procedure planning"],
    ["Location", "Shaheed Nagar, Agra"],
    ["Appointment", "Call or WhatsApp reception"]
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": isDisease ? "MedicalCondition" : "MedicalProcedure",
        name: procedure.title,
        description: procedure.summary,
        provider: {
          "@type": "Hospital",
          name: site.name,
          url: site.url
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Gastroenterology Hospital in Agra</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">{procedure.title} in Agra</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>{procedure.summary}</p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">{procedure.hiSummary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact#appointment" className="gap-2"><CalendarCheck size={18} /> Book Appointment</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="gap-2"><MessageCircle size={18} /> WhatsApp</ButtonLink>
              <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="gap-2 border-white/25 bg-white/95 text-ink"><Phone size={18} /> Call {site.mobile}</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/20 bg-white/12 p-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Quick Information</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickFacts.map(([label, value]) => (
                <div key={label} className="rounded border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/55">{label}</p>
                  <p className="mt-1 font-black text-white">{value}</p>
                </div>
              ))}
            </div>
            {isBleeding ? (
              <div className="mt-4 flex gap-3 rounded border border-red-300/30 bg-red-600/20 p-4 text-sm leading-relaxed text-white/85">
                <AlertCircle className="mt-0.5 shrink-0 text-red-100" size={19} />
                <p>Severe or active bleeding symptoms need immediate medical attention. Call reception or local emergency services urgently.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <div className="grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <MotionReveal>
          <article className="overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="relative aspect-[4/3] bg-soft">
              <Image src={heroImage} alt={`${procedure.title} facility at Mudgal Gastromedics Hospital`} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{isDisease ? "Care Overview" : "Procedure Overview"}</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Specialized {procedure.title} care by a gastroenterology team</h2>
              <p className="mt-4 text-muted">
                {pageCopy.overview}
              </p>
            </div>
          </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
          <div className="grid gap-5">
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded bg-soft text-brand">
                <Stethoscope size={24} />
              </div>
              <h2 className="text-3xl font-black leading-tight">When to consult</h2>
              <div className="mt-5 grid gap-3">
                {pageCopy.consultCues.map((cue) => (
                  <div key={cue} className="flex gap-3 rounded border border-line bg-soft/60 p-3 text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                    <span>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-xl font-black">Related search terms</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {pageCopy.relatedTerms.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-sm font-black text-teal-dark">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          </MotionReveal>
        </div>
      </Section>

      <Section>
        <MotionReveal>
          <div className="relative overflow-hidden rounded border border-line bg-ink p-6 text-white shadow-lift md:p-8">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.22),transparent_24rem),linear-gradient(135deg,rgba(8,145,178,0.42),rgba(5,150,105,0.22)_48%,rgba(2,22,29,0.96))]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Patient Education Guide</p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">{procedure.title}: complete guide for Indian patients</h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/82">
                  Clear information about why it is done, preparation, medicine precautions, safety, recovery, cost factors and when to call reception.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {["Bring previous reports", "Ask about fasting", "Discuss blood thinners", "Call reception for urgent symptoms"].map((item) => (
                  <div key={item} className="rounded border border-white/15 bg-white/10 px-4 py-3 font-semibold text-cyan-50 backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Guide" title={`${procedure.title}: what patients should know`} />
        <div className="grid gap-5 lg:grid-cols-2">
          {article.sections.map((section) => (
            <article key={section.title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-2xl font-black leading-tight text-ink">{section.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{section.text}</p>
              {section.items?.length ? (
                <ul className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-muted">
                      <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Care Pathway" title="What patients can expect" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { ...pageCopy.pathway[0], icon: ClipboardList },
            { ...pageCopy.pathway[1], icon: HeartPulse },
            { ...pageCopy.pathway[2], icon: FileText }
          ].map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded bg-soft text-brand">
                <Icon size={21} />
              </span>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="FAQs" title={`${procedure.title} FAQs`} />
        <div className="grid gap-4 lg:grid-cols-2">
          {article.faqs.map((faq) => (
            <details key={faq.question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-lg font-black text-ink">
                {faq.question}
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {relatedBlogPosts.length ? (
        <Section muted>
          <SectionHead eyebrow="Related Reading" title={`Patient guides for ${procedure.title}`} />
          <div className="grid gap-5 md:grid-cols-2">
            {relatedBlogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{post.category}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-ink">{post.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{post.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-black text-brand">
                  Read guide <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Need guidance?</p>
            <h2 className="mt-2 text-3xl font-black">Talk to reception before planning your visit.</h2>
            <p className="mt-2 max-w-2xl text-muted">Share symptoms, prior reports and preferred appointment timing so the hospital team can guide the next step.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact#appointment">Book Appointment <ArrowRight size={18} /></ButtonLink>
            <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost"><Phone size={18} /> Call Reception</ButtonLink>
            <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
