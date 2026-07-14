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
  },
  {
    slug: "liver-clinic",
    title: "Liver Clinic in Agra",
    shortTitle: "Liver Clinic",
    description:
      "Liver clinic in Agra for fatty liver, abnormal LFT, jaundice, hepatitis, cirrhosis, ascites, liver fibrosis and FibroScan report review.",
    keywords: ["Liver clinic Agra", "Liver doctor Agra", "Abnormal LFT treatment Agra", "Fatty liver clinic Agra"],
    hero:
      "A focused liver OPD for patients with fatty liver, jaundice, abnormal liver reports, fibrosis risk, cirrhosis or long-term liver monitoring needs.",
    highlights: ["Fatty liver and abnormal LFT review", "Jaundice and hepatitis evaluation", "Cirrhosis and ascites monitoring", "FibroScan and fibrosis risk planning"],
    sections: [
      {
        title: "Who Should Visit",
        text:
          "Patients commonly visit the liver clinic for fatty liver on ultrasound, raised SGOT/SGPT, jaundice, viral hepatitis, alcohol-related liver injury, ascites, cirrhosis or suspected fibrosis.",
        items: ["Fatty liver with diabetes, obesity or cholesterol", "Yellow eyes, dark urine or fever with jaundice", "Abnormal LFT, INR or platelet reports", "Swelling in abdomen or legs"]
      },
      {
        title: "Reports To Bring",
        text:
          "Bring old prescriptions, LFT, CBC, INR, ultrasound, CT/MRCP, FibroScan, viral markers, diabetes and cholesterol reports so the doctor can assess stage and risk.",
        items: ["Share alcohol history honestly", "Mention diabetes, BP and cholesterol medicines", "Bring discharge summaries if admitted earlier", "Do not stop liver medicines without advice"]
      },
      {
        title: "Long-Term Monitoring",
        text:
          "Liver care often needs repeat reports, lifestyle change, vaccination advice, endoscopy surveillance for varices and follow-up planning to prevent complications."
      }
    ],
    relatedLinks: [
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Liver Cirrhosis", href: "/procedures/liver-cirrhosis" },
      { label: "Ascites", href: "/procedures/ascites" }
    ]
  },
  {
    slug: "endoscopy-services",
    title: "Endoscopy Services in Agra",
    shortTitle: "Endoscopy Services",
    description:
      "Endoscopy services in Agra for acidity, stomach pain, vomiting, difficulty swallowing, bleeding symptoms, biopsy planning and upper GI evaluation.",
    keywords: ["Endoscopy services Agra", "Upper GI endoscopy Agra", "Stomach endoscopy Agra", "Endoscopy doctor Agra"],
    hero:
      "Upper GI endoscopy support for patients with persistent acidity, pain, vomiting, swallowing difficulty, anemia or suspected stomach and food-pipe disease.",
    highlights: ["Upper GI endoscopy planning", "Biopsy support when needed", "Bleeding and ulcer evaluation", "Clear preparation and recovery guidance"],
    sections: [
      {
        title: "When Endoscopy Is Needed",
        text:
          "Endoscopy may be advised for persistent acidity, vomiting, stomach pain, black stools, anemia, difficulty swallowing, weight loss or symptoms not improving with treatment.",
        items: ["Chronic acidity or GERD symptoms", "Vomiting blood or black stools", "Food sticking or swallowing difficulty", "Biopsy planning for suspicious findings"]
      },
      {
        title: "Preparation",
        text:
          "Most patients need fasting before endoscopy. Medicine review is important for diabetes medicines, insulin, aspirin, clopidogrel, warfarin and other blood thinners.",
        items: ["Usually fasting is required", "Bring previous endoscopy reports", "Discuss blood thinners before procedure", "Bring an attendant if sedation is planned"]
      },
      {
        title: "After The Procedure",
        text:
          "The team explains findings, diet restart, biopsy follow-up if taken and warning signs such as fever, severe pain, vomiting blood or persistent black stools."
      }
    ],
    relatedLinks: [
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Endoscopic Biopsy", href: "/procedures/endoscopic-biopsy" },
      { label: "Acidity & GERD", href: "/procedures/acidity-gerd" },
      { label: "GI Bleeding", href: "/procedures/gastrointestinal-bleeding-management" }
    ]
  },
  {
    slug: "colonoscopy-services",
    title: "Colonoscopy Services in Agra",
    shortTitle: "Colonoscopy Services",
    description:
      "Colonoscopy services in Agra for blood in stool, bowel habit change, chronic constipation or diarrhea, colon polyps and colon cancer screening.",
    keywords: ["Colonoscopy services Agra", "Colonoscopy in Agra", "Colon cancer screening Agra", "Blood in stool doctor Agra"],
    hero:
      "Colonoscopy planning and bowel evaluation for bleeding symptoms, bowel habit change, colon polyps, chronic diarrhea, constipation and screening needs.",
    highlights: ["Bowel symptom evaluation", "Colon polyp detection and removal planning", "Cancer screening guidance", "Bowel preparation support"],
    sections: [
      {
        title: "Symptoms Covered",
        text:
          "Colonoscopy may be advised for blood in stool, black stools, chronic diarrhea, chronic constipation, unexplained anemia, weight loss, suspected colitis or screening based on age and family history.",
        items: ["Blood in stool or rectal bleeding", "Long-term constipation or diarrhea", "Colon polyps or family history", "Screening and biopsy planning"]
      },
      {
        title: "Bowel Preparation",
        text:
          "A clean bowel is essential for accurate colonoscopy. Patients receive diet and bowel prep instructions based on health condition and procedure timing.",
        items: ["Follow diet instructions carefully", "Complete bowel prep as advised", "Discuss diabetes medicines and blood thinners", "Bring old colonoscopy or biopsy reports"]
      },
      {
        title: "What Happens Next",
        text:
          "After colonoscopy, the doctor explains findings such as piles, colitis, ulcers, polyps, strictures or biopsy needs and advises follow-up or treatment."
      }
    ],
    relatedLinks: [
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "Colon Polyps", href: "/procedures/colon-polyps" },
      { label: "Polypectomy", href: "/procedures/polypectomy" },
      { label: "IBD / Colitis", href: "/procedures/ibd-colitis" }
    ]
  },
  {
    slug: "ercp-bile-duct-care",
    title: "ERCP & Bile Duct Care in Agra",
    shortTitle: "ERCP & Bile Duct Care",
    description:
      "ERCP and bile duct care in Agra for obstructive jaundice, CBD stones, bile duct stenting, cholangitis and pancreaticobiliary problems.",
    keywords: ["ERCP specialist Agra", "CBD stone treatment Agra", "Bile duct stenting Agra", "Obstructive jaundice treatment Agra"],
    hero:
      "Pancreaticobiliary care for patients with jaundice, CBD stones, bile duct blockage, cholangitis or ERCP-related treatment planning.",
    highlights: ["ERCP planning and coordination", "CBD stone and bile duct care", "Bile duct stenting guidance", "Jaundice warning-sign assessment"],
    sections: [
      {
        title: "When ERCP Is Considered",
        text:
          "ERCP may be considered when reports suggest CBD stone, bile duct blockage, obstructive jaundice, cholangitis, bile leak, narrowing or selected pancreatic duct problems.",
        items: ["Yellow eyes with dark urine", "Fever with jaundice", "CBD stone on ultrasound, CT or MRCP", "Bile duct stent planning or follow-up"]
      },
      {
        title: "Reports Needed",
        text:
          "Bring LFT, CBC, INR, ultrasound, CT, MRCP, previous ERCP notes, stent details and current medicines. Blood thinner and infection risk review is important.",
        items: ["MRCP or CT reports if available", "Previous stent or surgery details", "Blood thinner and diabetes medicine list", "Call early for fever with jaundice"]
      },
      {
        title: "Safety And Follow-Up",
        text:
          "The team explains fasting, consent, monitoring, admission needs, stent follow-up and warning signs after ERCP such as severe pain, fever or vomiting."
      }
    ],
    relatedLinks: [
      { label: "ERCP", href: "/procedures/ercp" },
      { label: "CBD Stone Removal", href: "/procedures/cbd-stone-removal" },
      { label: "Bile Duct Stenting", href: "/procedures/bile-duct-stenting" },
      { label: "Obstructive Jaundice", href: "/procedures/obstructive-jaundice" }
    ]
  },
  {
    slug: "fibroscan-fatty-liver-assessment",
    title: "FibroScan & Fatty Liver Assessment in Agra",
    shortTitle: "FibroScan & Fatty Liver Assessment",
    description:
      "FibroScan and fatty liver assessment in Agra for liver stiffness, fibrosis risk, CAP score, abnormal LFT and metabolic liver disease monitoring.",
    keywords: ["FibroScan Agra", "Fatty liver assessment Agra", "Liver stiffness test Agra", "Fibrosis test Agra"],
    hero:
      "Focused assessment for fatty liver and fibrosis risk using clinical review, liver reports, ultrasound history and FibroScan-based monitoring when appropriate.",
    highlights: ["FibroScan report interpretation", "Fatty liver risk staging", "CAP and kPa score guidance", "Lifestyle and follow-up planning"],
    sections: [
      {
        title: "Who Needs Assessment",
        text:
          "Patients with fatty liver, diabetes, obesity, abnormal SGOT/SGPT, cholesterol problems, alcohol history or family history may need fibrosis risk assessment.",
        items: ["Fatty liver on ultrasound", "Raised SGOT, SGPT or GGT", "Diabetes, obesity or metabolic syndrome", "Need to understand FibroScan kPa/CAP score"]
      },
      {
        title: "What The Doctor Reviews",
        text:
          "The assessment combines symptoms, weight, diabetes control, alcohol history, liver reports, ultrasound and FibroScan findings to decide monitoring and treatment goals.",
        items: ["Bring LFT, lipid profile and HbA1c", "Bring ultrasound and old FibroScan reports", "Share alcohol and medicine history", "Discuss safe weight-loss targets"]
      },
      {
        title: "Follow-Up Goals",
        text:
          "The plan may include weight reduction, diet changes, diabetes and cholesterol control, alcohol avoidance and repeat monitoring based on fibrosis risk."
      }
    ],
    relatedLinks: [
      { label: "FibroScan", href: "/procedures/fibroscan" },
      { label: "Fatty Liver", href: "/procedures/fatty-liver" },
      { label: "Liver Fibrosis", href: "/procedures/liver-fibrosis" },
      { label: "Medical Weight Management", href: "/services/medical-weight-management" }
    ]
  },
  {
    slug: "gi-bleeding-emergency-gastro-care",
    title: "GI Bleeding & Emergency Gastro Care in Agra",
    shortTitle: "GI Bleeding & Emergency Gastro Care",
    description:
      "Urgent gastro care coordination in Agra for vomiting blood, black stools, blood in stool, suspected GI bleeding and variceal bleeding warning signs.",
    keywords: ["GI bleeding treatment Agra", "Vomiting blood doctor Agra", "Black stool emergency Agra", "Blood in stool Agra"],
    hero:
      "Urgent gastroenterology coordination for bleeding warning signs such as vomiting blood, black stools, blood in stool, dizziness, anemia or suspected variceal bleeding.",
    highlights: ["Vomiting blood and black stool guidance", "Variceal bleeding risk review", "Endoscopy planning when needed", "Call-before-visit instructions"],
    sections: [
      {
        title: "Warning Signs",
        text:
          "GI bleeding can be serious. Patients with vomiting blood, black stools, fresh blood in stool, fainting, severe weakness or known liver cirrhosis should call reception urgently.",
        items: ["Vomiting blood or coffee-ground vomit", "Black tarry stools", "Fresh blood in stool with weakness", "Known cirrhosis with bleeding symptoms"]
      },
      {
        title: "What To Share On Call",
        text:
          "Tell reception the symptom, duration, amount of bleeding, blood pressure issues, liver disease history, blood thinner use and whether the patient feels dizzy or weak.",
        items: ["Current medicines and blood thinners", "Previous endoscopy or banding reports", "Liver cirrhosis or varices history", "Recent Hb or platelet report if available"]
      },
      {
        title: "Care Planning",
        text:
          "Depending on severity, the patient may need urgent assessment, blood tests, stabilization, endoscopy, banding, injection therapy or referral to emergency services."
      }
    ],
    relatedLinks: [
      { label: "GI Bleeding Management", href: "/procedures/gastrointestinal-bleeding-management" },
      { label: "Variceal Banding", href: "/procedures/variceal-banding" },
      { label: "Sclerotherapy", href: "/procedures/sclerotherapy" },
      { label: "Endoscopy", href: "/procedures/endoscopy" }
    ]
  },
  {
    slug: "pancreas-biliary-clinic",
    title: "Pancreas & Biliary Clinic in Agra",
    shortTitle: "Pancreas & Biliary Clinic",
    description:
      "Pancreas and biliary clinic in Agra for pancreatitis, pancreatic duct stones, bile duct strictures, jaundice, gallstone-related complications and ERCP planning.",
    keywords: ["Pancreas specialist Agra", "Biliary clinic Agra", "Pancreatitis treatment Agra", "Pancreatic duct stone Agra"],
    hero:
      "Focused care for pancreatic and bile duct problems including pancreatitis, pancreatic duct stones, bile duct strictures, CBD stones and jaundice-related complications.",
    highlights: ["Pancreatitis evaluation", "Pancreatic duct stone review", "Bile duct stricture and stent planning", "ERCP-linked care pathway"],
    sections: [
      {
        title: "Problems Covered",
        text:
          "Patients may visit for pancreatitis, recurrent upper abdominal pain, pancreatic duct stones, bile duct strictures, CBD stones, jaundice or abnormal CT/MRCP findings.",
        items: ["Pancreatitis and recurrent pain", "Pancreatic duct stone or narrowing", "Bile duct stricture or blockage", "Gallstone-related jaundice or infection"]
      },
      {
        title: "Reports To Bring",
        text:
          "Bring ultrasound, CT, MRCP, LFT, amylase/lipase, previous ERCP notes, surgery details, discharge summaries and current medicines.",
        items: ["CT/MRCP images and reports", "Previous stent or ERCP documents", "Gallbladder surgery history", "Fever, jaundice or pain timeline"]
      },
      {
        title: "Treatment Planning",
        text:
          "Care may include medicine review, diet advice, ERCP planning, stenting, stone treatment, monitoring or referral depending on severity and reports."
      }
    ],
    relatedLinks: [
      { label: "Pancreatic Disorders", href: "/procedures/pancreatic-disorders" },
      { label: "Pancreatic Duct Stone Removal", href: "/procedures/pancreatic-duct-stone-removal" },
      { label: "Bile Duct Stricture", href: "/procedures/bile-duct-stricture" },
      { label: "ERCP", href: "/procedures/ercp" }
    ]
  },
  {
    slug: "ibs-constipation-bowel-disorder-clinic",
    title: "IBS, Constipation & Bowel Disorder Clinic in Agra",
    shortTitle: "IBS, Constipation & Bowel Disorder Clinic",
    description:
      "Bowel disorder clinic in Agra for IBS, gas, bloating, chronic constipation, chronic diarrhea, abdominal pain and functional bowel symptoms.",
    keywords: ["IBS treatment Agra", "Constipation doctor Agra", "Bowel disorder clinic Agra", "Gas bloating doctor Agra"],
    hero:
      "Structured bowel symptom evaluation for IBS, gas, bloating, constipation, diarrhea and abdominal pain with warning-sign review and practical treatment planning.",
    highlights: ["IBS and bloating assessment", "Constipation and diarrhea planning", "Diet and medicine review", "Colonoscopy decision support"],
    sections: [
      {
        title: "Symptoms Covered",
        text:
          "Patients commonly visit for gas, bloating, cramps, urgency, mucus, constipation, loose motions, incomplete evacuation or alternating bowel habits.",
        items: ["IBS-like abdominal pain and bloating", "Chronic constipation", "Chronic diarrhea", "Bowel habit changes with anxiety or food triggers"]
      },
      {
        title: "Warning Signs Checked",
        text:
          "The doctor checks for warning signs such as blood in stool, weight loss, anemia, fever, night symptoms, family history or age-related screening needs.",
        items: ["Blood in stool or black stools", "Unexplained weight loss", "Anemia or low hemoglobin", "Family history of colon cancer or IBD"]
      },
      {
        title: "Treatment Plan",
        text:
          "Treatment may include diet changes, fiber planning, medicines, stress and sleep review, stool tests, blood tests or colonoscopy if warning signs are present."
      }
    ],
    relatedLinks: [
      { label: "IBS", href: "/procedures/ibs" },
      { label: "Chronic Constipation", href: "/procedures/chronic-constipation" },
      { label: "Chronic Diarrhea", href: "/procedures/chronic-diarrhea" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" }
    ]
  },
  {
    slug: "acidity-gerd-ulcer-clinic",
    title: "Acidity, GERD & Ulcer Clinic in Agra",
    shortTitle: "Acidity, GERD & Ulcer Clinic",
    description:
      "Acidity, GERD and ulcer clinic in Agra for reflux, heartburn, gastritis, peptic ulcer disease, swallowing difficulty and long-term medicine review.",
    keywords: ["Acidity doctor Agra", "GERD treatment Agra", "Ulcer treatment Agra", "Heartburn specialist Agra"],
    hero:
      "Focused care for chronic acidity, GERD, gastritis, peptic ulcers, chest burning, sour belching, nausea and swallowing difficulty.",
    highlights: ["GERD and chronic acidity care", "Ulcer and gastritis evaluation", "Endoscopy decision support", "Long-term medicine safety review"],
    sections: [
      {
        title: "When To Consult",
        text:
          "Consult if acidity is frequent, medicines are needed repeatedly, swallowing is difficult, vomiting occurs, appetite drops or symptoms disturb sleep.",
        items: ["Frequent heartburn or sour belching", "Burning chest after meals", "Pain, nausea or vomiting", "Difficulty swallowing or food sticking"]
      },
      {
        title: "What The Doctor Checks",
        text:
          "The consultation reviews food triggers, pain pattern, medicine use, painkiller use, smoking, alcohol, alarm symptoms and whether endoscopy or testing is needed.",
        items: ["Painkiller and antibiotic history", "Weight loss or anemia", "Black stools or vomiting blood", "Previous endoscopy and biopsy reports"]
      },
      {
        title: "Treatment Approach",
        text:
          "Care may include medicine correction, lifestyle changes, H. pylori-related planning, endoscopy when needed and follow-up to avoid unnecessary long-term medicine use."
      }
    ],
    relatedLinks: [
      { label: "Acidity & GERD", href: "/procedures/acidity-gerd" },
      { label: "Peptic Ulcer Disease", href: "/procedures/peptic-ulcer-disease" },
      { label: "Endoscopy", href: "/procedures/endoscopy" },
      { label: "Difficulty Swallowing", href: "/procedures/difficulty-swallowing" }
    ]
  },
  {
    slug: "gi-cancer-screening-polyp-clinic",
    title: "GI Cancer Screening & Polyp Clinic in Agra",
    shortTitle: "GI Cancer Screening & Polyp Clinic",
    description:
      "GI cancer screening and polyp clinic in Agra for colon cancer screening, colon polyps, biopsy planning, anemia, weight loss and high-risk family history.",
    keywords: ["GI cancer screening Agra", "Colon cancer screening Agra", "Colon polyp clinic Agra", "Biopsy planning Agra"],
    hero:
      "Screening and risk assessment for colon polyps, colon cancer risk, unexplained anemia, weight loss, biopsy needs and family-history based surveillance.",
    highlights: ["Colon cancer screening advice", "Colon polyp follow-up", "Biopsy and report review", "High-risk family history planning"],
    sections: [
      {
        title: "Who Should Ask About Screening",
        text:
          "Screening may be important for patients with age-related risk, family history, colon polyps, blood in stool, anemia, unexplained weight loss or bowel habit change.",
        items: ["Family history of colon cancer", "Previous colon polyps", "Blood in stool or anemia", "Unexplained weight loss with bowel symptoms"]
      },
      {
        title: "Tests And Reports",
        text:
          "Depending on risk, the doctor may advise colonoscopy, endoscopy, biopsy, stool tests, blood tests or imaging. Old biopsy and colonoscopy reports are very useful.",
        items: ["Bring old biopsy reports", "Bring endoscopy or colonoscopy images", "Share family cancer history", "Mention blood thinner medicines"]
      },
      {
        title: "Surveillance Plan",
        text:
          "If polyps are found or removed, follow-up timing depends on size, number, biopsy type, family history and completeness of removal."
      }
    ],
    relatedLinks: [
      { label: "Colon Polyps", href: "/procedures/colon-polyps" },
      { label: "Polypectomy", href: "/procedures/polypectomy" },
      { label: "Colonoscopy", href: "/procedures/colonoscopy" },
      { label: "Endoscopic Biopsy", href: "/procedures/endoscopic-biopsy" }
    ]
  }
];

export function getServicePage(slug: string) {
  return servicePages.find((page) => page.slug === slug);
}
