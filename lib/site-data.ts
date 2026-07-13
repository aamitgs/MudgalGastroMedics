export const site = {
  name: "Mudgal Gastromedics Hospital",
  shortName: "Mudgal Gastro Medics",
  tagline: "Advanced Gastroenterology, Hepatology & Endoscopy Centre",
  secondaryTagline: "A Gastro & Liver Superspeciality Centre",
  url: "https://www.mudgalgastromedics.com",
  alternateUrl: "https://www.mudgalgastromedics.in",
  addressLine1: "16 HIG, Shaheed Nagar",
  addressLine2: "Behind Shaheed Nagar Police Chowki",
  city: "Agra",
  region: "Uttar Pradesh",
  postalCode: "282001",
  country: "India",
  phone: "0562-3501228",
  mobile: "+91 9828912257",
  whatsapp: "919828912257",
  whatsappAlt: "+91 9084678126",
  email: "admin@mudgalgastromedics.com",
  emailAlt: "admin@mudgalgastromedics.com",
  directionsUrl: "https://maps.app.goo.gl/EHcBzTLo2GUqdLtt5",
  mapEmbed:
    "https://www.google.com/maps?q=Mudgal%20Gastromedics%20Hospital%2016%20HIG%20Shaheed%20Nagar%20Agra&output=embed"
};

export const fullAddress = `${site.addressLine1}, ${site.addressLine2}, ${site.city}, ${site.region} ${site.postalCode}`;

export const doctor = {
  name: "Dr. Deepak Kumar Sharma",
  designation: "Consultant Gastroenterologist & Hepatologist",
  registration: "MCI-57000",
  image: "/placeholders/doctor-deepak-kumar-sharma.svg",
  education: [
    "DM (Gastroenterology), SMS Medical College, Jaipur, 2017",
    "MD (Medicine), S.N. Medical College, Agra, 2013",
    "MBBS, S.N. Medical College, Agra, 2008"
  ],
  experience: [
    "Max Super Speciality Hospital, Shalimar Bagh, 2018-2019",
    "Mudgal Gastromedics Hospital, 2019-Present"
  ],
  interests: [
    "Liver Diseases",
    "Therapeutic Endoscopy",
    "Colonoscopy",
    "ERCP",
    "GI Cancer Screening",
    "Obesity Endoscopy",
    "Pancreatic Disorders"
  ]
};

export const agraLocalAreas = [
  "Shaheed Nagar",
  "Rajpur Chungi",
  "Kaveri Vihar",
  "Panchvati",
  "Fatehabad Road",
  "Shamsabad Road",
  "Tajganj",
  "Agra Cantt",
  "Civil Lines",
  "Kamla Nagar",
  "Dayal Bagh",
  "Sikandra",
  "New Agra",
  "Sanjay Place",
  "Lohamandi",
  "Rakabganj",
  "Khandari",
  "Bhagwan Talkies",
  "Bodla",
  "Shahganj",
  "Jaipur House",
  "Pratap Pura",
  "Sadar Bazar",
  "Delhi Gate",
  "Belanganj",
  "Mantola",
  "Hing Ki Mandi",
  "Raja Ki Mandi",
  "Jeoni Mandi",
  "MG Road",
  "Taj Nagari Phase 1",
  "Taj Nagari Phase 2",
  "Basai",
  "Idgah",
  "Namner",
  "Madhu Nagar",
  "Nehru Nagar",
  "Vijay Nagar Colony",
  "Gailana",
  "Rohta",
  "Shastripuram",
  "Paschimpuri",
  "Avas Vikas Colony",
  "Arjun Nagar",
  "Balkeshwar",
  "Trans Yamuna Colony",
  "Foundry Nagar",
  "Nunhai",
  "Yamuna Kinara Road",
  "Etmadpur Road",
  "Rambagh",
  "Tedi Bagiya",
  "Kalindi Vihar",
  "Swamibagh",
  "Surya Nagar",
  "Kuberpur",
  "Pathauli",
  "Gwalior Road",
  "Mathura Road (NH-19)",
  "Inner Ring Road",
  "Kargil Crossing",
  "Bichpuri",
  "Kheria Mod",
  "Airport Area (Kheria)",
  "Paliwal Park Area"
];

export const nearbyServiceCities = [
  "Agra",
  "Mathura",
  "Vrindavan",
  "Firozabad",
  "Bharatpur",
  "Dholpur",
  "Morena",
  "Fatehpur Sikri",
  "Fatehabad",
  "Bah",
  "Etmadpur",
  "Kheragarh",
  "Achhnera",
  "Pinahat",
  "Tundla",
  "Shikohabad",
  "Jalesar",
  "Sadabad",
  "Deeg",
  "Bayana",
  "Kumher",
  "Nadbai",
  "Bari",
  "Banmore",
  "Ambah",
  "Jaura",
  "Hodal"
];

export const localServiceAreas = Array.from(new Set(["Agra", ...agraLocalAreas, ...nearbyServiceCities]));

export const patientFacilities = [
  "Wheelchair Accessible Entrance",
  "Wheelchair Accessible Exit",
  "Stretcher Accessible Entry",
  "Stretcher Accessible Exit",
  "Lift Facility",
  "Water Cooler",
  "Comfortable Waiting Area",
  "In-House Pharmacy"
];

export const whyChoose = [
  "Experienced Gastroenterologist",
  "Advanced Endoscopy Centre",
  "Comprehensive Liver Care",
  "Modern Medical Equipment",
  "Personalized Treatment Plans",
  "Weight Loss & Nutrition Support",
  "Patient-Centered Approach",
  "Accessible Facilities",
  "In-House Pharmacy",
  "Modern HDU Facility"
];

export const procedures = [
  {
    slug: "endoscopy",
    title: "Endoscopy",
    hiTitle: "एंडोस्कोपी",
    summary: "Upper GI evaluation for acidity, pain, bleeding, ulcers, swallowing difficulty, and screening needs.",
    hiSummary: "एसिडिटी, दर्द, ब्लीडिंग, अल्सर और निगलने में दिक्कत की जांच।"
  },
  {
    slug: "colonoscopy",
    title: "Colonoscopy",
    hiTitle: "कोलोनोस्कोपी",
    summary: "Detailed colon evaluation for bleeding, bowel habit changes, polyps, cancer screening, and inflammatory disease.",
    hiSummary: "ब्लीडिंग, पेट की आदतों में बदलाव, पॉलीप्स और कैंसर स्क्रीनिंग की जांच।"
  },
  {
    slug: "enteroscopy",
    title: "Enteroscopy",
    hiTitle: "एंटेरोस्कोपी",
    summary: "Small bowel assessment for obscure bleeding, suspected lesions, anemia, and selected therapeutic needs.",
    hiSummary: "छोटी आंत की विशेष जांच, खासकर अस्पष्ट ब्लीडिंग और एनीमिया में।"
  },
  {
    slug: "ercp",
    title: "ERCP",
    hiTitle: "ईआरसीपी",
    summary: "Advanced bile duct and pancreatic duct procedure for stones, jaundice, strictures, and stenting.",
    hiSummary: "पित्त नली और पैंक्रियास डक्ट की पथरी, पीलिया और स्टेंटिंग के लिए उन्नत प्रक्रिया।"
  },
  {
    slug: "gastrointestinal-bleeding-management",
    title: "Gastrointestinal Bleeding Management",
    hiTitle: "जीआई ब्लीडिंग मैनेजमेंट",
    summary: "Urgent endoscopic diagnosis and treatment for vomiting blood, black stools, and internal GI bleeding.",
    hiSummary: "खून की उल्टी, काला मल और अंदरूनी जीआई ब्लीडिंग का एंडोस्कोपिक उपचार।"
  },
  {
    slug: "variceal-banding",
    title: "Variceal Banding",
    hiTitle: "वेरिसियल बैंडिंग",
    summary: "Endoscopic treatment for enlarged food-pipe veins commonly linked with chronic liver disease.",
    hiSummary: "लिवर रोग से जुड़ी भोजन नली की सूजी नसों का एंडोस्कोपिक उपचार।"
  },
  {
    slug: "sclerotherapy",
    title: "Sclerotherapy",
    hiTitle: "स्क्लेरोथेरेपी",
    summary: "Injection-based endoscopic treatment used in selected bleeding varices and vascular lesions.",
    hiSummary: "चयनित ब्लीडिंग वैरिसेज और वैस्कुलर लेजन में इंजेक्शन आधारित उपचार।"
  },
  {
    slug: "foreign-body-removal",
    title: "Foreign Body Removal",
    hiTitle: "फॉरेन बॉडी रिमूवल",
    summary: "Endoscopic removal of swallowed objects or impacted food bolus when clinically appropriate.",
    hiSummary: "निगली हुई वस्तु या फंसे भोजन को एंडोस्कोपी से निकालना।"
  },
  {
    slug: "polypectomy",
    title: "Polypectomy",
    hiTitle: "पॉलीपेक्टॉमी",
    summary: "Endoscopic removal of selected stomach or colon polyps with biopsy guidance and follow-up planning.",
    hiSummary: "पेट या बड़ी आंत के पॉलीप्स को एंडोस्कोपी से निकालना।"
  },
  {
    slug: "colon-polyp-removal",
    title: "Colon Polyp Removal",
    hiTitle: "कोलन पॉलीप रिमूवल",
    summary: "Colonoscopy-guided removal of suitable colon polyps with biopsy reporting and future surveillance planning.",
    hiSummary: "कोलोनोस्कोपी द्वारा उपयुक्त कोलन पॉलीप्स को निकालना और बायोप्सी व आगे की निगरानी की योजना।"
  },
  {
    slug: "endoscopic-biopsy",
    title: "Endoscopic Biopsy",
    hiTitle: "एंडोस्कोपिक बायोप्सी",
    summary: "Targeted tissue sampling during endoscopy or colonoscopy to help diagnose ulcers, inflammation, infection, polyps, or suspected growths.",
    hiSummary: "अल्सर, सूजन, संक्रमण, पॉलीप्स या संदिग्ध ग्रोथ की जांच के लिए एंडोस्कोपी या कोलोनोस्कोपी के दौरान ऊतक सैंपल लेना।"
  },
  {
    slug: "ryles-tube-placement",
    title: "Ryle's Tube Placement",
    hiTitle: "राइल्स ट्यूब प्लेसमेंट",
    summary: "Safe tube placement support for nutrition, decompression, and selected inpatient care needs.",
    hiSummary: "न्यूट्रिशन और मरीज देखभाल के लिए सुरक्षित ट्यूब प्लेसमेंट।"
  },
  {
    slug: "nasojejunal-tube-placement",
    title: "Nasojejunal Tube Placement",
    hiTitle: "नासोजेजुनल ट्यूब प्लेसमेंट",
    summary: "Tube placement beyond the stomach for feeding support in selected pancreatitis and GI conditions.",
    hiSummary: "चयनित पैंक्रियाटाइटिस और जीआई रोगों में फीडिंग सपोर्ट।"
  },
  {
    slug: "peg-tube-placement",
    title: "PEG Tube Placement",
    hiTitle: "पीईजी ट्यूब प्लेसमेंट",
    summary: "Endoscopic feeding tube placement for patients needing longer-term nutritional support.",
    hiSummary: "लंबे समय तक पोषण सहायता की जरूरत वाले मरीजों के लिए फीडिंग ट्यूब।"
  },
  {
    slug: "cbd-stone-removal",
    title: "CBD Stone Removal",
    hiTitle: "सीबीडी स्टोन रिमूवल",
    summary: "ERCP-based treatment for common bile duct stones causing pain, infection, or jaundice.",
    hiSummary: "दर्द, संक्रमण या पीलिया पैदा करने वाली पित्त नली की पथरी का उपचार।"
  },
  {
    slug: "pancreatic-duct-stone-removal",
    title: "Pancreatic Duct Stone Removal",
    hiTitle: "पैंक्रियाटिक डक्ट स्टोन रिमूवल",
    summary: "Advanced pancreatic duct stone management in suitable chronic pancreatitis cases.",
    hiSummary: "उपयुक्त क्रॉनिक पैंक्रियाटाइटिस मामलों में पैंक्रियाटिक डक्ट स्टोन का उपचार।"
  },
  {
    slug: "stricture-dilation",
    title: "Stricture Dilation",
    hiTitle: "स्ट्रिक्चर डाइलेशन",
    summary: "Endoscopic widening of selected narrowed areas in the food pipe or GI tract.",
    hiSummary: "भोजन नली या जीआई ट्रैक्ट के संकरे हिस्सों को एंडोस्कोपी से चौड़ा करना।"
  },
  {
    slug: "esophageal-dilation",
    title: "Esophageal Dilation",
    hiTitle: "ईसोफेजियल डाइलेशन",
    summary: "Endoscopic widening of selected food-pipe narrowing that causes swallowing difficulty or food sticking.",
    hiSummary: "निगलने में दिक्कत या भोजन फंसने वाली भोजन नली की सिकुड़न को एंडोस्कोपी से चौड़ा करना।"
  },
  {
    slug: "gi-stenting",
    title: "GI Stenting",
    hiTitle: "जीआई स्टेंटिंग",
    summary: "Stent placement for selected GI blockages, strictures, bile duct obstruction, and palliative care needs.",
    hiSummary: "जीआई रुकावट, स्ट्रिक्चर और पित्त नली अवरोध में स्टेंटिंग।"
  },
  {
    slug: "bile-duct-stenting",
    title: "Bile Duct Stenting",
    hiTitle: "बाइल डक्ट स्टेंटिंग",
    summary: "ERCP-guided stent placement to relieve bile duct blockage from stones, strictures, tumors, or pancreaticobiliary disease.",
    hiSummary: "पथरी, सिकुड़न, ट्यूमर या पैंक्रियाटोबिलियरी रोग से पित्त नली की रुकावट में ईआरसीपी द्वारा स्टेंट लगाना।"
  },
  {
    slug: "endoscopic-hemostasis",
    title: "Endoscopic Hemostasis",
    hiTitle: "एंडोस्कोपिक हीमोस्टेसिस",
    summary: "Endoscopic treatment to control selected gastrointestinal bleeding using clips, injection, thermal therapy, or other suitable techniques.",
    hiSummary: "क्लिप, इंजेक्शन, थर्मल थेरेपी या अन्य तकनीकों से चुनी हुई जीआई ब्लीडिंग को एंडोस्कोपी द्वारा नियंत्रित करना।"
  },
  {
    slug: "argon-plasma-coagulation",
    title: "Argon Plasma Coagulation (APC)",
    hiTitle: "आर्गन प्लाज्मा कोएगुलेशन",
    summary: "Non-contact endoscopic coagulation used for selected bleeding vascular lesions, radiation injury, and suitable superficial GI lesions.",
    hiSummary: "चयनित ब्लीडिंग वैस्कुलर लेजन, रेडिएशन इंजरी और उपयुक्त सतही जीआई लेजन के लिए नॉन-कॉन्टैक्ट एंडोस्कोपिक कोएगुलेशन।"
  },
  {
    slug: "intragastric-balloon-placement",
    title: "Intragastric Balloon Placement",
    hiTitle: "इंट्रागैस्ट्रिक बैलून",
    summary: "Non-surgical endoscopic weight-loss support for selected patients with lifestyle and nutrition guidance.",
    hiSummary: "चयनित मरीजों के लिए बिना सर्जरी एंडोस्कोपिक वजन घटाने की सहायता।"
  },
  {
    slug: "fibroscan",
    title: "Fibroscan",
    hiTitle: "फाइब्रोस्कैन",
    summary: "Non-invasive liver stiffness and fatty liver assessment for chronic liver disease monitoring.",
    hiSummary: "लिवर की कठोरता और फैटी लिवर की बिना चीरा जांच।"
  },
  {
    slug: "ascitic-fluid-tapping",
    title: "Ascitic Fluid Tapping",
    hiTitle: "एसाइटिक फ्लूइड टैपिंग",
    summary: "Clinical drainage and testing support for abdominal fluid in liver and other medical conditions.",
    hiSummary: "लिवर और अन्य रोगों में पेट के पानी की जांच और निकासी।"
  },
  {
    slug: "varices",
    title: "Varices",
    hiTitle: "वेरिसेस",
    summary: "Evaluation and treatment planning for enlarged food-pipe or stomach veins, commonly associated with chronic liver disease and bleeding risk.",
    hiSummary: "लिवर रोग से जुड़ी भोजन नली या पेट की सूजी नसों और ब्लीडिंग जोखिम की जांच व उपचार योजना।"
  },
  {
    slug: "liver-cirrhosis",
    title: "Liver Cirrhosis",
    hiTitle: "लिवर सिरोसिस",
    summary: "Specialist assessment for chronic liver damage, portal hypertension, fluid in the abdomen, varices, jaundice, and long-term liver care planning.",
    hiSummary: "पुराने लिवर नुकसान, पोर्टल हाइपरटेंशन, पेट में पानी, वेरिसेस, पीलिया और लंबी अवधि की लिवर देखभाल की जांच।"
  },
  {
    slug: "fatty-liver",
    title: "Fatty Liver",
    hiTitle: "फैटी लिवर",
    summary: "Assessment of fatty liver, liver stiffness, metabolic risk, abnormal liver tests, and lifestyle-based prevention of progressive liver disease.",
    hiSummary: "फैटी लिवर, लिवर कठोरता, मेटाबॉलिक जोखिम, असामान्य लिवर रिपोर्ट और जीवनशैली आधारित बचाव की जांच।"
  },
  {
    slug: "liver-fibrosis",
    title: "Liver Fibrosis",
    hiTitle: "लिवर फाइब्रोसिस",
    summary: "Non-invasive evaluation and monitoring for liver scarring caused by fatty liver, alcohol, viral hepatitis, or chronic liver conditions.",
    hiSummary: "फैटी लिवर, अल्कोहल, वायरल हेपेटाइटिस या पुराने लिवर रोग से होने वाली लिवर स्कारिंग की जांच और निगरानी।"
  },
  {
    slug: "obstructive-jaundice",
    title: "Obstructive Jaundice",
    hiTitle: "अवरोधक पीलिया",
    summary: "Evaluation of jaundice caused by bile duct blockage, stones, strictures, tumors, or pancreaticobiliary disease with ERCP planning when needed.",
    hiSummary: "पित्त नली में रुकावट, पथरी, सिकुड़न, ट्यूमर या पैंक्रियाटोबिलियरी रोग से होने वाले पीलिया की जांच।"
  },
  {
    slug: "bile-duct-stricture",
    title: "Bile Duct Stricture",
    hiTitle: "बाइल डक्ट सिकुड़न",
    summary: "Diagnosis and treatment planning for narrowed bile ducts causing jaundice, itching, infection, abnormal liver tests, or recurrent bile duct symptoms.",
    hiSummary: "पित्त नली की सिकुड़न से होने वाले पीलिया, खुजली, संक्रमण और असामान्य लिवर रिपोर्ट की जांच व उपचार योजना।"
  },
  {
    slug: "pancreatic-disorders",
    title: "Pancreatic Disorders",
    hiTitle: "पैंक्रियास रोग",
    summary: "Consultation for pancreatitis, pancreatic duct stones, recurrent upper abdominal pain, pancreatic fluid collections, and related digestive complications.",
    hiSummary: "पैंक्रियाटाइटिस, पैंक्रियाटिक डक्ट स्टोन, बार-बार ऊपरी पेट दर्द, पैंक्रियास फ्लूइड कलेक्शन और संबंधित पाचन समस्याओं की जांच।"
  },
  {
    slug: "acidity-gerd",
    title: "Acidity & GERD",
    hiTitle: "एसिडिटी और जीईआरडी",
    summary: "Evaluation for chronic acidity, reflux, heartburn, regurgitation, chest discomfort, throat irritation, and complications needing endoscopy.",
    hiSummary: "लंबे समय की एसिडिटी, रिफ्लक्स, सीने में जलन, खट्टा पानी, गले में जलन और एंडोस्कोपी की जरूरत वाली समस्याओं की जांच।"
  },
  {
    slug: "peptic-ulcer-disease",
    title: "Peptic Ulcer Disease",
    hiTitle: "पेप्टिक अल्सर रोग",
    summary: "Diagnosis and treatment support for stomach or duodenal ulcers causing pain, acidity, vomiting, anemia, black stools, or bleeding symptoms.",
    hiSummary: "पेट या ड्यूडेनम के अल्सर से होने वाले दर्द, एसिडिटी, उल्टी, एनीमिया, काला मल या ब्लीडिंग की जांच और उपचार।"
  },
  {
    slug: "difficulty-swallowing",
    title: "Difficulty Swallowing",
    hiTitle: "निगलने में दिक्कत",
    summary: "Assessment of swallowing difficulty due to food-pipe narrowing, reflux-related injury, motility problems, strictures, or suspected growths.",
    hiSummary: "भोजन नली की सिकुड़न, रिफ्लक्स से नुकसान, मोटिलिटी समस्या, स्ट्रिक्चर या संदिग्ध ग्रोथ से निगलने में दिक्कत की जांच।"
  },
  {
    slug: "gi-stricture",
    title: "GI Stricture",
    hiTitle: "जीआई सिकुड़न",
    summary: "Evaluation of narrowed areas in the food pipe, stomach, intestine, bile duct, or colon with endoscopic dilation or stenting planning when suitable.",
    hiSummary: "भोजन नली, पेट, आंत, पित्त नली या कोलन की सिकुड़न की जांच और जरूरत अनुसार डाइलेशन या स्टेंटिंग की योजना।"
  },
  {
    slug: "colon-polyps",
    title: "Colon Polyps",
    hiTitle: "कोलन पॉलीप्स",
    summary: "Colonoscopy-based assessment and removal planning for colon polyps, cancer screening, bleeding evaluation, and biopsy-guided follow-up.",
    hiSummary: "कोलन पॉलीप्स, कैंसर स्क्रीनिंग, ब्लीडिंग जांच और बायोप्सी आधारित फॉलो-अप के लिए कोलोनोस्कोपी योजना।"
  },
  {
    slug: "ibd-colitis",
    title: "IBD / Colitis",
    hiTitle: "आईबीडी / कोलाइटिस",
    summary: "Care for suspected or known inflammatory bowel disease, colitis, chronic diarrhea, bleeding, abdominal pain, and colonoscopy-based monitoring.",
    hiSummary: "आईबीडी, कोलाइटिस, लंबे समय के दस्त, ब्लीडिंग, पेट दर्द और कोलोनोस्कोपी आधारित निगरानी की देखभाल।"
  },
  {
    slug: "ibs",
    title: "IBS",
    hiTitle: "आईबीएस",
    summary: "Evaluation and treatment planning for irritable bowel syndrome with abdominal pain, bloating, constipation, diarrhea, urgency, and recurrent bowel habit changes.",
    hiSummary: "पेट दर्द, गैस, कब्ज, दस्त, जल्दी शौच की जरूरत और बार-बार बदलती मल आदतों वाले आईबीएस की जांच और उपचार योजना।"
  },
  {
    slug: "chronic-constipation",
    title: "Chronic Constipation",
    hiTitle: "लंबे समय की कब्ज",
    summary: "Assessment of long-standing constipation, hard stools, straining, incomplete evacuation, bloating, medicine causes, and colonoscopy need when warning signs are present.",
    hiSummary: "लंबे समय की कब्ज, सख्त मल, जोर लगना, अधूरा शौच, गैस, दवा से जुड़ी वजह और जरूरत होने पर कोलोनोस्कोपी की जांच।"
  },
  {
    slug: "chronic-diarrhea",
    title: "Chronic Diarrhea",
    hiTitle: "लंबे समय के दस्त",
    summary: "Evaluation of persistent diarrhea, loose stools, urgency, blood or mucus in stool, weight loss, infection, IBS, colitis, and malabsorption concerns.",
    hiSummary: "लगातार दस्त, पतला मल, जल्दी शौच, मल में खून या म्यूकस, वजन घटना, संक्रमण, आईबीएस, कोलाइटिस और मालएब्जॉर्प्शन की जांच।"
  },
  {
    slug: "ascites",
    title: "Ascites",
    hiTitle: "पेट में पानी",
    summary: "Evaluation of abdominal fluid commonly linked with liver disease, infection, low protein states, or other medical conditions requiring testing and treatment planning.",
    hiSummary: "लिवर रोग, संक्रमण, कम प्रोटीन या अन्य कारणों से पेट में पानी की जांच, टेस्टिंग और उपचार योजना।"
  }
];

export const galleryItems = [
  ["Hospital Exterior", "Hospital Front View", "hospital-front-view", "/images/hospital/hospital-front-view.jpg"],
  ["Hospital Exterior", "Entrance", "entrance", "/images/hospital/entrance.jpg"],
  ["Reception", "Reception Desk", "reception-desk", "/images/hospital/reception-desk.jpg"],
  ["Patient Facilities", "Pharmacy", "pharmacy", "/images/hospital/pharmacy.jpg"],
  ["Patient Facilities", "Lift", "lift", "/images/hospital/lift.jpg"],
  ["Reception", "Waiting Area", "reception-waiting-area", "/images/hospital/reception-waiting-area.jpg"],
  ["Consultation Areas", "Doctor Chamber", "doctor-chamber", "/images/hospital/doctor-chamber.jpg"],
  ["Endoscopy Unit", "Endoscopy Room", "endoscopy-room", "/images/hospital/endoscopy-room.jpg"],
  ["Endoscopy Unit", "CBD Stone Removal", "cbd-stone-removal", "/images/hospital/cbd-stone-removal.jpg"],
  ["Consultation Areas", "Duty Doctor Chamber", "duty-doctor-chamber", "/images/hospital/duty-doctor-chamber.jpg"],
  ["HDU", "HDU Cabin", "hdu-cabin", "/images/hospital/hdu-cabin.jpg"],
  ["HDU", "HDU Ward", "hdu-ward", "/images/hospital/hdu-ward.jpg"],
  ["Patient Rooms", "IPD Waiting Area", "ipd-waiting-area", "/images/hospital/ipd-waiting-area.jpg"],
  ["Patient Rooms", "Private Room 1", "private-room-1", "/images/hospital/private-room-1.jpg"],
  ["Patient Rooms", "Private Room 2", "private-room-2", "/images/hospital/private-room-2.jpg"],
  ["Patient Rooms", "Private Room Lobby", "private-room-lobby", "/images/hospital/private-room-lobby.jpg"]
].map(([category, title, slug, src]) => ({ category, title, slug, src }));

export const equipment = [
  {
    name: "Colonoscope",
    uses: "Colonoscopy, polyp detection, bleeding evaluation",
    benefits: "High-resolution colon assessment with therapeutic capability",
    src: "/images/hospital/colonoscope.jpg"
  },
  {
    name: "Endoscope",
    uses: "Upper GI evaluation, biopsy, bleeding control",
    benefits: "Clear visualization of food pipe, stomach, and duodenum",
    src: "/images/hospital/endoscope.jpg"
  },
  {
    name: "ERCP Scope",
    uses: "Bile duct stones, strictures, jaundice care",
    benefits: "Specialized access for therapeutic pancreato-biliary care",
    src: "/images/hospital/ercp-scope.jpg"
  },
  {
    name: "C-Arm Machine",
    uses: "Fluoroscopy support for ERCP and stenting",
    benefits: "Real-time imaging support during advanced procedures",
    src: "/images/hospital/c-arm-machine.jpg"
  },
  {
    name: "Fibroscan",
    uses: "Liver stiffness and fatty liver assessment",
    benefits: "Non-invasive liver evaluation for chronic liver disease monitoring",
    src: "/images/hospital/fibroscan.jpg"
  },
  {
    name: "Cautery Machine",
    uses: "Bleeding control, polypectomy, therapeutic endoscopy",
    benefits: "Precise tissue treatment and hemostasis support",
    src: "/images/hospital/cautery-machine.jpg"
  }
];

export const allImagePlaceholders = [
  ...galleryItems.map((item) => ({ slug: item.slug, title: item.title, category: item.category })),
  ...equipment.map((item) => ({
    slug: item.src.split("/").pop()?.replace(/\.(svg|jpe?g|png|webp)$/i, "") ?? item.name,
    title: item.name,
    category: "Medical Equipment"
  })),
  { slug: "doctor-deepak-kumar-sharma", title: doctor.name, category: "Doctor Photo Placeholder" }
];

export function hospitalSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Hospital", "MedicalClinic"],
    name: site.name,
    alternateName: site.shortName,
    url: site.url,
    logo: `${site.url}/mgm-logo.png`,
    image: `${site.url}/images/hospital/hospital-front-view.jpg`,
    telephone: [site.phone, site.mobile],
    email: [site.email, site.emailAlt],
    sameAs: [
      "https://www.facebook.com/MudgalGastromedics",
      "https://www.youtube.com/@mudgalgastromedics9355",
      "https://whatsapp.com/channel/0029VaLI8y2J93wdMvMwWM2d"
    ],
    priceRange: "₹₹",
    additionalType: ["Gastroenterology Hospital", "Liver Care Centre", "Endoscopy Centre"],
    medicalSpecialty: ["Gastroenterology", "Hepatology", "Endoscopy"],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
      addressLocality: site.city,
      addressRegion: site.region,
      postalCode: site.postalCode,
      addressCountry: "IN"
    },
    areaServed: localServiceAreas,
    hasMap: site.directionsUrl,
    availableService: [
      { "@type": "MedicalTherapy", name: "Gastroenterology Consultation" },
      { "@type": "MedicalTherapy", name: "Hepatology and Liver Care" },
      { "@type": "MedicalProcedure", name: "Upper GI Endoscopy" },
      { "@type": "MedicalProcedure", name: "Colonoscopy" },
      { "@type": "MedicalProcedure", name: "ERCP" },
      { "@type": "MedicalTest", name: "FibroScan" }
    ],
    department: [
      { "@type": "MedicalClinic", name: "Advanced Endoscopy Centre" },
      { "@type": "MedicalClinic", name: "Liver Care Clinic" },
      { "@type": "MedicalClinic", name: "Diagnostic Services" }
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "11:00",
        closes: "14:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "17:00",
        closes: "18:00"
      }
    ],
    physician: {
      "@type": "Physician",
      name: doctor.name,
      medicalSpecialty: ["Gastroenterology", "Hepatology"],
      identifier: doctor.registration
    }
  };
}
