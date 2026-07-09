import type { BlogPost } from "@/lib/blog-posts";
import { site } from "@/lib/site-data";

type Topic = {
  slug: string;
  category: string;
  title: string;
  description: string;
  date: string;
  readTime?: string;
  accent: string;
  relatedHref: string;
  relatedLabel: string;
  keywords: string[];
  intro: string;
  sections: BlogPost["sections"];
  faqs: BlogPost["faqs"];
};

function post(topic: Topic): BlogPost {
  return {
    readTime: topic.readTime ?? "6 min read",
    ...topic
  };
}

export const additionalSeoBlogPosts: BlogPost[] = [
  post({
    slug: "gastroenterologist-near-tajganj-agra-digestive-problems",
    category: "Local SEO",
    title: "Gastroenterologist Near Tajganj Agra: When to Visit for Digestive Problems",
    description: "A local patient guide for Tajganj and nearby Agra patients on when acidity, pain, bloating, bleeding, jaundice or bowel changes need a gastroenterologist.",
    date: "January 31, 2026",
    accent: "#0e7490",
    relatedHref: "/services/gastroenterology",
    relatedLabel: "Gastroenterology Services in Agra",
    keywords: ["Gastroenterologist Near Tajganj Agra", "Gastro Doctor Near Me", "Digestive Disease Specialist", "Stomach Specialist in Agra"],
    intro: "Patients near Tajganj, Fatehabad Road and Shaheed Nagar often search for a gastroenterologist when symptoms keep returning despite routine medicines. Persistent digestive symptoms should be assessed before they become emergencies.",
    sections: [
      { title: "Symptoms that need review", body: "A gastroenterologist evaluates stomach, intestine, liver, pancreas and bile duct symptoms.", items: ["Repeated acidity or reflux", "Abdominal pain or bloating", "Constipation or diarrhea", "Blood in stool or black stool", "Jaundice, high SGPT or fatty liver"] },
      { title: "Why local access matters", body: "Digestive symptoms sometimes need follow-up visits, report review, endoscopy, colonoscopy or liver testing. A nearby specialist centre makes repeat care easier for patients and attendants." },
      { title: "What to bring", body: "Bring previous prescriptions, ultrasound, CT/MRCP, liver function tests, stool tests, endoscopy, colonoscopy and biopsy reports if available." },
      { title: "When to call urgently", body: "Vomiting blood, black stool, severe abdominal pain, fever with jaundice, persistent vomiting, dehydration or breathing difficulty need urgent medical advice." }
    ],
    faqs: [
      { question: "Which areas are close to Mudgal Gastromedics Hospital?", answer: `${site.name} is located in Shaheed Nagar, Agra and is accessible for Tajganj, Fatehabad Road and nearby localities.` },
      { question: "Do all digestive symptoms need endoscopy?", answer: "No. The doctor decides based on symptoms, age, warning signs and previous reports." },
      { question: "Can liver problems be seen by a gastroenterologist?", answer: "Yes. Gastroenterologists commonly manage fatty liver, jaundice, hepatitis, cirrhosis and bile duct problems." },
      { question: "How can I book?", answer: `Call reception at ${site.mobile} or use the appointment form.` }
    ]
  }),
  post({
    slug: "endoscopy-centre-near-shaheed-nagar-agra-preparation-safety",
    category: "Local SEO",
    title: "Endoscopy Centre Near Shaheed Nagar Agra: Preparation, Safety and When Needed",
    description: "Learn when upper GI endoscopy is advised, how to prepare, safety precautions and what patients in Shaheed Nagar, Agra should know.",
    date: "January 28, 2026",
    accent: "#22d3ee",
    relatedHref: "/procedures/endoscopy",
    relatedLabel: "Endoscopy in Agra",
    keywords: ["Endoscopy Centre Near Shaheed Nagar", "Endoscopy in Agra", "Upper GI Endoscopy", "Endoscopy Near Me"],
    intro: "Upper GI endoscopy helps examine the food pipe, stomach and first part of the small intestine. It may be advised for acidity, ulcers, vomiting, black stool, anemia or swallowing difficulty.",
    sections: [
      { title: "When endoscopy is advised", body: "Endoscopy is useful when symptoms persist or warning signs are present.", items: ["Long-standing acidity or GERD", "Upper abdominal pain", "Black stool or suspected bleeding", "Vomiting or anemia", "Difficulty swallowing"] },
      { title: "Preparation", body: "Fasting is usually required for 6-8 hours, but the exact instruction should come from the treating doctor. Tell the team about diabetes, BP medicines, pregnancy, allergies and blood thinners." },
      { title: "Safety", body: "Endoscopy is commonly performed safely. Uncommon risks include bleeding, medicine reaction, aspiration or perforation, especially when biopsy or treatment is done." },
      { title: "After endoscopy", body: "Mild throat discomfort or bloating can occur. Avoid driving if sedation is used and follow the report review plan." }
    ],
    faqs: [
      { question: "Is endoscopy painful?", answer: "Most patients tolerate it well. Throat spray or sedation may be used depending on the plan." },
      { question: "Can biopsy be taken?", answer: "Yes, small biopsy samples may be taken if needed for H. pylori, inflammation or suspicious findings." },
      { question: "Do I need an attendant?", answer: "If sedation is planned, an adult attendant is usually required." },
      { question: "Where is endoscopy available in Shaheed Nagar?", answer: `Upper GI endoscopy is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  }),
  post({
    slug: "liver-specialist-near-fatehabad-road-agra-fatty-liver-jaundice-sgpt",
    category: "Local SEO",
    title: "Liver Specialist Near Fatehabad Road Agra: Fatty Liver, Jaundice and High SGPT",
    description: "A local liver care guide for patients near Fatehabad Road, Tajganj and Shaheed Nagar with fatty liver, jaundice, high SGPT/SGOT or cirrhosis symptoms.",
    date: "January 25, 2026",
    accent: "#b9852f",
    relatedHref: "/services/hepatology-liver-care",
    relatedLabel: "Liver Specialist in Agra",
    keywords: ["Liver Specialist Near Fatehabad Road Agra", "Liver Specialist in Agra", "High SGPT Treatment", "Fatty Liver Doctor"],
    intro: "Liver problems may be silent in early stages. Fatty liver, high SGPT/SGOT, jaundice, alcohol-related liver disease and hepatitis need structured evaluation instead of repeated self-medication.",
    sections: [
      { title: "Symptoms and reports that matter", body: "Liver disease can show through symptoms or routine reports.", items: ["Yellow eyes or dark urine", "High SGPT/SGOT", "Fatty liver on ultrasound", "Abdominal swelling or leg swelling", "Low platelets or enlarged spleen"] },
      { title: "Common liver conditions", body: "A liver specialist evaluates fatty liver, hepatitis B/C, alcohol-related liver disease, cirrhosis, ascites, varices and obstructive jaundice." },
      { title: "Tests that may be advised", body: "Depending on findings, evaluation may include LFT, CBC, INR, viral markers, ultrasound, FibroScan, MRCP or endoscopy for varices." },
      { title: "Urgent symptoms", body: "Fever with jaundice, vomiting blood, black stools, confusion, severe weakness or increasing swelling should be treated as urgent." }
    ],
    faqs: [
      { question: "Does fatty liver need a specialist?", answer: "Yes, especially with diabetes, obesity, high enzymes, alcohol use or abnormal FibroScan." },
      { question: "Is high SGPT always dangerous?", answer: "Not always, but persistent or high values need evaluation to find the cause." },
      { question: "Can jaundice be due to bile duct blockage?", answer: "Yes. Obstructive jaundice may need imaging and sometimes ERCP." },
      { question: "Where can I consult near Fatehabad Road?", answer: `${site.name} provides liver care in Shaheed Nagar, Agra.` }
    ]
  }),
  post({
    slug: "colonoscopy-cost-in-agra-what-affects-price",
    category: "Local SEO",
    title: "Colonoscopy Cost in Agra: What Affects Price and What Is Included",
    description: "Understand colonoscopy cost factors in Agra including bowel preparation, sedation, biopsy, polyp removal, admission and follow-up.",
    date: "January 22, 2026",
    accent: "#10b981",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colonoscopy in Agra",
    keywords: ["Colonoscopy Cost in Agra", "Colonoscopy in Agra", "Colonoscopy Preparation", "Colon Cancer Screening"],
    intro: "Colonoscopy cost depends on the procedure plan, patient condition and whether biopsy or treatment is needed. Patients should understand what affects cost instead of comparing only one package amount.",
    sections: [
      { title: "What affects cost", body: "The final amount can vary because every colonoscopy is not identical.", items: ["Diagnostic or therapeutic colonoscopy", "Sedation or anesthesia support", "Biopsy or polypectomy", "Emergency vs planned procedure", "Admission or day-care need"] },
      { title: "Preparation costs", body: "Bowel preparation medicines, diet instructions and repeat preparation may affect the total cost if the colon is not clean enough for proper viewing." },
      { title: "Why biopsy or polyp removal matters", body: "If tissue is taken or a polyp is removed, pathology and consumable costs may be separate. These steps are performed only when clinically needed." },
      { title: "Ask before booking", body: "Ask what is included, whether sedation is planned, whether biopsy is extra and when the report review will happen." }
    ],
    faqs: [
      { question: "Is the cost same for every patient?", answer: "No. Cost depends on sedation, biopsy, polyp removal, consumables and admission need." },
      { question: "Can colonoscopy remove polyps?", answer: "Suitable polyps can often be removed during colonoscopy." },
      { question: "Why is bowel prep important?", answer: "Poor bowel prep can reduce accuracy and sometimes requires repeat preparation." },
      { question: "How do I confirm cost?", answer: `Call ${site.name} reception at ${site.mobile} for current appointment and procedure guidance.` }
    ]
  }),
  post({
    slug: "fibroscan-cost-in-agra-who-needs-it",
    category: "Local SEO",
    title: "FibroScan Cost in Agra: Who Needs It and What Affects the Price",
    description: "Learn who needs FibroScan for fatty liver, high SGPT, diabetes or hepatitis, and what factors affect FibroScan cost in Agra.",
    date: "January 19, 2026",
    accent: "#84cc16",
    relatedHref: "/procedures/fibroscan",
    relatedLabel: "FibroScan in Agra",
    keywords: ["FibroScan Cost in Agra", "FibroScan in Agra", "Fatty Liver Test", "Liver Fibrosis Scan"],
    intro: "FibroScan is a non-invasive test used to estimate liver stiffness and fat-related risk. It is commonly advised for fatty liver, high liver enzymes, hepatitis and cirrhosis risk assessment.",
    sections: [
      { title: "Who may need FibroScan", body: "FibroScan helps when ultrasound or blood reports do not fully explain liver risk.", items: ["Fatty liver on ultrasound", "High SGPT/SGOT", "Diabetes or obesity", "Alcohol-related liver risk", "Hepatitis B or C"] },
      { title: "What affects cost", body: "Cost may depend on hospital policy, test type, reporting, consultation and whether other liver tests are needed." },
      { title: "What the report shows", body: "FibroScan usually gives liver stiffness and fat-related readings. Results must be interpreted with symptoms, LFT, ultrasound and medical history." },
      { title: "After the report", body: "A high score may need lifestyle treatment, medicine review, viral testing, alcohol avoidance, follow-up testing or cirrhosis monitoring." }
    ],
    faqs: [
      { question: "Is FibroScan painful?", answer: "No. It is non-invasive and does not need a cut or sedation." },
      { question: "Can FibroScan diagnose all liver diseases?", answer: "No. It estimates stiffness and fat risk; other tests may still be needed." },
      { question: "Do I need fasting?", answer: "Fasting may be advised before the test. Confirm instructions with reception." },
      { question: "Where can I get FibroScan in Agra?", answer: `FibroScan evaluation is available at ${site.name}, Shaheed Nagar, Agra.` }
    ]
  }),
  post({
    slug: "right-upper-abdominal-pain-liver-gallbladder-acidity",
    category: "Symptom Guide",
    title: "Right Upper Abdominal Pain: Liver, Gallbladder or Acidity?",
    description: "Right upper abdominal pain may be due to acidity, gallstones, bile duct stones, liver inflammation or pancreatitis. Learn warning signs and tests.",
    date: "January 16, 2026",
    accent: "#f97316",
    relatedHref: "/procedures/cbd-stone-removal",
    relatedLabel: "Biliary and Liver Evaluation",
    keywords: ["Right Upper Abdominal Pain", "Gallstone Symptoms", "Liver Pain", "Bile Duct Stone"],
    intro: "Pain in the right upper abdomen can come from the stomach, liver, gallbladder, bile duct or pancreas. The pattern of pain, fever, jaundice and vomiting helps decide urgency.",
    sections: [
      { title: "Common causes", body: "The cause cannot be confirmed by location alone.", items: ["Acidity or gastritis", "Gallstones", "CBD stone or bile duct blockage", "Liver inflammation", "Pancreatitis"] },
      { title: "Warning signs", body: "Pain with fever, yellow eyes, dark urine, persistent vomiting, severe weakness or pain going to the back needs urgent evaluation." },
      { title: "Tests that may be advised", body: "Doctors may advise LFT, CBC, amylase/lipase, ultrasound, CT, MRCP or endoscopy depending on symptoms." },
      { title: "Treatment depends on cause", body: "Acidity medicines, ERCP, antibiotics, admission, surgical referral or liver care may be needed depending on diagnosis." }
    ],
    faqs: [
      { question: "Can acidity cause right upper pain?", answer: "Yes, but gallbladder and liver causes should be considered when pain is recurrent or severe." },
      { question: "When is it urgent?", answer: "Fever with jaundice, severe pain, vomiting or weakness needs urgent medical advice." },
      { question: "Can ultrasound detect gallstones?", answer: "Ultrasound commonly detects gallstones, but bile duct stones may need MRCP or other tests." },
      { question: "Where can I consult in Agra?", answer: `Right upper abdominal pain evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "mucus-in-stool-ibs-infection-colitis",
    category: "Symptom Guide",
    title: "Mucus in Stool: IBS, Infection or Colitis?",
    description: "Mucus in stool can occur with IBS, infection, piles, proctitis or inflammatory bowel disease. Learn when to consult a gastroenterologist.",
    date: "January 13, 2026",
    accent: "#06b6d4",
    relatedHref: "/procedures/ibs",
    relatedLabel: "IBS and Colitis Evaluation",
    keywords: ["Mucus in Stool", "IBS Symptoms", "Colitis Symptoms", "Chronic Diarrhea Treatment"],
    intro: "Seeing mucus in stool can be worrying. It may happen with IBS, infection or inflammation, but mucus with blood, weight loss, fever or night symptoms needs medical evaluation.",
    sections: [
      { title: "Possible causes", body: "Mucus can come from irritation or inflammation in the bowel.", items: ["IBS", "Intestinal infection", "Ulcerative colitis or Crohn's disease", "Piles or rectal irritation", "Food intolerance or post-infection bowel changes"] },
      { title: "Warning signs", body: "Blood, fever, weight loss, anemia, severe pain, night diarrhea or persistent symptoms should not be ignored." },
      { title: "Tests that may help", body: "Depending on symptoms, stool tests, blood tests, inflammatory markers, colonoscopy or biopsy may be advised." },
      { title: "Treatment approach", body: "Treatment depends on cause. Repeated antibiotics or self-medication may delay diagnosis in colitis or IBD." }
    ],
    faqs: [
      { question: "Is mucus in stool always serious?", answer: "No, but persistent mucus or mucus with blood, fever or weight loss needs evaluation." },
      { question: "Can IBS cause mucus?", answer: "Yes. IBS can cause mucus, bloating and bowel habit changes, but warning signs need testing." },
      { question: "Will I need colonoscopy?", answer: "Colonoscopy may be advised if symptoms suggest colitis, bleeding, anemia or chronic inflammation." },
      { question: "Where can I consult for mucus in stool?", answer: `Bowel symptom evaluation is available at ${site.name}, Agra.` }
    ]
  }),
  post({
    slug: "food-stuck-in-chest-causes-endoscopy-needed",
    category: "Symptom Guide",
    title: "Food Stuck in Chest: Causes and When Endoscopy Is Needed",
    description: "Food sticking in the chest may suggest food pipe narrowing, GERD complications, motility problems or growth. Learn warning signs and endoscopy role.",
    date: "January 10, 2026",
    accent: "#22d3ee",
    relatedHref: "/procedures/difficulty-swallowing",
    relatedLabel: "Difficulty Swallowing Evaluation",
    keywords: ["Food Stuck in Chest", "Difficulty Swallowing Doctor", "Food Pipe Narrowing", "Endoscopy"],
    intro: "Food sticking in the chest or difficulty swallowing should not be ignored, especially when it worsens over time. It may be due to reflux-related narrowing, rings, inflammation, motility disorders or serious causes.",
    sections: [
      { title: "Common causes", body: "Swallowing difficulty can involve the throat or food pipe.", items: ["GERD-related stricture", "Food pipe narrowing", "Inflammation or ulcers", "Motility disorder", "Tumor or growth in selected cases"] },
      { title: "Warning signs", body: "Progressive difficulty, weight loss, vomiting, anemia, black stool or inability to swallow liquids needs urgent evaluation." },
      { title: "How endoscopy helps", body: "Endoscopy can directly examine the food pipe, detect narrowing, take biopsy if needed and plan treatment such as dilation in selected cases." },
      { title: "Preparation", body: "Fasting is usually required. Bring previous endoscopy, barium swallow, CT or prescription reports if available." }
    ],
    faqs: [
      { question: "Is food sticking always acidity?", answer: "No. Reflux can cause it, but narrowing or other conditions must be ruled out." },
      { question: "Can food pipe narrowing be treated?", answer: "Some narrowings can be treated with endoscopic dilation, depending on cause and safety." },
      { question: "Should I wait if swallowing is worsening?", answer: "No. Progressive swallowing difficulty needs early medical review." },
      { question: "Where can I get evaluated?", answer: `Difficulty swallowing evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "stomach-burning-at-night-causes-treatment",
    category: "Stomach Care",
    title: "Stomach Burning at Night: Causes, Diet Tips and Treatment",
    description: "Night-time stomach burning may be due to GERD, gastritis, ulcer, late meals or medicines. Learn treatment steps and warning signs.",
    date: "January 7, 2026",
    accent: "#14b8a6",
    relatedHref: "/procedures/acidity-gerd",
    relatedLabel: "Acidity and GERD Treatment",
    keywords: ["Stomach Burning at Night", "Acidity Treatment", "GERD Treatment", "Gastritis Treatment"],
    intro: "Stomach or chest burning at night is common in GERD, gastritis and ulcers. It often worsens after late meals, spicy food, alcohol, tobacco or lying down soon after dinner.",
    sections: [
      { title: "Common causes", body: "Night burning can come from acid reflux or stomach lining irritation.", items: ["GERD", "Gastritis", "Peptic ulcer", "Painkiller use", "Late heavy meals"] },
      { title: "Simple steps that help", body: "Avoid late dinner, reduce fried and spicy meals, stop tobacco, avoid alcohol and keep a gap before lying down. Weight reduction may help reflux in suitable patients." },
      { title: "When endoscopy may be advised", body: "Endoscopy may be advised for persistent symptoms, difficulty swallowing, vomiting, anemia, black stool, weight loss or older-age onset." },
      { title: "Avoid unsafe self-medication", body: "Repeated acidity medicine without diagnosis can delay treatment for ulcers, bleeding or H. pylori infection." }
    ],
    faqs: [
      { question: "Why does acidity worsen at night?", answer: "Lying down after food can allow reflux into the food pipe, especially after heavy or late meals." },
      { question: "Can ulcers cause night burning?", answer: "Yes. Ulcers can cause burning pain and may need H. pylori testing or endoscopy." },
      { question: "When is burning urgent?", answer: "Chest pain with sweating, breathlessness or arm pain needs urgent heart evaluation." },
      { question: "Where can I consult for acidity in Agra?", answer: `Acidity and GERD care is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "anemia-due-to-digestive-bleeding-endoscopy-colonoscopy",
    category: "Symptom Guide",
    title: "Anemia Due to Digestive Bleeding: When Endoscopy or Colonoscopy Is Needed",
    description: "Low hemoglobin may be linked to hidden digestive bleeding from ulcers, polyps, colitis or cancer. Learn when GI evaluation is needed.",
    date: "January 4, 2026",
    accent: "#ef4444",
    relatedHref: "/services/diagnostic-services",
    relatedLabel: "Diagnostic Services in Agra",
    keywords: ["Anemia Digestive Bleeding", "Endoscopy Near Me", "Colonoscopy in Agra", "GI Bleeding"],
    intro: "Anemia means low hemoglobin. In some patients, anemia is caused by visible or hidden bleeding from the digestive tract. Finding the source is important, especially in adults and older patients.",
    sections: [
      { title: "GI causes of anemia", body: "Digestive bleeding can be slow and not always visible.", items: ["Stomach ulcer or erosions", "Colon polyps", "Colitis", "Piles or fissure", "Cancer in selected cases"] },
      { title: "Symptoms to watch", body: "Weakness, breathlessness, black stool, blood in stool, weight loss, poor appetite or repeated low hemoglobin need evaluation." },
      { title: "Tests that may be advised", body: "Depending on age and symptoms, doctors may advise CBC, iron studies, stool occult blood, endoscopy, colonoscopy or biopsy." },
      { title: "Treatment plan", body: "Iron alone may not solve anemia if bleeding continues. Treatment should address the cause." }
    ],
    faqs: [
      { question: "Can digestive bleeding happen without visible blood?", answer: "Yes. Slow bleeding can cause anemia without obvious blood in stool." },
      { question: "Do all anemia patients need endoscopy?", answer: "No. The need depends on age, symptoms, iron deficiency and risk factors." },
      { question: "Is black stool important?", answer: "Yes. Black stool can suggest upper GI bleeding and needs urgent review." },
      { question: "Where can anemia due to GI bleeding be evaluated?", answer: `GI bleeding and diagnostic evaluation are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "abdominal-swelling-gas-fat-ascites-liver-disease",
    category: "Symptom Guide",
    title: "Abdominal Swelling: Gas, Fat, Ascites or Liver Disease?",
    description: "Abdominal swelling may be due to gas, obesity, constipation, ascites or liver disease. Learn warning signs and when fluid tapping is needed.",
    date: "January 1, 2026",
    accent: "#0f766e",
    relatedHref: "/procedures/ascites",
    relatedLabel: "Ascites and Liver Care",
    keywords: ["Abdominal Swelling", "Ascites Treatment", "Liver Cirrhosis Symptoms", "Fluid in Abdomen"],
    intro: "Abdominal swelling is not always gas. It may be due to constipation, obesity, fluid in the abdomen, liver disease, kidney issues or other medical conditions.",
    sections: [
      { title: "Possible causes", body: "The cause depends on duration, pain, weight change and associated symptoms.", items: ["Gas and bloating", "Constipation", "Weight gain or fat", "Ascites due to liver disease", "Abdominal mass or other causes"] },
      { title: "Signs of ascites", body: "Increasing abdominal size with leg swelling, jaundice, low platelets, alcohol history or known cirrhosis suggests fluid-related swelling." },
      { title: "Tests that may be advised", body: "Ultrasound, liver tests, CBC, kidney tests and sometimes ascitic fluid testing may be required." },
      { title: "When urgent", body: "Fever, severe pain, vomiting blood, black stool, breathlessness, confusion or reduced urine need urgent medical advice." }
    ],
    faqs: [
      { question: "Can gas cause a swollen abdomen?", answer: "Yes, but persistent or progressive swelling should be evaluated." },
      { question: "What is ascites?", answer: "Ascites is fluid collection in the abdomen, commonly linked with liver disease but not always." },
      { question: "Why is fluid removed?", answer: "Ascitic fluid may be removed for testing or symptom relief, depending on the case." },
      { question: "Where can ascites be evaluated in Agra?", answer: `Ascites and liver care are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "gastritis-vs-peptic-ulcer-difference-symptoms-treatment",
    category: "Stomach Care",
    title: "Gastritis vs Peptic Ulcer: Difference, Symptoms and Treatment",
    description: "Understand the difference between gastritis and peptic ulcer disease, symptoms, H. pylori, painkiller risk and when endoscopy is needed.",
    date: "December 29, 2025",
    accent: "#f59e0b",
    relatedHref: "/procedures/peptic-ulcer-disease",
    relatedLabel: "Gastritis and Ulcer Treatment",
    keywords: ["Gastritis Treatment", "Peptic Ulcer Treatment", "H Pylori Treatment", "Endoscopy in Agra"],
    intro: "Gastritis means inflammation of the stomach lining. A peptic ulcer is a deeper sore in the stomach or duodenum. Symptoms can overlap, so proper evaluation matters.",
    sections: [
      { title: "How they differ", body: "Gastritis may cause burning, nausea or heaviness. Ulcers may cause deeper pain and can sometimes bleed.", items: ["Gastritis: lining inflammation", "Ulcer: deeper wound", "Both may be linked with H. pylori", "Painkillers can worsen both"] },
      { title: "Warning signs", body: "Black stool, vomiting blood, anemia, weight loss, persistent vomiting or severe pain need urgent evaluation." },
      { title: "Role of endoscopy", body: "Endoscopy helps identify ulcers, bleeding, suspicious areas and allows biopsy or H. pylori testing when needed." },
      { title: "Treatment", body: "Treatment may include acid suppression, H. pylori therapy, stopping unsafe painkillers and follow-up based on severity." }
    ],
    faqs: [
      { question: "Can gastritis become ulcer?", answer: "Ongoing injury from H. pylori, painkillers or acid can contribute to ulcer risk in some patients." },
      { question: "Is H. pylori common?", answer: "Yes. It is a common cause of gastritis and ulcers and needs complete treatment when confirmed." },
      { question: "Should I avoid painkillers?", answer: "Avoid repeated painkiller use without advice, especially if you have acidity, ulcer history or blood thinners." },
      { question: "Where can I consult?", answer: `Gastritis and ulcer care is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "bile-duct-stricture-symptoms-tests-treatment-options",
    category: "Biliary Care",
    title: "Bile Duct Stricture: Symptoms, Tests and Treatment Options",
    description: "Bile duct stricture can cause jaundice, itching, fever and abnormal liver tests. Learn tests, ERCP stenting and follow-up needs.",
    date: "December 26, 2025",
    accent: "#b9852f",
    relatedHref: "/procedures/bile-duct-stenting",
    relatedLabel: "Bile Duct Stenting",
    keywords: ["Bile Duct Stricture", "Jaundice Treatment", "ERCP Specialist in Agra", "Biliary Stenting"],
    intro: "A bile duct stricture is a narrowing in the bile drainage pathway. It can block bile flow and cause jaundice, infection or abnormal liver function tests.",
    sections: [
      { title: "Symptoms", body: "Symptoms depend on the level and severity of blockage.", items: ["Yellow eyes", "Dark urine", "Itching", "Fever with chills", "Pale stool or weight loss"] },
      { title: "Tests", body: "Evaluation may include LFT, CBC, ultrasound, CT, MRCP and ERCP depending on suspected cause and urgency." },
      { title: "Treatment options", body: "Treatment may involve antibiotics, drainage, ERCP stenting, biopsy or surgical referral depending on benign or suspicious causes." },
      { title: "Follow-up", body: "Stents may need exchange or removal. Repeat liver tests and imaging may be required." }
    ],
    faqs: [
      { question: "Is bile duct stricture serious?", answer: "It can be serious if it causes infection, worsening jaundice or persistent blockage." },
      { question: "Can ERCP help?", answer: "In selected cases ERCP can place a stent, take samples or improve drainage." },
      { question: "What is cholangitis?", answer: "Cholangitis is bile duct infection, often causing fever with jaundice and needing urgent care." },
      { question: "Where is bile duct care available?", answer: `Bile duct and ERCP care are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "chronic-pancreatitis-pain-diabetes-digestion-problems",
    category: "Pancreas Care",
    title: "Chronic Pancreatitis: Pain, Diabetes and Digestion Problems",
    description: "Chronic pancreatitis can cause recurrent pain, diabetes, weight loss and digestion problems. Learn symptoms, tests and treatment planning.",
    date: "December 23, 2025",
    accent: "#8b5cf6",
    relatedHref: "/procedures/pancreatic-disorders",
    relatedLabel: "Pancreatic Disorder Care",
    keywords: ["Chronic Pancreatitis", "Pancreas Specialist", "Pancreatic Disease Doctor", "Abdominal Pain Doctor"],
    intro: "Chronic pancreatitis is long-term pancreas inflammation. It can cause repeated pain, duct stones, poor digestion, weight loss and diabetes.",
    sections: [
      { title: "Symptoms", body: "Symptoms may come in episodes or continue over time.", items: ["Upper abdominal pain going to back", "Weight loss", "Oily or floating stools", "Diabetes", "Repeated vomiting or poor appetite"] },
      { title: "Common causes", body: "Alcohol use, smoking, genetic risk, duct problems, high triglycerides and previous acute pancreatitis may contribute." },
      { title: "Tests", body: "Evaluation may include blood tests, ultrasound, CT, MRCP, stool fat or diabetes assessment depending on symptoms." },
      { title: "Treatment", body: "Treatment may include alcohol and tobacco cessation, pain planning, enzyme support, nutrition care, diabetes control and selected endoscopic therapy." }
    ],
    faqs: [
      { question: "Can chronic pancreatitis cause diabetes?", answer: "Yes. Long-term pancreatic damage can affect insulin production." },
      { question: "Why do stools become oily?", answer: "Poor enzyme secretion can affect fat digestion, causing oily or floating stools." },
      { question: "Can endoscopy help?", answer: "Selected patients with duct stones or narrowing may need endoscopic evaluation or treatment." },
      { question: "Where can I consult?", answer: `Pancreatic disorder care is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "portal-hypertension-varices-ascites-bleeding-risk",
    category: "Liver Care",
    title: "Portal Hypertension: Varices, Ascites and Bleeding Risk",
    description: "Portal hypertension in liver disease can cause varices, ascites, low platelets and bleeding. Learn symptoms, tests and prevention.",
    date: "December 20, 2025",
    accent: "#dc2626",
    relatedHref: "/procedures/esophageal-varices",
    relatedLabel: "Varices and Liver Care",
    keywords: ["Portal Hypertension", "Esophageal Varices", "Ascites Treatment", "Liver Cirrhosis Symptoms"],
    intro: "Portal hypertension means high pressure in the liver blood flow system, commonly due to cirrhosis. It can lead to varices, ascites, enlarged spleen and bleeding risk.",
    sections: [
      { title: "Why it happens", body: "Scarring in the liver can block normal blood flow and increase pressure in veins around the food pipe, stomach and abdomen." },
      { title: "Complications", body: "Portal hypertension can cause serious complications.", items: ["Esophageal or gastric varices", "Vomiting blood or black stool", "Ascites", "Low platelets", "Enlarged spleen"] },
      { title: "Tests", body: "Evaluation may include ultrasound, FibroScan, blood tests, endoscopy for varices and liver disease work-up." },
      { title: "Prevention", body: "Medicines, variceal banding, salt restriction, alcohol avoidance and regular follow-up may reduce complication risk." }
    ],
    faqs: [
      { question: "Can varices bleed suddenly?", answer: "Yes. Variceal bleeding can be sudden and serious." },
      { question: "Why is endoscopy advised?", answer: "Endoscopy helps detect and grade varices so prevention can be planned." },
      { question: "What symptoms are urgent?", answer: "Vomiting blood, black stool, fainting, confusion, fever or severe weakness need urgent care." },
      { question: "Where can portal hypertension be managed?", answer: `Liver and variceal care are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "hepatitis-b-carrier-meaning-follow-up-tests",
    category: "Liver Care",
    title: "Hepatitis B Carrier: What It Means and Follow-Up Tests",
    description: "Understand what hepatitis B carrier status means, which tests are needed, family screening, vaccination and long-term liver monitoring.",
    date: "December 17, 2025",
    accent: "#0ea5e9",
    relatedHref: "/services/hepatology-liver-care",
    relatedLabel: "Hepatitis and Liver Care",
    keywords: ["Hepatitis B Carrier", "Hepatitis B Treatment", "Liver Specialist in Agra", "HBsAg Positive"],
    intro: "Many patients find out they are HBsAg positive during routine testing. A hepatitis B carrier may feel normal but still needs proper classification and follow-up.",
    sections: [
      { title: "What carrier means", body: "Carrier status means hepatitis B infection is present, but activity and liver risk vary. Viral load and liver tests guide management." },
      { title: "Tests that may be needed", body: "Doctors may advise HBeAg, HBV DNA viral load, LFT, CBC, INR, ultrasound, FibroScan and screening for family members." },
      { title: "Treatment decision", body: "Not every HBsAg-positive patient needs immediate medicine. Treatment depends on viral load, liver enzymes, fibrosis risk, age and other factors." },
      { title: "Family safety", body: "Family members may need testing and hepatitis B vaccination. Avoid sharing razors, toothbrushes or needles." }
    ],
    faqs: [
      { question: "Can hepatitis B be silent?", answer: "Yes. Many patients have no symptoms for years." },
      { question: "Is vaccination useful for family?", answer: "Yes, if family members are not infected and not already immune." },
      { question: "Can hepatitis B cause cirrhosis?", answer: "Long-standing active infection can increase cirrhosis and liver cancer risk." },
      { question: "Where can I consult?", answer: `Hepatitis B evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "celiac-disease-adults-symptoms-tests-gluten-free-diet",
    category: "Intestine Care",
    title: "Celiac Disease in Adults: Symptoms, Tests and Gluten-Free Diet",
    description: "Celiac disease can cause diarrhea, anemia, bloating, weight loss and nutrient deficiency. Learn tests and gluten-free diet basics.",
    date: "December 14, 2025",
    accent: "#a3a83a",
    relatedHref: "/services/gastroenterology",
    relatedLabel: "Digestive Disease Evaluation",
    keywords: ["Celiac Disease Symptoms", "Chronic Diarrhea", "Anemia Digestive Causes", "Bloating Treatment"],
    intro: "Celiac disease is an immune reaction to gluten that can damage the small intestine. Adults may have diarrhea, bloating, anemia, fatigue or unexplained nutrient deficiency.",
    sections: [
      { title: "Symptoms", body: "Symptoms vary widely and may not be limited to diarrhea.", items: ["Chronic diarrhea", "Bloating and gas", "Weight loss", "Anemia", "Weakness or nutrient deficiency"] },
      { title: "Testing", body: "Blood tests and sometimes endoscopic biopsy may be advised. Patients should not start a gluten-free diet before testing unless instructed, because it can affect results." },
      { title: "Diet treatment", body: "A strict gluten-free diet avoids wheat, barley and rye. Indian meals need careful planning because atta, sooji, maida and many packaged foods contain gluten." },
      { title: "Follow-up", body: "Follow-up checks symptoms, nutrition, anemia, vitamin levels and diet adherence." }
    ],
    faqs: [
      { question: "Can adults develop celiac disease?", answer: "Yes. It can be diagnosed in childhood or adulthood." },
      { question: "Should I stop wheat before testing?", answer: "Do not stop gluten before testing unless your doctor advises it." },
      { question: "Can celiac cause anemia?", answer: "Yes. Poor absorption can cause iron, folate or vitamin deficiencies." },
      { question: "Where can I consult?", answer: `Celiac and chronic diarrhea evaluation are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "endoscopic-biopsy-report-what-patients-should-know",
    category: "Procedure Guide",
    title: "Endoscopic Biopsy Report: What Patients Should Know",
    description: "Learn why biopsy is taken during endoscopy or colonoscopy, what reports can show and why follow-up with the doctor is important.",
    date: "December 11, 2025",
    accent: "#64748b",
    relatedHref: "/procedures/endoscopic-biopsy",
    relatedLabel: "Endoscopic Biopsy",
    keywords: ["Endoscopic Biopsy", "Biopsy Report", "Endoscopy Report", "Colonoscopy Biopsy"],
    intro: "A biopsy is a small tissue sample taken during endoscopy or colonoscopy. It helps confirm inflammation, infection, H. pylori, celiac disease, colitis or suspicious changes.",
    sections: [
      { title: "Why biopsy is taken", body: "The doctor may take biopsy when visual findings need confirmation.", items: ["Gastritis or H. pylori", "Ulcer or suspicious lesion", "Celiac disease evaluation", "Colitis or IBD", "Polyp or growth"] },
      { title: "Is biopsy painful?", body: "Patients usually do not feel biopsy sampling from the digestive lining during the procedure." },
      { title: "What the report means", body: "Histopathology terms should be reviewed with the doctor because treatment depends on symptoms, endoscopy findings and report wording." },
      { title: "Follow-up", body: "Bring the biopsy report for review. Do not assume serious disease from one word without medical interpretation." }
    ],
    faqs: [
      { question: "Does biopsy mean cancer?", answer: "No. Biopsy is often taken for infection, inflammation or routine confirmation." },
      { question: "How long does the report take?", answer: "Timing depends on the pathology process and hospital coordination." },
      { question: "Can biopsy cause bleeding?", answer: "Minor bleeding can occur but significant bleeding is uncommon." },
      { question: "Where can biopsy be reviewed?", answer: `Biopsy report review is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "polypectomy-aftercare-diet-bleeding-follow-up",
    category: "Procedure Guide",
    title: "Polypectomy Aftercare: Diet, Bleeding Signs and Follow-Up",
    description: "After colon polyp removal, patients need diet advice, bleeding precautions, medicine review and biopsy follow-up. Learn what to expect.",
    date: "December 8, 2025",
    accent: "#10b981",
    relatedHref: "/procedures/polypectomy",
    relatedLabel: "Polypectomy",
    keywords: ["Polypectomy Aftercare", "Colon Polyps Treatment", "Colonoscopy in Agra", "Colon Cancer Screening"],
    intro: "Polypectomy means removal of suitable polyps during colonoscopy or endoscopy. Aftercare depends on polyp size, site, technique, bleeding risk and biopsy report.",
    sections: [
      { title: "Diet after polypectomy", body: "Diet instructions vary. Some patients start light food after recovery, while larger polyp removal may need specific restrictions." },
      { title: "Bleeding signs", body: "Small spotting may happen, but heavy bleeding, black stool, dizziness or severe pain should be reported urgently." },
      { title: "Medicine precautions", body: "Blood thinners, aspirin, diabetes medicines and painkillers should be restarted only as advised." },
      { title: "Biopsy follow-up", body: "Histopathology decides whether the polyp was harmless, precancerous or needs earlier surveillance." }
    ],
    faqs: [
      { question: "Can I travel after polypectomy?", answer: "Ask the doctor. Larger polyp removal or bleeding risk may need observation." },
      { question: "Is polyp removal painful?", answer: "Patients usually do not feel polyp removal during colonoscopy." },
      { question: "Will polyps come back?", answer: "Some patients can develop new polyps, so surveillance timing matters." },
      { question: "Where can I review biopsy?", answer: `Polyp biopsy review is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "variceal-banding-repeat-sessions-needed",
    category: "Liver Care",
    title: "Variceal Banding: Why Repeat Sessions May Be Needed",
    description: "Variceal banding helps reduce bleeding risk in cirrhosis patients. Learn why repeat sessions, medicines and follow-up are important.",
    date: "December 5, 2025",
    accent: "#dc2626",
    relatedHref: "/procedures/variceal-banding",
    relatedLabel: "Variceal Banding",
    keywords: ["Variceal Banding", "Esophageal Varices", "Liver Cirrhosis Treatment", "GI Bleeding Management"],
    intro: "Variceal banding is an endoscopic treatment for enlarged veins in the food pipe, usually caused by portal hypertension in liver disease. Repeat sessions are often needed until risk reduces.",
    sections: [
      { title: "Why banding is done", body: "Varices can bleed suddenly. Banding places small bands on suitable varices to reduce bleeding risk." },
      { title: "Why repeat sessions happen", body: "Large varices may need staged treatment. Repeat endoscopy checks whether more bands are needed." },
      { title: "Aftercare", body: "Temporary chest discomfort or swallowing discomfort can occur. Follow diet, medicine and warning-sign instructions carefully." },
      { title: "Urgent warning signs", body: "Vomiting blood, black stool, fainting, severe chest pain, fever or breathing difficulty need urgent care." }
    ],
    faqs: [
      { question: "Is banding a cure for cirrhosis?", answer: "No. It reduces variceal bleeding risk but liver disease still needs treatment and monitoring." },
      { question: "How many sessions are needed?", answer: "It depends on variceal size, response and liver condition." },
      { question: "Do medicines continue after banding?", answer: "Often yes, based on the doctor's plan." },
      { question: "Where is variceal banding available?", answer: `Variceal banding is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "gi-stent-placement-when-used-what-to-expect",
    category: "Procedure Guide",
    title: "GI Stent Placement: When It Is Used and What to Expect",
    description: "GI stents may help relieve selected digestive tract blockages. Learn indications, preparation, diet, risks and follow-up.",
    date: "December 2, 2025",
    accent: "#0e7490",
    relatedHref: "/procedures/gi-stenting",
    relatedLabel: "GI Stenting",
    keywords: ["GI Stent Placement", "Enteral Stent", "Food Pipe Stent", "GI Stenting"],
    intro: "A GI stent is a tube-like device placed to keep a narrowed digestive passage open in selected patients. It may be used in the food pipe, stomach outlet, colon or bile duct depending on the condition.",
    sections: [
      { title: "When it is used", body: "Stenting is considered when narrowing causes obstruction or poor drainage.", items: ["Difficulty swallowing due to narrowing", "Gastric outlet obstruction", "Colon obstruction in selected cases", "Bile duct blockage", "Palliative or bridge treatment"] },
      { title: "Preparation", body: "Preparation depends on location. Fasting, blood tests, imaging review, medicine review and attendant support may be needed." },
      { title: "Risks", body: "Risks include bleeding, pain, perforation, migration, blockage, infection or need for repeat procedure, depending on site." },
      { title: "Aftercare", body: "Diet progression, warning signs and follow-up imaging or endoscopy are explained before discharge." }
    ],
    faqs: [
      { question: "Is every narrowing treated with a stent?", answer: "No. Treatment depends on cause, site, patient condition and alternatives." },
      { question: "Can stents move?", answer: "Migration is a known risk with some stents and needs follow-up if symptoms return." },
      { question: "What should I eat after stenting?", answer: "Diet depends on stent location. Follow the hospital's instructions." },
      { question: "Where is GI stenting evaluated?", answer: `GI stenting evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "ascitic-fluid-test-why-fluid-removed-abdomen",
    category: "Liver Care",
    title: "Ascitic Fluid Test: Why Fluid Is Removed From the Abdomen",
    description: "Ascitic fluid tapping may be done for testing or relief in abdominal fluid. Learn preparation, safety, reports and warning signs.",
    date: "November 29, 2025",
    accent: "#0f766e",
    relatedHref: "/procedures/ascitic-fluid-tapping",
    relatedLabel: "Ascitic Fluid Tapping",
    keywords: ["Ascitic Fluid Test", "Ascitic Fluid Tapping", "Ascites Treatment", "Fluid in Abdomen"],
    intro: "Ascitic fluid tapping, also called paracentesis, removes fluid from the abdomen for testing or symptom relief. It is commonly used in patients with ascites.",
    sections: [
      { title: "Why fluid is removed", body: "Fluid may be removed to identify infection, assess cause or reduce discomfort and breathing pressure." },
      { title: "Preparation", body: "The doctor may review blood tests, medicines, blood thinners, infection risk and ultrasound findings before tapping." },
      { title: "What reports show", body: "Fluid testing can check infection, protein level, cell count and other markers that help identify cause." },
      { title: "Aftercare", body: "Monitor for fever, severe pain, leakage, dizziness or worsening swelling. Follow salt, medicine and liver care advice." }
    ],
    faqs: [
      { question: "Is ascitic tapping painful?", answer: "Local anesthesia may be used. Mild discomfort can occur." },
      { question: "Can fluid come back?", answer: "Yes, if the underlying cause remains active. Long-term management is important." },
      { question: "Is fever with ascites urgent?", answer: "Yes. Fever, pain or confusion in ascites can suggest infection and needs urgent care." },
      { question: "Where is ascitic fluid testing available?", answer: `Ascites evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "peg-tube-placement-feeding-tube-care-home",
    category: "Procedure Guide",
    title: "PEG Tube Placement: Feeding Tube Care at Home",
    description: "PEG tube placement helps long-term feeding when swallowing is unsafe. Learn home care, flushing, infection signs and follow-up.",
    date: "November 26, 2025",
    accent: "#14b8a6",
    relatedHref: "/procedures/peg-tube-placement",
    relatedLabel: "PEG Tube Placement",
    keywords: ["PEG Tube Placement", "Feeding Tube Care", "Enteral Feeding", "Gastrostomy Tube"],
    intro: "PEG tube placement creates a feeding route directly into the stomach for patients who cannot swallow safely for a prolonged period. Caregiver education is essential.",
    sections: [
      { title: "Who may need PEG", body: "PEG may be considered in selected patients with unsafe swallowing or long-term nutrition needs after careful assessment." },
      { title: "Home care basics", body: "Care includes cleaning the site, flushing the tube, correct feeding position and preventing blockage." },
      { title: "Warning signs", body: "Fever, redness, pus, leakage, severe pain, tube blockage, vomiting or breathing difficulty should be reported." },
      { title: "Follow-up", body: "Follow-up checks tube position, skin care, feeding tolerance, nutrition status and caregiver technique." }
    ],
    faqs: [
      { question: "Can patients eat by mouth after PEG?", answer: "It depends on swallowing safety and doctor advice." },
      { question: "Can the tube block?", answer: "Yes. Regular flushing and correct feeding technique reduce blockage risk." },
      { question: "Is PEG permanent?", answer: "Not always. Duration depends on the underlying condition and recovery." },
      { question: "Where can PEG be evaluated?", answer: `PEG tube placement evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "colon-cancer-screening-age-india-when-to-start",
    category: "Preventive Health",
    title: "Colon Cancer Screening Age in India: When to Start",
    description: "Learn when Indian patients should discuss colon cancer screening, colonoscopy, family history, polyps and warning symptoms.",
    date: "November 23, 2025",
    accent: "#10b981",
    relatedHref: "/procedures/colonoscopy",
    relatedLabel: "Colon Cancer Screening",
    keywords: ["Colon Cancer Screening India", "Colonoscopy in Agra", "Colon Polyps Treatment", "Family History Colon Cancer"],
    intro: "Colon cancer screening aims to detect polyps or early cancer before advanced symptoms occur. The right age depends on symptoms, family history and risk profile.",
    sections: [
      { title: "Who should discuss screening", body: "Screening decisions should be individualized.", items: ["Age-appropriate adults", "Family history of colon cancer", "Previous polyps", "IBD history", "Unexplained anemia or bleeding"] },
      { title: "Warning symptoms", body: "Blood in stool, black stool, bowel habit change, anemia, weight loss or persistent pain need evaluation regardless of age." },
      { title: "Role of colonoscopy", body: "Colonoscopy can detect inflammation, polyps and cancer, and suitable polyps can often be removed." },
      { title: "Preparation", body: "Good bowel preparation, medicine review and attendant planning are important for safe and accurate colonoscopy." }
    ],
    faqs: [
      { question: "Is screening needed without symptoms?", answer: "Some patients need screening based on age or family history even without symptoms." },
      { question: "Does blood in stool always mean cancer?", answer: "No, but it should be evaluated." },
      { question: "Can polyps be prevented?", answer: "Some risk can be reduced with lifestyle, but screening is still important for selected patients." },
      { question: "Where is screening available?", answer: `Colonoscopy and screening guidance are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "fatty-liver-and-diabetes-why-occur-together",
    category: "Liver Care",
    title: "Fatty Liver and Diabetes: Why They Often Occur Together",
    description: "Fatty liver and diabetes are closely linked. Learn why liver fat, insulin resistance, SGPT and FibroScan monitoring matter.",
    date: "November 20, 2025",
    accent: "#84cc16",
    relatedHref: "/procedures/fatty-liver",
    relatedLabel: "Fatty Liver Treatment",
    keywords: ["Fatty Liver and Diabetes", "Fatty Liver Treatment", "High SGPT", "FibroScan in Agra"],
    intro: "Diabetes and fatty liver commonly occur together because both are linked with insulin resistance and metabolic risk. Normal symptoms do not always mean the liver is safe.",
    sections: [
      { title: "Why they are linked", body: "Insulin resistance can increase liver fat. Fatty liver can also reflect higher metabolic and cardiovascular risk." },
      { title: "Reports to monitor", body: "Patients may need LFT, HbA1c, lipid profile, ultrasound, FibroScan and weight/waist monitoring." },
      { title: "Treatment approach", body: "Weight loss, exercise, diabetes control, cholesterol care, alcohol avoidance and diet planning are central." },
      { title: "When to consult", body: "High SGPT/SGOT, abnormal FibroScan, obesity, low platelets, jaundice or swelling need specialist review." }
    ],
    faqs: [
      { question: "Can fatty liver happen in thin diabetics?", answer: "Yes, although it is more common with obesity." },
      { question: "Does normal SGPT rule out liver risk?", answer: "No. Some patients may still have fibrosis risk despite normal enzymes." },
      { question: "Is FibroScan useful?", answer: "It helps estimate stiffness and fibrosis risk in selected patients." },
      { question: "Where can I consult?", answer: `Fatty liver and diabetes-related liver care are available at ${site.name}.` }
    ]
  }),
  post({
    slug: "indian-diet-for-acidity-gerd-what-to-eat-avoid",
    category: "Stomach Care",
    title: "Indian Diet for Acidity and GERD: What to Eat and Avoid",
    description: "Practical Indian diet advice for acidity and GERD, including meal timing, tea, spicy food, fried snacks, dinner habits and warning signs.",
    date: "November 17, 2025",
    accent: "#22d3ee",
    relatedHref: "/procedures/acidity-gerd",
    relatedLabel: "GERD Treatment",
    keywords: ["Indian Diet for Acidity", "GERD Diet", "Acid Reflux Treatment", "Heartburn Specialist"],
    intro: "Acidity and GERD often worsen with meal timing, portion size and trigger foods. Diet changes work best when they are practical for Indian meals.",
    sections: [
      { title: "Common triggers", body: "Triggers vary, but some habits commonly worsen reflux.", items: ["Late dinner", "Fried snacks", "Very spicy meals", "Tea or coffee excess", "Lying down soon after food"] },
      { title: "Meal habits that help", body: "Eat smaller dinners, keep a gap before sleep, walk after meals, avoid overeating and reduce tobacco or alcohol." },
      { title: "What to eat", body: "Home-cooked balanced meals with controlled oil, adequate protein and non-trigger vegetables are often better tolerated." },
      { title: "When diet is not enough", body: "Persistent symptoms, difficulty swallowing, black stool, vomiting, anemia or weight loss need medical evaluation." }
    ],
    faqs: [
      { question: "Is curd good for acidity?", answer: "Some patients tolerate curd, while others worsen. Personal trigger tracking helps." },
      { question: "Can I drink tea?", answer: "Excess tea can worsen reflux in some patients. Reduce quantity if symptoms correlate." },
      { question: "Is spicy food always forbidden?", answer: "Not always, but reduce foods that clearly trigger symptoms." },
      { question: "Where can I consult for GERD?", answer: `GERD and acidity care is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "safe-painkiller-use-protect-stomach-liver",
    category: "Preventive Health",
    title: "Safe Painkiller Use: How to Protect Your Stomach and Liver",
    description: "Painkillers can worsen ulcers, bleeding and liver risk if misused. Learn precautions for stomach, liver, blood thinners and alcohol.",
    date: "November 14, 2025",
    accent: "#ef4444",
    relatedHref: "/services/gastroenterology",
    relatedLabel: "Digestive Safety Consultation",
    keywords: ["Painkiller Stomach Ulcer", "Painkiller Liver Damage", "Gastritis Treatment", "GI Bleeding"],
    intro: "Repeated painkiller use is common, but some medicines can irritate the stomach, trigger ulcers, increase bleeding risk or affect the liver, especially with alcohol or existing disease.",
    sections: [
      { title: "Who should be careful", body: "Risk is higher in certain patients.", items: ["Ulcer or bleeding history", "Blood thinner use", "Liver disease", "Kidney disease", "Elderly patients", "Alcohol use"] },
      { title: "Stomach risks", body: "Some painkillers can cause gastritis, ulcer, black stool or vomiting blood, especially when taken repeatedly or without food." },
      { title: "Liver risks", body: "Overdose, alcohol use or existing liver disease can make some medicines unsafe. Do not mix multiple pain medicines without advice." },
      { title: "When to call", body: "Black stool, vomiting blood, severe pain, jaundice, confusion or repeated vomiting need urgent care." }
    ],
    faqs: [
      { question: "Can painkillers cause ulcers?", answer: "Yes, especially NSAIDs and repeated unsupervised use." },
      { question: "Are all painkillers bad for liver?", answer: "No, but dose, alcohol use and liver disease matter." },
      { question: "Should I stop blood thinners?", answer: "Do not stop blood thinners without medical advice." },
      { question: "Where can I consult for bleeding symptoms?", answer: `GI bleeding evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "normal-ultrasound-still-needs-gastroenterology-evaluation",
    category: "Diagnostic Guide",
    title: "When Normal Ultrasound Still Needs Gastroenterology Evaluation",
    description: "A normal ultrasound does not rule out GERD, ulcers, colitis, early liver disease or bowel problems. Learn when specialist evaluation is still needed.",
    date: "November 11, 2025",
    accent: "#64748b",
    relatedHref: "/services/diagnostic-services",
    relatedLabel: "Diagnostic Services",
    keywords: ["Normal Ultrasound Digestive Symptoms", "Digestive Problems Doctor", "Endoscopy Near Me", "Colonoscopy in Agra"],
    intro: "Ultrasound is useful, but it cannot diagnose every digestive disease. Patients may still need gastroenterology evaluation when symptoms persist despite a normal scan.",
    sections: [
      { title: "What ultrasound may miss", body: "Ultrasound does not directly inspect the food pipe, stomach or colon lining.", items: ["GERD or esophagitis", "Gastritis or ulcer", "H. pylori", "Colitis or polyps", "Early mucosal disease"] },
      { title: "Symptoms needing review", body: "Persistent acidity, pain, vomiting, bleeding, anemia, diarrhea, constipation or weight loss need evaluation even if ultrasound is normal." },
      { title: "Other tests", body: "Depending on symptoms, endoscopy, colonoscopy, stool tests, blood tests, FibroScan, CT or MRCP may be advised." },
      { title: "Bring reports", body: "Carry the ultrasound images/report and all previous medicines so the doctor can avoid repeating unnecessary tests." }
    ],
    faqs: [
      { question: "Does normal ultrasound rule out ulcer?", answer: "No. Ulcers are usually evaluated by endoscopy." },
      { question: "Can colon disease be missed?", answer: "Many colon lining problems need colonoscopy rather than ultrasound." },
      { question: "Should I repeat ultrasound?", answer: "Only if advised. The next test depends on symptoms." },
      { question: "Where can I get evaluated?", answer: `Diagnostic gastroenterology evaluation is available at ${site.name}.` }
    ]
  }),
  post({
    slug: "second-opinion-endoscopy-colonoscopy-report-when-it-helps",
    category: "Diagnostic Guide",
    title: "Second Opinion for Endoscopy or Colonoscopy Report: When It Helps",
    description: "A second opinion can help clarify biopsy reports, polyps, ulcers, colitis, strictures, stents and repeat procedure decisions.",
    date: "November 8, 2025",
    accent: "#0e7490",
    relatedHref: "/services/diagnostic-services",
    relatedLabel: "Report Review and Diagnostics",
    keywords: ["Second Opinion Endoscopy Report", "Colonoscopy Report Review", "Biopsy Report", "Gastroenterologist in Agra"],
    intro: "A second opinion can be useful when reports are unclear, symptoms continue, biopsy results need explanation or a major procedure has been advised.",
    sections: [
      { title: "When it helps", body: "Report review can clarify next steps.", items: ["Persistent symptoms despite treatment", "Biopsy terms are confusing", "Polyp or colitis report needs follow-up", "Repeat endoscopy advised", "Surgery or stenting suggested"] },
      { title: "What to bring", body: "Bring original endoscopy or colonoscopy images, full report, biopsy report, medicines, blood tests and imaging." },
      { title: "What the doctor checks", body: "The doctor reviews whether findings match symptoms and whether treatment, repeat test, biopsy follow-up or surveillance is needed." },
      { title: "Avoid delay in emergencies", body: "Vomiting blood, black stool, severe pain, fever with jaundice or obstruction symptoms need urgent care, not routine second-opinion delay." }
    ],
    faqs: [
      { question: "Can reports be reviewed without repeating the test?", answer: "Often yes, if images, biopsy and reports are complete. Repeat testing is advised only when needed." },
      { question: "Should I bring biopsy slides?", answer: "If available, biopsy blocks/slides or pathology details can help in complex cases." },
      { question: "Is second opinion useful before surgery?", answer: "It can help clarify diagnosis and alternatives when time permits." },
      { question: "Where can I get a report review?", answer: `Report review is available at ${site.name}.` }
    ]
  })
];
