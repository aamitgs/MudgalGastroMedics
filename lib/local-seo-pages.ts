import { fullAddress, site } from "@/lib/site-data";

export type LocalSeoPage = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  hero: string;
  localFocus: string;
  keywords: string[];
  primaryService: string;
  patientIntent: string[];
  relatedLinks: Array<{ label: string; href: string }>;
  nearbyAreas: string[];
};

export type LocalSeoPageDetail = {
  routeContext: string;
  careDifference: string;
  preparationNotes: string[];
  localHighlights: Array<{ title: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const localSeoPages: LocalSeoPage[] = [
  {
    slug: "gastroenterologist-in-agra",
    title: "Gastroenterologist in Agra",
    shortTitle: "Gastroenterology Care",
    description: "Consult a gastroenterologist in Agra for acidity, abdominal pain, IBS, bowel changes, bleeding symptoms, endoscopy and colonoscopy planning.",
    hero: "Specialist digestive care for stomach, intestine, food pipe, pancreas and bowel symptoms at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    localFocus: "Patients from Shaheed Nagar, Tajganj, Fatehabad Road, Agra Cantt, Civil Lines, Kamla Nagar and nearby Agra areas visit for gastroenterology consultation.",
    keywords: ["Gastroenterologist in Agra", "Gastro doctor near me", "Digestive disease specialist Agra", "Stomach specialist Agra"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Tajganj", "Fatehabad Road", "Rajpur Chungi", "Agra Cantt", "Civil Lines", "Kamla Nagar", "Dayal Bagh"]
  },
  {
    slug: "liver-specialist-in-agra",
    title: "Liver Specialist in Agra",
    shortTitle: "Liver Care",
    description: "Liver specialist care in Agra for fatty liver, jaundice, high SGPT/SGOT, liver fibrosis, cirrhosis, ascites and FibroScan assessment.",
    hero: "Focused hepatology and liver care for abnormal liver reports, fatty liver, jaundice and chronic liver disease in Agra.",
    localFocus: "Patients from Agra and nearby cities commonly visit for liver function test review, FibroScan, jaundice evaluation and cirrhosis care.",
    keywords: ["Liver Specialist in Agra", "Hepatologist in Agra", "Fatty Liver Treatment Agra", "High SGPT Doctor Agra"],
    primaryService: "Hepatology / Liver Care",
    patientIntent: ["Fatty liver on ultrasound", "High SGPT, SGOT or abnormal LFT", "Jaundice, itching or yellow eyes", "Ascites, cirrhosis or varices monitoring"],
    relatedLinks: [
      { label: "Hepatology / Liver Care", href: "/services/hepatology-liver-care" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Liver Cirrhosis", href: "/procedures/liver-cirrhosis" }
    ],
    nearbyAreas: ["Fatehabad Road", "Tajganj", "Civil Lines", "Kamla Nagar", "Sikandra", "New Agra", "Mathura", "Firozabad"]
  },
  {
    slug: "endoscopy-in-agra",
    title: "Endoscopy in Agra",
    shortTitle: "Upper GI Endoscopy",
    description: "Endoscopy in Agra for acidity, ulcers, stomach pain, vomiting, black stools, anemia, swallowing difficulty and biopsy planning.",
    hero: "Upper GI endoscopy support with fasting guidance, report explanation and follow-up care at Mudgal Gastromedics Hospital.",
    localFocus: "Endoscopy care is available at Shaheed Nagar for patients from Rajpur Chungi, Fatehabad Road, Tajganj, Agra Cantt and nearby areas.",
    keywords: ["Endoscopy in Agra", "Upper GI Endoscopy Agra", "Endoscopy near me", "Stomach endoscopy Agra"],
    primaryService: "Advanced Endoscopy Centre",
    patientIntent: ["Persistent acidity or reflux", "Upper abdominal pain or vomiting", "Black stools or unexplained anemia", "Difficulty swallowing or food sticking"],
    relatedLinks: [
      { label: "Advanced Endoscopy Centre", href: "/services/advanced-endoscopy-centre" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Peptic Ulcer Disease", href: "/procedures/peptic-ulcer-disease" },
      { label: "Difficulty Swallowing", href: "/procedures/difficulty-swallowing" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Rajpur Chungi", "Fatehabad Road", "Tajganj", "Agra Cantt", "Civil Lines", "Kaveri Vihar", "Panchvati"]
  },
  {
    slug: "colonoscopy-in-agra",
    title: "Colonoscopy in Agra",
    shortTitle: "Colonoscopy",
    description: "Colonoscopy in Agra for blood in stool, black stool, chronic diarrhea, constipation, colitis, colon polyps and colon cancer screening.",
    hero: "Colonoscopy planning with bowel preparation guidance, polyp evaluation, biopsy follow-up and patient-friendly recovery instructions.",
    localFocus: "Patients from Agra, Mathura, Firozabad, Bharatpur and nearby cities visit for colonoscopy and bowel symptom evaluation.",
    keywords: ["Colonoscopy in Agra", "Colon Cancer Screening Agra", "Blood in Stool Doctor Agra", "Colonoscopy near me"],
    primaryService: "Diagnostic Services",
    patientIntent: ["Blood in stool or black stools", "Long-standing diarrhea or constipation", "Colitis, IBD or mucus in stool", "Colon polyp or screening advice"],
    relatedLinks: [
      { label: "Diagnostic Services", href: "/services/diagnostic-services" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "Colon Polyps", href: "/procedures/colon-polyps" },
      { label: "IBD / Colitis", href: "/procedures/ibd-colitis" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Fatehabad Road", "Civil Lines", "Kamla Nagar", "Mathura", "Firozabad", "Bharatpur", "Dholpur"]
  },
  {
    slug: "ercp-specialist-in-agra",
    title: "ERCP Specialist in Agra",
    shortTitle: "ERCP Care",
    description: "ERCP specialist care in Agra for CBD stones, obstructive jaundice, bile duct strictures, cholangitis and bile duct stenting.",
    hero: "Advanced ERCP care for bile duct and pancreatic duct problems with imaging review, procedure planning and recovery guidance.",
    localFocus: "Patients from Agra and nearby cities visit for CBD stone removal, jaundice treatment and bile duct stenting when advised by the doctor.",
    keywords: ["ERCP Specialist in Agra", "ERCP in Agra", "CBD Stone Removal Agra", "Jaundice Treatment Agra"],
    primaryService: "Advanced Endoscopy Centre",
    patientIntent: ["CBD stone on ultrasound, CT or MRCP", "Jaundice with pain or fever", "Bile duct stricture or blocked bile flow", "Pancreaticobiliary procedure planning"],
    relatedLinks: [
      { label: "ERCP", href: "/procedures/ercp" },
      { label: "CBD Stone Removal", href: "/procedures/cbd-stone-removal" },
      { label: "Bile Duct Stenting", href: "/procedures/bile-duct-stenting" },
      { label: "Obstructive Jaundice", href: "/procedures/obstructive-jaundice" }
    ],
    nearbyAreas: ["Agra", "Mathura", "Firozabad", "Bharatpur", "Dholpur", "Morena", "Tundla", "Shikohabad"]
  },
  {
    slug: "fibroscan-in-agra",
    title: "FibroScan in Agra",
    shortTitle: "FibroScan",
    description: "FibroScan in Agra for fatty liver, liver fibrosis, cirrhosis risk, high SGPT/SGOT and chronic liver disease monitoring.",
    hero: "Non-invasive liver stiffness and fatty liver assessment for patients with abnormal liver reports or metabolic risk.",
    localFocus: "FibroScan support is available for patients from Agra local areas and nearby cities who need liver risk assessment.",
    keywords: ["FibroScan in Agra", "Fatty Liver Test Agra", "Liver Fibrosis Scan Agra", "Liver Stiffness Test Agra"],
    primaryService: "Diagnostic Services",
    patientIntent: ["Fatty liver on ultrasound", "High SGPT/SGOT or abnormal LFT", "Diabetes, obesity or metabolic risk", "Chronic hepatitis or alcohol-related liver risk"],
    relatedLinks: [
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Liver Fibrosis", href: "/procedures/liver-fibrosis" },
      { label: "Hepatology / Liver Care", href: "/services/hepatology-liver-care" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Tajganj", "Fatehabad Road", "Agra Cantt", "Mathura", "Firozabad", "Bharatpur", "Dholpur"]
  },
  {
    slug: "gastroenterologist-near-shaheed-nagar-agra",
    title: "Gastroenterologist near Shaheed Nagar, Agra",
    shortTitle: "Shaheed Nagar Gastro Care",
    description: "Gastroenterologist near Shaheed Nagar, Agra for acidity, abdominal pain, liver reports, endoscopy, colonoscopy and GI symptom evaluation.",
    hero: `${site.name} is located at ${fullAddress}, serving Shaheed Nagar and nearby Agra areas.`,
    localFocus: "This page supports patients searching for digestive care near Shaheed Nagar, Rajpur Chungi, Kaveri Vihar, Panchvati and Fatehabad Road.",
    keywords: ["Gastroenterologist near Shaheed Nagar Agra", "Gastro doctor Shaheed Nagar", "Endoscopy near Shaheed Nagar", "Stomach specialist Shaheed Nagar"],
    primaryService: "Gastroenterology",
    patientIntent: ["Nearby gastro consultation", "Endoscopy or colonoscopy planning", "Fatty liver or LFT review", "Urgent bleeding or severe pain guidance"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Contact Hospital", href: "/contact" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Rajpur Chungi", "Kaveri Vihar", "Panchvati", "Fatehabad Road", "Shamsabad Road", "Tajganj", "Agra Cantt"]
  },
  {
    slug: "gastroenterologist-near-fatehabad-road-agra",
    title: "Gastroenterologist near Fatehabad Road, Agra",
    shortTitle: "Fatehabad Road Gastro Care",
    description: "Gastroenterologist near Fatehabad Road, Agra for stomach pain, acidity, IBS, blood in stool, endoscopy, colonoscopy and liver care.",
    hero: "Digestive and liver care near Fatehabad Road with access to gastroenterology consultation, endoscopy, colonoscopy and FibroScan-related guidance.",
    localFocus: "Patients from Fatehabad Road, Tajganj, Taj Nagari, Basai, Kaveri Vihar and Shaheed Nagar commonly visit the hospital.",
    keywords: ["Gastroenterologist near Fatehabad Road Agra", "Gastro doctor Fatehabad Road", "Endoscopy near Fatehabad Road", "Liver specialist near Fatehabad Road"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity or chronic stomach pain", "Bloating, vomiting or bowel symptoms", "Liver reports and fatty liver review", "Endoscopy or colonoscopy planning"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Liver Specialist in Agra", href: "/areas/liver-specialist-in-agra" },
      { label: "Endoscopy in Agra", href: "/areas/endoscopy-in-agra" },
      { label: "Colonoscopy in Agra", href: "/areas/colonoscopy-in-agra" }
    ],
    nearbyAreas: ["Fatehabad Road", "Tajganj", "Taj Nagari Phase 1", "Taj Nagari Phase 2", "Basai", "Kaveri Vihar", "Shaheed Nagar", "Rajpur Chungi"]
  },
  {
    slug: "liver-specialist-near-tajganj-agra",
    title: "Liver Specialist near Tajganj, Agra",
    shortTitle: "Tajganj Liver Care",
    description: "Liver specialist near Tajganj, Agra for fatty liver, jaundice, high SGPT/SGOT, FibroScan, cirrhosis and ascites evaluation.",
    hero: "Liver care for Tajganj and nearby areas, including fatty liver, jaundice, liver fibrosis and chronic liver disease monitoring.",
    localFocus: "Patients from Tajganj, Fatehabad Road, Taj Nagari, Basai and Shaheed Nagar can access liver specialist care at Mudgal Gastromedics Hospital.",
    keywords: ["Liver Specialist near Tajganj Agra", "Fatty Liver Doctor Tajganj", "FibroScan near Tajganj", "Jaundice Doctor Tajganj Agra"],
    primaryService: "Hepatology / Liver Care",
    patientIntent: ["Fatty liver or abnormal LFT", "Jaundice, itching or yellow urine", "Cirrhosis, ascites or varices", "FibroScan or liver fibrosis monitoring"],
    relatedLinks: [
      { label: "Hepatology / Liver Care", href: "/services/hepatology-liver-care" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Jaundice Treatment", href: "/procedures/obstructive-jaundice" }
    ],
    nearbyAreas: ["Tajganj", "Fatehabad Road", "Taj Nagari Phase 1", "Taj Nagari Phase 2", "Basai", "Shaheed Nagar", "Agra Cantt", "Civil Lines"]
  },
  {
    slug: "endoscopy-near-agra-cantt",
    title: "Endoscopy near Agra Cantt",
    shortTitle: "Endoscopy Access",
    description: "Endoscopy near Agra Cantt for acidity, ulcers, stomach pain, vomiting, black stools, anemia and swallowing difficulty.",
    hero: "Upper GI endoscopy support for patients from Agra Cantt, Sadar Bazar, Kheria, Idgah, Arjun Nagar and nearby areas.",
    localFocus: "Patients searching for endoscopy near Agra Cantt can contact reception for fasting guidance, report review and appointment planning.",
    keywords: ["Endoscopy near Agra Cantt", "Upper GI Endoscopy Agra Cantt", "Endoscopy near me Agra", "Stomach endoscopy Agra"],
    primaryService: "Advanced Endoscopy Centre",
    patientIntent: ["Persistent acidity or ulcer symptoms", "Black stools or anemia", "Difficulty swallowing", "Repeated vomiting or upper abdominal pain"],
    relatedLinks: [
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Advanced Endoscopy Centre", href: "/services/advanced-endoscopy-centre" },
      { label: "Peptic Ulcer Disease", href: "/procedures/peptic-ulcer-disease" },
      { label: "Contact Hospital", href: "/contact" }
    ],
    nearbyAreas: ["Agra Cantt", "Sadar Bazar", "Kheria Mod", "Airport Area (Kheria)", "Idgah", "Arjun Nagar", "Pratap Pura", "MG Road"]
  },
  {
    slug: "gastro-hospital-in-shaheed-nagar-agra",
    title: "Gastro Hospital in Shaheed Nagar, Agra",
    shortTitle: "Gastro Hospital",
    description: "Gastro hospital in Shaheed Nagar, Agra offering gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan-related care and GI procedures.",
    hero: "Mudgal Gastromedics Hospital provides focused digestive, liver and endoscopy care from Shaheed Nagar, Agra.",
    localFocus: "The hospital location supports patients from Shaheed Nagar, Rajpur Chungi, Kaveri Vihar, Fatehabad Road, Tajganj, Agra Cantt and nearby cities.",
    keywords: ["Gastro Hospital in Shaheed Nagar Agra", "Gastroenterology Hospital Agra", "Endoscopy Centre Shaheed Nagar", "Liver Hospital Agra"],
    primaryService: "Gastroenterology Hospital",
    patientIntent: ["Gastroenterology consultation", "Liver care and FibroScan guidance", "Endoscopy, colonoscopy or ERCP planning", "Urgent GI warning symptom guidance"],
    relatedLinks: [
      { label: "About Hospital", href: "/about" },
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Advanced Endoscopy Centre", href: "/services/advanced-endoscopy-centre" },
      { label: "Contact & Directions", href: "/contact" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Rajpur Chungi", "Kaveri Vihar", "Panchvati", "Fatehabad Road", "Tajganj", "Agra Cantt", "Mathura", "Firozabad"]
  },
  {
    slug: "gastroenterologist-in-mathura",
    title: "Gastroenterologist in Mathura",
    shortTitle: "Mathura Gastro Care",
    description: "Gastroenterologist for patients travelling from Mathura to Agra for acidity, abdominal pain, IBS, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients travelling from Mathura can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 55-60 km away via NH-19, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Mathura, Vrindavan, Chhata, Goverdhan and nearby Mathura-district towns travel to Agra for gastroenterology consultation, liver care and endoscopy-related procedures.",
    keywords: ["Gastroenterologist in Mathura", "Gastro doctor near Mathura", "Liver specialist near Mathura", "Endoscopy near Mathura"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Mathura", "Vrindavan", "Chhata", "Goverdhan", "Raya", "Baldeo", "Mahavan", "Kosi Kalan"]
  },
  {
    slug: "gastroenterologist-in-vrindavan",
    title: "Gastroenterologist in Vrindavan",
    shortTitle: "Vrindavan Gastro Care",
    description: "Gastroenterologist for patients and visitors travelling from Vrindavan to Agra for digestive symptoms, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients and visitors travelling from Vrindavan can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 60-65 km away via NH-19, for gastroenterology, liver and endoscopy care.",
    localFocus: "Residents and visitors travelling from Vrindavan, Mathura, Chhata and Goverdhan visit Agra for gastroenterology consultation, endoscopy and liver-related care.",
    keywords: ["Gastroenterologist in Vrindavan", "Gastro doctor near Vrindavan", "Liver specialist near Vrindavan", "Stomach doctor near Vrindavan"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Vrindavan", "Mathura", "Chhata", "Goverdhan", "Baldeo", "Mahavan"]
  },
  {
    slug: "gastroenterologist-in-firozabad",
    title: "Gastroenterologist in Firozabad",
    shortTitle: "Firozabad Gastro Care",
    description: "Gastroenterologist for patients travelling from Firozabad to Agra for acidity, abdominal pain, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients from Firozabad can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 40 km away, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Firozabad, Tundla, Shikohabad, Sirsaganj and Jasrana travel to Agra for gastroenterology consultation, liver care and procedure planning.",
    keywords: ["Gastroenterologist in Firozabad", "Gastro doctor near Firozabad", "Liver specialist near Firozabad", "Endoscopy near Firozabad"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Firozabad", "Tundla", "Shikohabad", "Sirsaganj", "Jasrana"]
  },
  {
    slug: "gastroenterologist-in-bharatpur",
    title: "Gastroenterologist in Bharatpur",
    shortTitle: "Bharatpur Gastro Care",
    description: "Gastroenterologist for patients travelling from Bharatpur, Rajasthan to Agra for digestive symptoms, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients travelling from Bharatpur can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 55 km away, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Bharatpur, Deeg, Kumher, Weir and Bayana in Rajasthan travel to Agra for gastroenterology consultation, liver care and procedure planning.",
    keywords: ["Gastroenterologist in Bharatpur", "Gastro doctor near Bharatpur", "Liver specialist near Bharatpur", "Endoscopy near Bharatpur"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Bharatpur", "Deeg", "Kumher", "Weir", "Bayana", "Roopbas"]
  },
  {
    slug: "gastroenterologist-in-dholpur",
    title: "Gastroenterologist in Dholpur",
    shortTitle: "Dholpur Gastro Care",
    description: "Gastroenterologist for patients travelling from Dholpur, Rajasthan to Agra for digestive symptoms, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients travelling from Dholpur can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 55 km away via the Agra-Gwalior road, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Dholpur, Bari and Rajakhera in Rajasthan travel to Agra for gastroenterology consultation, liver care and procedure planning.",
    keywords: ["Gastroenterologist in Dholpur", "Gastro doctor near Dholpur", "Liver specialist near Dholpur", "Endoscopy near Dholpur"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Dholpur", "Bari", "Rajakhera", "Bharatpur"]
  },
  {
    slug: "gastroenterologist-in-morena",
    title: "Gastroenterologist in Morena",
    shortTitle: "Morena Gastro Care",
    description: "Gastroenterologist for patients travelling from Morena, Madhya Pradesh to Agra for digestive symptoms, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients travelling from Morena can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 95 km away via the Agra-Gwalior road, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Morena, Ambah, Porsa, Sabalgarh and Joura in Madhya Pradesh travel to Agra for gastroenterology consultation, liver care and procedure planning.",
    keywords: ["Gastroenterologist in Morena", "Gastro doctor near Morena", "Liver specialist near Morena", "Endoscopy near Morena"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Morena", "Ambah", "Porsa", "Sabalgarh", "Joura", "Dimani"]
  },
  {
    slug: "gastroenterologist-in-gwalior",
    title: "Gastroenterologist in Gwalior",
    shortTitle: "Gwalior Gastro Care",
    description: "Gastroenterologist for patients travelling from Gwalior, Madhya Pradesh to Agra for digestive symptoms, liver reports, endoscopy and colonoscopy care.",
    hero: "Patients travelling from Gwalior can consult Mudgal Gastromedics Hospital in Shaheed Nagar, Agra, roughly 120 km away via the Agra-Gwalior road, for gastroenterology, liver and endoscopy care.",
    localFocus: "Patients from Gwalior and nearby Morena travel to Agra for gastroenterology consultation, liver care and endoscopy or colonoscopy-related procedures.",
    keywords: ["Gastroenterologist in Gwalior", "Gastro doctor near Gwalior", "Liver specialist near Gwalior", "Endoscopy near Gwalior"],
    primaryService: "Gastroenterology",
    patientIntent: ["Acidity, reflux or stomach burning", "Abdominal pain, bloating or vomiting", "Constipation, diarrhea or IBS symptoms", "Blood in stool, black stools or anemia"],
    relatedLinks: [
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" }
    ],
    nearbyAreas: ["Gwalior", "Morena", "Agra"]
  },
  {
    slug: "fatty-liver-treatment-in-agra",
    title: "Fatty Liver Treatment in Agra",
    shortTitle: "Fatty Liver Treatment",
    description: "Fatty liver treatment in Agra for high SGPT/SGOT, metabolic risk, diabetes-related fatty liver and lifestyle-based liver care planning.",
    hero: "Assessment and treatment planning for fatty liver disease at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    localFocus: "Patients from across Agra and nearby areas visit for fatty liver evaluation, FibroScan-related assessment and lifestyle-based treatment planning.",
    keywords: ["Fatty Liver Treatment in Agra", "Fatty Liver Doctor Agra", "NAFLD Treatment Agra", "High SGPT Doctor Agra"],
    primaryService: "Hepatology / Liver Care",
    patientIntent: ["Fatty liver reported on ultrasound", "High SGPT/SGOT or abnormal LFT", "Diabetes, obesity or high cholesterol", "FibroScan or liver stiffness assessment"],
    relatedLinks: [
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Hepatology / Liver Care", href: "/services/hepatology-liver-care" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Liver Specialist in Agra", href: "/areas/liver-specialist-in-agra" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Tajganj", "Fatehabad Road", "Sikandra", "Kamla Nagar", "Civil Lines"]
  },
  {
    slug: "ibs-treatment-in-agra",
    title: "IBS Treatment in Agra",
    shortTitle: "IBS Treatment",
    description: "IBS treatment in Agra for abdominal pain, bloating, constipation, diarrhea and recurrent bowel habit changes.",
    hero: "Evaluation and treatment planning for irritable bowel syndrome at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    localFocus: "Patients from across Agra and nearby areas visit for IBS symptom evaluation, bowel-habit review and treatment planning.",
    keywords: ["IBS Treatment in Agra", "IBS Doctor Agra", "Irritable Bowel Syndrome Agra", "Bowel Habit Change Doctor Agra"],
    primaryService: "Gastroenterology",
    patientIntent: ["Recurrent abdominal pain or cramping", "Bloating, gas or altered bowel habits", "Chronic constipation or diarrhea", "Symptoms linked with stress or specific foods"],
    relatedLinks: [
      { label: "IBS", href: "/procedures/ibs" },
      { label: "Gastroenterology Services", href: "/services/gastroenterology" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "Gastroenterologist in Agra", href: "/areas/gastroenterologist-in-agra" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Tajganj", "Fatehabad Road", "Agra Cantt", "Civil Lines", "Kamla Nagar"]
  },
  {
    slug: "weight-management-clinic-in-agra",
    title: "Weight Management Clinic in Agra",
    shortTitle: "Weight Management",
    description: "Medical weight management clinic in Agra with gastroenterology-led evaluation for obesity, fatty liver and metabolic risk.",
    hero: "Gastroenterology-led medical weight management at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    localFocus: "Patients from across Agra and nearby areas visit for obesity evaluation, fatty liver-linked weight concerns and diet-planning guidance.",
    keywords: ["Weight Management Clinic in Agra", "Obesity Treatment Agra", "Medical Weight Loss Agra", "Endoscopic Weight Loss Agra"],
    primaryService: "Medical Weight Management",
    patientIntent: ["Obesity with metabolic risk factors", "Fatty liver linked with weight gain", "Diabetes or high cholesterol needing weight review", "Interest in medical or endoscopic weight-loss options"],
    relatedLinks: [
      { label: "Medical Weight Management", href: "/services/medical-weight-management" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Intragastric Balloon Placement", href: "/procedures/intragastric-balloon-placement" },
      { label: "Hepatology / Liver Care", href: "/services/hepatology-liver-care" }
    ],
    nearbyAreas: ["Shaheed Nagar", "Tajganj", "Fatehabad Road", "Sikandra", "Kamla Nagar", "Civil Lines"]
  }
];

export const localSeoPageDetails: Record<string, LocalSeoPageDetail> = {
  "gastroenterologist-in-agra": {
    routeContext: "This page is for patients anywhere in Agra who need a first gastroenterology opinion, especially when symptoms are persistent, recurring or linked with warning signs. The hospital is located in Shaheed Nagar, with access from Fatehabad Road, Rajpur Chungi, Tajganj and Agra Cantt.",
    careDifference: "The visit is usually planned as a consultation-first pathway: symptom review, prior medicine review, report assessment and then endoscopy, colonoscopy, liver testing or imaging only when clinically useful.",
    preparationNotes: ["Carry old prescriptions and current medicines.", "Bring ultrasound, CT, blood, stool, endoscopy or colonoscopy reports if available.", "Note the duration, triggers and timing of acidity, pain, vomiting or bowel symptoms.", "Call before travelling if there is vomiting blood, black stool, fainting or severe pain."],
    localHighlights: [
      { title: "Broad symptom entry point", text: "Useful for patients unsure whether the problem is stomach, intestine, liver, pancreas or bile duct related." },
      { title: "Report-led planning", text: "Existing reports are reviewed to avoid unnecessary repeat testing where possible." },
      { title: "Procedure access", text: "Endoscopy, colonoscopy, ERCP and FibroScan-related planning are connected to the same care pathway." }
    ],
    faqs: [
      { question: "Which gastro symptoms should not be ignored?", answer: "Vomiting blood, black stools, blood in stool, unexplained weight loss, severe abdominal pain, persistent vomiting and jaundice with fever need early medical advice." },
      { question: "Can I visit with old reports?", answer: "Yes. Prior prescriptions, blood tests, scans and procedure reports are useful for planning the next step." },
      { question: "Is this page only for Shaheed Nagar patients?", answer: "No. It is a city-level gastroenterology page for patients across Agra and nearby areas." }
    ]
  },
  "liver-specialist-in-agra": {
    routeContext: "This page is for patients in Agra with abnormal liver reports, fatty liver on ultrasound, jaundice, hepatitis, alcohol-related liver risk, cirrhosis, ascites or varices monitoring.",
    careDifference: "Liver visits depend heavily on reports and risk stage. The care pathway focuses on LFT pattern, platelet count, INR, ultrasound, FibroScan needs and warning signs such as swelling, bleeding or confusion.",
    preparationNotes: ["Bring LFT, CBC, INR, viral hepatitis markers and ultrasound reports.", "Carry FibroScan or prior liver stiffness reports if already done.", "Mention alcohol intake, diabetes, weight change and current medicines clearly.", "Call urgently for fever with jaundice, vomiting blood, black stool, confusion or increasing abdominal swelling."],
    localHighlights: [
      { title: "Fatty liver risk review", text: "Patients with diabetes, obesity or high SGPT/SGOT can be assessed for fibrosis risk and monitoring frequency." },
      { title: "Cirrhosis follow-up", text: "Ascites, varices, low platelets and bleeding risk need structured follow-up rather than only symptom treatment." },
      { title: "FibroScan linkage", text: "FibroScan-related assessment is connected with liver consultation and report explanation." }
    ],
    faqs: [
      { question: "When should high SGPT or SGOT be shown to a liver specialist?", answer: "Persistent elevation, fatty liver, jaundice, diabetes, alcohol risk or abnormal ultrasound findings should be reviewed." },
      { question: "Does every fatty liver patient need FibroScan?", answer: "Not every patient, but FibroScan may be advised when fibrosis risk needs assessment." },
      { question: "What liver symptoms are urgent?", answer: "Fever with jaundice, vomiting blood, black stools, confusion and increasing abdominal swelling are warning signs." }
    ]
  },
  "endoscopy-in-agra": {
    routeContext: "This page focuses on upper GI endoscopy for patients with acidity, stomach pain, vomiting, black stools, anemia, ulcer symptoms or swallowing difficulty.",
    careDifference: "Endoscopy planning is different from a routine consultation because fasting, medicine review and attendant guidance may be needed before the procedure.",
    preparationNotes: ["Ask reception about fasting before arrival.", "Tell the team about diabetes medicines, BP medicines and blood thinners.", "Bring prior endoscopy, biopsy, ultrasound or blood reports.", "Come with an attendant if sedation is expected."],
    localHighlights: [
      { title: "Upper GI focus", text: "The page is specific to food pipe, stomach and duodenum evaluation rather than general gastro symptoms." },
      { title: "Biopsy planning", text: "If ulcers, inflammation or suspicious areas are seen, biopsy advice and follow-up are explained." },
      { title: "Warning symptom use", text: "Black stool, vomiting blood, anemia and swallowing difficulty are highlighted because they change urgency." }
    ],
    faqs: [
      { question: "Is fasting needed for endoscopy?", answer: "Fasting is commonly needed, but exact instructions should be confirmed before the visit." },
      { question: "Can endoscopy detect ulcers?", answer: "Yes. Upper GI endoscopy helps evaluate ulcers, inflammation, bleeding areas and narrowing." },
      { question: "Should I stop blood thinners before endoscopy?", answer: "Do not stop them yourself. Tell the doctor or reception so safe instructions can be given." }
    ]
  },
  "colonoscopy-in-agra": {
    routeContext: "This page is for patients with blood in stool, black stool, chronic constipation, chronic diarrhea, mucus, suspected colitis, polyps or colon cancer screening needs.",
    careDifference: "Colonoscopy depends strongly on bowel preparation quality. A poor prep can reduce report quality, so diet, medicines and timing need clear planning.",
    preparationNotes: ["Follow bowel preparation exactly as advised.", "Discuss diabetes medicines and blood thinners before the procedure.", "Bring prior colonoscopy, biopsy or stool reports.", "Plan an attendant if sedation is used."],
    localHighlights: [
      { title: "Bowel-prep guidance", text: "Preparation is emphasized because it directly affects visibility and report reliability." },
      { title: "Bleeding evaluation", text: "Fresh blood, black stool and anemia are treated as important cues for early review." },
      { title: "Polyp and biopsy follow-up", text: "The pathway includes reporting, biopsy discussion and surveillance planning when needed." }
    ],
    faqs: [
      { question: "Why is bowel preparation important?", answer: "Clean bowel preparation helps the doctor see the colon lining clearly and reduces missed findings." },
      { question: "Is colonoscopy only for cancer screening?", answer: "No. It is also used for bleeding, chronic diarrhea, constipation, colitis, anemia and polyps." },
      { question: "Can I eat normally before colonoscopy?", answer: "Usually diet restrictions are advised before the test. Follow the hospital instructions." }
    ]
  },
  "ercp-specialist-in-agra": {
    routeContext: "This page is for patients with CBD stones, obstructive jaundice, cholangitis, bile duct strictures, bile duct stenting needs or pancreaticobiliary procedure planning.",
    careDifference: "ERCP is a therapeutic endoscopy pathway, not just a diagnostic consultation. Imaging review, blood tests, fasting, risk explanation and post-procedure observation may be needed.",
    preparationNotes: ["Bring ultrasound, CT, MRCP, LFT and CBC reports.", "Tell the doctor about fever, chills, jaundice and pain pattern.", "Discuss blood thinners, diabetes medicines and prior anesthesia issues.", "Call early if jaundice is associated with fever or severe pain."],
    localHighlights: [
      { title: "CBD stone pathway", text: "The page is specific to bile duct stones and obstruction rather than general gallbladder complaints." },
      { title: "Jaundice urgency", text: "Fever with jaundice can suggest infection and should not be treated as a routine appointment." },
      { title: "Therapeutic planning", text: "Stone removal, stenting and stricture management need case-specific risk assessment." }
    ],
    faqs: [
      { question: "Is ERCP the same as endoscopy?", answer: "ERCP is a specialized endoscopic procedure for bile duct and pancreatic duct problems." },
      { question: "When is jaundice urgent?", answer: "Jaundice with fever, chills, severe pain or weakness needs early medical guidance." },
      { question: "What reports are important for ERCP consultation?", answer: "MRCP, ultrasound, CT, LFT, CBC, INR and previous procedure notes are useful." }
    ]
  },
  "fibroscan-in-agra": {
    routeContext: "This page is for patients with fatty liver, high SGPT/SGOT, diabetes, obesity, hepatitis, alcohol-related liver risk or chronic liver disease monitoring.",
    careDifference: "FibroScan is a non-invasive liver stiffness and fat assessment. The value is highest when results are interpreted with blood reports, ultrasound and clinical risk factors.",
    preparationNotes: ["Bring LFT, platelet count, ultrasound and hepatitis reports.", "Mention diabetes, weight, alcohol use and current medicines.", "Ask whether fasting is needed before the scan.", "Keep prior FibroScan values for comparison if this is follow-up."],
    localHighlights: [
      { title: "Non-invasive liver assessment", text: "Useful when fibrosis risk needs assessment without a biopsy in selected patients." },
      { title: "Fatty liver context", text: "CAP and stiffness values should be interpreted with metabolic risk and blood reports." },
      { title: "Monitoring over time", text: "Repeat comparison can help track risk when lifestyle and treatment plans are followed." }
    ],
    faqs: [
      { question: "What does FibroScan measure?", answer: "It estimates liver stiffness and fatty change, which helps assess fibrosis and fatty liver risk." },
      { question: "Is FibroScan painful?", answer: "No. It is non-invasive and does not involve an incision." },
      { question: "Can FibroScan replace consultation?", answer: "No. Results should be interpreted with symptoms, blood reports and ultrasound findings." }
    ]
  },
  "gastroenterologist-near-shaheed-nagar-agra": {
    routeContext: `${site.name} is located in Shaheed Nagar, so this page is for patients looking for nearby digestive care around Rajpur Chungi, Kaveri Vihar, Panchvati, Fatehabad Road and Shamsabad Road.`,
    careDifference: "Because this is the immediate hospital neighborhood, the page emphasizes directions, quick access, report review and when to call before visiting for urgent symptoms.",
    preparationNotes: ["Carry existing reports so nearby visits can be used efficiently.", "Call before visiting for bleeding, severe pain or persistent vomiting.", "Confirm procedure preparation if endoscopy or colonoscopy may be planned.", "Use the directions link if arriving from Rajpur Chungi, Panchvati or Fatehabad Road."],
    localHighlights: [
      { title: "Closest locality page", text: "This page is anchored around the actual hospital neighborhood rather than a broad city search." },
      { title: "Walk-in decision support", text: "Patients nearby can still benefit from calling first when symptoms suggest urgency." },
      { title: "Report review access", text: "Useful for patients bringing ultrasound, LFT, endoscopy or colonoscopy reports from nearby clinics." }
    ],
    faqs: [
      { question: "Is the hospital in Shaheed Nagar?", answer: `Yes. The address is ${fullAddress}.` },
      { question: "Should nearby patients call before visiting?", answer: "Yes, especially for bleeding symptoms, severe pain, jaundice with fever or persistent vomiting." },
      { question: "Which nearby areas does this page serve?", answer: "Shaheed Nagar, Rajpur Chungi, Kaveri Vihar, Panchvati, Fatehabad Road, Shamsabad Road and Tajganj." }
    ]
  },
  "gastroenterologist-near-fatehabad-road-agra": {
    routeContext: "This page is for patients around Fatehabad Road, Taj Nagari, Basai, Kaveri Vihar and Tajganj looking for digestive and liver care near their route toward Shaheed Nagar.",
    careDifference: "The content is tailored to common nearby searches around tourist and residential corridors: acidity, food-related stomach symptoms, bowel changes, liver reports and procedure planning.",
    preparationNotes: ["Bring current medicines and recent reports when travelling from Fatehabad Road.", "Confirm timing before coming for procedure-related questions.", "Mention food-triggered symptoms, travel-related stomach upset or recurring acidity clearly.", "Call urgently for black stools, vomiting blood, severe pain or dehydration."],
    localHighlights: [
      { title: "Fatehabad Road access", text: "Useful for patients from Taj Nagari, Basai and hotel/residential areas looking for a nearby gastroenterologist." },
      { title: "Digestive and liver overlap", text: "The page connects stomach symptoms with fatty liver and abnormal LFT review, common in local search intent." },
      { title: "Procedure next steps", text: "Endoscopy, colonoscopy or FibroScan planning can be discussed after report and symptom review." }
    ],
    faqs: [
      { question: "Is this page for Fatehabad Road patients only?", answer: "It is focused on Fatehabad Road and nearby areas, but patients from any Agra locality can contact the hospital." },
      { question: "Can I consult for acidity and liver reports together?", answer: "Yes. Bring current medicines and liver reports so both concerns can be reviewed." },
      { question: "What should I do for severe vomiting or dehydration?", answer: "Call reception before travelling, especially if symptoms are persistent or associated with weakness." }
    ]
  },
  "liver-specialist-near-tajganj-agra": {
    routeContext: "This page is for patients from Tajganj, Taj Nagari, Basai and Fatehabad Road with fatty liver, jaundice, abnormal LFT, cirrhosis, ascites or FibroScan needs.",
    careDifference: "Compared with general gastro pages, this page is liver-specific and focuses on report interpretation, fibrosis risk, warning symptoms and monitoring for chronic liver disease.",
    preparationNotes: ["Bring LFT, CBC, INR, ultrasound and prior FibroScan reports.", "Mention alcohol use, diabetes, weight changes and hepatitis history.", "Call early for jaundice with fever, swelling, confusion or black stools.", "Keep prior liver prescriptions and discharge summaries available."],
    localHighlights: [
      { title: "Tajganj liver focus", text: "The page is not a generic gastro page; it is focused on liver-related concerns from Tajganj and nearby areas." },
      { title: "Fatty liver and FibroScan", text: "Patients with metabolic risk can discuss whether stiffness assessment is needed." },
      { title: "Cirrhosis warning signs", text: "Ascites, varices, bleeding and confusion are handled as higher-risk symptoms." }
    ],
    faqs: [
      { question: "Can Tajganj patients consult for fatty liver?", answer: "Yes. Fatty liver, high SGPT/SGOT and FibroScan-related guidance are covered." },
      { question: "What liver reports should I bring?", answer: "LFT, CBC, INR, ultrasound, viral markers and prior FibroScan reports if available." },
      { question: "When should jaundice be treated urgently?", answer: "Jaundice with fever, chills, severe pain, weakness or confusion needs early guidance." }
    ]
  },
  "endoscopy-near-agra-cantt": {
    routeContext: "This page is for patients around Agra Cantt, Sadar Bazar, Kheria, Idgah, Arjun Nagar and Pratap Pura who need endoscopy-related guidance.",
    careDifference: "The page focuses on endoscopy access and preparation for patients travelling from the cantonment and airport-side areas, where confirming fasting and timing before travel is useful.",
    preparationNotes: ["Confirm fasting and arrival time before travelling from Agra Cantt or Kheria.", "Bring previous prescriptions, endoscopy reports and blood tests.", "Tell the team about blood thinners, diabetes and heart medicines.", "Arrange an attendant if sedation may be used."],
    localHighlights: [
      { title: "Agra Cantt access", text: "Designed for patients searching for endoscopy near cantonment, Sadar Bazar, Kheria and Idgah areas." },
      { title: "Fasting-sensitive visit", text: "The page emphasizes confirming preparation because endoscopy may not be possible without correct fasting." },
      { title: "Upper GI warning signs", text: "Black stools, anemia, vomiting and swallowing difficulty are highlighted as reasons to seek timely review." }
    ],
    faqs: [
      { question: "Can I come directly for endoscopy from Agra Cantt?", answer: "Call first to confirm fasting, timing and whether consultation is needed before the procedure." },
      { question: "Is an attendant required?", answer: "An attendant is advisable if sedation is planned." },
      { question: "What symptoms commonly need endoscopy?", answer: "Persistent acidity, stomach pain, vomiting, black stools, anemia and swallowing difficulty may need evaluation." }
    ]
  },
  "gastro-hospital-in-shaheed-nagar-agra": {
    routeContext: "This page is focused on the hospital location itself: digestive, liver, endoscopy, colonoscopy, ERCP and FibroScan-related care available from Shaheed Nagar.",
    careDifference: "Unlike single-service pages, this page explains the hospital-level setup: consultation, diagnostics, therapeutic endoscopy, pharmacy support, accessibility and urgent symptom coordination.",
    preparationNotes: ["Call reception to choose the right department or procedure pathway.", "Bring all prior reports, prescriptions and discharge summaries.", "Confirm fasting if endoscopy, colonoscopy, ERCP or FibroScan may be planned.", "For bleeding, fever with jaundice or severe pain, call before visiting."],
    localHighlights: [
      { title: "Hospital-level care", text: "This page connects consultation, diagnostics, procedure planning and follow-up in one location." },
      { title: "Shaheed Nagar location", text: "Useful for patients comparing gastro care near Rajpur Chungi, Panchvati, Fatehabad Road and Agra Cantt." },
      { title: "Urgent coordination", text: "Reception can help route bleeding, jaundice, severe pain and vomiting symptoms appropriately." }
    ],
    faqs: [
      { question: "What services are available at the gastro hospital?", answer: "Gastroenterology consultation, liver care, endoscopy, colonoscopy, ERCP, FibroScan-related care and selected therapeutic procedures are available." },
      { question: "Where is the hospital located?", answer: `${site.name} is at ${fullAddress}.` },
      { question: "Should I call before visiting for urgent symptoms?", answer: "Yes. Call before visiting for vomiting blood, black stools, severe pain, fever with jaundice or breathing difficulty." }
    ]
  },
  "gastroenterologist-in-mathura": {
    routeContext: "Mudgal Gastromedics Hospital is located in Shaheed Nagar, Agra, roughly 55-60 km from Mathura via NH-19 (Agra-Mathura road) - commonly a little over an hour by road depending on traffic. This page is for Mathura-area patients planning a gastroenterology, liver or endoscopy visit.",
    careDifference: "Because the visit involves travel, the first consultation is usually planned to review symptoms and existing reports together, so onward tests such as endoscopy, colonoscopy or liver evaluation can be scheduled on the same trip when clinically appropriate.",
    preparationNotes: ["Call reception before travelling to confirm appointment timing.", "Carry old prescriptions, blood reports and any ultrasound or endoscopy reports.", "Ask whether fasting is needed if a procedure may be planned the same day.", "For vomiting blood, black stools, severe pain or fainting, call before travelling rather than waiting."],
    localHighlights: [
      { title: "Single-trip planning", text: "Consultation and possible same-day testing can be discussed with reception to reduce repeat travel from Mathura." },
      { title: "Liver and endoscopy access", text: "Patients travelling for fatty liver, high SGPT/SGOT or endoscopy-related symptoms can plan the visit around report review." },
      { title: "Clear travel guidance", text: "Reception can advise timing so patients from Mathura and nearby areas avoid an unnecessary second visit." }
    ],
    faqs: [
      { question: "How far is Mudgal Gastromedics Hospital from Mathura?", answer: "The hospital is in Shaheed Nagar, Agra, approximately 55-60 km from Mathura via NH-19, typically a little over an hour by road depending on traffic." },
      { question: "Can I get an endoscopy or colonoscopy on the same visit if travelling from Mathura?", answer: "This depends on fasting status and clinical assessment. Call reception before travelling so timing and preparation can be planned in advance." },
      { question: "Do I need a referral to consult from Mathura?", answer: "No referral is required. Patients can call or use the appointment form to plan a gastroenterology consultation." }
    ]
  },
  "gastroenterologist-in-vrindavan": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 60-65 km from Vrindavan via NH-19 through Mathura - usually around 1.5 hours by road depending on traffic. Many patients and visitors travelling through Vrindavan and Mathura plan a gastroenterology or liver visit here.",
    careDifference: "For patients travelling a longer distance, especially visitors with a limited stay in the region, the visit is planned around symptom review and report assessment first, with procedures scheduled once fasting and preparation can be confirmed.",
    preparationNotes: ["Call ahead if you are visiting Vrindavan for a limited number of days and want to plan the same trip.", "Carry prior prescriptions, blood reports and any prior endoscopy or ultrasound reports.", "Confirm fasting instructions in advance if a procedure may be needed.", "For bleeding, severe pain or persistent vomiting, call before travelling rather than waiting."],
    localHighlights: [
      { title: "Visitor-friendly planning", text: "Useful for visitors staying in Vrindavan who want a gastroenterology opinion during their trip." },
      { title: "Liver and digestive care", text: "Covers fatty liver, acidity, bowel symptoms and endoscopy-related concerns in one consultation." },
      { title: "Advance coordination", text: "Reception can help plan timing so travel from Vrindavan is not wasted on an incomplete visit." }
    ],
    faqs: [
      { question: "How far is the hospital from Vrindavan?", answer: "Approximately 60-65 km via NH-19 through Mathura, usually around 1.5 hours by road depending on traffic." },
      { question: "Can visitors staying temporarily in Vrindavan consult here?", answer: "Yes. Patients and visitors can call ahead to plan a consultation, and testing if clinically needed, within their stay." },
      { question: "What should I carry when travelling from Vrindavan?", answer: "Carry any previous prescriptions, blood reports, ultrasound or endoscopy reports so the visit can be more useful." }
    ]
  },
  "gastroenterologist-in-firozabad": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 40 km from Firozabad - usually under an hour by road. This page is for patients from Firozabad and nearby towns such as Tundla and Shikohabad.",
    careDifference: "Given the relatively short distance, same-day consultation and testing can often be planned together after reception confirms fasting and preparation requirements.",
    preparationNotes: ["Call reception to confirm timing before travelling from Firozabad.", "Carry old prescriptions, blood reports and prior ultrasound or endoscopy reports.", "Ask about fasting if endoscopy, colonoscopy or FibroScan may be planned.", "Call urgently for vomiting blood, black stools or severe abdominal pain rather than waiting."],
    localHighlights: [
      { title: "Short-distance access", text: "Firozabad's proximity to Agra makes same-day consultation and testing more practical for many patients." },
      { title: "Liver and endoscopy pathway", text: "Covers fatty liver, abnormal LFT, acidity and endoscopy or colonoscopy-related symptoms." },
      { title: "Tundla and Shikohabad access", text: "Patients travelling via Tundla or Shikohabad can plan the visit around the same route." }
    ],
    faqs: [
      { question: "How far is Agra from Firozabad for a gastro consultation?", answer: "Mudgal Gastromedics Hospital is approximately 40 km from Firozabad, usually under an hour by road." },
      { question: "Can I get tests done the same day travelling from Firozabad?", answer: "This depends on fasting and clinical assessment. Call reception in advance to plan the visit." },
      { question: "Does this hospital treat patients from Tundla and Shikohabad?", answer: "Yes. Patients from Tundla, Shikohabad, Sirsaganj and Jasrana regularly travel here for gastroenterology and liver care." }
    ]
  },
  "gastroenterologist-in-bharatpur": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 55 km from Bharatpur, Rajasthan - usually around an hour to 90 minutes by road. This page is for patients from Bharatpur and nearby towns such as Deeg, Kumher and Bayana.",
    careDifference: "For patients crossing the Uttar Pradesh-Rajasthan border for care, the visit is planned to combine consultation with report review, so onward testing can be scheduled without unnecessary repeat travel.",
    preparationNotes: ["Call reception to confirm appointment timing before travelling from Bharatpur.", "Carry prior prescriptions, blood reports and any ultrasound or endoscopy reports.", "Confirm fasting instructions if a procedure may be planned the same day.", "Call urgently for jaundice with fever, vomiting blood or severe abdominal pain."],
    localHighlights: [
      { title: "Cross-border travel planning", text: "Reception can help plan timing for patients travelling from Bharatpur district into Agra." },
      { title: "Liver and endoscopy access", text: "Covers fatty liver, abnormal liver tests, acidity and endoscopy or colonoscopy-related concerns." },
      { title: "Deeg and Kumher access", text: "Patients from Deeg, Kumher, Weir and Bayana can plan visits along the same route." }
    ],
    faqs: [
      { question: "How far is Mudgal Gastromedics Hospital from Bharatpur?", answer: "Approximately 55 km, usually around an hour to 90 minutes by road depending on traffic and the border crossing." },
      { question: "Can patients from Rajasthan consult at this hospital?", answer: "Yes. Patients from Bharatpur, Deeg, Kumher, Weir and Bayana regularly travel to Agra for gastroenterology and liver care." },
      { question: "What reports should I bring from Bharatpur?", answer: "Bring previous prescriptions, blood tests, ultrasound and any endoscopy or colonoscopy reports if available." }
    ]
  },
  "gastroenterologist-in-dholpur": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 55 km from Dholpur via the Agra-Gwalior road (NH44) - usually around 1-1.5 hours by road. This page is for patients from Dholpur and nearby towns such as Bari and Rajakhera.",
    careDifference: "For patients travelling along the Agra-Gwalior highway, the first visit is usually planned around symptom and report review, with endoscopy, colonoscopy or liver testing scheduled once preparation is confirmed.",
    preparationNotes: ["Call reception to confirm timing before travelling from Dholpur.", "Carry prior prescriptions, blood reports and any ultrasound or endoscopy reports.", "Ask about fasting requirements if a procedure may be planned.", "Call urgently for black stools, vomiting blood, severe pain or jaundice with fever."],
    localHighlights: [
      { title: "NH44 highway access", text: "Dholpur's location on the Agra-Gwalior highway makes travel for consultation and testing straightforward." },
      { title: "Liver and endoscopy pathway", text: "Covers fatty liver, abnormal LFT, acidity, bowel symptoms and endoscopy-related concerns." },
      { title: "Bari and Rajakhera access", text: "Patients from Bari and Rajakhera can plan the visit along the same highway route." }
    ],
    faqs: [
      { question: "How far is Agra from Dholpur for a gastro consultation?", answer: "Approximately 55 km via the Agra-Gwalior road (NH44), usually around 1-1.5 hours by road." },
      { question: "Does this hospital see patients from Rajasthan border towns like Dholpur?", answer: "Yes. Patients from Dholpur, Bari and Rajakhera regularly travel to Agra for gastroenterology and liver care." },
      { question: "Can I combine consultation and testing in one visit from Dholpur?", answer: "This depends on fasting and clinical assessment. Call reception in advance to plan the visit efficiently." }
    ]
  },
  "gastroenterologist-in-morena": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 95 km from Morena via the Agra-Gwalior road (NH44) - usually around 2 hours by road depending on traffic. This page is for patients from Morena and nearby towns such as Ambah, Porsa and Sabalgarh.",
    careDifference: "For patients travelling a longer distance from Madhya Pradesh, the visit is planned to make the most of a single trip - reviewing symptoms and reports together and scheduling further testing when it can be arranged the same day.",
    preparationNotes: ["Call reception in advance to plan a same-day visit where possible.", "Carry prior prescriptions, blood reports and any ultrasound, endoscopy or FibroScan reports.", "Confirm fasting instructions before travelling if a procedure may be needed.", "For jaundice with fever, vomiting blood, black stools or severe pain, call before travelling."],
    localHighlights: [
      { title: "Longer-distance trip planning", text: "Reception can help plan timing so a single visit from Morena covers consultation and, where possible, testing." },
      { title: "Liver care focus", text: "Covers fatty liver, abnormal LFT, jaundice and liver monitoring for patients travelling from Madhya Pradesh." },
      { title: "Ambah and Porsa access", text: "Patients from Ambah, Porsa, Sabalgarh and Joura can plan the visit along the same NH44 route." }
    ],
    faqs: [
      { question: "How far is Mudgal Gastromedics Hospital from Morena?", answer: "Approximately 95 km via the Agra-Gwalior road (NH44), usually around 2 hours by road depending on traffic." },
      { question: "Can patients from Madhya Pradesh consult at this hospital?", answer: "Yes. Patients from Morena, Ambah, Porsa, Sabalgarh and Joura regularly travel to Agra for gastroenterology and liver care." },
      { question: "What should I bring for a liver consultation from Morena?", answer: "Bring LFT, ultrasound, prior FibroScan reports and any hepatitis or diabetes-related test results if available." }
    ]
  },
  "gastroenterologist-in-gwalior": {
    routeContext: "Mudgal Gastromedics Hospital is in Shaheed Nagar, Agra, roughly 120 km from Gwalior via the Agra-Gwalior road (NH44) - usually around 2.5 hours by road depending on traffic. This page is for patients from Gwalior planning a gastroenterology, liver or endoscopy visit to Agra.",
    careDifference: "Given the longer travel distance, patients from Gwalior are encouraged to call ahead so consultation, report review and any same-day testing can be planned together, reducing the need for a repeat trip.",
    preparationNotes: ["Call reception in advance to plan a same-day visit where clinically possible.", "Carry prior prescriptions, blood reports, ultrasound and any endoscopy or FibroScan reports.", "Confirm fasting instructions before travelling if a procedure may be needed.", "For vomiting blood, black stools, jaundice with fever or severe pain, call before travelling rather than waiting."],
    localHighlights: [
      { title: "Long-distance visit planning", text: "Reception can help coordinate timing so a trip from Gwalior can cover consultation and, where possible, testing." },
      { title: "Liver and endoscopy pathway", text: "Covers fatty liver, abnormal LFT, jaundice, acidity and endoscopy or colonoscopy-related symptoms." },
      { title: "Route via Morena", text: "Patients travelling via Morena can plan the visit along the same NH44 route." }
    ],
    faqs: [
      { question: "How far is Agra from Gwalior for a gastroenterology consultation?", answer: "Approximately 120 km via the Agra-Gwalior road (NH44), usually around 2.5 hours by road depending on traffic." },
      { question: "Can I plan consultation and endoscopy together travelling from Gwalior?", answer: "This depends on fasting and clinical assessment. Call reception in advance so the visit can be planned efficiently." },
      { question: "Does this hospital treat patients travelling from Madhya Pradesh?", answer: "Yes. Patients from Gwalior, Morena and nearby towns regularly travel to Agra for gastroenterology and liver care." }
    ]
  },
  "fatty-liver-treatment-in-agra": {
    routeContext: "This page is for Agra-area patients with fatty liver reported on ultrasound, high SGPT/SGOT or metabolic risk factors such as diabetes and obesity, planning a liver evaluation at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    careDifference: "Fatty liver treatment depends on cause and severity. The pathway usually involves reviewing liver tests, ultrasound findings, metabolic risk factors and, where useful, FibroScan-based liver stiffness assessment before lifestyle and medical planning.",
    preparationNotes: ["Bring LFT, ultrasound and any prior FibroScan reports.", "Mention diabetes, weight, cholesterol and alcohol intake clearly.", "Ask whether FibroScan is advised at this visit.", "Call urgently for jaundice, severe fatigue or abdominal swelling."],
    localHighlights: [
      { title: "Risk-based evaluation", text: "Fatty liver risk is reviewed alongside diabetes, obesity and cholesterol rather than in isolation." },
      { title: "FibroScan-linked planning", text: "Liver stiffness assessment can be discussed as part of the same care pathway when clinically useful." },
      { title: "Lifestyle-first approach", text: "Weight, diet and activity guidance are central to early fatty liver management." }
    ],
    faqs: [
      { question: "Can fatty liver be treated without medicines?", answer: "In many early cases, weight loss, exercise, diabetes control and diet changes can improve fatty liver. Some patients also need medical management depending on severity." },
      { question: "Do I need FibroScan for fatty liver treatment?", answer: "Not always. FibroScan may be advised when liver fibrosis risk needs closer assessment." },
      { question: "Is fatty liver treatment available in Agra?", answer: "Yes. Fatty liver assessment and treatment planning are available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra." }
    ]
  },
  "ibs-treatment-in-agra": {
    routeContext: "This page is for Agra-area patients with recurrent abdominal pain, bloating, constipation, diarrhea or bowel-habit changes suggestive of IBS, planning a gastroenterology visit at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    careDifference: "IBS care focuses on symptom pattern, trigger identification and ruling out warning signs before treatment planning, since IBS is diagnosed after other causes of similar symptoms are reasonably excluded.",
    preparationNotes: ["Note which foods, stress or routines seem to trigger symptoms.", "Bring any prior blood, stool or colonoscopy reports.", "Mention weight loss, blood in stool or night-time symptoms clearly, as these are not typical of IBS.", "Call reception if symptoms are accompanied by bleeding, fever or unintended weight loss."],
    localHighlights: [
      { title: "Symptom-pattern review", text: "IBS evaluation looks at pain pattern, bowel habit and trigger foods rather than a single test result." },
      { title: "Warning-sign screening", text: "Blood in stool, weight loss or night symptoms are reviewed separately since they need their own evaluation." },
      { title: "Ongoing management", text: "Diet, lifestyle and medicine adjustments are typically reviewed over more than one visit." }
    ],
    faqs: [
      { question: "Is IBS treatment available in Agra?", answer: "Yes. IBS evaluation and treatment planning are available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra." },
      { question: "Can IBS be cured completely?", answer: "IBS is usually managed rather than permanently cured, with diet, lifestyle and medicine adjustments controlling symptoms for most patients." },
      { question: "When should IBS-like symptoms be checked urgently?", answer: "Blood in stool, unexplained weight loss, fever or symptoms that wake you at night should be evaluated promptly rather than assumed to be IBS." }
    ]
  },
  "weight-management-clinic-in-agra": {
    routeContext: "This page is for Agra-area patients with obesity, fatty liver linked to weight or metabolic risk factors, planning a medical weight management evaluation at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra.",
    careDifference: "Medical weight management here is gastroenterology-led, connecting weight evaluation with fatty liver, diabetes and metabolic risk review rather than treating weight as a standalone concern.",
    preparationNotes: ["Bring recent weight, height, blood sugar and cholesterol readings if available.", "Mention prior weight-loss attempts and any related medical conditions.", "Bring liver reports or ultrasound findings if fatty liver has been noted previously.", "Discuss expectations so a realistic plan can be made."],
    localHighlights: [
      { title: "Metabolic risk focus", text: "Weight evaluation is connected with fatty liver, diabetes and cholesterol review." },
      { title: "Range of options", text: "Diet and lifestyle planning are reviewed first; selected endoscopic options may be discussed when clinically appropriate." },
      { title: "Ongoing follow-up", text: "Weight management is typically followed up over multiple visits rather than a single consultation." }
    ],
    faqs: [
      { question: "Is medical weight management available in Agra?", answer: "Yes. Gastroenterology-led medical weight management is available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra." },
      { question: "Is weight management linked to fatty liver treatment here?", answer: "Yes. Weight, metabolic risk and fatty liver are often reviewed together since they are closely related." },
      { question: "Are endoscopic weight-loss options available?", answer: "Selected endoscopic options such as intragastric balloon placement may be discussed when clinically appropriate after evaluation." }
    ]
  }
};

export function getLocalSeoPage(slug: string) {
  return localSeoPages.find((page) => page.slug === slug);
}

export function getLocalSeoPageDetail(slug: string) {
  return localSeoPageDetails[slug];
}
