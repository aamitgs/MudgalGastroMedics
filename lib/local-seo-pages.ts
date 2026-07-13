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
  }
};

export function getLocalSeoPage(slug: string) {
  return localSeoPages.find((page) => page.slug === slug);
}

export function getLocalSeoPageDetail(slug: string) {
  return localSeoPageDetails[slug];
}
