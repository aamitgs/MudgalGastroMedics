import { site } from "@/lib/site-data";
import { additionalSeoBlogPosts } from "@/lib/additional-blog-posts";

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
  coverImage?: string;
  ogImage?: string;
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
    date: "July 9, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Treatment in Agra",
    keywords: ["What is Fatty Liver", "Fatty Liver Symptoms", "Fatty Liver Treatment in Agra", "Fatty Liver Specialist in Agra", "Liver Specialist in Agra", "FibroScan in Agra"],
    coverImage: "/images/blog/what-is-fatty-liver-symptoms-causes-cover.jpg",
    ogImage: "/images/blog/what-is-fatty-liver-symptoms-causes-og.jpg",
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
    date: "July 6, 2026",
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
    date: "July 3, 2026",
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
    date: "June 30, 2026",
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
    date: "June 27, 2026",
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
    date: "June 24, 2026",
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
    date: "June 21, 2026",
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
    date: "June 18, 2026",
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
    date: "June 15, 2026",
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
    date: "June 12, 2026",
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
    date: "June 9, 2026",
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
    date: "June 6, 2026",
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
    date: "June 3, 2026",
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
    date: "May 31, 2026",
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
    date: "May 28, 2026",
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
    date: "May 25, 2026",
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
    date: "May 22, 2026",
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
    date: "May 19, 2026",
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
    date: "May 16, 2026",
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
    date: "May 13, 2026",
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
    date: "May 10, 2026",
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
    date: "May 7, 2026",
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
    date: "May 4, 2026",
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
    date: "May 1, 2026",
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
    date: "April 28, 2026",
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
    date: "April 25, 2026",
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
    title: "ERCP Specialist in Agra: When ERCP Is Needed for CBD Stones and Jaundice",
    description: "Understand when to consult an ERCP specialist in Agra for common bile duct stones, obstructive jaundice, bile duct blockage, stenting, risks, preparation and recovery.",
    date: "April 22, 2026",
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
    date: "April 19, 2026",
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
    date: "April 16, 2026",
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
    date: "April 13, 2026",
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
    date: "April 10, 2026",
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
    date: "April 7, 2026",
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
  },
  {
    slug: "blood-in-stool-vs-black-stool-difference",
    category: "Symptom Guide",
    title: "Blood in Stool vs Black Stool: What Is the Difference?",
    description: "Learn the difference between fresh blood in stool and black stool, common causes, emergency warning signs and when endoscopy or colonoscopy may be needed.",
    date: "April 4, 2026",
    readTime: "7 min read",
    accent: "#dc2626",
    relatedHref: "/procedures/gastrointestinal-bleeding-management",
    relatedLabel: "GI Bleeding Management",
    keywords: ["Blood in Stool", "Black Stool", "GI Bleeding", "Endoscopy Near Me", "Colonoscopy in Agra", "Gastroenterologist in Agra"],
    intro: "Fresh red blood and black stool can both be signs of bleeding, but they often point to different parts of the digestive tract. Color, smell, weakness, vomiting blood and liver history help decide urgency.",
    sections: [
      { title: "What red blood may suggest", body: "Fresh red blood is often from the lower digestive tract, but the exact cause needs evaluation.", items: ["Piles or fissure", "Colitis or infection", "Colon polyps", "Rectal or colon bleeding", "Rarely heavy upper GI bleeding"] },
      { title: "What black stool may suggest", body: "Black, tarry, foul-smelling stool can indicate digested blood from the upper digestive tract.", items: ["Stomach or duodenal ulcer", "Severe gastritis", "Variceal bleeding in liver disease", "Blood thinner-related bleeding", "Iron tablets can also darken stool"] },
      { title: "Warning signs", body: "Bleeding with weakness, dizziness, fast pulse, vomiting blood or known liver disease needs urgent attention." },
      { title: "Tests that may be advised", body: "Depending on symptoms, the doctor may advise CBC, stool testing, endoscopy, colonoscopy, liver tests or admission for monitoring." }
    ],
    faqs: [
      { question: "Is black stool always bleeding?", answer: "No. Iron tablets, bismuth medicines and some foods can darken stool, but tarry black stool with weakness should be evaluated." },
      { question: "Is fresh blood always piles?", answer: "No. Piles are common, but colitis, polyps and other colon problems can also cause bleeding." },
      { question: "Which test is needed?", answer: "Endoscopy or colonoscopy is selected based on stool color, symptoms, age, hemoglobin and examination." },
      { question: "Where can I consult in Agra?", answer: `GI bleeding evaluation is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "jaundice-with-fever-urgent-warning-signs",
    category: "Liver Care",
    title: "Jaundice With Fever: Why It Can Be Urgent",
    description: "Jaundice with fever can indicate bile duct infection or blockage. Learn warning symptoms, tests and when urgent ERCP evaluation may be needed.",
    date: "April 1, 2026",
    readTime: "6 min read",
    accent: "#eab308",
    relatedHref: "/procedures/obstructive-jaundice",
    relatedLabel: "Obstructive Jaundice Treatment",
    keywords: ["Jaundice With Fever", "Jaundice Treatment in Agra", "ERCP Specialist in Agra", "CBD Stone", "Liver Specialist in Agra"],
    intro: "Yellow eyes or dark urine should be evaluated, but jaundice with fever, chills or abdominal pain can be more urgent because it may indicate blocked infected bile flow.",
    sections: [
      { title: "Why fever matters", body: "Fever with jaundice can occur when bile drainage is blocked and infection develops.", items: ["CBD stone", "Bile duct stricture", "Cholangitis", "Pancreaticobiliary disease", "Post-surgery duct problems"] },
      { title: "Urgent warning signs", body: "These symptoms should not wait for routine review.", items: ["High fever or chills", "Severe right upper abdominal pain", "Confusion or low BP", "Persistent vomiting", "Very dark urine and pale stool"] },
      { title: "Tests used for evaluation", body: "Liver function tests, CBC, ultrasound, CT or MRCP may help locate the blockage." },
      { title: "Treatment planning", body: "Some patients need antibiotics, admission, ERCP, stone removal or stenting depending on the cause." }
    ],
    faqs: [
      { question: "Is jaundice with fever an emergency?", answer: "It can be. Fever with jaundice may indicate infection in a blocked bile duct and needs urgent medical advice." },
      { question: "Can CBD stone cause fever and jaundice?", answer: "Yes. A CBD stone can block bile drainage and cause jaundice, pain and infection." },
      { question: "When is ERCP needed?", answer: "ERCP may be needed when imaging suggests a treatable bile duct blockage such as a stone or stricture." },
      { question: "Where is jaundice care available in Agra?", answer: `Jaundice and ERCP evaluation are available at ${site.name}.` }
    ]
  },
  {
    slug: "persistent-acidity-despite-medicine-causes-next-steps",
    category: "Stomach Care",
    title: "Persistent Acidity Despite Medicine: Causes and Next Steps",
    description: "Persistent acidity despite regular medicine may need review for GERD, ulcers, H. pylori, medicines, lifestyle triggers or endoscopy warning signs.",
    date: "March 29, 2026",
    readTime: "6 min read",
    accent: "#22d3ee",
    relatedHref: "/procedures/acidity-gerd",
    relatedLabel: "Acidity and GERD Treatment",
    keywords: ["Persistent Acidity", "GERD Treatment", "Acidity Doctor in Agra", "Upper GI Endoscopy", "Stomach Specialist in Agra"],
    intro: "Many patients take acidity medicines repeatedly. If symptoms keep returning or warning signs appear, the cause should be reviewed rather than only changing tablets.",
    sections: [
      { title: "Why acidity may continue", body: "Persistent symptoms can happen due to lifestyle triggers or an untreated underlying problem.", items: ["Late meals or lying down after food", "GERD or hiatal hernia", "Gastritis or peptic ulcer", "H. pylori infection", "Painkiller or tobacco use"] },
      { title: "Warning signs", body: "These symptoms need medical evaluation and may require endoscopy.", items: ["Difficulty swallowing", "Vomiting or weight loss", "Black stool or anemia", "Persistent pain despite treatment", "Symptoms starting at older age"] },
      { title: "What the doctor checks", body: "Medicine timing, dose, triggers, old reports and risk factors are reviewed before changing treatment." },
      { title: "Next steps", body: "Treatment may include medicine correction, lifestyle changes, H. pylori testing or upper GI endoscopy if indicated." }
    ],
    faqs: [
      { question: "Can I take acidity tablets daily?", answer: "Some patients need longer treatment, but persistent symptoms should be reviewed by a doctor." },
      { question: "When is endoscopy advised?", answer: "Endoscopy may be advised for warning signs, persistent symptoms, swallowing difficulty, bleeding or weight loss." },
      { question: "Can H. pylori cause acidity?", answer: "H. pylori can cause gastritis and ulcers in some patients and may need specific treatment." },
      { question: "Where can I consult for acidity in Agra?", answer: `GERD and acidity evaluation are available at ${site.name}.` }
    ]
  },
  {
    slug: "loss-of-appetite-weight-loss-digestive-causes",
    category: "Symptom Guide",
    title: "Loss of Appetite and Weight Loss: Digestive Causes to Check",
    description: "Loss of appetite and unexplained weight loss may be linked to ulcers, liver disease, pancreatic disease, IBD, infection or cancer risk in selected patients.",
    date: "March 26, 2026",
    readTime: "7 min read",
    accent: "#64748b",
    relatedHref: "/services/diagnostic-services",
    relatedLabel: "Diagnostic Services",
    keywords: ["Loss of Appetite", "Unexplained Weight Loss", "Digestive Disease Specialist", "GI Cancer Screening", "Endoscopy in Agra"],
    intro: "Loss of appetite can happen with simple illness, but persistent appetite loss with weight loss, anemia, vomiting or bowel changes needs digestive evaluation.",
    sections: [
      { title: "Possible digestive causes", body: "The cause depends on associated symptoms and reports.", items: ["Gastritis or peptic ulcer", "Liver disease or jaundice", "Pancreatic disease", "IBD or chronic infection", "GI cancer risk in selected patients"] },
      { title: "Symptoms to mention", body: "Small details help the doctor decide the right tests.", items: ["Difficulty swallowing", "Vomiting or early fullness", "Blood in stool or black stool", "Chronic diarrhea", "Abdominal pain or jaundice"] },
      { title: "Tests that may be needed", body: "The doctor may advise blood tests, liver tests, stool tests, ultrasound, endoscopy, colonoscopy or CT depending on symptoms." },
      { title: "Why early evaluation helps", body: "Early diagnosis can prevent anemia, dehydration, malnutrition and delayed treatment of serious disease." }
    ],
    faqs: [
      { question: "When is weight loss concerning?", answer: "Unintentional weight loss that persists or occurs with digestive symptoms should be checked." },
      { question: "Can acidity cause appetite loss?", answer: "It can reduce appetite, but weight loss or vomiting needs evaluation." },
      { question: "Will I need endoscopy?", answer: "The doctor decides based on symptoms, age, warning signs and reports." },
      { question: "Where can I get evaluated in Agra?", answer: `Digestive diagnostic care is available at ${site.name}.` }
    ]
  },
  {
    slug: "chronic-gas-bloating-indian-diet-triggers-warning-signs",
    category: "Symptom Guide",
    title: "Chronic Gas and Bloating: Indian Diet Triggers and Warning Signs",
    description: "Understand chronic gas and bloating, Indian diet triggers, constipation, IBS, acidity, warning signs and when to consult a gastroenterologist.",
    date: "March 23, 2026",
    readTime: "6 min read",
    accent: "#10b981",
    relatedHref: "/procedures/ibs",
    relatedLabel: "IBS and Bloating Care",
    keywords: ["Bloating Treatment", "Gas Problem", "IBS Treatment in Agra", "Indigestion Treatment", "Digestive Problems Doctor"],
    intro: "Gas and bloating are common, but chronic or worsening symptoms should be interpreted with stool pattern, diet, stress, medicines and warning signs.",
    sections: [
      { title: "Common Indian diet triggers", body: "Triggers vary, but some habits commonly worsen bloating.", items: ["Fast eating", "Late dinner", "Excess tea, fried snacks or sweets", "Large portions of chana, rajma or cabbage", "Carbonated drinks"] },
      { title: "Medical causes", body: "Bloating can be linked with treatable digestive conditions.", items: ["Constipation", "IBS", "Acidity or gastritis", "Food intolerance", "Colitis or malabsorption in selected patients"] },
      { title: "Warning signs", body: "Bloating with weight loss, vomiting, anemia, blood in stool or persistent pain needs review." },
      { title: "Treatment approach", body: "Treatment may include diet correction, constipation care, IBS management, reflux treatment or targeted testing." }
    ],
    faqs: [
      { question: "Is gas always due to food?", answer: "No. Food habits are common triggers, but constipation, IBS, acidity and other conditions can contribute." },
      { question: "Can stress worsen bloating?", answer: "Yes. Stress, irregular meals and poor sleep can worsen IBS-type symptoms." },
      { question: "When should I consult?", answer: "Consult if bloating is persistent, painful, associated with weight loss, vomiting, bleeding or anemia." },
      { question: "Where can I consult in Agra?", answer: `IBS and bloating care are available at ${site.name}.` }
    ]
  },
  {
    slug: "colonoscopy-report-explained-polyps-colitis-biopsy",
    category: "Procedure Guide",
    title: "Colonoscopy Report Explained: Polyps, Colitis and Biopsy",
    description: "Understand common colonoscopy report terms including polyps, colitis, ulcers, biopsy, bowel preparation quality and follow-up advice.",
    date: "March 20, 2026",
    readTime: "7 min read",
    accent: "#0f766e",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colonoscopy in Agra",
    keywords: ["Colonoscopy Report", "Colon Polyps", "Colitis", "Biopsy Report", "Colonoscopy in Agra"],
    intro: "A colonoscopy report can mention terms such as polyps, colitis, ulcer, biopsy and bowel preparation. Understanding the report helps patients follow the next plan correctly.",
    sections: [
      { title: "Bowel preparation quality", body: "The report may comment on whether the colon was clean enough to see clearly.", items: ["Good preparation improves accuracy", "Poor preparation may require repeat test", "Diet and laxative instructions matter"] },
      { title: "Polyps and removal", body: "Polyps are growths that may be removed and sent for biopsy when suitable.", items: ["Number and size matter", "Histopathology guides risk", "Repeat colonoscopy timing depends on report"] },
      { title: "Colitis and ulcers", body: "Inflammation may suggest infection, IBD, ischemia or other causes. Biopsy can help clarify." },
      { title: "Follow-up after report", body: "Bring the colonoscopy images, report and biopsy result for final treatment and surveillance planning." }
    ],
    faqs: [
      { question: "Is biopsy always cancer?", answer: "No. Biopsy is often taken to diagnose inflammation, infection, colitis or polyp type." },
      { question: "What does poor preparation mean?", answer: "It means stool limited visibility. A repeat test may sometimes be needed." },
      { question: "Do all polyps need removal?", answer: "The doctor decides based on size, type, number and safety." },
      { question: "Where can I discuss a colonoscopy report?", answer: `Colonoscopy report review is available at ${site.name}.` }
    ]
  },
  {
    slug: "fibroscan-score-explained-cap-kpa-fatty-liver-risk",
    category: "Procedure Guide",
    title: "FibroScan Score Explained: CAP, kPa and Fatty Liver Risk",
    description: "Learn what FibroScan CAP and kPa scores mean, how they relate to fatty liver and fibrosis risk, and when specialist review is needed.",
    date: "March 17, 2026",
    readTime: "7 min read",
    accent: "#84cc16",
    relatedHref: "/procedures/fibroscan",
    relatedLabel: "FibroScan in Agra",
    keywords: ["FibroScan Score", "CAP Score", "kPa FibroScan", "Fatty Liver Test", "Liver Fibrosis Scan"],
    intro: "FibroScan is a non-invasive liver test. Patients often see CAP and kPa values on the report and want to know what they mean for fatty liver and fibrosis risk.",
    sections: [
      { title: "What CAP suggests", body: "CAP gives an estimate of fat in the liver. It must be interpreted with weight, diabetes, ultrasound and liver tests." },
      { title: "What kPa suggests", body: "kPa estimates liver stiffness. Higher stiffness may suggest fibrosis or cirrhosis risk, but inflammation and other factors can affect results." },
      { title: "Who needs FibroScan", body: "FibroScan is commonly used in patients with fatty liver or chronic liver risk.", items: ["Fatty liver on ultrasound", "High SGPT/SGOT", "Diabetes or obesity", "Alcohol-related liver risk", "Hepatitis B or C"] },
      { title: "What to do after the report", body: "The report should be reviewed with symptoms, blood tests and imaging before deciding treatment or follow-up interval." }
    ],
    faqs: [
      { question: "Is FibroScan painful?", answer: "No. It is usually quick and painless." },
      { question: "Does high CAP mean cirrhosis?", answer: "No. CAP estimates fat, while kPa relates more to stiffness. Both need clinical interpretation." },
      { question: "Can FibroScan replace all liver tests?", answer: "No. It supports assessment but does not replace blood tests and clinical evaluation." },
      { question: "Where is FibroScan available in Agra?", answer: `FibroScan evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "ercp-vs-surgery-for-cbd-stones",
    category: "Procedure Guide",
    title: "ERCP vs Surgery for CBD Stones: What Patients Should Know",
    description: "Understand when ERCP is used for CBD stones, how it differs from gallbladder surgery, preparation, risks and recovery.",
    date: "March 14, 2026",
    readTime: "7 min read",
    accent: "#f59e0b",
    relatedHref: "/procedures/ercp",
    relatedLabel: "ERCP for CBD Stones",
    keywords: ["ERCP vs Surgery", "CBD Stone Removal", "ERCP Specialist in Agra", "Jaundice Treatment", "Bile Duct Stone"],
    intro: "CBD stones are stones in the common bile duct. ERCP and gallbladder surgery treat different parts of the problem, so patients often need both specialist advice and surgical planning.",
    sections: [
      { title: "What ERCP treats", body: "ERCP can remove stones from the bile duct and improve drainage in suitable patients.", items: ["CBD stone", "Obstructive jaundice", "Cholangitis", "Bile duct stenting", "Duct narrowing in selected cases"] },
      { title: "What surgery treats", body: "Gallbladder surgery removes the gallbladder when gallstones are the source. It does not always remove CBD stones." },
      { title: "Preparation and risks", body: "ERCP usually needs fasting, blood tests, imaging review, medicine review and attendant support. Risks include pancreatitis, bleeding, infection or perforation in uncommon cases." },
      { title: "Recovery", body: "Recovery depends on infection, jaundice, stone size, stenting and whether surgery is planned later." }
    ],
    faqs: [
      { question: "Can ERCP avoid surgery?", answer: "ERCP can treat bile duct stones, but gallbladder surgery may still be advised if gallstones remain." },
      { question: "Is ERCP a surgery?", answer: "ERCP is an endoscopic procedure, not open surgery." },
      { question: "Is ERCP urgent for jaundice with fever?", answer: "It can be urgent if infection and blockage are suspected." },
      { question: "Where can I get ERCP in Agra?", answer: `ERCP evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "upper-gi-endoscopy-report-meaning",
    category: "Procedure Guide",
    title: "Upper GI Endoscopy: What the Report Means",
    description: "Understand common upper GI endoscopy report findings such as gastritis, esophagitis, ulcer, biopsy, H. pylori and hiatal hernia.",
    date: "March 11, 2026",
    readTime: "6 min read",
    accent: "#0891b2",
    relatedHref: "/procedures/endoscopy",
    relatedLabel: "Upper GI Endoscopy",
    keywords: ["Upper GI Endoscopy", "Endoscopy Report", "Gastritis", "H Pylori", "Endoscopy in Agra"],
    intro: "Endoscopy reports may mention gastritis, ulcer, esophagitis, bile reflux, hiatal hernia or biopsy. The report should be interpreted with symptoms and biopsy results.",
    sections: [
      { title: "Food pipe findings", body: "The report may mention reflux injury, esophagitis, stricture, varices or suspicious lesions depending on what is seen." },
      { title: "Stomach findings", body: "Common terms include gastritis, erosions, ulcer, bile reflux, polyp or growth. Biopsy may be advised in selected findings." },
      { title: "Biopsy and H. pylori", body: "Biopsy can help diagnose H. pylori, inflammation, celiac disease or suspicious tissue depending on site." },
      { title: "Next steps", body: "Treatment may include medicines, H. pylori therapy, repeat endoscopy, biopsy follow-up or urgent care for bleeding." }
    ],
    faqs: [
      { question: "Is gastritis serious?", answer: "Many cases are treatable, but bleeding, ulcer, weight loss or persistent symptoms need follow-up." },
      { question: "Why was biopsy taken?", answer: "Biopsy helps confirm infection, inflammation or tissue diagnosis." },
      { question: "Can endoscopy detect cancer?", answer: "Endoscopy can identify suspicious areas, but biopsy confirms diagnosis." },
      { question: "Where can I discuss my report?", answer: `Endoscopy report review is available at ${site.name}.` }
    ]
  },
  {
    slug: "colonoscopy-preparation-mistakes-indian-patients",
    category: "Procedure Guide",
    title: "Colonoscopy Preparation Mistakes Indian Patients Should Avoid",
    description: "Avoid common colonoscopy preparation mistakes with diet, bowel prep timing, medicines, diabetes tablets, blood thinners and hydration.",
    date: "March 8, 2026",
    readTime: "7 min read",
    accent: "#14b8a6",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colonoscopy Preparation",
    keywords: ["Colonoscopy Preparation", "Bowel Prep", "Colonoscopy in Agra", "Colon Cancer Screening", "Blood in Stool"],
    intro: "Good bowel preparation is essential for a useful colonoscopy. Poor preparation can hide polyps, inflammation or bleeding sources and may require repeat testing.",
    sections: [
      { title: "Diet mistakes", body: "Patients may accidentally eat foods that leave residue in the colon.", items: ["Seeds and high-fiber foods close to procedure", "Heavy oily meals", "Ignoring clear liquid advice", "Eating after fasting time"] },
      { title: "Bowel prep mistakes", body: "Timing and completion of laxative solution matter.", items: ["Not finishing prep", "Taking prep too early or too late", "Not drinking enough clear fluids", "Stopping because stool looks partly clear"] },
      { title: "Medicine mistakes", body: "Diabetes medicines, insulin, BP medicines and blood thinners need specific instructions from the doctor." },
      { title: "Attendant and recovery", body: "If sedation is planned, come with an adult attendant and avoid driving that day." }
    ],
    faqs: [
      { question: "Why is bowel prep important?", answer: "A clean colon helps the doctor see polyps, ulcers, bleeding and inflammation clearly." },
      { question: "Can I take diabetes medicines?", answer: "Ask the doctor for specific instructions because fasting and bowel prep can affect sugar levels." },
      { question: "What if prep is poor?", answer: "The report may be limited and repeat colonoscopy may be needed." },
      { question: "Where can I get colonoscopy in Agra?", answer: `Colonoscopy is available at ${site.name}.` }
    ]
  },
  {
    slug: "fatty-liver-grade-1-2-3-meaning",
    category: "Liver Care",
    title: "Fatty Liver Grade 1, 2 and 3: What It Means",
    description: "Understand fatty liver grade 1, 2 and 3 on ultrasound, fibrosis risk, FibroScan need, lifestyle changes and when to consult a liver specialist.",
    date: "March 5, 2026",
    readTime: "7 min read",
    accent: "#84cc16",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Treatment",
    keywords: ["Fatty Liver Grade 1", "Fatty Liver Grade 2", "Fatty Liver Grade 3", "Fatty Liver Treatment", "Liver Specialist in Agra"],
    intro: "Ultrasound reports often mention fatty liver grade 1, 2 or 3. Grade describes how fatty the liver appears, but it does not always show whether scarring has started.",
    sections: [
      { title: "What grades mean", body: "Higher grade usually means more visible fat on ultrasound, but symptoms and risk vary.", items: ["Grade 1: mild fatty change", "Grade 2: moderate fatty change", "Grade 3: severe fatty change", "Fibrosis cannot be judged by grade alone"] },
      { title: "Why FibroScan may be needed", body: "FibroScan helps estimate stiffness and fibrosis risk, especially in diabetes, obesity, high SGPT or long-standing fatty liver." },
      { title: "Treatment approach", body: "Weight control, diet, exercise, diabetes control, cholesterol care and alcohol avoidance are central." },
      { title: "When to consult", body: "Consult if SGPT/SGOT are high, diabetes is present, FibroScan is abnormal or there are signs of advanced liver disease." }
    ],
    faqs: [
      { question: "Is grade 1 fatty liver dangerous?", answer: "It can be early and reversible, but metabolic risk should still be managed." },
      { question: "Does grade 3 mean cirrhosis?", answer: "Not necessarily. Fibrosis and cirrhosis need further assessment." },
      { question: "Can fatty liver improve?", answer: "Many cases improve with weight loss, diet, exercise and risk control." },
      { question: "Where can I consult for fatty liver in Agra?", answer: `Fatty liver care is available at ${site.name}.` }
    ]
  },
  {
    slug: "high-sgpt-sgot-common-causes-when-to-consult",
    category: "Liver Care",
    title: "High SGPT/SGOT: Common Causes and When to Consult",
    description: "High SGPT or SGOT can be due to fatty liver, alcohol, viral hepatitis, medicines or liver injury. Learn when specialist review is needed.",
    date: "March 2, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/services/hepatology-liver-care",
    relatedLabel: "Hepatology and Liver Care",
    keywords: ["High SGPT", "High SGOT", "Liver Function Test", "Liver Specialist in Agra", "Fatty Liver Treatment"],
    intro: "SGPT and SGOT are liver enzymes commonly checked in liver function tests. Mild elevation is common, but repeated or high values need evaluation for the cause.",
    sections: [
      { title: "Common causes", body: "Many conditions can raise liver enzymes.", items: ["Fatty liver", "Alcohol intake", "Viral hepatitis", "Medicines or supplements", "Bile duct blockage or infection"] },
      { title: "When to consult", body: "Consult a liver specialist if values remain high, rise quickly or occur with symptoms.", items: ["Jaundice", "Fever or abdominal pain", "Fatty liver with diabetes", "Low platelets or abnormal ultrasound", "Alcohol-related liver risk"] },
      { title: "Tests that may be advised", body: "Evaluation may include repeat LFT, CBC, INR, viral markers, ultrasound, FibroScan or MRCP depending on findings." },
      { title: "Treatment depends on cause", body: "There is no single SGPT tablet. Treatment targets fatty liver, alcohol, hepatitis, medicines, bile duct disease or other cause." }
    ],
    faqs: [
      { question: "Is high SGPT always serious?", answer: "Not always, but persistent or high elevation should be evaluated." },
      { question: "Can fatty liver raise SGPT?", answer: "Yes. Fatty liver is a common cause of raised SGPT/SGOT." },
      { question: "Should I stop all medicines?", answer: "Do not stop prescribed medicines without medical advice. Tell the doctor all medicines and supplements." },
      { question: "Where can I consult for high SGPT in Agra?", answer: `Liver evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "liver-cirrhosis-diet-salt-protein-indian-food",
    category: "Liver Care",
    title: "Liver Cirrhosis Diet: Salt, Protein and Indian Food Guidance",
    description: "A practical Indian diet guide for liver cirrhosis covering salt restriction, protein, dal, roti, rice, fluid, ascites and when to call urgently.",
    date: "February 27, 2026",
    readTime: "7 min read",
    accent: "#0f766e",
    relatedHref: "/procedures/liver-cirrhosis",
    relatedLabel: "Liver Cirrhosis Care",
    keywords: ["Liver Cirrhosis Diet", "Cirrhosis Treatment", "Liver Specialist in Agra", "Ascites Diet", "Protein in Cirrhosis"],
    intro: "Diet in cirrhosis should be personalized. Many patients need salt restriction, adequate protein, alcohol avoidance and monitoring for ascites, confusion and bleeding risk.",
    sections: [
      { title: "Salt and swelling", body: "Salt restriction is often important when ascites or leg swelling is present.", items: ["Avoid extra salt", "Reduce packaged salty snacks", "Avoid pickle and papad if advised", "Follow doctor's fluid advice"] },
      { title: "Protein guidance", body: "Many cirrhosis patients need adequate protein, but the plan depends on condition and encephalopathy risk.", items: ["Dal, curd, paneer, eggs or lean protein as advised", "Small frequent meals", "Avoid long fasting", "Late evening snack may be advised"] },
      { title: "Foods and habits to avoid", body: "Alcohol must be avoided. Unsafe painkillers, herbal products and high-salt foods can worsen risk." },
      { title: "Urgent symptoms", body: "Vomiting blood, black stools, confusion, fever, increasing swelling or reduced urine need urgent care." }
    ],
    faqs: [
      { question: "Should cirrhosis patients stop protein?", answer: "Usually no. Protein needs should be personalized; stopping protein can worsen weakness." },
      { question: "Is salt restriction needed for all?", answer: "It is especially important with ascites or swelling. Follow doctor advice." },
      { question: "Can alcohol be taken occasionally?", answer: "Alcohol avoidance is strongly advised in cirrhosis." },
      { question: "Where can I consult for cirrhosis diet in Agra?", answer: `Cirrhosis care is available at ${site.name}.` }
    ]
  },
  {
    slug: "peptic-ulcer-painkiller-use-h-pylori",
    category: "Stomach Care",
    title: "Peptic Ulcer Disease: Painkiller Use and H. pylori",
    description: "Understand peptic ulcer disease, painkiller-related ulcers, H. pylori infection, black stool, endoscopy and treatment planning.",
    date: "February 24, 2026",
    readTime: "6 min read",
    accent: "#f97316",
    relatedHref: "/procedures/peptic-ulcer-disease",
    relatedLabel: "Peptic Ulcer Treatment",
    keywords: ["Peptic Ulcer Disease", "H Pylori Treatment", "Painkiller Ulcer", "Black Stool", "Endoscopy in Agra"],
    intro: "Peptic ulcers can occur in the stomach or duodenum. Common contributors include H. pylori infection and painkiller use, especially when taken frequently or without medical supervision.",
    sections: [
      { title: "Common symptoms", body: "Ulcer symptoms vary from burning pain to bleeding.", items: ["Upper abdominal pain", "Acidity or nausea", "Vomiting", "Black stool", "Anemia or weakness"] },
      { title: "Painkiller risk", body: "Medicines such as NSAIDs can injure the stomach lining and increase bleeding risk, especially with blood thinners or alcohol." },
      { title: "H. pylori role", body: "H. pylori is a bacterial infection that can cause gastritis and ulcers. It needs a complete prescribed treatment course when confirmed." },
      { title: "Diagnosis and treatment", body: "Endoscopy may be advised for bleeding, persistent pain, anemia, weight loss or older age onset. Treatment depends on cause." }
    ],
    faqs: [
      { question: "Can ulcers bleed?", answer: "Yes. Black stool, vomiting blood or severe weakness can indicate bleeding." },
      { question: "Should I stop painkillers?", answer: "Discuss with a doctor. Do not stop critical medicines without advice, but avoid self-medication." },
      { question: "Is H. pylori curable?", answer: "It is usually treated with a combination of medicines taken as prescribed." },
      { question: "Where can I get ulcer treatment in Agra?", answer: `Peptic ulcer evaluation is available at ${site.name}.` }
    ]
  },
  {
    slug: "gerd-vs-heart-attack-chest-burning-urgent-care",
    category: "Stomach Care",
    title: "GERD vs Heart Attack: When Chest Burning Needs Urgent Care",
    description: "Chest burning may be due to GERD, acidity or a heart problem. Learn warning signs, when to seek emergency care and when gastro evaluation is needed.",
    date: "February 21, 2026",
    readTime: "7 min read",
    accent: "#ef4444",
    relatedHref: "/procedures/acidity-gerd",
    relatedLabel: "GERD and Acidity Care",
    keywords: ["GERD vs Heart Attack", "Chest Burning", "Acidity Treatment", "Heartburn Specialist", "Gastroenterologist in Agra", "Emergency Warning Signs"],
    intro: "Chest burning is often blamed on acidity, but not every chest symptom is GERD. Some heart-related symptoms can feel like burning or pressure, so warning signs should be taken seriously.",
    sections: [
      {
        title: "Symptoms that may suggest GERD",
        body: "GERD symptoms often relate to meals, posture and sour reflux, though symptoms can vary.",
        items: ["Burning after meals", "Sour belching or regurgitation", "Symptoms worse on lying down", "Throat irritation or chronic cough", "Relief with doctor-advised acidity treatment"]
      },
      {
        title: "Symptoms that need urgent heart evaluation",
        body: "Do not assume acidity if chest symptoms are severe, new or associated with warning signs.",
        items: ["Chest pressure or heaviness", "Pain spreading to arm, jaw, back or shoulder", "Sweating, breathlessness or fainting", "Symptoms during exertion", "Diabetes, BP, smoking or heart disease risk"]
      },
      {
        title: "When gastro evaluation is useful",
        body: "After urgent heart causes are excluded when needed, a gastroenterologist can evaluate reflux, gastritis, ulcers, swallowing issues or persistent acidity symptoms."
      },
      {
        title: "Tests that may be advised",
        body: "Depending on symptoms, the doctor may advise ECG or emergency cardiac care first, and later upper GI endoscopy, H. pylori testing or reflux treatment review when appropriate."
      }
    ],
    faqs: [
      { question: "Can acidity feel like chest pain?", answer: "Yes. GERD can cause burning or discomfort in the chest, but heart-related causes must be considered when warning signs are present." },
      { question: "When should I go to emergency care?", answer: "Go urgently for chest pressure, breathlessness, sweating, fainting, pain spreading to arm or jaw, or symptoms during exertion." },
      { question: "Can endoscopy diagnose heart attack?", answer: "No. Endoscopy evaluates the food pipe and stomach. Heart symptoms need cardiac evaluation." },
      { question: "Where can I consult for persistent reflux in Agra?", answer: `GERD and acidity evaluation are available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  },
  {
    slug: "ibs-vs-ibd-functional-inflammatory-difference",
    category: "Bowel Health",
    title: "IBS vs IBD: Difference Between Functional and Inflammatory Disease",
    description: "Understand the difference between IBS and IBD, symptoms, warning signs, colonoscopy, biopsy and when specialist evaluation is needed.",
    date: "February 18, 2026",
    readTime: "7 min read",
    accent: "#7c3aed",
    relatedHref: "/procedures/ibd-colitis",
    relatedLabel: "IBD and Colitis Care",
    keywords: ["IBS vs IBD", "IBS Treatment", "IBD Specialist", "Ulcerative Colitis", "Crohn's Disease", "Colonoscopy in Agra"],
    intro: "IBS and IBD sound similar but are different. IBS is a functional bowel disorder, while IBD involves inflammation such as ulcerative colitis or Crohn's disease.",
    sections: [
      { title: "IBS pattern", body: "IBS commonly causes pain, bloating and bowel habit changes without visible inflammation on routine tests.", items: ["Cramping relieved by stool", "Constipation or diarrhea pattern", "Bloating and gas", "Stress or food triggers"] },
      { title: "IBD pattern", body: "IBD causes inflammation and may need long-term medical treatment.", items: ["Blood or mucus in stool", "Chronic diarrhea", "Weight loss", "Fever or anemia", "Colonoscopy biopsy findings"] },
      { title: "Warning signs", body: "Blood, anemia, fever, night symptoms, weight loss or family history should not be labeled as simple IBS without evaluation." },
      { title: "Tests and treatment", body: "IBD may need blood tests, stool tests, colonoscopy, biopsy and long-term monitoring. IBS care focuses on triggers and symptom control." }
    ],
    faqs: [
      { question: "Can IBS turn into IBD?", answer: "IBS does not turn into IBD, but symptoms can overlap and need correct diagnosis." },
      { question: "Does blood in stool happen in IBS?", answer: "Blood in stool is not typical IBS and should be evaluated." },
      { question: "Is colonoscopy needed?", answer: "It may be advised when warning signs or suspected colitis are present." },
      { question: "Where can I consult for IBS or IBD in Agra?", answer: `IBS and IBD evaluation are available at ${site.name}.` }
    ]
  },
  {
    slug: "best-gastroenterologist-in-agra-when-to-visit",
    category: "Local SEO",
    title: "Best Gastroenterologist in Agra: When to Visit a Specialist",
    description: "Learn when to visit a gastroenterologist in Agra for acidity, abdominal pain, jaundice, blood in stool, liver disease, endoscopy or colonoscopy.",
    date: "February 15, 2026",
    readTime: "6 min read",
    accent: "#0891b2",
    relatedHref: "/dr-deepak-kumar-sharma-gastroenterologist-agra",
    relatedLabel: "Gastroenterologist in Agra",
    keywords: ["Best Gastroenterologist in Agra", "Gastro Doctor Near Me", "Digestive Disease Specialist", "Stomach Specialist in Agra", "Liver Specialist in Agra"],
    intro: "A gastroenterologist evaluates digestive, liver, pancreatic, bile duct and bowel problems. Timely specialist review helps avoid repeated temporary treatment without diagnosis.",
    sections: [
      { title: "Symptoms that need consultation", body: "Persistent or recurrent digestive symptoms should be assessed.", items: ["Acidity or reflux", "Abdominal pain or bloating", "Constipation or diarrhea", "Blood in stool or black stool", "Difficulty swallowing"] },
      { title: "Liver symptoms", body: "A gastroenterologist also manages liver-related problems.", items: ["Fatty liver", "High SGPT/SGOT", "Jaundice", "Ascites", "Cirrhosis and varices"] },
      { title: "Procedures commonly advised", body: "Endoscopy, colonoscopy, FibroScan, ERCP or biopsy may be recommended only when clinically useful." },
      { title: "What to bring", body: "Bring prescriptions, blood reports, ultrasound, CT/MRCP, endoscopy or colonoscopy reports." }
    ],
    faqs: [
      { question: "When should I see a gastroenterologist?", answer: "Consult for persistent acidity, pain, bowel changes, bleeding, jaundice, weight loss or abnormal liver reports." },
      { question: "Does a gastroenterologist treat liver disease?", answer: "Yes. Gastroenterologists with hepatology expertise treat fatty liver, hepatitis, cirrhosis and jaundice." },
      { question: "Where can I consult in Agra?", answer: `${site.name} provides gastroenterology and liver care in Shaheed Nagar, Agra.` },
      { question: "Can I book online?", answer: "You can call, WhatsApp or use the appointment form on the website." }
    ]
  },
  {
    slug: "endoscopy-in-agra-cost-factors-preparation-safety",
    category: "Local SEO",
    title: "Endoscopy in Agra: Cost Factors, Preparation and Safety",
    description: "Planning endoscopy in Agra? Learn why it is done, preparation, fasting, biopsy, sedation, safety and cost factors.",
    date: "February 12, 2026",
    readTime: "7 min read",
    accent: "#06b6d4",
    relatedHref: "/procedures/endoscopy",
    relatedLabel: "Endoscopy in Agra",
    keywords: ["Endoscopy in Agra", "Upper GI Endoscopy", "Endoscopy Cost in Agra", "Gastroscopy", "Stomach Endoscopy"],
    intro: "Upper GI endoscopy examines the food pipe, stomach and duodenum. It is commonly advised for persistent acidity, pain, vomiting, black stool, anemia or swallowing difficulty.",
    sections: [
      { title: "Why endoscopy is done", body: "Endoscopy helps diagnose conditions not visible from symptoms alone.", items: ["GERD complications", "Gastritis or ulcer", "Bleeding source", "Swallowing difficulty", "Biopsy for selected findings"] },
      { title: "Preparation", body: "Fasting is usually required. Tell the doctor about diabetes, BP, pregnancy, allergies and blood thinners." },
      { title: "Safety", body: "Endoscopy is commonly performed safely, but risks such as bleeding, reaction to medicines or perforation are uncommon and explained before the procedure." },
      { title: "Cost factors", body: "Cost depends on biopsy, sedation, emergency need, admission, consumables and hospital policy." }
    ],
    faqs: [
      { question: "Is endoscopy painful?", answer: "Most patients tolerate it well. Sedation or throat spray may be used depending on case." },
      { question: "Can biopsy be taken?", answer: "Yes, if needed for diagnosis. Biopsy is not always cancer-related." },
      { question: "How long is fasting?", answer: "Usually 6-8 hours, but final instructions come from the hospital team." },
      { question: "Where is endoscopy available in Agra?", answer: `Upper GI endoscopy is available at ${site.name}.` }
    ]
  },
  {
    slug: "colonoscopy-in-agra-when-needed-how-to-prepare",
    category: "Local SEO",
    title: "Colonoscopy in Agra: When It Is Needed and How to Prepare",
    description: "Learn when colonoscopy is needed in Agra for blood in stool, diarrhea, constipation, polyps, colitis and colon cancer screening.",
    date: "February 9, 2026",
    readTime: "7 min read",
    accent: "#10b981",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colonoscopy in Agra",
    keywords: ["Colonoscopy in Agra", "Colonoscopy Preparation", "Colon Cancer Screening", "Blood in Stool", "Colitis Specialist"],
    intro: "Colonoscopy examines the large intestine and rectum. It is useful for bleeding, bowel habit changes, chronic diarrhea, suspected colitis, polyps and screening.",
    sections: [
      { title: "When it is needed", body: "The doctor may advise colonoscopy based on symptoms and risk.", items: ["Blood in stool", "Chronic diarrhea or constipation", "Unexplained anemia", "Suspected IBD or colitis", "Colon polyp or cancer screening"] },
      { title: "Preparation", body: "Colonoscopy needs bowel preparation, diet instructions and fasting. Poor prep can reduce accuracy." },
      { title: "Medicine precautions", body: "Discuss diabetes medicines, insulin, BP medicines and blood thinners before the procedure." },
      { title: "After colonoscopy", body: "Recovery advice depends on sedation, biopsy, polyp removal and findings." }
    ],
    faqs: [
      { question: "Is colonoscopy painful?", answer: "Sedation may be used to improve comfort depending on patient and procedure plan." },
      { question: "Can polyps be removed?", answer: "Suitable polyps can often be removed during colonoscopy." },
      { question: "Do I need an attendant?", answer: "If sedation is planned, an adult attendant is usually required." },
      { question: "Where can I get colonoscopy in Agra?", answer: `Colonoscopy is available at ${site.name}.` }
    ]
  },
  {
    slug: "liver-specialist-in-agra-symptoms-not-ignore",
    category: "Local SEO",
    title: "Liver Specialist in Agra: Symptoms You Should Not Ignore",
    description: "Learn which liver symptoms need specialist review in Agra, including jaundice, high SGPT, fatty liver, ascites, bleeding and confusion.",
    date: "February 6, 2026",
    readTime: "6 min read",
    accent: "#b9852f",
    relatedHref: "/services/hepatology-liver-care",
    relatedLabel: "Liver Specialist in Agra",
    keywords: ["Liver Specialist in Agra", "Hepatologist in Agra", "Fatty Liver Treatment", "Jaundice Treatment", "Cirrhosis Doctor"],
    intro: "Liver disease can be silent in early stages. Symptoms such as jaundice, swelling, bleeding, confusion or repeated abnormal reports should not be ignored.",
    sections: [
      { title: "Symptoms to watch", body: "Liver symptoms may be subtle or serious.", items: ["Yellow eyes or dark urine", "Abdominal swelling", "Leg swelling", "Vomiting blood or black stool", "Confusion or excessive sleepiness"] },
      { title: "Report findings that matter", body: "High SGPT/SGOT, low platelets, abnormal ultrasound, fatty liver or high FibroScan score need review." },
      { title: "Common liver conditions", body: "A liver specialist evaluates fatty liver, hepatitis B/C, alcohol-related disease, cirrhosis, ascites and jaundice." },
      { title: "Urgent situations", body: "Fever with jaundice, bleeding, confusion or severe weakness needs urgent medical advice." }
    ],
    faqs: [
      { question: "Can fatty liver need a specialist?", answer: "Yes, especially with diabetes, high enzymes, fibrosis risk or obesity." },
      { question: "Is jaundice always liver disease?", answer: "Jaundice can be due to liver disease or bile duct blockage and needs evaluation." },
      { question: "What tests may be needed?", answer: "LFT, CBC, INR, ultrasound, viral markers, FibroScan or MRCP may be advised." },
      { question: "Where can I consult a liver specialist in Agra?", answer: `Liver care is available at ${site.name}.` }
    ]
  },
  {
    slug: "gastro-hospital-shaheed-nagar-agra-services",
    category: "Local SEO",
    title: "Gastro Hospital in Shaheed Nagar, Agra: Services Available",
    description: "Mudgal Gastromedics Hospital in Shaheed Nagar, Agra provides gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan and advanced GI services.",
    date: "February 3, 2026",
    readTime: "6 min read",
    accent: "#0e7490",
    relatedHref: "/services/gastroenterology",
    relatedLabel: "Gastroenterology Services in Agra",
    keywords: ["Gastro Hospital in Shaheed Nagar", "Gastro Hospital in Agra", "Mudgal Gastromedics", "Endoscopy in Agra", "Liver Specialist in Agra"],
    intro: "Patients looking for digestive and liver care in Shaheed Nagar, Agra can access consultation, diagnostic and therapeutic gastroenterology services at Mudgal Gastromedics Hospital.",
    sections: [
      { title: "Core services", body: "The hospital provides focused care for digestive, liver, pancreatic and biliary diseases.", items: ["Gastroenterology consultation", "Hepatology and liver care", "Endoscopy and colonoscopy", "ERCP and bile duct care", "FibroScan and diagnostics"] },
      { title: "Symptoms evaluated", body: "Patients commonly visit for acidity, abdominal pain, bloating, vomiting, constipation, diarrhea, jaundice, bleeding and weight loss." },
      { title: "Procedures available", body: "Services include upper GI endoscopy, colonoscopy, ERCP, FibroScan, polypectomy, variceal banding, GI bleeding care and selected therapeutic procedures." },
      { title: "Location and appointment", body: `${site.name} is located at ${site.addressLine1}, ${site.addressLine2}, ${site.city}. Call or WhatsApp reception before visiting.` }
    ],
    faqs: [
      { question: "Where is Mudgal Gastromedics Hospital?", answer: `${site.name} is located at ${site.addressLine1}, ${site.addressLine2}, ${site.city}.` },
      { question: "Is endoscopy available?", answer: "Yes. Upper GI endoscopy and colonoscopy services are available." },
      { question: "Is liver care available?", answer: "Yes. Fatty liver, jaundice, cirrhosis, ascites and liver report evaluation are available." },
      { question: "How can I book an appointment?", answer: `Call ${site.mobile}, WhatsApp reception or use the appointment form.` }
    ]
  },
  ...additionalSeoBlogPosts
];

export function getSeoBlogPost(slug: string) {
  return seoBlogPosts.find((post) => post.slug === slug) ?? null;
}
