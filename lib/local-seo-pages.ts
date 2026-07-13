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
  }
];

export function getLocalSeoPage(slug: string) {
  return localSeoPages.find((page) => page.slug === slug);
}
