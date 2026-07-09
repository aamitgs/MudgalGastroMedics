export type ServicePage = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  hero: string;
  highlights: string[];
  sections: Array<{
    title: string;
    text: string;
    items?: string[];
  }>;
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
};

export const servicePages: ServicePage[] = [
  {
    slug: "gastroenterology",
    title: "Gastroenterology Services in Agra",
    shortTitle: "Gastroenterology",
    description:
      "Specialist care for acidity, abdominal pain, IBS, constipation, diarrhea, ulcers, GI bleeding, swallowing difficulty and digestive diseases in Agra.",
    keywords: ["Gastroenterologist in Agra", "Digestive disease specialist", "Gastro doctor near me", "Stomach specialist Agra"],
    hero:
      "Comprehensive digestive care for stomach, intestine, food pipe, pancreas and bowel-related symptoms, planned by a gastroenterology team in Shaheed Nagar, Agra.",
    highlights: ["Digestive symptom evaluation", "Endoscopy and colonoscopy planning", "Personalized medical treatment", "Follow-up and prevention guidance"],
    sections: [
      {
        title: "Conditions We Evaluate",
        text:
          "Patients commonly visit for acidity, reflux, abdominal pain, bloating, constipation, diarrhea, vomiting, blood in stool, black stools, anemia, difficulty swallowing and unexplained weight loss.",
        items: ["Acidity, GERD and peptic ulcer disease", "IBS, chronic constipation and chronic diarrhea", "Blood in stool, black stools and GI bleeding", "Difficulty swallowing and food-pipe narrowing"]
      },
      {
        title: "How Care Is Planned",
        text:
          "The doctor reviews symptoms, previous reports, medicines and warning signs before advising tests or treatment. When needed, endoscopy, colonoscopy, biopsy or imaging is planned with clear preparation instructions.",
        items: ["Bring old prescriptions and reports", "Share diabetes, BP and blood thinner details", "Call reception for urgent bleeding or severe pain", "Follow up with reports for a complete plan"]
      },
      {
        title: "Why Early Consultation Matters",
        text:
          "Digestive symptoms are often treatable, but persistent or warning symptoms should not be ignored. Early evaluation helps detect ulcers, inflammation, bleeding, polyps and serious disease at the right time."
      }
    ],
    relatedLinks: [
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "IBS", href: "/procedures/ibs" },
      { label: "Chronic Constipation", href: "/procedures/chronic-constipation" }
    ]
  },
  {
    slug: "hepatology-liver-care",
    title: "Hepatology & Liver Care in Agra",
    shortTitle: "Hepatology / Liver Care",
    description:
      "Liver specialist care for fatty liver, jaundice, liver fibrosis, cirrhosis, ascites, abnormal LFT and chronic liver disease in Agra.",
    keywords: ["Liver specialist in Agra", "Fatty liver treatment Agra", "Jaundice doctor Agra", "Hepatology Agra"],
    hero:
      "Focused liver care for fatty liver, jaundice, fibrosis, cirrhosis and ascites with practical monitoring, lifestyle guidance and complication prevention.",
    highlights: ["Fatty liver and FibroScan assessment", "Jaundice and bile duct evaluation", "Cirrhosis and ascites care", "Varices screening and bleeding prevention"],
    sections: [
      {
        title: "Liver Problems Covered",
        text:
          "Liver care includes evaluation of abnormal SGOT/SGPT, fatty liver, alcohol-related liver injury, viral hepatitis, jaundice, liver fibrosis, cirrhosis, ascites and portal hypertension.",
        items: ["Fatty liver and metabolic liver disease", "Obstructive jaundice and bile duct blockage", "Liver cirrhosis, varices and ascites", "FibroScan-based liver stiffness monitoring"]
      },
      {
        title: "Reports To Bring",
        text:
          "For a useful liver consultation, bring previous LFT reports, CBC, INR, ultrasound, CT/MRCP, FibroScan, viral markers, discharge summaries and current medicines.",
        items: ["Tell the doctor about alcohol use honestly", "Mention diabetes, obesity and cholesterol history", "Share previous jaundice or admission details", "Do not stop medicines without advice"]
      },
      {
        title: "Long-Term Liver Protection",
        text:
          "Liver disease often needs regular monitoring. Diet, weight control, alcohol avoidance, vaccination advice, endoscopy surveillance and timely treatment reduce complication risk."
      }
    ],
    relatedLinks: [
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Liver Cirrhosis", href: "/procedures/liver-cirrhosis" },
      { label: "Ascitic Fluid Tapping", href: "/procedures/ascitic-fluid-tapping" }
    ]
  },
  {
    slug: "advanced-endoscopy-centre",
    title: "Advanced Endoscopy Centre in Agra",
    shortTitle: "Advanced Endoscopy Centre",
    description:
      "Advanced diagnostic and therapeutic endoscopy centre in Agra for endoscopy, colonoscopy, ERCP, GI bleeding, stenting, polypectomy and PEG tube placement.",
    keywords: ["Advanced endoscopy centre Agra", "Endoscopy in Agra", "ERCP specialist in Agra", "Therapeutic endoscopy Agra"],
    hero:
      "A focused endoscopy centre for diagnostic and therapeutic procedures, including upper GI endoscopy, colonoscopy, ERCP and selected advanced endoscopic treatment.",
    highlights: ["Diagnostic endoscopy and colonoscopy", "ERCP and bile duct treatment", "GI bleeding control", "Stenting, dilation and polyp removal"],
    sections: [
      {
        title: "Procedures Offered",
        text:
          "The centre supports both diagnostic evaluation and therapeutic procedures when clinically appropriate, with preparation, consent, monitoring and recovery guidance.",
        items: ["Endoscopy, colonoscopy and enteroscopy", "ERCP, CBD stone removal and bile duct stenting", "Polypectomy, stricture dilation and GI stenting", "Variceal banding and GI bleeding management"]
      },
      {
        title: "Patient Preparation",
        text:
          "Most endoscopic procedures need fasting, medication review and an adult attendant if sedation is planned. Colonoscopy requires bowel preparation as advised.",
        items: ["Usually 6-8 hours fasting unless told otherwise", "Discuss diabetes medicines and insulin before the procedure", "Inform about aspirin, clopidogrel, warfarin or other blood thinners", "Bring previous reports and imaging"]
      },
      {
        title: "Safety And Recovery",
        text:
          "After the procedure, the team explains diet restart, rest, report follow-up and warning signs such as fever, severe pain, vomiting blood or black stools."
      }
    ],
    relatedLinks: [
      { label: "ERCP", href: "/procedures/ercp" },
      { label: "GI Bleeding Management", href: "/procedures/gastrointestinal-bleeding-management" },
      { label: "Polypectomy", href: "/procedures/polypectomy" },
      { label: "GI Stenting", href: "/procedures/gi-stenting" }
    ]
  },
  {
    slug: "diagnostic-services",
    title: "Diagnostic Services for Digestive & Liver Diseases",
    shortTitle: "Diagnostic Services",
    description:
      "Diagnostic services in Agra for digestive and liver problems, including upper GI endoscopy, colonoscopy, FibroScan, biopsy planning and cancer screening.",
    keywords: ["Diagnostic services Agra", "Upper GI endoscopy Agra", "Colonoscopy in Agra", "FibroScan in Agra"],
    hero:
      "Structured diagnostic evaluation for digestive symptoms, liver reports, bleeding, anemia, bowel changes and screening needs.",
    highlights: ["Upper GI endoscopy", "Colonoscopy and biopsy support", "FibroScan for liver stiffness", "Digestive health check-up planning"],
    sections: [
      {
        title: "When Diagnostics Are Needed",
        text:
          "Tests are selected when symptoms persist, warning signs are present, reports are abnormal or screening is advised based on age, family history or medical risk.",
        items: ["Blood in stool, black stools or anemia", "Persistent acidity, pain, vomiting or swallowing difficulty", "Abnormal liver function tests or fatty liver", "Colon polyp and GI cancer screening needs"]
      },
      {
        title: "Common Diagnostic Pathways",
        text:
          "Evaluation may include blood tests, stool tests, ultrasound, FibroScan, endoscopy, colonoscopy, biopsy or referral for CT/MRCP depending on the clinical question.",
        items: ["Endoscopy for upper GI symptoms", "Colonoscopy for bowel symptoms and screening", "FibroScan for fatty liver and fibrosis risk", "Biopsy when tissue diagnosis is needed"]
      },
      {
        title: "Clear Reporting And Next Steps",
        text:
          "Reports are used to create a practical treatment plan, including medicines, diet, procedure follow-up, surveillance schedule or urgent care when needed."
      }
    ],
    relatedLinks: [
      { label: "Endoscopic Biopsy", href: "/procedures/endoscopic-biopsy" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Colon Polyps", href: "/procedures/colon-polyps" },
      { label: "Book Appointment", href: "/contact#appointment" }
    ]
  },
  {
    slug: "preventive-health-check-up",
    title: "Preventive Digestive Health Check-up in Agra",
    shortTitle: "Preventive Health Check-up",
    description:
      "Preventive digestive and liver health check-up planning in Agra for acidity, fatty liver, colon cancer screening, lifestyle risk and family history.",
    keywords: ["Preventive health check-up Agra", "Digestive health check-up", "Colon cancer screening Agra", "Fatty liver check-up"],
    hero:
      "Preventive gastro and liver assessment for people with lifestyle risk, family history, fatty liver, recurring acidity or age-related screening needs.",
    highlights: ["Risk-based check-up planning", "Fatty liver and metabolic assessment", "Colon cancer screening advice", "Diet and lifestyle guidance"],
    sections: [
      {
        title: "Who Should Consider A Check-up",
        text:
          "Preventive evaluation is useful for patients with diabetes, obesity, fatty liver, alcohol use, family history of colon cancer, recurrent acidity or unexplained digestive symptoms.",
        items: ["Age-appropriate colon cancer screening", "Fatty liver and abnormal LFT evaluation", "Chronic acidity or ulcer risk review", "Family history of GI cancer or colon polyps"]
      },
      {
        title: "What May Be Included",
        text:
          "The exact package depends on age, symptoms and reports. The doctor may advise blood tests, ultrasound, FibroScan, stool tests, endoscopy or colonoscopy when appropriate.",
        items: ["Personal risk assessment", "Previous report review", "Test selection without unnecessary investigations", "Follow-up plan with lifestyle targets"]
      },
      {
        title: "Prevention-Focused Care",
        text:
          "The goal is to detect risk early, avoid complications and create a realistic plan for diet, weight, alcohol avoidance, medicines and future screening."
      }
    ],
    relatedLinks: [
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "Colon Polyps", href: "/procedures/colon-polyps" },
      { label: "Contact Us", href: "/contact" }
    ]
  },
  {
    slug: "medical-weight-management",
    title: "Medical Weight Management in Agra",
    shortTitle: "Medical Weight Management",
    description:
      "Medical weight management in Agra with gastroenterology-led evaluation for obesity, fatty liver, metabolic risk, diet planning and selected endoscopic options.",
    keywords: ["Medical weight management Agra", "Obesity treatment Agra", "Endoscopic weight loss Agra", "Fatty liver weight loss"],
    hero:
      "Doctor-guided weight management for obesity, fatty liver and metabolic risk, combining evaluation, diet planning, follow-up and selected endoscopic options when suitable.",
    highlights: ["Obesity and metabolic risk review", "Fatty liver-focused weight goals", "Diet and lifestyle planning", "Selected endoscopic weight-loss support"],
    sections: [
      {
        title: "Why Weight Management Matters",
        text:
          "Excess weight can worsen fatty liver, reflux, diabetes, cholesterol, sleep issues and long-term cardiovascular risk. A medical plan helps set safe and realistic goals.",
        items: ["Fatty liver with obesity or diabetes", "Reflux symptoms worsened by weight", "High cholesterol or metabolic syndrome", "Need for supervised weight-loss planning"]
      },
      {
        title: "How The Plan Is Built",
        text:
          "The consultation reviews weight history, eating pattern, medicines, sleep, activity, liver reports and metabolic markers before advising diet, medicines or procedure-based support.",
        items: ["BMI and waist-risk assessment", "Liver and metabolic report review", "Indian diet and habit counselling", "Follow-up tracking and goal adjustment"]
      },
      {
        title: "Endoscopic Options",
        text:
          "Selected patients may be assessed for endoscopic weight-loss support such as intragastric balloon placement. Suitability depends on medical history, BMI, expectations and safety review."
      }
    ],
    relatedLinks: [
      { label: "Intragastric Balloon Placement", href: "/procedures/intragastric-balloon-placement" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Book Appointment", href: "/contact#appointment" }
    ]
  }
];

export function getServicePage(slug: string) {
  return servicePages.find((page) => page.slug === slug);
}
