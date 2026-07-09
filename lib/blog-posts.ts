import { site } from "@/lib/site-data";

export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  accent: string;
  relatedHref: string;
  relatedLabel: string;
  keywords: string[];
  intro: string;
  sections: Array<{ title: string; body: string; items?: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const seoBlogPosts: BlogPost[] = [
  {
    slug: "what-is-fatty-liver-symptoms-causes",
    category: "Liver Care",
    title: "What Is Fatty Liver? Symptoms, Causes and When to Consult",
    description: "A simple guide to fatty liver symptoms, common causes, liver tests, FibroScan and when Indian patients should consult a liver specialist in Agra.",
    date: "January 1, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Treatment in Agra",
    keywords: ["What is Fatty Liver", "Fatty Liver Symptoms", "Fatty Liver Treatment in Agra", "Fatty Liver Specialist in Agra", "Liver Specialist in Agra", "FibroScan in Agra"],
    intro: "Fatty liver means excess fat has built up in liver cells. It is very common in India and may be linked with diabetes, obesity, high triglycerides, alcohol intake or sedentary lifestyle. Many patients feel normal, so reports and follow-up matter.",
    sections: [
      {
        title: "What causes fatty liver?",
        body: "Fatty liver can happen when the liver stores more fat than it should. The cause may be metabolic, alcohol-related, medicine-related or linked with other liver conditions.",
        items: ["Diabetes or insulin resistance", "Overweight, obesity or increased waist size", "High cholesterol or triglycerides", "Alcohol intake", "Low physical activity and high-calorie diet"]
      },
      {
        title: "Common symptoms",
        body: "Most people have no clear symptoms in early fatty liver. It is often found on ultrasound or blood tests.",
        items: ["Tiredness or low energy", "Heaviness or discomfort in the right upper abdomen", "Bloating or indigestion", "Raised SGPT/SGOT on liver function tests", "Fatty liver reported on ultrasound"]
      },
      {
        title: "When to consult a liver specialist",
        body: "Specialist review is important when liver tests are abnormal, diabetes is present, FibroScan suggests stiffness or there are warning signs such as jaundice, swelling or low platelets."
      },
      {
        title: "How fatty liver is treated",
        body: "Treatment depends on severity and cause. Weight reduction, diabetes control, exercise, diet changes, alcohol avoidance and monitoring are usually central to care."
      }
    ],
    faqs: [
      { question: "Can fatty liver be reversed?", answer: "In many early cases, fatty liver can improve with weight loss, exercise, diabetes control and diet changes. Advanced fibrosis needs closer monitoring." },
      { question: "Is fatty liver always due to alcohol?", answer: "No. Many patients have non-alcoholic fatty liver linked with diabetes, obesity and metabolic risk." },
      { question: "Which test checks liver stiffness?", answer: "FibroScan can help estimate liver stiffness and fat-related risk without surgery." },
      { question: "Where can I consult for fatty liver in Agra?", answer: `Fatty liver evaluation is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "best-diet-for-fatty-liver-indian-food-guide",
    category: "Liver Care",
    title: "Best Diet for Fatty Liver: Indian Food Guide",
    description: "A practical Indian diet guide for fatty liver covering chapati, rice, oil, sugar, fruits, protein, alcohol avoidance and lifestyle habits.",
    date: "January 2, 2026",
    readTime: "7 min read",
    accent: "#84cc16",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Diet and Treatment",
    keywords: ["Best Diet for Fatty Liver", "Foods Good for the Liver", "Fatty Liver Treatment in Agra", "Fatty Liver Specialist in Agra", "Liver Specialist in Agra", "Best Doctor for Fatty Liver in Agra"],
    intro: "Diet is one of the most important parts of fatty liver care. There is no single magic food, but steady weight control, lower sugar intake, balanced Indian meals and regular activity can help reduce liver fat and metabolic risk.",
    sections: [
      {
        title: "What should a fatty liver diet focus on?",
        body: "The goal is to reduce excess calories, sugar and refined carbohydrates while improving protein, fiber and overall meal balance.",
        items: ["Prefer home-cooked meals with controlled oil", "Use whole grains such as roti, dalia or millets when suitable", "Add dal, curd, paneer, eggs, fish or lean protein as advised", "Include vegetables and salads regularly", "Avoid sugary drinks, sweets and frequent fried snacks"]
      },
      {
        title: "Common Indian food mistakes",
        body: "Many patients eat vegetarian or home food but still consume too many calories through refined carbs, sugar, snacks and large portions.",
        items: ["Too much rice, poori, paratha or refined flour", "Sweet tea, packaged juice or soft drinks", "Frequent namkeen, biscuits and bakery foods", "Late dinner and no walking after meals", "Alcohol intake despite abnormal liver reports"]
      },
      {
        title: "Weight loss and exercise",
        body: "Gradual weight loss can improve fatty liver in many patients. Crash diets are not advised. Walking, strength activity and diabetes control should be planned realistically."
      },
      {
        title: "When diet alone is not enough",
        body: "Patients with diabetes, high liver enzymes, fibrosis risk, obesity, alcohol use or abnormal FibroScan need specialist follow-up along with diet changes."
      }
    ],
    faqs: [
      { question: "Can I eat rice with fatty liver?", answer: "Many patients can eat rice in controlled portions, but quantity, diabetes status and total calories matter. The doctor or diet plan can personalize this." },
      { question: "Is fruit allowed in fatty liver?", answer: "Whole fruit in sensible portions is usually better than juice. Patients with diabetes should follow specific advice." },
      { question: "Should I stop alcohol completely?", answer: "If liver tests are abnormal or fatty liver is present, alcohol avoidance is commonly advised. Discuss your exact risk with the doctor." },
      { question: "Can diet reverse fatty liver?", answer: "Diet, exercise and weight loss can improve many early cases. Fibrosis or cirrhosis risk needs specialist monitoring." }
    ]
  },
  {
    slug: "gerd-acid-reflux-symptoms-treatment",
    category: "Stomach Care",
    title: "GERD and Acid Reflux: Symptoms, Causes and Treatment",
    description: "Understand acidity, GERD, heartburn, reflux symptoms, lifestyle triggers, warning signs and when endoscopy may be needed.",
    date: "January 3, 2026",
    readTime: "6 min read",
    accent: "#22d3ee",
    relatedHref: "/procedures/acidity-gerd",
    relatedLabel: "GERD Treatment in Agra",
    keywords: ["GERD Symptoms", "Acid Reflux Treatment", "GERD Specialist", "Heartburn Specialist", "Best Doctor for GERD in Agra", "Stomach Specialist in Agra"],
    intro: "GERD, also called acid reflux, happens when acid or stomach contents move back into the food pipe. Occasional acidity is common, but frequent symptoms, swallowing difficulty or weight loss need medical review.",
    sections: [
      {
        title: "Common symptoms of GERD",
        body: "GERD symptoms may be typical or unusual. Some patients mainly complain of throat symptoms or cough.",
        items: ["Burning in chest or heartburn", "Sour belching or regurgitation", "Upper abdominal burning or pain", "Chronic cough, throat irritation or hoarseness", "Difficulty swallowing or food sticking sensation"]
      },
      {
        title: "Common triggers in Indian patients",
        body: "Meals and lifestyle habits often worsen reflux, though triggers differ from person to person.",
        items: ["Late-night meals", "Spicy, fried or heavy food", "Tea, coffee, tobacco or alcohol", "Lying down soon after food", "Obesity or tight abdominal pressure"]
      },
      {
        title: "When endoscopy may be advised",
        body: "Endoscopy may be needed if symptoms persist despite treatment, there is difficulty swallowing, vomiting, black stool, anemia, weight loss or long-standing reflux."
      },
      {
        title: "Treatment approach",
        body: "Treatment may include lifestyle correction, weight management, medicines and evaluation for complications. Long-term medicine use should be reviewed by a doctor."
      }
    ],
    faqs: [
      { question: "Is GERD the same as acidity?", answer: "Acidity is a common symptom. GERD means repeated reflux that causes troublesome symptoms or complications." },
      { question: "Can GERD cause throat symptoms?", answer: "Yes. Reflux can cause cough, throat irritation, sour taste, hoarseness or choking sensation in some patients." },
      { question: "Do all GERD patients need endoscopy?", answer: "No. Endoscopy is advised based on age, duration, warning symptoms and treatment response." },
      { question: "Where can I consult for GERD in Agra?", answer: `GERD and acidity care is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "stomach-pain-causes-when-to-see-gastroenterologist",
    category: "Symptom Guide",
    title: "Stomach Pain Causes: When Should You See a Gastroenterologist?",
    description: "Stomach pain may be due to acidity, ulcers, gallstones, pancreatitis, liver disease or intestinal problems. Learn warning signs and when to consult.",
    date: "January 4, 2026",
    readTime: "6 min read",
    accent: "#14b8a6",
    relatedHref: "/procedures/peptic-ulcer-disease",
    relatedLabel: "Stomach Pain and Ulcer Care",
    keywords: ["Stomach Pain Causes", "Stomach Pain Doctor", "Abdominal Pain Doctor", "Gastritis Treatment", "Peptic Ulcer Treatment", "Digestive Problems Doctor"],
    intro: "Stomach pain is one of the most common reasons patients visit a gastroenterologist. The cause can be simple acidity, but repeated or severe pain may need evaluation for ulcers, gallbladder disease, pancreatitis, liver problems or intestinal disease.",
    sections: [
      {
        title: "Common causes of stomach pain",
        body: "Pain location, timing, food relation, vomiting, stool changes and fever help guide evaluation.",
        items: ["Acidity, GERD or gastritis", "Peptic ulcer disease", "Gallstones or bile duct stones", "Pancreatitis", "Constipation, infection or inflammatory bowel disease", "Liver disease or jaundice-related pain"]
      },
      {
        title: "Warning symptoms",
        body: "Some symptoms should not be ignored because they may suggest bleeding, infection, obstruction or severe inflammation.",
        items: ["Severe or worsening pain", "Fever, persistent vomiting or dehydration", "Black stool or vomiting blood", "Jaundice or dark urine", "Unexplained weight loss or anemia"]
      },
      {
        title: "Tests that may be needed",
        body: "Depending on the symptoms, the doctor may advise blood tests, liver and pancreas tests, ultrasound, endoscopy, colonoscopy, CT or stool tests."
      },
      {
        title: "Treatment depends on the cause",
        body: "Painkillers and home remedies can mask symptoms. Correct treatment depends on diagnosis, age, previous reports and warning signs."
      }
    ],
    faqs: [
      { question: "When is stomach pain urgent?", answer: "Severe pain, fever, vomiting blood, black stool, jaundice, fainting or persistent vomiting needs urgent medical advice." },
      { question: "Can acidity cause stomach pain?", answer: "Yes, acidity and gastritis can cause upper abdominal burning or pain, but repeated symptoms should be evaluated." },
      { question: "Should I take painkillers for stomach pain?", answer: "Avoid repeated self-medication. Some painkillers can worsen ulcers or bleeding risk." },
      { question: "Where can I consult for abdominal pain in Agra?", answer: `You can consult ${site.name}, Shaheed Nagar, Agra for gastroenterology evaluation.` }
    ]
  },
  {
    slug: "ibs-symptoms-treatment-indian-patient-guide",
    category: "Intestine Care",
    title: "IBS Symptoms and Treatment: Indian Patient Guide",
    description: "Understand IBS symptoms, triggers, bowel habit changes, bloating, stress connection, diet planning and when tests like colonoscopy may be needed.",
    date: "January 5, 2026",
    readTime: "7 min read",
    accent: "#06b6d4",
    relatedHref: "/procedures/ibs",
    relatedLabel: "IBS Treatment in Agra",
    keywords: ["IBS Treatment", "Irritable Bowel Syndrome Doctor", "Bloating Treatment", "Chronic Constipation Treatment", "Chronic Diarrhea Treatment", "Best Doctor for IBS in Agra"],
    intro: "Irritable bowel syndrome, or IBS, is a common functional bowel disorder. Patients may have abdominal pain, bloating, constipation, diarrhea or alternating bowel habits. IBS is treatable, but warning symptoms must be ruled out.",
    sections: [
      {
        title: "Common IBS symptoms",
        body: "IBS symptoms often come and go and may worsen with stress, irregular meals or certain foods.",
        items: ["Abdominal cramps relieved after passing stool", "Bloating or gas", "Constipation, diarrhea or mixed bowel pattern", "Urgency after meals", "Feeling of incomplete evacuation"]
      },
      {
        title: "When it may not be simple IBS",
        body: "Warning signs suggest the need for evaluation to rule out infection, colitis, celiac disease, polyps or other bowel disease.",
        items: ["Blood in stool", "Unexplained weight loss", "Fever or night symptoms", "Anemia or low hemoglobin", "New symptoms after age 45-50", "Family history of colon cancer or IBD"]
      },
      {
        title: "Diet and lifestyle approach",
        body: "Treatment may include meal timing, fiber planning, hydration, sleep correction, stress management and selected medicines. A strict diet should not be started without guidance."
      },
      {
        title: "Tests that may be advised",
        body: "Depending on symptoms, the doctor may advise blood tests, stool tests, celiac testing, ultrasound, colonoscopy or other evaluation."
      }
    ],
    faqs: [
      { question: "Is IBS dangerous?", answer: "IBS itself is not cancer, but symptoms that look like IBS can sometimes come from other diseases. Warning signs need evaluation." },
      { question: "Can stress worsen IBS?", answer: "Yes. Stress, poor sleep and irregular eating can worsen IBS symptoms in many patients." },
      { question: "Do IBS patients need colonoscopy?", answer: "Not all. Colonoscopy is considered when warning symptoms, age, anemia, bleeding or family history are present." },
      { question: "Where can I consult for IBS symptoms in Agra?", answer: `Digestive symptom evaluation is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "chronic-constipation-causes-tests-treatment",
    category: "Intestine Care",
    title: "Chronic Constipation: Causes, Tests and Treatment Options",
    description: "A patient guide to chronic constipation causes, fiber, hydration, medicines, warning signs and when colonoscopy or specialist care is needed.",
    date: "January 6, 2026",
    readTime: "6 min read",
    accent: "#0f766e",
    relatedHref: "/procedures/chronic-constipation",
    relatedLabel: "Chronic Constipation Treatment",
    keywords: ["Chronic Constipation Treatment", "Digestive Problems Doctor", "Colonoscopy in Agra", "Stomach Specialist in Agra", "Gastroenterologist in Agra", "Best Gastro Doctor in Agra"],
    intro: "Constipation becomes chronic when it persists for weeks or months, causes strain, hard stool, bloating or incomplete evacuation. Treatment depends on diet, medicines, lifestyle, age and warning symptoms.",
    sections: [
      {
        title: "Common causes",
        body: "Constipation may be related to diet and lifestyle, but medical causes and medicines should also be reviewed.",
        items: ["Low fiber or low water intake", "Low physical activity", "Diabetes or thyroid disease", "Iron, calcium, pain medicines or other drugs", "IBS-related constipation", "Colon narrowing, polyp or tumor in selected cases"]
      },
      {
        title: "Warning signs",
        body: "Constipation with warning signs needs medical evaluation instead of long-term self-medication.",
        items: ["Blood in stool", "Unexplained weight loss", "Anemia", "New constipation in older age", "Severe pain, vomiting or abdominal distension", "Family history of colon cancer"]
      },
      {
        title: "Treatment approach",
        body: "Treatment may include fiber correction, fluids, activity, toilet routine, medicines and evaluation of underlying causes. Long-term laxative use should be reviewed."
      },
      {
        title: "When colonoscopy may be needed",
        body: "Colonoscopy may be advised for warning symptoms, unexplained anemia, bleeding, age-related screening or persistent bowel habit change."
      }
    ],
    faqs: [
      { question: "How much fiber should I take?", answer: "Fiber needs vary. Sudden high fiber can worsen gas in some patients, so increase gradually and follow doctor advice." },
      { question: "Is daily laxative use safe?", answer: "Some medicines are safe when prescribed, but long-term self-use should be reviewed by a doctor." },
      { question: "Can constipation be a sign of colon cancer?", answer: "Usually constipation has benign causes, but new constipation with bleeding, anemia or weight loss needs evaluation." },
      { question: "Where can I consult for chronic constipation in Agra?", answer: `You can consult ${site.name}, Shaheed Nagar, Agra for digestive and colon evaluation.` }
    ]
  },
  {
    slug: "liver-cirrhosis-symptoms-warning-signs",
    category: "Liver Care",
    title: "Liver Cirrhosis Symptoms and Warning Signs",
    description: "Learn common liver cirrhosis symptoms, complications, variceal bleeding warning signs, ascites, jaundice and when urgent care is needed.",
    date: "January 7, 2026",
    readTime: "7 min read",
    accent: "#f59e0b",
    relatedHref: "/procedures/liver-cirrhosis",
    relatedLabel: "Liver Cirrhosis Treatment in Agra",
    keywords: ["Liver Cirrhosis Symptoms", "Liver Cirrhosis Treatment in Agra", "Liver Disease Specialist", "Liver Specialist in Agra", "Hepatologist in Agra", "Best Doctor for Liver Cirrhosis in Agra"],
    intro: "Cirrhosis means advanced scarring of the liver. It can develop from fatty liver, alcohol-related liver disease, hepatitis B or C and other liver conditions. Many complications can be prevented or detected early with regular specialist follow-up.",
    sections: [
      {
        title: "Symptoms of liver cirrhosis",
        body: "Early cirrhosis may have few symptoms. Advanced disease can affect digestion, blood clotting, fluid balance and brain function.",
        items: ["Tiredness, weakness or poor appetite", "Jaundice or yellow eyes", "Abdominal swelling due to ascites", "Leg swelling", "Easy bruising or bleeding", "Confusion, sleep reversal or drowsiness"]
      },
      {
        title: "Important complications",
        body: "Cirrhosis can cause portal hypertension, varices, ascites, infections, kidney issues and liver cancer risk.",
        items: ["Vomiting blood or black stool from varices", "Fluid in abdomen", "Low platelets or enlarged spleen", "Repeated jaundice", "Fever with abdominal pain or swelling"]
      },
      {
        title: "Tests and monitoring",
        body: "Monitoring may include liver function tests, ultrasound, FibroScan, viral markers, endoscopy for varices and periodic screening as advised."
      },
      {
        title: "Why regular follow-up matters",
        body: "Cirrhosis needs structured follow-up. Medicines, salt restriction, vaccination, variceal screening, alcohol avoidance and complication management are individualized."
      }
    ],
    faqs: [
      { question: "Can cirrhosis be silent?", answer: "Yes. Some patients are diagnosed only after abnormal reports, low platelets, ultrasound changes or complications." },
      { question: "Why is endoscopy advised in cirrhosis?", answer: "Endoscopy checks for varices, which can bleed suddenly if untreated." },
      { question: "When should cirrhosis patients call urgently?", answer: "Vomiting blood, black stool, fever, confusion, severe weakness, jaundice worsening or abdominal swelling need urgent care." },
      { question: "Is cirrhosis care available in Agra?", answer: `Liver cirrhosis care is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "chronic-diarrhea-when-specialist-evaluation-needed",
    category: "Intestine Care",
    title: "Chronic Diarrhea: When It Needs Specialist Evaluation",
    description: "Learn chronic diarrhea causes, warning signs, stool tests, colonoscopy need, dehydration risk and when to consult a gastroenterologist.",
    date: "January 8, 2026",
    readTime: "6 min read",
    accent: "#0891b2",
    relatedHref: "/procedures/chronic-diarrhea",
    relatedLabel: "Chronic Diarrhea Treatment",
    keywords: ["Chronic Diarrhea Treatment", "Ulcerative Colitis Specialist", "Crohn's Disease Treatment", "IBS Treatment", "Digestive Problems Doctor", "Gastroenterologist in Agra"],
    intro: "Diarrhea lasting more than a few weeks should be evaluated, especially if it causes weight loss, weakness, blood in stool or night-time symptoms. Causes range from infection and food intolerance to IBS, IBD and malabsorption.",
    sections: [
      {
        title: "Common causes of chronic diarrhea",
        body: "The pattern of diarrhea, stool frequency, pain, blood, fever and weight loss helps guide diagnosis.",
        items: ["Post-infection bowel sensitivity", "IBS with diarrhea", "Ulcerative colitis or Crohn's disease", "Celiac disease or malabsorption", "Medicine-related diarrhea", "Chronic infection or parasites"]
      },
      {
        title: "Warning signs",
        body: "These symptoms need specialist evaluation and should not be managed only with repeated antibiotics or home remedies.",
        items: ["Blood or mucus in stool", "Fever or night-time diarrhea", "Weight loss or anemia", "Severe dehydration", "Persistent pain", "Diarrhea in elderly or immunocompromised patients"]
      },
      {
        title: "Tests that may be advised",
        body: "The doctor may advise stool tests, CBC, thyroid test, celiac testing, inflammatory markers, ultrasound, colonoscopy or biopsy depending on symptoms."
      },
      {
        title: "Treatment planning",
        body: "Treatment depends on cause. Unnecessary antibiotics can worsen some conditions, so recurrent diarrhea should be diagnosed properly."
      }
    ],
    faqs: [
      { question: "How long is chronic diarrhea?", answer: "Diarrhea lasting more than 3-4 weeks is commonly considered chronic and should be evaluated." },
      { question: "Can chronic diarrhea be IBS?", answer: "Yes, but blood, fever, weight loss, anemia or night symptoms suggest evaluation for other conditions." },
      { question: "Will I need colonoscopy?", answer: "Colonoscopy may be advised if there is bleeding, suspected colitis, chronic symptoms, anemia or warning signs." },
      { question: "Where can I consult for chronic diarrhea in Agra?", answer: `Chronic diarrhea and colitis evaluation are available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "hepatitis-b-c-tests-symptoms-treatment",
    category: "Liver Care",
    title: "Hepatitis B and Hepatitis C: Tests, Symptoms and Treatment",
    description: "Patient guide to hepatitis B and C symptoms, blood tests, liver monitoring, treatment planning, family screening and when to consult a liver specialist.",
    date: "January 9, 2026",
    readTime: "7 min read",
    accent: "#0ea5e9",
    relatedHref: "/procedures/liver-cirrhosis",
    relatedLabel: "Hepatitis and Liver Care",
    keywords: ["Hepatitis B Treatment", "Hepatitis C Treatment", "Liver Specialist in Agra", "Hepatologist in Agra", "Liver Disease Specialist", "Expert Liver Care in Agra"],
    intro: "Hepatitis B and hepatitis C are viral infections that can affect the liver. Some patients have jaundice or weakness, but many feel normal for years. Timely testing and follow-up can reduce the risk of cirrhosis and liver complications.",
    sections: [
      {
        title: "How hepatitis is detected",
        body: "Hepatitis B and C are usually detected through blood tests. A positive screening test may need confirmatory tests and viral load assessment.",
        items: ["HBsAg and related hepatitis B tests", "Anti-HCV and HCV RNA for hepatitis C", "Liver function tests", "Ultrasound or FibroScan when advised", "Family screening where appropriate"]
      },
      {
        title: "Symptoms and warning signs",
        body: "Symptoms can be mild, severe or absent. Jaundice with fever, bleeding or confusion needs urgent care.",
        items: ["Yellow eyes or dark urine", "Fatigue, nausea or poor appetite", "Right upper abdominal discomfort", "Abnormal liver reports", "Swelling, black stool or confusion in advanced disease"]
      },
      {
        title: "Treatment planning",
        body: "Treatment depends on virus type, viral load, liver tests, FibroScan findings, age, pregnancy status and other medical conditions. Not every patient needs immediate medicine, but every patient needs correct monitoring."
      },
      {
        title: "Prevention and family safety",
        body: "Hepatitis B vaccination, safe injections, screened blood products and family testing are important. Patients should not share razors, toothbrushes or needles."
      }
    ],
    faqs: [
      { question: "Can hepatitis B or C be present without symptoms?", answer: "Yes. Many patients feel normal even when infection is present, which is why blood tests and follow-up are important." },
      { question: "Is hepatitis C treatable?", answer: "Hepatitis C is often treatable with antiviral medicines, but the exact plan must be made by a specialist." },
      { question: "Should family members be tested?", answer: "Family screening may be advised, especially for hepatitis B, so vaccination or monitoring can be planned." },
      { question: "Where can I consult for hepatitis in Agra?", answer: `Hepatitis and liver care are available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "gallstones-bile-duct-stones-difference-symptoms-treatment",
    category: "Biliary Care",
    title: "Gallstones and Bile Duct Stones: Difference, Symptoms and Treatment",
    description: "Understand gallstones, CBD stones, bile duct blockage, jaundice, fever, ERCP, surgery referral and when urgent gastro care is needed.",
    date: "January 10, 2026",
    readTime: "7 min read",
    accent: "#f97316",
    relatedHref: "/procedures/cbd-stone-removal",
    relatedLabel: "CBD Stone Removal and ERCP",
    keywords: ["Gallstone Treatment", "Gallbladder Specialist", "Bile Duct Specialist", "CBD Stone Removal", "ERCP Specialist in Agra", "Jaundice Treatment"],
    intro: "Gallstones form in the gallbladder, while bile duct stones can block the common bile duct and cause jaundice, fever or pancreatitis. Bile duct stones often need gastroenterology evaluation and selected ERCP-based treatment.",
    sections: [
      {
        title: "Gallstones vs bile duct stones",
        body: "Gallbladder stones and common bile duct stones are related but not the same. Treatment planning depends on stone location and symptoms.",
        items: ["Gallstones are inside the gallbladder", "CBD stones are inside the common bile duct", "CBD stones can cause jaundice or infection", "Gallstones can trigger pancreatitis in some patients", "ERCP may be needed for selected bile duct stones"]
      },
      {
        title: "Symptoms to watch",
        body: "Symptoms may occur after meals or suddenly when a stone blocks bile flow.",
        items: ["Right upper abdominal pain", "Pain after fatty meals", "Fever with chills", "Yellow eyes or dark urine", "Vomiting", "Severe pain going to the back"]
      },
      {
        title: "Tests used for diagnosis",
        body: "Ultrasound, liver function tests, CBC, amylase/lipase, CT or MRCP may be used depending on pain, jaundice and infection risk."
      },
      {
        title: "Treatment approach",
        body: "Gallbladder stones may need surgical opinion. CBD stones may need ERCP for duct clearance, drainage or stenting depending on the case."
      }
    ],
    faqs: [
      { question: "Are gallstones and CBD stones the same?", answer: "No. Gallstones are in the gallbladder. CBD stones are in the bile duct and can block bile drainage." },
      { question: "When is it urgent?", answer: "Jaundice with fever, chills, severe pain, persistent vomiting or weakness needs urgent medical evaluation." },
      { question: "Can ERCP remove bile duct stones?", answer: "In selected cases, ERCP can remove common bile duct stones or place a stent for drainage." },
      { question: "Where can I consult for bile duct stones in Agra?", answer: `CBD stone and ERCP evaluation are available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "pancreatitis-symptoms-causes-treatment-agra",
    category: "Pancreas Care",
    title: "Pancreatitis: Symptoms, Causes and Treatment in Agra",
    description: "Understand acute and chronic pancreatitis symptoms, alcohol and gallstone causes, warning signs, tests and when specialist care is needed.",
    date: "January 11, 2026",
    readTime: "7 min read",
    accent: "#8b5cf6",
    relatedHref: "/procedures/pancreatic-disorders",
    relatedLabel: "Pancreatitis Treatment in Agra",
    keywords: ["Pancreatitis Treatment", "Pancreas Specialist", "Pancreatic Disease Doctor", "Pancreatitis Treatment in Agra", "Gastroenterologist in Agra", "Abdominal Pain Doctor"],
    intro: "Pancreatitis means inflammation of the pancreas. It can cause severe upper abdominal pain, vomiting and complications. Gallstones, alcohol, high triglycerides and chronic pancreatic disease are common reasons for specialist evaluation.",
    sections: [
      {
        title: "Symptoms of pancreatitis",
        body: "Pancreatitis pain is often severe and may radiate to the back. Vomiting and inability to eat are common.",
        items: ["Severe upper abdominal pain", "Pain going to the back", "Repeated vomiting", "Fever or weakness", "Weight loss or oily stools in chronic disease"]
      },
      {
        title: "Common causes",
        body: "The cause should be identified because prevention depends on it.",
        items: ["Gallstones or bile duct stones", "Alcohol use", "High triglycerides", "Certain medicines or infections", "Chronic pancreatitis with duct stones or narrowing"]
      },
      {
        title: "Tests that may be advised",
        body: "Evaluation may include amylase/lipase, liver tests, ultrasound, CT, MRCP and other tests depending on severity and recurrence."
      },
      {
        title: "Treatment and follow-up",
        body: "Acute pancreatitis may need admission, IV fluids, pain control and monitoring. Chronic pancreatitis may need diet guidance, enzyme support, pain planning and selected endoscopic treatment."
      }
    ],
    faqs: [
      { question: "Is pancreatitis serious?", answer: "It can be serious, especially with severe pain, vomiting, fever, low BP, breathing difficulty or organ complications." },
      { question: "Can gallstones cause pancreatitis?", answer: "Yes. Gallstones or bile duct stones can trigger pancreatitis and may need specialist management." },
      { question: "What should I do for severe upper abdominal pain?", answer: "Severe pain with vomiting, fever, jaundice or weakness needs urgent medical evaluation." },
      { question: "Where is pancreatitis care available in Agra?", answer: `Pancreatic disorder evaluation is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "colon-cancer-symptoms-screening-colonoscopy",
    category: "Colon Health",
    title: "Colon Cancer Symptoms and Screening: When Colonoscopy Is Needed",
    description: "Learn colon cancer warning signs, colon polyps, blood in stool, anemia, family history and when colonoscopy screening should be discussed.",
    date: "January 12, 2026",
    readTime: "7 min read",
    accent: "#10b981",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colon Cancer Screening",
    keywords: ["Colon Cancer Symptoms", "Colon Cancer Screening", "Colonoscopy in Agra", "Best Colonoscopy Doctor in Agra", "Colon Polyps Treatment", "Blood in Stool Treatment"],
    intro: "Colon cancer can sometimes develop from colon polyps over years. Screening and timely colonoscopy can help detect polyps, bleeding sources, inflammation or cancer risk before symptoms become severe.",
    sections: [
      {
        title: "Warning symptoms",
        body: "Symptoms do not always mean cancer, but they should be evaluated, especially if persistent or unexplained.",
        items: ["Blood in stool or black stool", "Change in bowel habits", "Unexplained anemia", "Unexplained weight loss", "Persistent abdominal pain", "Family history of colon cancer or polyps"]
      },
      {
        title: "What are colon polyps?",
        body: "Polyps are growths in the colon. Many are harmless, but some types can become cancerous over time. Suitable polyps may be removed during colonoscopy."
      },
      {
        title: "When colonoscopy is discussed",
        body: "The doctor may advise colonoscopy for bleeding, anemia, chronic bowel changes, suspected colitis, screening age, family history or abnormal imaging."
      },
      {
        title: "Preparation and safety",
        body: "Good bowel preparation is essential for clear visualization. Patients should discuss diabetes medicines, blood thinners and attendant needs before colonoscopy."
      }
    ],
    faqs: [
      { question: "Does blood in stool mean colon cancer?", answer: "Not always. Piles and fissures are common, but bleeding should be evaluated because polyps, colitis or cancer can also cause it." },
      { question: "Can colonoscopy remove polyps?", answer: "Suitable polyps can often be removed during colonoscopy and sent for biopsy." },
      { question: "Who needs colon cancer screening?", answer: "Screening depends on age, symptoms, family history and risk factors. A gastroenterologist can guide timing." },
      { question: "Where can I get colonoscopy in Agra?", answer: `Colonoscopy is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "endoscopy-preparation-indian-patients",
    category: "Procedure Guide",
    title: "Endoscopy Preparation: What Indian Patients Should Know",
    description: "A practical endoscopy preparation guide for Indian patients, including fasting, medicines, blood thinners, attendant advice and when to call a gastroenterologist in Agra.",
    date: "January 13, 2026",
    readTime: "6 min read",
    accent: "#22d3ee",
    relatedHref: "/procedures/endoscopy",
    relatedLabel: "Endoscopy in Agra",
    keywords: ["Endoscopy in Agra", "Best Endoscopy Centre in Agra", "Upper GI Endoscopy", "Endoscopy Near Me", "Advanced Endoscopy Center in Agra", "Gastroenterologist in Agra"],
    intro: "Upper GI endoscopy helps doctors examine the food pipe, stomach and first part of the small intestine. It may be advised for persistent acidity, stomach pain, vomiting, black stools, anemia, ulcers or difficulty swallowing.",
    sections: [
      {
        title: "Why endoscopy may be advised",
        body: "A gastroenterologist may advise endoscopy when symptoms do not improve with routine medicines or when warning signs suggest a need to directly inspect the upper digestive tract.",
        items: ["Long-standing acidity, GERD or heartburn", "Upper abdominal pain, vomiting or bloating", "Black stools, anemia or suspected bleeding", "Difficulty swallowing or food sticking sensation"]
      },
      {
        title: "How to prepare",
        body: "Preparation is simple but important. Final instructions should always come from the treating doctor or hospital team.",
        items: ["Fasting is usually needed for 6-8 hours, as advised.", "Tell the doctor about diabetes, BP medicines and heart medicines.", "Discuss aspirin, clopidogrel, warfarin or other blood thinners in advance.", "Bring previous prescriptions, blood reports and scan reports."]
      },
      {
        title: "Is endoscopy painful?",
        body: "Most patients tolerate endoscopy well. Some may feel throat discomfort, bloating or mild tiredness afterward. Sedation or throat spray may be used depending on the patient and procedure plan."
      },
      {
        title: "After the procedure",
        body: "Patients are observed for a short time. Eating, drinking, driving and work instructions depend on whether sedation was used and whether biopsy or treatment was performed.",
        items: ["Avoid driving after sedation.", "Follow diet instructions before eating.", "Collect and review the report with the doctor.", "Call reception for severe pain, fever, vomiting blood or black stools."]
      }
    ],
    faqs: [
      { question: "Do I need fasting for endoscopy?", answer: "Yes, fasting is usually required for 6-8 hours, but the exact timing should be confirmed by the hospital team." },
      { question: "Can I take diabetes medicine before endoscopy?", answer: "Do not change diabetes medicine or insulin on your own. Ask the doctor because fasting can affect sugar levels." },
      { question: "Is endoscopy available at Mudgal Gastromedics Hospital?", answer: `Yes. Endoscopy is available at ${site.name}, Shaheed Nagar, Agra.` },
      { question: "When should I urgently consult?", answer: "Vomiting blood, black stools, severe pain, persistent vomiting or difficulty breathing need urgent medical advice." }
    ]
  },
  {
    slug: "colonoscopy-preparation-guide",
    category: "Procedure Guide",
    title: "Colonoscopy Preparation Guide: Diet, Bowel Prep and Safety",
    description: "Patient-friendly colonoscopy preparation guide covering diet, bowel cleansing, medicines, attendant requirement, recovery and warning symptoms.",
    date: "January 14, 2026",
    readTime: "7 min read",
    accent: "#10b981",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colonoscopy in Agra",
    keywords: ["Colonoscopy in Agra", "Colonoscopy Near Me", "Colon Cancer Screening", "Blood in Stool Treatment", "Best Colonoscopy Doctor in Agra", "Colonoscopy Specialist in Agra"],
    intro: "Colonoscopy examines the large intestine and rectum. It may help diagnose blood in stool, chronic diarrhea, constipation, colon polyps, inflammatory bowel disease and colon cancer risk.",
    sections: [
      {
        title: "Why colonoscopy is done",
        body: "A colonoscopy may be recommended when bowel symptoms continue, bleeding occurs, or screening is needed.",
        items: ["Blood in stool or rectal bleeding", "Chronic diarrhea or constipation", "Unexplained anemia or weight loss", "Colon polyps or family history of colon cancer"]
      },
      {
        title: "Diet and bowel preparation",
        body: "A clean colon is essential for a useful report. Follow the diet and bowel preparation schedule exactly as advised.",
        items: ["Avoid restricted foods as instructed before the test.", "Take bowel prep medicine at the correct time.", "Drink permitted clear fluids if advised.", "Inform the doctor if vomiting prevents prep completion."]
      },
      {
        title: "Medicines and attendant",
        body: "Tell the hospital about diabetes medicines, insulin, BP medicines and blood thinners. An adult attendant is usually advised when sedation is planned."
      },
      {
        title: "Recovery",
        body: "Mild gas or cramps can happen after colonoscopy. If sedation is used, avoid driving for the rest of the day. Biopsy or polyp removal may require additional instructions."
      }
    ],
    faqs: [
      { question: "Is bowel preparation necessary?", answer: "Yes. Poor bowel preparation can hide important findings and may require repeating the test." },
      { question: "Is colonoscopy painful?", answer: "Sedation is commonly used when appropriate. Some bloating or cramps may occur after the test." },
      { question: "Can colonoscopy remove polyps?", answer: "Suitable polyps may be removed during colonoscopy, depending on size, location and safety." },
      { question: "Where is colonoscopy available in Agra?", answer: `Colonoscopy is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "fatty-liver-symptoms-treatment-agra",
    category: "Liver Care",
    title: "Fatty Liver Disease: Symptoms, Tests and Treatment in Agra",
    description: "Understand fatty liver symptoms, causes, FibroScan, liver tests, lifestyle care and when to consult a liver specialist in Agra.",
    date: "January 15, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Treatment in Agra",
    keywords: ["Fatty Liver Treatment in Agra", "Fatty Liver Specialist in Agra", "Liver Specialist in Agra", "FibroScan in Agra", "Best Doctor for Fatty Liver in Agra", "Expert Liver Care in Agra"],
    intro: "Fatty liver is common in India and is often linked with obesity, diabetes, high cholesterol, alcohol intake or metabolic risk. Many patients have no symptoms, so reports and risk assessment matter.",
    sections: [
      {
        title: "Common causes",
        body: "Fatty liver can happen when fat builds up in liver cells. It may progress silently in some patients.",
        items: ["Diabetes or insulin resistance", "Overweight or obesity", "High triglycerides or cholesterol", "Alcohol use", "Sedentary lifestyle"]
      },
      {
        title: "Symptoms and warning signs",
        body: "Many patients are diagnosed on ultrasound or abnormal liver function tests. Some may have fatigue, heaviness in the right upper abdomen or bloating.",
        items: ["Raised SGPT/SGOT", "Fatty liver on ultrasound", "Diabetes with liver risk", "Jaundice, swelling or low platelets need specialist review"]
      },
      {
        title: "Tests used for evaluation",
        body: "A liver specialist may advise liver function tests, viral markers, sugar and lipid tests, ultrasound and FibroScan to assess stiffness and fat-related risk."
      },
      {
        title: "Treatment approach",
        body: "Treatment depends on cause and severity. Weight loss, diet, exercise, diabetes control, alcohol avoidance and follow-up testing are commonly important."
      }
    ],
    faqs: [
      { question: "Is fatty liver serious?", answer: "It can be mild, but some patients develop fibrosis or cirrhosis over time. Risk assessment is important." },
      { question: "Can FibroScan help?", answer: "FibroScan can estimate liver stiffness and fatty change without surgery." },
      { question: "Who should consult a liver specialist?", answer: "Patients with abnormal liver tests, diabetes, obesity, alcohol use, hepatitis risk, jaundice or suspected fibrosis should consult." },
      { question: "Is fatty liver treatment available in Agra?", answer: `Yes. Fatty liver evaluation and treatment planning are available at ${site.name}.` }
    ]
  },
  {
    slug: "blood-in-stool-causes-when-to-consult",
    category: "Symptom Guide",
    title: "Blood in Stool: Causes and When to Consult a Gastroenterologist",
    description: "Blood in stool can occur from piles, fissure, colitis, polyps, ulcers or serious disease. Learn warning signs and when colonoscopy may be needed.",
    date: "January 16, 2026",
    readTime: "6 min read",
    accent: "#dc2626",
    relatedHref: "/procedures/gastrointestinal-bleeding-management",
    relatedLabel: "GI Bleeding Treatment in Agra",
    keywords: ["Blood in Stool Treatment", "Rectal Bleeding Specialist", "Abdominal Pain Doctor", "Stomach Specialist in Agra", "Colonoscopy in Agra", "Gastroenterologist in Agra"],
    intro: "Blood in stool should not be ignored. It may be due to piles or fissure, but it can also indicate colitis, polyps, ulcers, inflammation or cancer risk.",
    sections: [
      {
        title: "Possible causes",
        body: "The color, amount and pattern of bleeding help guide evaluation, but diagnosis requires medical assessment.",
        items: ["Piles or anal fissure", "Colitis or inflammatory bowel disease", "Colon polyps", "Ulcers or vascular lesions", "Colon or rectal cancer risk"]
      },
      {
        title: "Warning signs",
        body: "Some symptoms need urgent medical care, especially if bleeding is heavy or associated with weakness.",
        items: ["Black stools or vomiting blood", "Dizziness, fainting or severe weakness", "Unexplained anemia or weight loss", "Persistent abdominal pain or fever"]
      },
      {
        title: "Tests that may be advised",
        body: "Depending on age and symptoms, the doctor may advise blood tests, stool tests, endoscopy, colonoscopy or imaging."
      },
      {
        title: "When colonoscopy may be needed",
        body: "Colonoscopy may be advised for recurrent rectal bleeding, anemia, suspected colitis, polyps, altered bowel habits or screening needs."
      }
    ],
    faqs: [
      { question: "Is blood in stool always piles?", answer: "No. Piles are common, but bleeding can also come from the intestine or rectum and should be evaluated." },
      { question: "When is it urgent?", answer: "Heavy bleeding, black stool, fainting, vomiting blood, severe pain or weakness need urgent care." },
      { question: "Will I need colonoscopy?", answer: "The doctor decides based on symptoms, age, examination and reports." },
      { question: "Where can I consult in Agra?", answer: `You can consult ${site.name}, Shaheed Nagar, Agra for GI bleeding evaluation.` }
    ]
  },
  {
    slug: "jaundice-causes-treatment-agra",
    category: "Liver Care",
    title: "Jaundice: Causes, Warning Signs and Treatment in Agra",
    description: "Jaundice may be caused by hepatitis, liver disease, bile duct stones or obstruction. Learn warning symptoms and when ERCP or liver care may be needed.",
    date: "January 17, 2026",
    readTime: "6 min read",
    accent: "#f59e0b",
    relatedHref: "/procedures/obstructive-jaundice",
    relatedLabel: "Jaundice Treatment in Agra",
    keywords: ["Jaundice Treatment", "Liver Specialist in Agra", "Hepatologist in Agra", "Bile Duct Specialist", "ERCP Specialist in Agra", "Best Liver Doctor in Agra"],
    intro: "Jaundice causes yellow eyes, dark urine and sometimes itching, fever or abdominal pain. It can be due to liver inflammation, hepatitis, bile duct blockage, stones or pancreaticobiliary disease.",
    sections: [
      {
        title: "Common causes of jaundice",
        body: "Jaundice needs evaluation because treatment depends on whether the problem is in the liver, bile duct, gallbladder or pancreas.",
        items: ["Hepatitis A, B, C or other liver inflammation", "Alcohol-related liver disease", "Bile duct stone or blockage", "Liver cirrhosis", "Pancreaticobiliary disease"]
      },
      {
        title: "Warning symptoms",
        body: "Jaundice with fever or severe pain can suggest infection or blockage and should be assessed quickly.",
        items: ["Fever with chills", "Severe upper abdominal pain", "Persistent vomiting", "Confusion, bleeding or severe weakness", "Pale stool with dark urine"]
      },
      {
        title: "Tests and treatment planning",
        body: "Evaluation may include liver function tests, viral markers, ultrasound, CT or MRCP. ERCP may be advised for selected bile duct stones or blockage."
      },
      {
        title: "Follow-up care",
        body: "Follow-up depends on the cause. Hepatitis, fatty liver, cirrhosis and obstruction all need different treatment plans."
      }
    ],
    faqs: [
      { question: "Is jaundice dangerous?", answer: "Some jaundice is mild, but jaundice with fever, pain, confusion, bleeding or worsening weakness can be serious." },
      { question: "Can jaundice need ERCP?", answer: "ERCP may be advised if jaundice is due to selected bile duct stones or blockage." },
      { question: "Which doctor treats jaundice?", answer: "A gastroenterologist or liver specialist evaluates jaundice and plans treatment based on the cause." },
      { question: "Is jaundice treatment available in Agra?", answer: `Yes. Jaundice evaluation and liver care are available at ${site.name}.` }
    ]
  },
  {
    slug: "when-should-you-see-a-gastroenterologist",
    category: "Patient Guide",
    title: "When Should You See a Gastroenterologist?",
    description: "Know when acidity, abdominal pain, jaundice, bleeding, bowel changes, weight loss or liver reports need specialist gastroenterology care.",
    date: "January 18, 2026",
    readTime: "6 min read",
    accent: "#0891b2",
    relatedHref: "/dr-deepak-kumar-sharma-gastroenterologist-agra",
    relatedLabel: "Gastroenterologist in Agra",
    keywords: ["Gastroenterologist in Agra", "Digestive Disease Specialist in Agra", "Gastro Doctor Near Me", "Best Gastro Doctor in Agra", "Stomach Specialist in Agra", "Gastro Hospital in Agra"],
    intro: "A gastroenterologist treats diseases of the stomach, intestine, liver, pancreas, gallbladder and bile duct. Many digestive symptoms are minor, but persistent, recurrent or warning symptoms need specialist review.",
    sections: [
      { title: "Symptoms that need consultation", body: "You should consider seeing a gastroenterologist when symptoms continue despite basic treatment or affect daily life.", items: ["Persistent acidity, reflux or indigestion", "Repeated abdominal pain or bloating", "Blood in stool, black stool or vomiting blood", "Jaundice, abnormal liver tests or fatty liver", "Chronic constipation, diarrhea or altered bowel habits"] },
      { title: "Warning signs", body: "Some symptoms should be evaluated early because they can indicate bleeding, infection, obstruction, liver disease or cancer risk.", items: ["Unexplained weight loss", "Anemia or low hemoglobin", "Difficulty swallowing", "Persistent vomiting", "Fever with jaundice or severe pain"] },
      { title: "What to bring", body: "Bring previous prescriptions, blood reports, ultrasound, CT, MRCP, endoscopy, colonoscopy and discharge summaries if available." },
      { title: "How the visit helps", body: "The specialist can decide whether medicines, lifestyle changes, blood tests, stool tests, endoscopy, colonoscopy, FibroScan, ERCP or imaging are needed." }
    ],
    faqs: [
      { question: "Do I need a gastroenterologist for acidity?", answer: "Occasional acidity may settle, but frequent symptoms, swallowing difficulty, vomiting, anemia or weight loss need review." },
      { question: "Which doctor treats liver and digestion problems?", answer: "A gastroenterologist or hepatology-focused gastro doctor evaluates digestive, liver, pancreas and bile duct conditions." },
      { question: "When is it urgent?", answer: "Vomiting blood, black stool, severe pain, jaundice with fever, fainting or persistent vomiting need urgent medical attention." },
      { question: "Where can I consult a gastroenterologist in Agra?", answer: `You can consult ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "endoscopy-vs-colonoscopy-difference-preparation-uses",
    category: "Procedure Guide",
    title: "Endoscopy vs Colonoscopy: Difference, Preparation and Uses",
    description: "Understand the difference between upper GI endoscopy and colonoscopy, when each is advised, preparation, sedation and recovery.",
    date: "January 19, 2026",
    readTime: "7 min read",
    accent: "#22d3ee",
    relatedHref: "/procedures/endoscopy",
    relatedLabel: "Endoscopy and Colonoscopy",
    keywords: ["Endoscopy in Agra", "Colonoscopy in Agra", "Upper GI Endoscopy", "Best Endoscopy Centre in Agra", "Colonoscopy Near Me", "Gastroenterologist in Agra"],
    intro: "Endoscopy and colonoscopy are different tests used to examine different parts of the digestive tract. Both help diagnose symptoms and may allow biopsy or treatment during the same procedure.",
    sections: [
      { title: "What does endoscopy check?", body: "Upper GI endoscopy examines the food pipe, stomach and first part of the small intestine.", items: ["Acidity or GERD complications", "Ulcers or gastritis", "Vomiting blood or black stool", "Difficulty swallowing", "Biopsy for selected findings"] },
      { title: "What does colonoscopy check?", body: "Colonoscopy examines the rectum and large intestine.", items: ["Blood in stool", "Chronic diarrhea or constipation", "Colon polyps", "IBD or colitis", "Colon cancer screening"] },
      { title: "Preparation differences", body: "Endoscopy usually needs fasting. Colonoscopy needs bowel preparation and diet instructions so the colon is clean." },
      { title: "Recovery and safety", body: "If sedation is used, patients should come with an attendant and avoid driving that day. Recovery advice depends on biopsy, polyp removal or treatment done." }
    ],
    faqs: [
      { question: "Which is better, endoscopy or colonoscopy?", answer: "They are used for different areas. The doctor chooses based on symptoms and suspected disease." },
      { question: "Can both be done together?", answer: "In selected patients, both may be planned on the same day if medically appropriate." },
      { question: "Is bowel prep needed for endoscopy?", answer: "No. Bowel prep is for colonoscopy. Endoscopy usually needs fasting." },
      { question: "Where are these available in Agra?", answer: `Endoscopy and colonoscopy are available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "black-stool-causes-emergency",
    category: "Symptom Guide",
    title: "Black Stool: Causes and When It Is an Emergency",
    description: "Black stool can be caused by medicines, iron, food or upper GI bleeding. Learn danger signs and when urgent endoscopy may be needed.",
    date: "January 20, 2026",
    readTime: "6 min read",
    accent: "#334155",
    relatedHref: "/procedures/gastrointestinal-bleeding-management",
    relatedLabel: "GI Bleeding Treatment",
    keywords: ["Black Stool Treatment", "GI Bleeding Treatment", "Endoscopy Near Me", "Vomiting Blood Doctor", "Emergency Endoscopy", "Gastroenterologist in Agra"],
    intro: "Black stool can sometimes happen from iron tablets or certain foods, but tar-like black stool may indicate bleeding from the stomach or upper intestine. It should not be ignored.",
    sections: [
      { title: "Common causes", body: "The cause depends on stool appearance, smell, medicines and associated symptoms.", items: ["Iron tablets or bismuth medicines", "Certain dark foods", "Stomach or duodenal ulcer bleeding", "Variceal bleeding in liver disease", "Bleeding from vascular lesions"] },
      { title: "Emergency warning signs", body: "Black stool with weakness or bleeding symptoms can be serious.", items: ["Dizziness, fainting or sweating", "Vomiting blood", "Fast pulse or severe weakness", "Known liver cirrhosis", "Low hemoglobin or repeated black stools"] },
      { title: "Tests that may be needed", body: "The doctor may advise CBC, stool testing, liver tests and upper GI endoscopy depending on stability and symptoms." },
      { title: "What not to do", body: "Do not keep taking painkillers, alcohol or blood thinners without medical advice if bleeding is suspected." }
    ],
    faqs: [
      { question: "Is black stool always bleeding?", answer: "No. Iron and some medicines can darken stool, but tar-like black stool needs evaluation." },
      { question: "When should I go urgently?", answer: "Black stool with weakness, fainting, vomiting blood, liver disease or repeated episodes needs urgent care." },
      { question: "Can endoscopy find the cause?", answer: "Upper GI endoscopy can identify ulcers, varices and other upper digestive bleeding sources." },
      { question: "Where can I consult for black stool in Agra?", answer: `GI bleeding evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "vomiting-blood-causes-emergency-warning-signs-treatment",
    category: "Emergency Symptoms",
    title: "Vomiting Blood: Causes, Emergency Warning Signs and Treatment",
    description: "Vomiting blood may be due to ulcer bleeding, varices, gastritis or severe upper GI bleeding. Learn urgent warning signs and treatment steps.",
    date: "January 21, 2026",
    readTime: "6 min read",
    accent: "#dc2626",
    relatedHref: "/procedures/gastrointestinal-bleeding-management",
    relatedLabel: "Emergency GI Bleeding Care",
    keywords: ["Vomiting Blood Doctor", "GI Bleeding Treatment", "Emergency Endoscopy", "Black Stool Treatment", "Gastroenterologist in Agra", "Variceal Banding"],
    intro: "Vomiting blood is a medical emergency. It may appear fresh red or like coffee grounds and can come from ulcers, varices, severe gastritis or other upper GI bleeding sources.",
    sections: [
      { title: "Possible causes", body: "The cause depends on liver history, painkiller use, alcohol use, ulcer symptoms and bleeding severity.", items: ["Peptic ulcer bleeding", "Esophageal or gastric varices", "Severe gastritis or erosions", "Mallory-Weiss tear after repeated vomiting", "Blood thinner-related bleeding"] },
      { title: "Emergency signs", body: "These symptoms need immediate medical attention.", items: ["Fresh blood vomiting", "Black stool with weakness", "Fainting, sweating or low BP", "Known cirrhosis or varices", "Severe abdominal pain or confusion"] },
      { title: "Hospital treatment", body: "Care may include stabilization, blood tests, IV medicines, transfusion if needed and urgent endoscopy for diagnosis or bleeding control." },
      { title: "Prevention after recovery", body: "Prevention depends on cause and may include ulcer treatment, stopping unsafe painkillers, liver care, variceal banding or repeat endoscopy." }
    ],
    faqs: [
      { question: "Is vomiting blood serious?", answer: "Yes. It should be treated as an emergency even if the amount seems small." },
      { question: "Can ulcers cause blood vomiting?", answer: "Yes. Stomach or duodenal ulcers are a common cause of upper GI bleeding." },
      { question: "Can liver disease cause vomiting blood?", answer: "Yes. Varices related to cirrhosis can bleed suddenly and severely." },
      { question: "What should I do first?", answer: "Call reception or emergency services and go to a hospital immediately. Do not delay for home remedies." }
    ]
  },
  {
    slug: "difficulty-swallowing-causes-tests-treatment",
    category: "Symptom Guide",
    title: "Difficulty Swallowing: Causes, Tests and Treatment",
    description: "Difficulty swallowing may be caused by reflux injury, food-pipe narrowing, stricture, motility problems or growths. Learn when endoscopy is needed.",
    date: "January 22, 2026",
    readTime: "6 min read",
    accent: "#0ea5e9",
    relatedHref: "/procedures/difficulty-swallowing",
    relatedLabel: "Difficulty Swallowing Evaluation",
    keywords: ["Difficulty Swallowing Doctor", "Food Pipe Narrowing", "Endoscopy in Agra", "Esophageal Dilation", "Stricture Dilation", "Gastroenterologist in Agra"],
    intro: "Difficulty swallowing, also called dysphagia, means food or liquid does not pass normally from the mouth to the stomach. Progressive or recurrent symptoms need evaluation.",
    sections: [
      { title: "Common causes", body: "The cause may be structural, inflammatory or related to movement of the food pipe.", items: ["Reflux-related injury", "Food-pipe stricture or ring", "Motility disorder", "Infection or inflammation", "Suspicious growth or cancer risk"] },
      { title: "Warning signs", body: "Some swallowing symptoms should be assessed early.", items: ["Progressive difficulty from solids to liquids", "Weight loss", "Vomiting or food regurgitation", "Anemia or black stool", "Painful swallowing"] },
      { title: "Tests used", body: "Endoscopy is commonly used to examine the food pipe. Biopsy, dilation or imaging may be advised depending on findings." },
      { title: "Treatment options", body: "Treatment may include reflux medicines, dilation for suitable strictures, biopsy-based treatment or referral depending on cause." }
    ],
    faqs: [
      { question: "Is difficulty swallowing dangerous?", answer: "It can be due to simple reflux, but progressive symptoms, weight loss or anemia need urgent evaluation." },
      { question: "Can endoscopy diagnose food-pipe narrowing?", answer: "Yes. Endoscopy can inspect narrowing, inflammation, ulcers or growths and allow biopsy if needed." },
      { question: "Can food-pipe narrowing be widened?", answer: "Suitable strictures may be treated with endoscopic dilation." },
      { question: "Where can I consult in Agra?", answer: `Difficulty swallowing evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "bloating-gas-common-causes-when-to-consult",
    category: "Symptom Guide",
    title: "Bloating and Gas: Common Causes and When to Consult",
    description: "Bloating and gas may be due to indigestion, IBS, constipation, food intolerance, acidity or serious digestive disease when warning signs are present.",
    date: "January 23, 2026",
    readTime: "6 min read",
    accent: "#14b8a6",
    relatedHref: "/procedures/ibs",
    relatedLabel: "Bloating and IBS Evaluation",
    keywords: ["Bloating Treatment", "Indigestion Treatment", "Digestive Problems Doctor", "IBS Treatment", "Stomach Specialist in Agra", "Gastro Doctor Near Me"],
    intro: "Bloating and gas are common, but persistent symptoms can affect appetite, sleep and confidence. The cause may be diet-related, IBS, constipation, acidity, infection or other digestive conditions.",
    sections: [
      { title: "Common causes", body: "Bloating may be linked to food habits, bowel movement, stress or underlying disease.", items: ["Fast eating or late meals", "Constipation", "IBS", "Acidity or gastritis", "Food intolerance", "Small intestinal or colon disease in selected cases"] },
      { title: "Warning signs", body: "Bloating with alarm features needs medical evaluation.", items: ["Weight loss", "Vomiting", "Blood in stool", "Anemia", "Persistent pain", "New symptoms in older age"] },
      { title: "Evaluation", body: "The doctor may review diet, stool pattern, medicines and reports before advising blood tests, stool tests, ultrasound, endoscopy or colonoscopy." },
      { title: "Treatment approach", body: "Treatment may include meal timing, fiber adjustment, constipation care, IBS medicines, reflux treatment or targeted therapy after diagnosis." }
    ],
    faqs: [
      { question: "Is bloating always due to gas?", answer: "No. Constipation, IBS, acidity, food intolerance and other conditions can feel like gas." },
      { question: "Can stress cause bloating?", answer: "Stress can worsen IBS and gut sensitivity in many patients." },
      { question: "When should I consult?", answer: "Consult if bloating is persistent, painful, associated with vomiting, weight loss, bleeding or anemia." },
      { question: "Where can I get bloating treatment in Agra?", answer: `Bloating and digestive symptom evaluation are available at ${site.name}.` }
    ]
  },
  {
    slug: "h-pylori-infection-symptoms-testing-treatment",
    category: "Stomach Care",
    title: "H. pylori Infection: Symptoms, Testing and Treatment",
    description: "H. pylori can cause gastritis, ulcers, acidity and recurrent stomach pain. Learn symptoms, testing, treatment and follow-up.",
    date: "January 24, 2026",
    readTime: "6 min read",
    accent: "#f97316",
    relatedHref: "/procedures/peptic-ulcer-disease",
    relatedLabel: "H. pylori and Ulcer Care",
    keywords: ["H Pylori Treatment", "Gastritis Treatment", "Peptic Ulcer Treatment", "Stomach Pain Doctor", "Upper GI Endoscopy", "Gastroenterologist in Agra"],
    intro: "H. pylori is a bacteria that can live in the stomach lining. It is linked with gastritis, ulcers and recurrent upper abdominal pain in some patients.",
    sections: [
      { title: "Symptoms linked with H. pylori", body: "Many patients have no symptoms, while others have acidity-like complaints.", items: ["Upper abdominal burning", "Acidity or indigestion", "Nausea or bloating", "Ulcer symptoms", "Black stool if ulcer bleeding occurs"] },
      { title: "How it is tested", body: "Testing may be done through breath test, stool antigen, blood test in selected cases or biopsy during endoscopy depending on the patient." },
      { title: "Treatment", body: "Treatment usually involves a combination of acid-reducing medicine and antibiotics. The full course should be completed exactly as prescribed." },
      { title: "Why follow-up matters", body: "Persistent symptoms, ulcer history or incomplete treatment may need repeat evaluation or confirmation of eradication." }
    ],
    faqs: [
      { question: "Is H. pylori common?", answer: "Yes. It is common, but not everyone with H. pylori has symptoms." },
      { question: "Can H. pylori cause ulcers?", answer: "Yes. It is one of the common causes of stomach and duodenal ulcers." },
      { question: "Can I treat it with one antibiotic?", answer: "No. H. pylori treatment needs a prescribed combination. Incomplete treatment can fail." },
      { question: "Where can I consult for H. pylori in Agra?", answer: `H. pylori and ulcer care are available at ${site.name}.` }
    ]
  },
  {
    slug: "ulcerative-colitis-vs-crohns-disease-differences",
    category: "Intestine Care",
    title: "Ulcerative Colitis vs Crohn's Disease: Key Differences",
    description: "Understand the difference between ulcerative colitis and Crohn's disease, symptoms, colonoscopy, biopsy, treatment and follow-up.",
    date: "January 25, 2026",
    readTime: "7 min read",
    accent: "#8b5cf6",
    relatedHref: "/procedures/ibd-colitis",
    relatedLabel: "IBD / Colitis Care",
    keywords: ["Ulcerative Colitis Specialist", "Crohn's Disease Treatment", "IBD Treatment", "Chronic Diarrhea Treatment", "Colonoscopy in Agra", "Gastroenterologist in Agra"],
    intro: "Ulcerative colitis and Crohn's disease are types of inflammatory bowel disease. Both can cause chronic diarrhea, bleeding, pain and weight loss, but they affect the digestive tract differently.",
    sections: [
      { title: "Key difference", body: "Ulcerative colitis usually affects the colon lining. Crohn's disease can affect deeper layers and may involve different parts of the digestive tract." },
      { title: "Common symptoms", body: "Symptoms can overlap, so diagnosis needs tests.", items: ["Blood or mucus in stool", "Chronic diarrhea", "Abdominal pain", "Weight loss", "Fever or fatigue", "Anemia"] },
      { title: "Tests used", body: "Colonoscopy with biopsy is important. Blood tests, stool tests, imaging and follow-up colonoscopy may be required." },
      { title: "Treatment and monitoring", body: "Treatment aims to control inflammation, prevent flares and monitor complications. Medicines should not be stopped without medical advice." }
    ],
    faqs: [
      { question: "Can IBD be cured permanently?", answer: "IBD is usually a long-term condition that can be controlled with proper treatment and monitoring." },
      { question: "Is blood in stool common in ulcerative colitis?", answer: "Yes, blood or mucus in stool is common and should be evaluated." },
      { question: "Why is biopsy needed?", answer: "Biopsy helps confirm inflammation type, severity and other causes." },
      { question: "Where can I consult for IBD in Agra?", answer: `IBD and colitis care are available at ${site.name}.` }
    ]
  },
  {
    slug: "fibroscan-test-fatty-liver-liver-fibrosis",
    category: "Liver Care",
    title: "FibroScan Test: Why It Is Done for Fatty Liver and Liver Fibrosis",
    description: "Learn how FibroScan helps assess fatty liver, liver stiffness, fibrosis risk, cirrhosis monitoring and chronic liver disease.",
    date: "January 26, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/procedures/fibroscan",
    relatedLabel: "FibroScan in Agra",
    keywords: ["FibroScan in Agra", "Fatty Liver Test", "Liver Fibrosis Scan", "Liver Specialist in Agra", "Fatty Liver Treatment in Agra", "Liver Disease Specialist"],
    intro: "FibroScan is a non-invasive test that estimates liver stiffness and fatty change. It is commonly used in fatty liver, hepatitis, alcohol-related liver risk and chronic liver disease monitoring.",
    sections: [
      { title: "Why FibroScan is done", body: "It helps assess whether fatty liver has progressed toward fibrosis or cirrhosis risk.", items: ["Fatty liver on ultrasound", "Raised liver enzymes", "Diabetes or obesity with liver risk", "Hepatitis B or C monitoring", "Alcohol-related liver disease"] },
      { title: "How it is performed", body: "The test is usually quick and painless. A probe is placed on the right side of the chest/abdomen to measure liver stiffness." },
      { title: "Preparation", body: "Fasting may be advised before FibroScan. Bring liver function tests, ultrasound and previous FibroScan reports if available." },
      { title: "What results mean", body: "Results must be interpreted with clinical history, blood tests and imaging. A high stiffness score needs specialist review." }
    ],
    faqs: [
      { question: "Is FibroScan painful?", answer: "No. It is usually painless and non-invasive." },
      { question: "Does FibroScan replace all liver tests?", answer: "No. It complements blood tests, ultrasound and clinical assessment." },
      { question: "Who should get FibroScan?", answer: "Patients with fatty liver, abnormal liver tests, diabetes, obesity, hepatitis or alcohol-related risk may be advised FibroScan." },
      { question: "Where is FibroScan available in Agra?", answer: `FibroScan is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "ercp-procedure-cbd-stones-jaundice",
    category: "Procedure Guide",
    title: "ERCP Procedure: When It Is Needed for CBD Stones and Jaundice",
    description: "Understand ERCP for common bile duct stones, obstructive jaundice, bile duct blockage, stenting, risks, preparation and recovery.",
    date: "January 27, 2026",
    readTime: "7 min read",
    accent: "#0ea5e9",
    relatedHref: "/procedures/ercp",
    relatedLabel: "ERCP Specialist in Agra",
    keywords: ["ERCP Specialist in Agra", "CBD Stone Removal", "Jaundice Treatment", "Bile Duct Specialist", "ERCP in Agra", "Bile Duct Stenting"],
    intro: "ERCP is an advanced endoscopic procedure used to diagnose and treat selected bile duct and pancreatic duct problems, especially CBD stones, obstructive jaundice and bile duct blockage.",
    sections: [
      { title: "When ERCP is advised", body: "ERCP is usually planned after blood tests and imaging suggest a treatable duct problem.", items: ["CBD stone", "Obstructive jaundice", "Bile duct stricture", "Cholangitis or duct infection", "Bile duct stenting need"] },
      { title: "Preparation", body: "Patients usually need fasting, medicine review and attendant support. Blood thinners, diabetes medicines and previous reports must be discussed." },
      { title: "Risks and safety", body: "ERCP is valuable but carries risks such as pancreatitis, bleeding, infection or perforation in uncommon cases. The doctor explains risk based on the case." },
      { title: "Recovery", body: "Observation, diet restart, medicines and admission need depend on procedure complexity and patient condition." }
    ],
    faqs: [
      { question: "Can ERCP remove CBD stones?", answer: "Yes, selected common bile duct stones can be removed by ERCP." },
      { question: "Is ERCP the same as surgery?", answer: "No. ERCP is an endoscopic procedure, but some patients may still need surgical opinion for gallbladder stones." },
      { question: "Can ERCP treat jaundice?", answer: "ERCP can help selected obstructive jaundice cases due to stones, strictures or blockage." },
      { question: "Where is ERCP available in Agra?", answer: `ERCP care is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "alcoholic-liver-disease-symptoms-tests-treatment",
    category: "Liver Care",
    title: "Alcoholic Liver Disease: Symptoms, Tests and Treatment",
    description: "Learn how alcohol affects the liver, symptoms, liver tests, fatty liver, cirrhosis risk, FibroScan and when to consult a liver specialist.",
    date: "January 28, 2026",
    readTime: "7 min read",
    accent: "#f59e0b",
    relatedHref: "/procedures/liver-cirrhosis",
    relatedLabel: "Alcoholic Liver Disease Care",
    keywords: ["Alcoholic Liver Disease Treatment", "Liver Specialist in Agra", "Hepatologist in Agra", "Liver Cirrhosis Treatment in Agra", "FibroScan in Agra", "Liver Disease Specialist"],
    intro: "Alcohol can cause fatty liver, hepatitis-like inflammation, fibrosis and cirrhosis. Early detection and stopping alcohol can reduce progression risk in many patients.",
    sections: [
      { title: "Symptoms", body: "Early disease may be silent. Advanced disease can cause serious symptoms.", items: ["Fatigue or poor appetite", "Right upper abdominal heaviness", "Jaundice", "Abdominal swelling", "Vomiting blood or black stool", "Confusion or drowsiness"] },
      { title: "Tests used", body: "Evaluation may include liver function tests, CBC, INR, ultrasound, FibroScan, viral markers and endoscopy for varices when cirrhosis is suspected." },
      { title: "Treatment approach", body: "Alcohol abstinence is central. Nutrition, vitamin correction, medicines, cirrhosis monitoring and complication prevention may be needed." },
      { title: "When urgent care is needed", body: "Jaundice with fever, vomiting blood, black stool, confusion, severe weakness or increasing abdominal swelling need urgent attention." }
    ],
    faqs: [
      { question: "Can alcoholic fatty liver improve?", answer: "Early alcohol-related fatty liver can improve with complete alcohol avoidance and medical guidance." },
      { question: "Can alcohol cause cirrhosis?", answer: "Yes. Long-term alcohol use can lead to fibrosis and cirrhosis in some patients." },
      { question: "Is FibroScan useful?", answer: "FibroScan can help assess liver stiffness and fibrosis risk." },
      { question: "Where can I consult for alcohol-related liver disease?", answer: `Liver care is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "foods-good-for-liver-health-indian-diet-tips",
    category: "Liver Care",
    title: "Foods Good for Liver Health: Indian Diet Tips",
    description: "Indian diet tips for liver health, fatty liver, protein, vegetables, sugar reduction, alcohol avoidance and practical meal planning.",
    date: "January 29, 2026",
    readTime: "6 min read",
    accent: "#84cc16",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Liver Diet and Fatty Liver Care",
    keywords: ["Foods Good for the Liver", "Liver Care", "Fatty Liver Diet", "Best Diet for Fatty Liver", "Liver Specialist in Agra", "Fatty Liver Treatment in Agra"],
    intro: "Liver-friendly eating is not about one special food. It is about regular meals, balanced protein, less sugar, controlled oil, fewer processed foods and alcohol avoidance when liver risk is present.",
    sections: [
      { title: "Foods that support liver health", body: "A balanced Indian diet can support weight and metabolic health.", items: ["Vegetables and salads", "Dal, curd, paneer, eggs, fish or lean protein", "Controlled portions of roti, rice or millets", "Whole fruit instead of juice", "Nuts or seeds in small portions if suitable"] },
      { title: "Foods to reduce", body: "Reducing high-calorie, high-sugar foods is important for fatty liver and diabetes risk.", items: ["Sugary tea and sweets", "Soft drinks and packaged juices", "Fried snacks and bakery foods", "Excess rice or refined flour", "Alcohol"] },
      { title: "Lifestyle matters", body: "Walking, strength activity, weight control, diabetes control and sleep routine work together with diet." },
      { title: "When to seek medical advice", body: "Abnormal SGPT/SGOT, fatty liver grade, diabetes, obesity, alcohol intake or FibroScan abnormality need specialist review." }
    ],
    faqs: [
      { question: "Is fruit good for liver?", answer: "Whole fruit in sensible portions is usually better than juice. Diabetic patients need individualized advice." },
      { question: "Is coffee good for liver?", answer: "Coffee may be beneficial for some liver conditions, but it is not a replacement for medical care." },
      { question: "Can I eat ghee?", answer: "Portion control matters. Excess calories and saturated fat can worsen metabolic risk." },
      { question: "Where can I get liver diet guidance in Agra?", answer: `Fatty liver and liver care planning are available at ${site.name}.` }
    ]
  },
  {
    slug: "colon-polyps-symptoms-removal-cancer-prevention",
    category: "Colon Health",
    title: "Colon Polyps: Symptoms, Removal and Cancer Prevention",
    description: "Learn what colon polyps are, symptoms, colonoscopy removal, biopsy, surveillance and how polyp removal can reduce colon cancer risk.",
    date: "January 30, 2026",
    readTime: "6 min read",
    accent: "#10b981",
    relatedHref: "/procedures/colon-polyps",
    relatedLabel: "Colon Polyps Treatment",
    keywords: ["Colon Polyps Treatment", "Polypectomy", "Colon Cancer Screening", "Colonoscopy in Agra", "Best Colonoscopy Doctor in Agra", "Blood in Stool Treatment"],
    intro: "Colon polyps are growths inside the large intestine. Many cause no symptoms, but some can bleed or slowly develop cancer risk over time. Colonoscopy can detect and remove suitable polyps.",
    sections: [
      { title: "Symptoms", body: "Most polyps are silent, but some patients may have symptoms.", items: ["Blood in stool", "Anemia", "Mucus or bowel habit change", "Abdominal discomfort", "Positive stool blood test"] },
      { title: "Why removal matters", body: "Removing suitable polyps during colonoscopy can help prevent future cancer risk depending on polyp type." },
      { title: "Biopsy and reports", body: "Removed polyps are sent for histopathology. Future colonoscopy timing depends on number, size and biopsy type." },
      { title: "Who should discuss screening", body: "Patients with family history, bleeding, anemia, older age or previous polyps should discuss colonoscopy timing." }
    ],
    faqs: [
      { question: "Are colon polyps cancer?", answer: "Most are not cancer, but some types can become cancer over time." },
      { question: "Can polyps be removed during colonoscopy?", answer: "Suitable polyps can often be removed during colonoscopy." },
      { question: "Do polyps come back?", answer: "New polyps can develop, so surveillance colonoscopy may be advised." },
      { question: "Where can I get colon polyp removal in Agra?", answer: `Colon polyp evaluation and removal planning are available at ${site.name}.` }
    ]
  },
  {
    slug: "persistent-vomiting-gastro-causes-warning-signs",
    category: "Symptom Guide",
    title: "Persistent Vomiting: Gastro Causes and Warning Signs",
    description: "Persistent vomiting may be due to acidity, obstruction, ulcer, pancreatitis, infection, liver or metabolic causes. Learn warning signs.",
    date: "January 31, 2026",
    readTime: "6 min read",
    accent: "#0f766e",
    relatedHref: "/procedures/peptic-ulcer-disease",
    relatedLabel: "Vomiting and Stomach Evaluation",
    keywords: ["Vomiting Specialist", "Digestive Problems Doctor", "Stomach Pain Doctor", "Peptic Ulcer Treatment", "Pancreatitis Treatment", "Gastroenterologist in Agra"],
    intro: "Vomiting once or twice may happen with infection or food upset, but persistent vomiting can cause dehydration and may indicate ulcer disease, obstruction, pancreatitis, liver disease or other conditions.",
    sections: [
      { title: "Common gastro causes", body: "Vomiting pattern and associated symptoms help identify the cause.", items: ["Gastritis or peptic ulcer disease", "Food infection", "Gallstone or pancreatitis-related pain", "Stomach outlet obstruction", "Liver disease or jaundice", "Medicine side effects"] },
      { title: "Warning signs", body: "Persistent vomiting should not be ignored when danger signs are present.", items: ["Blood in vomit", "Severe abdominal pain", "Dehydration or reduced urine", "Jaundice", "Severe headache or confusion", "Weight loss"] },
      { title: "Tests that may be needed", body: "Depending on symptoms, tests may include blood counts, liver and pancreas tests, ultrasound, endoscopy or CT." },
      { title: "Treatment", body: "Treatment depends on cause. Repeated anti-vomiting medicines without diagnosis can delay care." }
    ],
    faqs: [
      { question: "When is vomiting urgent?", answer: "Blood vomiting, severe pain, dehydration, jaundice, confusion or repeated vomiting needs urgent care." },
      { question: "Can acidity cause vomiting?", answer: "Yes, but persistent vomiting or weight loss needs evaluation." },
      { question: "Can pancreatitis cause vomiting?", answer: "Yes. Pancreatitis often causes severe upper abdominal pain with vomiting." },
      { question: "Where can I consult for persistent vomiting in Agra?", answer: `Digestive symptom evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "unexplained-weight-loss-digestive-symptoms-investigation",
    category: "Symptom Guide",
    title: "Unexplained Weight Loss and Digestive Symptoms: When to Investigate",
    description: "Unexplained weight loss with acidity, pain, diarrhea, bleeding or swallowing difficulty may need endoscopy, colonoscopy and specialist evaluation.",
    date: "February 1, 2026",
    readTime: "7 min read",
    accent: "#64748b",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "GI Cancer Screening and Evaluation",
    keywords: ["GI Cancer Screening", "Colonoscopy", "Endoscopy", "Unexplained Weight Loss", "Digestive Disease Specialist in Agra", "Gastroenterologist in Agra"],
    intro: "Weight loss without trying should be taken seriously, especially when it occurs with digestive symptoms. It may be linked to infection, inflammation, malabsorption, liver disease, cancer risk or poor intake due to swallowing or stomach problems.",
    sections: [
      { title: "Symptoms that matter", body: "The combination of weight loss with digestive symptoms guides investigation.", items: ["Difficulty swallowing", "Persistent vomiting", "Blood in stool or black stool", "Chronic diarrhea", "Abdominal pain", "Loss of appetite or anemia"] },
      { title: "Possible causes", body: "Causes range from treatable digestive disorders to serious conditions.", items: ["Ulcers or gastritis", "IBD or chronic infection", "Celiac disease or malabsorption", "Liver or pancreatic disease", "GI cancer risk in selected patients"] },
      { title: "Tests that may be advised", body: "The doctor may advise blood tests, stool tests, ultrasound, endoscopy, colonoscopy, CT or biopsy depending on symptoms." },
      { title: "Why early evaluation helps", body: "Early diagnosis can improve treatment options and prevent complications from anemia, dehydration, malnutrition or advanced disease." }
    ],
    faqs: [
      { question: "How much weight loss is concerning?", answer: "Unintentional weight loss that is persistent or associated with digestive symptoms should be evaluated." },
      { question: "Can acidity cause weight loss?", answer: "Acidity alone usually does not cause major weight loss. Weight loss with swallowing difficulty, vomiting or anemia needs evaluation." },
      { question: "Will I need endoscopy or colonoscopy?", answer: "The doctor decides based on age, symptoms, examination and reports." },
      { question: "Where can I get digestive evaluation in Agra?", answer: `GI evaluation, endoscopy and colonoscopy are available at ${site.name}.` }
    ]
  }
];

export function getSeoBlogPost(slug: string) {
  return seoBlogPosts.find((post) => post.slug === slug) ?? null;
}
