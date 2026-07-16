import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { Award, CheckCircle2, GraduationCap, HeartPulse, HelpCircle, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { doctor, fullAddress, site } from "@/lib/site-data";

const pageTitle = "Dr. Deepak Kumar Sharma | Gastroenterologist & Liver Specialist in Agra";
const pageDescription =
  "Consult Dr. Deepak Kumar Sharma, Gastroenterologist, Liver Specialist & Advanced Endoscopist in Agra, for digestive disorders, liver disease, ERCP, colonoscopy, endoscopy, and pancreatic and GI care.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "Gastroenterologist in Agra",
    "Liver Specialist in Agra",
    "Dr Deepak Kumar Sharma",
    "DM Gastroenterologist in Agra",
    "Endoscopist in Agra",
    "ERCP Specialist in Agra",
    "Colonoscopy in Agra",
    "Stomach Specialist in Agra",
    "Pancreas Specialist in Agra"
  ],
  alternates: { canonical: "/dr-deepak-kumar-sharma-gastroenterologist-agra" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${site.url}/dr-deepak-kumar-sharma-gastroenterologist-agra`,
    type: "profile",
    images: ["/images/hospital/dr-deepak-kumar-sharma.jpg"]
  }
};

const expertise = [
  ["Fatty Liver Disease", "फैटी लिवर डिजीज़"],
  ["Hepatitis B and Hepatitis C", "हेपेटाइटिस बी और हेपेटाइटिस सी"],
  ["Liver Cirrhosis", "लिवर सिरोसिस"],
  ["Liver Failure", "लिवर फेल्योर"],
  ["Liver Cancer", "लिवर कैंसर"],
  ["Alcohol-Related Liver Disease", "शराब से संबंधित लिवर रोग"],
  ["GERD and Acid Reflux", "जीईआरडी और एसिड रिफ्लक्स"],
  ["Gastritis and Peptic Ulcers", "गैस्ट्राइटिस और पेप्टिक अल्सर"],
  ["Peptic Esophagitis", "पेप्टिक एसोफेगाइटिस"],
  ["Esophageal Stricture", "एसोफेजियल स्ट्रिक्चर"],
  ["Ulcerative Colitis", "अल्सरेटिव कोलाइटिस"],
  ["Crohn's Disease", "क्रोहन रोग"],
  ["Inflammatory Bowel Disease", "इंफ्लेमेटरी बाउल डिजीज़"],
  ["Irritable Bowel Syndrome", "इरिटेबल बाउल सिंड्रोम"],
  ["Gastrointestinal Bleeding", "जठरांत्र रक्तस्राव (जीआई ब्लीडिंग)"],
  ["Rectal Bleeding", "मलाशय से रक्तस्राव"],
  ["Chronic Constipation", "पुरानी कब्ज़"],
  ["Chronic Diarrhea", "पुराना दस्त"],
  ["Abdominal Pain and Bloating", "पेट दर्द और सूजन"],
  ["Enteritis and Enteric Fever", "एंटेराइटिस और आंत्र ज्वर"],
  ["Pancreatic Disorders", "अग्न्याशय संबंधी रोग"],
  ["Gallbladder and Biliary Disorders", "पित्ताशय और पित्त नली संबंधी रोग"]
].map(([en, hi]) => ({ en, hi }));

const procedures = [
  ["Upper GI Endoscopy", "अपर जीआई एंडोस्कोपी"],
  ["Colonoscopy", "कोलोनोस्कोपी"],
  ["ERCP", "ईआरसीपी"],
  ["FibroScan", "फाइब्रोस्कैन"],
  ["Capsule Endoscopy", "कैप्सूल एंडोस्कोपी"],
  ["Polypectomy", "पॉलीपेक्टॉमी"],
  ["Variceal Band Ligation", "वेरिसियल बैंड लिगेशन"],
  ["Endoscopic Hemostasis", "एंडोस्कोपिक हीमोस्टेसिस"],
  ["Advanced Therapeutic Endoscopy", "उन्नत चिकित्सीय एंडोस्कोपी"]
].map(([en, hi]) => ({ en, hi }));

const keyServices = [
  ["Liver Disease Treatment", "लिवर रोग उपचार"],
  ["Therapeutic Endoscopy", "चिकित्सीय एंडोस्कोपी"],
  ["Colonoscopy", "कोलोनोस्कोपी"],
  ["ERCP", "ईआरसीपी"],
  ["GI Cancer Screening", "जीआई कैंसर स्क्रीनिंग"],
  ["Obesity Endoscopy", "मोटापा एंडोस्कोपी"],
  ["Pancreatic Disorder Treatment", "अग्न्याशय रोग उपचार"],
  ["Gallbladder and Biliary Disease Management", "पित्ताशय और पित्त नली रोग प्रबंधन"]
].map(([en, hi]) => ({ en, hi }));

const whyChoose = [
  ["Specialist care in gastroenterology and hepatology", "गैस्ट्रोएंटरोलॉजी और हेपेटोलॉजी में विशेषज्ञ देखभाल"],
  ["Advanced endoscopy and diagnostic facilities", "उन्नत एंडोस्कोपी और डायग्नोस्टिक सुविधाएं"],
  ["Experience in liver, pancreatic, biliary, and intestinal diseases", "लिवर, अग्न्याशय, पित्त और आंत संबंधी रोगों में अनुभव"],
  ["Evidence-based diagnosis and treatment planning", "साक्ष्य-आधारित निदान और उपचार योजना"],
  ["Patient-focused consultation and follow-up care", "मरीज़-केंद्रित परामर्श और फॉलो-अप देखभाल"],
  ["Comprehensive care under one roof at Mudgal Gastromedics Hospital", "मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में एक ही स्थान पर संपूर्ण देखभाल"]
].map(([en, hi]) => ({ en, hi }));

const consultationGuide = [
  {
    title: "When to consult Dr. Deepak",
    titleHi: "डॉ. दीपक से कब परामर्श करें",
    text: "Patients should consider gastroenterology consultation when symptoms persist, recur, or are linked with warning signs.",
    textHi: "यदि लक्षण बने रहें, बार-बार हों, या चेतावनी संकेतों से जुड़े हों, तो मरीज़ों को गैस्ट्रोएंटरोलॉजी परामर्श पर विचार करना चाहिए।",
    items: [
      ["Frequent acidity, abdominal pain, bloating or vomiting", "बार-बार एसिडिटी, पेट दर्द, सूजन या उल्टी"],
      ["Constipation, diarrhea or altered bowel habits", "कब्ज़, दस्त या मल त्याग की आदतों में बदलाव"],
      ["Blood in stool, black stools or vomiting blood", "मल में खून, काला मल या खून की उल्टी"],
      ["Jaundice, fatty liver or abnormal liver tests", "पीलिया, फैटी लिवर या असामान्य लिवर टेस्ट"],
      ["Difficulty swallowing or unexplained weight loss", "निगलने में कठिनाई या अस्पष्टीकृत वज़न घटना"]
    ].map(([en, hi]) => ({ en, hi }))
  },
  {
    title: "What to bring",
    titleHi: "क्या साथ लाएं",
    text: "Previous records help avoid repeat testing and make the consultation more useful.",
    textHi: "पिछले रिकॉर्ड दोबारा जांच से बचने में मदद करते हैं और परामर्श को अधिक उपयोगी बनाते हैं।",
    items: [
      ["Old prescriptions and current medicines", "पुराने प्रिस्क्रिप्शन और वर्तमान दवाएं"],
      ["Blood reports, LFT, CBC, INR and stool reports", "ब्लड रिपोर्ट, एलएफटी, सीबीसी, आईएनआर और स्टूल रिपोर्ट"],
      ["Ultrasound, CT, MRCP or FibroScan reports", "अल्ट्रासाउंड, सीटी, एमआरसीपी या फाइब्रोस्कैन रिपोर्ट"],
      ["Endoscopy, colonoscopy, biopsy or discharge summaries", "एंडोस्कोपी, कोलोनोस्कोपी, बायोप्सी या डिस्चार्ज समरी"],
      ["Diabetes, BP, allergy and blood thinner details", "डायबिटीज़, बीपी, एलर्जी और ब्लड थिनर की जानकारी"]
    ].map(([en, hi]) => ({ en, hi }))
  },
  {
    title: "What happens during consultation",
    titleHi: "परामर्श के दौरान क्या होता है",
    text: "The consultation focuses on symptom pattern, report review, diagnosis, treatment planning and follow-up guidance.",
    textHi: "परामर्श में लक्षणों के पैटर्न, रिपोर्ट समीक्षा, निदान, उपचार योजना और फॉलो-अप मार्गदर्शन पर ध्यान दिया जाता है।",
    items: [
      ["History and warning-sign review", "इतिहास और चेतावनी संकेतों की समीक्षा"],
      ["Previous report assessment", "पिछली रिपोर्ट का आकलन"],
      ["Medicine and diet guidance", "दवा और आहार संबंधी मार्गदर्शन"],
      ["Test or procedure planning if needed", "आवश्यकता पड़ने पर जांच या प्रक्रिया की योजना"],
      ["Follow-up and emergency warning advice", "फॉलो-अप और आपातकालीन चेतावनी सलाह"]
    ].map(([en, hi]) => ({ en, hi }))
  },
  {
    title: "When to call urgently",
    titleHi: "तुरंत कब कॉल करें",
    text: "Some symptoms should not wait for a routine appointment.",
    textHi: "कुछ लक्षणों के लिए नियमित अपॉइंटमेंट का इंतज़ार नहीं करना चाहिए।",
    items: [
      ["Vomiting blood or black stools", "खून की उल्टी या काला मल"],
      ["Severe abdominal pain or persistent vomiting", "गंभीर पेट दर्द या लगातार उल्टी"],
      ["Fever with jaundice", "पीलिया के साथ बुखार"],
      ["Fainting, severe weakness or dehydration", "बेहोशी, गंभीर कमज़ोरी या निर्जलीकरण"],
      ["Confusion or increasing abdominal swelling in liver disease", "लिवर रोग में भ्रम या बढ़ता पेट फूलना"]
    ].map(([en, hi]) => ({ en, hi }))
  }
];

const educationRows = [
  ["DM Gastroenterology", "DM Gastroenterology", "SMS Medical College, Jaipur, 2017"],
  ["MD Medicine", "MD Medicine", "S.N. Medical College, Agra, 2013"],
  ["Advanced Clinical Experience", "उन्नत नैदानिक अनुभव", "Max Super Specialty Hospital, Shalimar Bagh, 2018-2019"],
  ["Current Practice", "वर्तमान अभ्यास", "Mudgal Gastromedics Hospital, Agra, 2019-Present"]
];

const faqs = [
  {
    question: "Who is Dr. Deepak Kumar Sharma?",
    questionHi: "डॉ. दीपक कुमार शर्मा कौन हैं?",
    answer: "Dr. Deepak Kumar Sharma is a Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra. He is the Founder and Principal Consultant at Mudgal Gastromedics Hospital and specializes in digestive, liver, pancreatic, intestinal, and biliary disorders.",
    answerHi: "डॉ. दीपक कुमार शर्मा आगरा में एक गैस्ट्रोएंटरोलॉजिस्ट, हेपेटोलॉजिस्ट और एडवांस्ड एंडोस्कोपिस्ट हैं। वे मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल के संस्थापक और प्रधान सलाहकार हैं और पाचन, लिवर, अग्न्याशय, आंत और पित्त संबंधी रोगों में विशेषज्ञ हैं।"
  },
  {
    question: "What conditions does Dr. Deepak Kumar Sharma treat?",
    questionHi: "डॉ. दीपक कुमार शर्मा किन बीमारियों का इलाज करते हैं?",
    answer: "Dr. Sharma treats fatty liver disease, hepatitis B and C, liver cirrhosis, GERD, acidity, gastritis, ulcers, inflammatory bowel disease, constipation, diarrhea, abdominal pain, GI bleeding, pancreatic disorders, and gallbladder diseases.",
    answerHi: "डॉ. शर्मा फैटी लिवर डिजीज़, हेपेटाइटिस बी और सी, लिवर सिरोसिस, जीईआरडी, एसिडिटी, गैस्ट्राइटिस, अल्सर, इंफ्लेमेटरी बाउल डिजीज़, कब्ज़, दस्त, पेट दर्द, जीआई ब्लीडिंग, अग्न्याशय संबंधी रोग और पित्ताशय के रोगों का इलाज करते हैं।"
  },
  {
    question: "Does Dr. Deepak Kumar Sharma perform endoscopy and colonoscopy?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा एंडोस्कोपी और कोलोनोस्कोपी करते हैं?",
    answer: "Yes. Dr. Sharma performs diagnostic and therapeutic procedures including upper GI endoscopy, colonoscopy, ERCP, FibroScan, polypectomy, variceal band ligation, and endoscopic hemostasis.",
    answerHi: "जी हां। डॉ. शर्मा अपर जीआई एंडोस्कोपी, कोलोनोस्कोपी, ईआरसीपी, फाइब्रोस्कैन, पॉलीपेक्टॉमी, वेरिसियल बैंड लिगेशन और एंडोस्कोपिक हीमोस्टेसिस सहित डायग्नोस्टिक और चिकित्सीय प्रक्रियाएं करते हैं।"
  },
  {
    question: "Where does Dr. Deepak Kumar Sharma practice?",
    questionHi: "डॉ. दीपक कुमार शर्मा कहां प्रैक्टिस करते हैं?",
    answer: `Dr. Deepak Kumar Sharma practices at ${site.name}, ${fullAddress}.`,
    answerHi: `डॉ. दीपक कुमार शर्मा ${site.name}, ${fullAddress} में प्रैक्टिस करते हैं।`
  },
  {
    question: "Is Dr. Deepak Kumar Sharma a liver specialist in Agra?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा आगरा में लिवर विशेषज्ञ हैं?",
    answer: "Yes. Dr. Sharma diagnoses and treats liver diseases including fatty liver, hepatitis B, hepatitis C, alcohol-related liver disease, liver cirrhosis, liver failure, and liver cancer.",
    answerHi: "जी हां। डॉ. शर्मा फैटी लिवर, हेपेटाइटिस बी, हेपेटाइटिस सी, शराब से संबंधित लिवर रोग, लिवर सिरोसिस, लिवर फेल्योर और लिवर कैंसर सहित लिवर रोगों का निदान और उपचार करते हैं।"
  },
  {
    question: "How can I book a consultation with Dr. Deepak Kumar Sharma?",
    questionHi: "मैं डॉ. दीपक कुमार शर्मा के साथ परामर्श कैसे बुक कर सकता हूं?",
    answer: `You can book a consultation by calling ${site.mobile}, sending a WhatsApp message, or using the appointment form on the website.`,
    answerHi: `आप ${site.mobile} पर कॉल करके, व्हाट्सएप संदेश भेजकर, या वेबसाइट पर अपॉइंटमेंट फॉर्म का उपयोग करके परामर्श बुक कर सकते हैं।`
  },
  {
    question: "What symptoms should I see a gastroenterologist for?",
    questionHi: "किन लक्षणों के लिए मुझे गैस्ट्रोएंटरोलॉजिस्ट को दिखाना चाहिए?",
    answer: "Consult a gastroenterologist for frequent acidity, heartburn, stomach pain, bloating, vomiting, difficulty swallowing, constipation, diarrhea, blood in stool, unexplained weight loss, jaundice, or long-term digestive discomfort.",
    answerHi: "बार-बार एसिडिटी, सीने में जलन, पेट दर्द, सूजन, उल्टी, निगलने में कठिनाई, कब्ज़, दस्त, मल में खून, अस्पष्टीकृत वज़न घटना, पीलिया या लंबे समय से पाचन संबंधी परेशानी के लिए गैस्ट्रोएंटरोलॉजिस्ट से परामर्श करें।"
  },
  {
    question: "When should I consult a liver specialist in Agra?",
    questionHi: "मुझे आगरा में लिवर विशेषज्ञ से कब परामर्श करना चाहिए?",
    answer: "Consult a liver specialist for jaundice, fatty liver, abnormal liver function tests, hepatitis B or C, alcohol-related liver problems, abdominal swelling, unexplained tiredness, or suspected liver cirrhosis.",
    answerHi: "पीलिया, फैटी लिवर, असामान्य लिवर फंक्शन टेस्ट, हेपेटाइटिस बी या सी, शराब से संबंधित लिवर समस्याएं, पेट फूलना, अस्पष्टीकृत थकान या लिवर सिरोसिस की आशंका होने पर लिवर विशेषज्ञ से परामर्श करें।"
  },
  {
    question: "What is ERCP and when is it required?",
    questionHi: "ईआरसीपी क्या है और यह कब आवश्यक होता है?",
    answer: "ERCP is an advanced endoscopic procedure used to diagnose and treat bile duct, pancreas, and gallbladder system problems such as bile duct stones, blocked ducts, jaundice, and pancreato-biliary disorders.",
    answerHi: "ईआरसीपी एक उन्नत एंडोस्कोपिक प्रक्रिया है जिसका उपयोग पित्त नली, अग्न्याशय और पित्ताशय प्रणाली की समस्याओं जैसे पित्त नली की पथरी, अवरुद्ध नलियों, पीलिया और पैंक्रियाटो-बिलियरी रोगों के निदान और उपचार के लिए किया जाता है।"
  },
  {
    question: "Is colonoscopy available at Mudgal Gastromedics Hospital?",
    questionHi: "क्या मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में कोलोनोस्कोपी उपलब्ध है?",
    answer: "Yes. Colonoscopy is available at Mudgal Gastromedics Hospital, Agra. It helps evaluate rectal bleeding, chronic diarrhea, inflammatory bowel disease, polyps, colon cancer risk, and other intestinal concerns.",
    answerHi: "जी हां। मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल, आगरा में कोलोनोस्कोपी उपलब्ध है। यह मलाशय से रक्तस्राव, पुराने दस्त, इंफ्लेमेटरी बाउल डिजीज़, पॉलिप्स, कोलन कैंसर के जोखिम और अन्य आंत संबंधी समस्याओं के आकलन में मदद करती है।"
  },
  {
    question: "What is the difference between endoscopy and colonoscopy?",
    questionHi: "एंडोस्कोपी और कोलोनोस्कोपी में क्या अंतर है?",
    answer: "Upper GI endoscopy examines the food pipe, stomach, and upper part of the small intestine, while colonoscopy examines the large intestine and rectum.",
    answerHi: "अपर जीआई एंडोस्कोपी में भोजन नली, पेट और छोटी आंत के ऊपरी हिस्से की जांच की जाती है, जबकि कोलोनोस्कोपी में बड़ी आंत और मलाशय की जांच की जाती है।"
  },
  {
    question: "Does Dr. Deepak Kumar Sharma treat fatty liver disease?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा फैटी लिवर डिजीज़ का इलाज करते हैं?",
    answer: "Yes. Dr. Sharma provides evaluation and treatment for fatty liver disease, including lifestyle guidance, diagnostic testing, risk assessment, and follow-up care.",
    answerHi: "जी हां। डॉ. शर्मा फैटी लिवर डिजीज़ के लिए मूल्यांकन और उपचार प्रदान करते हैं, जिसमें जीवनशैली मार्गदर्शन, डायग्नोस्टिक जांच, जोखिम आकलन और फॉलो-अप देखभाल शामिल है।"
  },
  {
    question: "Can Dr. Deepak Kumar Sharma treat acidity and GERD?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा एसिडिटी और जीईआरडी का इलाज कर सकते हैं?",
    answer: "Yes. Dr. Sharma treats acidity, GERD, acid reflux, heartburn, gastritis, peptic ulcers, and related upper digestive symptoms.",
    answerHi: "जी हां। डॉ. शर्मा एसिडिटी, जीईआरडी, एसिड रिफ्लक्स, सीने में जलन, गैस्ट्राइटिस, पेप्टिक अल्सर और संबंधित ऊपरी पाचन लक्षणों का इलाज करते हैं।"
  },
  {
    question: "What is FibroScan used for?",
    questionHi: "फाइब्रोस्कैन का उपयोग किस लिए किया जाता है?",
    answer: "FibroScan is a non-invasive test used to assess liver stiffness and fatty changes. It is commonly used for fatty liver disease, hepatitis, liver fibrosis, and cirrhosis risk assessment.",
    answerHi: "फाइब्रोस्कैन एक नॉन-इनवेसिव जांच है जिसका उपयोग लिवर की कठोरता और फैटी बदलावों का आकलन करने के लिए किया जाता है। इसका उपयोग आमतौर पर फैटी लिवर डिजीज़, हेपेटाइटिस, लिवर फाइब्रोसिस और सिरोसिस जोखिम आकलन के लिए किया जाता है।"
  },
  {
    question: "Does Dr. Deepak Kumar Sharma treat pancreatic disorders?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा अग्न्याशय संबंधी रोगों का इलाज करते हैं?",
    answer: "Yes. Dr. Sharma provides consultation and treatment for pancreatic disorders, including pancreatitis and pancreato-biliary conditions.",
    answerHi: "जी हां। डॉ. शर्मा पैंक्रियाटाइटिस और पैंक्रियाटो-बिलियरी स्थितियों सहित अग्न्याशय संबंधी रोगों के लिए परामर्श और उपचार प्रदान करते हैं।"
  },
  {
    question: "Can I consult Dr. Deepak Kumar Sharma for abdominal pain and bloating?",
    questionHi: "क्या मैं पेट दर्द और सूजन के लिए डॉ. दीपक कुमार शर्मा से परामर्श कर सकता हूं?",
    answer: "Yes. Persistent abdominal pain, gas, bloating, indigestion, altered bowel habits, or unexplained stomach discomfort should be evaluated by a gastroenterologist.",
    answerHi: "जी हां। लगातार पेट दर्द, गैस, सूजन, अपच, मल त्याग की आदतों में बदलाव या अस्पष्टीकृत पेट की परेशानी का मूल्यांकन गैस्ट्रोएंटरोलॉजिस्ट द्वारा किया जाना चाहिए।"
  },
  {
    question: "Does Mudgal Gastromedics Hospital provide GI cancer screening?",
    questionHi: "क्या मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल जीआई कैंसर स्क्रीनिंग प्रदान करता है?",
    answer: "Yes. The hospital provides gastroenterology consultation and diagnostic procedures that may support GI cancer screening, including endoscopy and colonoscopy when medically advised.",
    answerHi: "जी हां। अस्पताल गैस्ट्रोएंटरोलॉजी परामर्श और डायग्नोस्टिक प्रक्रियाएं प्रदान करता है जो चिकित्सकीय सलाह पर एंडोस्कोपी और कोलोनोस्कोपी सहित जीआई कैंसर स्क्रीनिंग में सहायक हो सकती हैं।"
  },
  {
    question: "Is Dr. Deepak Kumar Sharma a DM Gastroenterologist in Agra?",
    questionHi: "क्या डॉ. दीपक कुमार शर्मा आगरा में डीएम गैस्ट्रोएंटरोलॉजिस्ट हैं?",
    answer: "Yes. Dr. Deepak Kumar Sharma completed DM Gastroenterology from SMS Medical College, Jaipur and practices as a qualified Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra.",
    answerHi: "जी हां। डॉ. दीपक कुमार शर्मा ने एसएमएस मेडिकल कॉलेज, जयपुर से डीएम गैस्ट्रोएंटरोलॉजी पूरा किया है और आगरा में एक योग्य गैस्ट्रोएंटरोलॉजिस्ट, हेपेटोलॉजिस्ट और एडवांस्ड एंडोस्कोपिस्ट के रूप में प्रैक्टिस करते हैं।"
  },
  {
    question: "What digestive problems require urgent medical attention?",
    questionHi: "किन पाचन समस्याओं के लिए तुरंत चिकित्सकीय ध्यान देने की आवश्यकता होती है?",
    answer: "Severe abdominal pain, vomiting blood, black stools, rectal bleeding, sudden jaundice, severe dehydration, persistent vomiting, or rapid unexplained weight loss should be evaluated urgently.",
    answerHi: "गंभीर पेट दर्द, खून की उल्टी, काला मल, मलाशय से रक्तस्राव, अचानक पीलिया, गंभीर निर्जलीकरण, लगातार उल्टी या तेज़ी से अस्पष्टीकृत वज़न घटने का तुरंत मूल्यांकन किया जाना चाहिए।"
  },
  {
    question: "Can I visit for a second opinion on liver or digestive disease?",
    questionHi: "क्या मैं लिवर या पाचन रोग पर दूसरी राय के लिए आ सकता हूं?",
    answer: "Yes. Patients may consult Dr. Sharma for a second opinion related to digestive disorders, liver disease, pancreatic conditions, gallbladder disease, endoscopy findings, colonoscopy reports, or ERCP-related concerns.",
    answerHi: "जी हां। मरीज़ पाचन रोगों, लिवर रोग, अग्न्याशय की स्थितियों, पित्ताशय रोग, एंडोस्कोपी निष्कर्षों, कोलोनोस्कोपी रिपोर्ट या ईआरसीपी से संबंधित चिंताओं पर दूसरी राय के लिए डॉ. शर्मा से परामर्श कर सकते हैं।"
  }
];

export default function DoctorProfilePage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Physician",
        name: doctor.name,
        image: `${site.url}/images/hospital/dr-deepak-kumar-sharma.jpg`,
        medicalSpecialty: ["Gastroenterology", "Hepatology", "Endoscopy"],
        jobTitle: "Gastroenterologist, Liver Specialist & Advanced Endoscopist",
        worksFor: {
          "@type": "Hospital",
          name: site.name,
          address: fullAddress,
          telephone: site.mobile
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
          addressLocality: site.city,
          addressRegion: site.region,
          postalCode: site.postalCode,
          addressCountry: site.country
        },
        telephone: site.mobile,
        url: `${site.url}/dr-deepak-kumar-sharma-gastroenterologist-agra`
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer }
        }))
      }
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero-bg overflow-hidden py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1280px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[1fr_0.72fr]">
          <MotionReveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100/35 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-50 backdrop-blur">
              <Stethoscope size={16} />
              <span className="inline-lang">
                <span data-en>Gastroenterologist in Agra</span>
                <span data-hi lang="hi">आगरा में गैस्ट्रोएंटरोलॉजिस्ट</span>
              </span>
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">
              Dr. Deepak Kumar Sharma
            </h1>
            <p className="inline-lang mt-5 max-w-3xl text-2xl font-black leading-tight text-cyan-50 md:text-4xl">
              <span data-en>Gastroenterologist, Liver Specialist & Advanced Endoscopist in Agra</span>
              <span data-hi lang="hi">आगरा में गैस्ट्रोएंटरोलॉजिस्ट, लिवर विशेषज्ञ और एडवांस्ड एंडोस्कोपिस्ट</span>
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/86" data-en>
              Trusted DM Gastroenterologist in Agra for digestive disorders, liver disease, ERCP, colonoscopy, endoscopy, pancreatic care and pancreato-biliary diseases.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/86" data-hi lang="hi">
              पाचन संबंधी विकारों, लिवर रोग, ईआरसीपी, कोलोनोस्कोपी, एंडोस्कोपी, अग्न्याशय देखभाल और पैंक्रियाटो-बिलियरी रोगों के लिए आगरा में विश्वसनीय डीएम गैस्ट्रोएंटरोलॉजिस्ट।
            </p>
            <AppointmentCtaPanel className="mt-8 max-w-3xl" />
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="relative mx-auto max-w-sm rounded border border-white/25 bg-white p-2 shadow-[0_28px_90px_rgba(2,22,29,0.38)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded bg-soft">
                <Image
                  src="/images/hospital/dr-deepak-kumar-sharma.jpg"
                  alt="Dr. Deepak Kumar Sharma Gastroenterologist in Agra"
                  fill
                  priority
                  sizes="(min-width: 1024px) 360px, 90vw"
                  className="object-cover object-[52%_18%]"
                />
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr]">
          <MotionReveal>
            <div className="sticky top-32 rounded border border-line bg-white p-6 shadow-soft">
              <p className="inline-lang text-xs font-black uppercase tracking-[0.16em] text-brand">
                <span data-en>Profile Summary</span>
                <span data-hi lang="hi">प्रोफ़ाइल सारांश</span>
              </p>
              <h2 className="inline-lang mt-3 text-3xl font-black leading-tight text-ink">
                <span data-en>Founder and Principal Consultant</span>
                <span data-hi lang="hi">संस्थापक और प्रधान सलाहकार</span>
              </h2>
              <div className="mt-5 grid gap-3 text-muted">
                <InfoLine icon={<Award size={18} />} text="DM Gastroenterology, SMS Medical College, Jaipur" />
                <InfoLine icon={<GraduationCap size={18} />} text="MD Medicine, S.N. Medical College, Agra" />
                <InfoLine
                  icon={<ShieldCheck size={18} />}
                  text={
                    <span className="inline-lang">
                      <span data-en>Registration: MCI-57000</span>
                      <span data-hi lang="hi">पंजीकरण: MCI-57000</span>
                    </span>
                  }
                />
                <InfoLine icon={<MapPin size={18} />} text={fullAddress} />
              </div>
              <AppointmentCtaPanel className="mt-6" />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="prose prose-lg max-w-none text-muted prose-headings:text-ink">
              <h2 className="inline-lang">
                <span data-en>About Dr. Deepak Kumar Sharma</span>
                <span data-hi lang="hi">डॉ. दीपक कुमार शर्मा के बारे में</span>
              </h2>
              <p data-en>
                Dr. Deepak Kumar Sharma is a trusted Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra, specializing in the diagnosis and treatment of digestive, liver, pancreatic, intestinal, and pancreato-biliary diseases. With advanced qualifications including MBBS, MD in General Medicine, and DM in Gastroenterology, Dr. Sharma brings strong clinical expertise, accurate diagnosis, and patient-focused care to every consultation.
              </p>
              <p data-hi lang="hi">
                डॉ. दीपक कुमार शर्मा आगरा में एक विश्वसनीय गैस्ट्रोएंटरोलॉजिस्ट, हेपेटोलॉजिस्ट और एडवांस्ड एंडोस्कोपिस्ट हैं, जो पाचन, लिवर, अग्न्याशय, आंत और पैंक्रियाटो-बिलियरी रोगों के निदान और उपचार में विशेषज्ञ हैं। एमबीबीएस, जनरल मेडिसिन में एमडी और गैस्ट्रोएंटरोलॉजी में डीएम सहित उन्नत योग्यताओं के साथ, डॉ. शर्मा हर परामर्श में मज़बूत नैदानिक विशेषज्ञता, सटीक निदान और मरीज़-केंद्रित देखभाल लाते हैं।
              </p>
              <p data-en>
                As the Founder and Principal Consultant at Mudgal Gastromedics Hospital, Agra, Dr. Sharma provides comprehensive gastroenterology and hepatology care under one roof. His practice focuses on evidence-based treatment, advanced diagnostic technology, minimally invasive endoscopic procedures, and compassionate care tailored to each patient’s condition.
              </p>
              <p data-hi lang="hi">
                मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल, आगरा के संस्थापक और प्रधान सलाहकार के रूप में, डॉ. शर्मा एक ही स्थान पर संपूर्ण गैस्ट्रोएंटरोलॉजी और हेपेटोलॉजी देखभाल प्रदान करते हैं। उनकी प्रैक्टिस साक्ष्य-आधारित उपचार, उन्नत डायग्नोस्टिक तकनीक, न्यूनतम इनवेसिव एंडोस्कोपिक प्रक्रियाओं और प्रत्येक मरीज़ की स्थिति के अनुसार दयालु देखभाल पर केंद्रित है।
              </p>
              <p data-en>
                Patients from Agra and nearby regions consult Dr. Deepak Kumar Sharma for common digestive symptoms as well as complex gastrointestinal, liver, pancreatic, and biliary disorders.
              </p>
              <p data-hi lang="hi">
                आगरा और आसपास के क्षेत्रों के मरीज़ सामान्य पाचन लक्षणों के साथ-साथ जटिल जठरांत्र, लिवर, अग्न्याशय और पित्त संबंधी रोगों के लिए डॉ. दीपक कुमार शर्मा से परामर्श करते हैं।
              </p>
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Digestive & Liver Disorders" title="Comprehensive care for gastroenterology, liver and pancreato-biliary conditions" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expertise.map((item) => (
            <FeaturePill
              key={item.en}
              text={
                <span className="inline-lang">
                  <span data-en>{item.en}</span>
                  <span data-hi lang="hi">{item.hi}</span>
                </span>
              }
            />
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-lg leading-relaxed text-muted" data-en>
          Whether you are experiencing acidity, abdominal discomfort, jaundice, digestive bleeding, altered bowel habits, chronic liver concerns, or pancreatic symptoms, Dr. Sharma offers detailed evaluation and personalized treatment planning.
        </p>
        <p className="mt-8 max-w-4xl text-lg leading-relaxed text-muted" data-hi lang="hi">
          चाहे आपको एसिडिटी, पेट में परेशानी, पीलिया, पाचन संबंधी रक्तस्राव, मल त्याग की आदतों में बदलाव, पुरानी लिवर संबंधी चिंताएं या अग्न्याशय के लक्षण हों, डॉ. शर्मा विस्तृत मूल्यांकन और व्यक्तिगत उपचार योजना प्रदान करते हैं।
        </p>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <ArticleCard
            eyebrow="Advanced Endoscopy"
            title="Diagnostic and therapeutic procedures in Agra"
            text={
              <>
                <span data-en>Mudgal Gastromedics Hospital is equipped to provide advanced diagnostic and therapeutic gastroenterology procedures. Dr. Sharma is experienced in minimally invasive endoscopic procedures that support accurate diagnosis, early detection, and effective treatment planning.</span>
                <span data-hi lang="hi">मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल उन्नत डायग्नोस्टिक और चिकित्सीय गैस्ट्रोएंटरोलॉजी प्रक्रियाएं प्रदान करने के लिए सुसज्जित है। डॉ. शर्मा न्यूनतम इनवेसिव एंडोस्कोपिक प्रक्रियाओं में अनुभवी हैं जो सटीक निदान, शीघ्र पहचान और प्रभावी उपचार योजना में सहायक हैं।</span>
              </>
            }
            items={procedures}
          />
          <ArticleCard
            eyebrow="Focused Services"
            title="Specialist care for digestive, liver and pancreatic disease"
            text={
              <>
                <span data-en>His clinical focus includes identifying the root cause of symptoms, explaining the diagnosis clearly, and offering treatment options based on each patient&apos;s condition and medical needs.</span>
                <span data-hi lang="hi">उनका नैदानिक फोकस लक्षणों के मूल कारण की पहचान करने, निदान को स्पष्ट रूप से समझाने और प्रत्येक मरीज़ की स्थिति और चिकित्सीय आवश्यकताओं के आधार पर उपचार विकल्प प्रदान करने पर केंद्रित है।</span>
              </>
            }
            items={keyServices}
          />
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <MotionReveal>
            <SectionHead eyebrow="Why Patients Choose Dr. Sharma" title="Specialist consultation with clear diagnosis and follow-up care" />
            <p className="max-w-3xl text-lg leading-relaxed text-muted" data-en>
              Patients choose Dr. Deepak Kumar Sharma for detailed consultations, accurate diagnosis, ethical medical guidance, and a compassionate approach. His focus is not only on treating symptoms but also on identifying the root cause and creating a personalized treatment plan for long-term digestive and liver health.
            </p>
            <p className="max-w-3xl text-lg leading-relaxed text-muted" data-hi lang="hi">
              मरीज़ विस्तृत परामर्श, सटीक निदान, नैतिक चिकित्सीय मार्गदर्शन और दयालु दृष्टिकोण के लिए डॉ. दीपक कुमार शर्मा को चुनते हैं। उनका ध्यान केवल लक्षणों के उपचार पर ही नहीं, बल्कि दीर्घकालिक पाचन और लिवर स्वास्थ्य के लिए मूल कारण की पहचान और व्यक्तिगत उपचार योजना बनाने पर भी है।
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {whyChoose.map((item) => (
                <FeaturePill
                  key={item.en}
                  text={
                    <span className="inline-lang">
                      <span data-en>{item.en}</span>
                      <span data-hi lang="hi">{item.hi}</span>
                    </span>
                  }
                />
              ))}
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="inline-lang text-2xl font-black text-ink">
                <span data-en>Education & Experience</span>
                <span data-hi lang="hi">शिक्षा और अनुभव</span>
              </h3>
              <div className="mt-5 divide-y divide-line">
                {educationRows.map(([label, labelHi, value]) => (
                  <div key={label} className="grid gap-1 py-4 sm:grid-cols-[0.45fr_1fr]">
                    <p className="inline-lang font-black text-ink">
                      <span data-en>{label}</span>
                      <span data-hi lang="hi">{labelHi}</span>
                    </p>
                    <p className="text-muted">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Gastroenterology & Liver Care" title="Complete digestive care at Mudgal Gastromedics Hospital" />
        <div className="grid gap-6 lg:grid-cols-2">
          <p className="text-lg leading-relaxed text-muted" data-en>
            At Mudgal Gastromedics Hospital, patients receive complete care for digestive diseases, liver disorders, pancreatic conditions, gallbladder diseases, and advanced endoscopy procedures. The hospital combines modern medical facilities with a patient-first approach to provide safe, effective, and comfortable treatment.
          </p>
          <p className="text-lg leading-relaxed text-muted" data-hi lang="hi">
            मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में, मरीज़ों को पाचन रोगों, लिवर संबंधी विकारों, अग्न्याशय की स्थितियों, पित्ताशय के रोगों और उन्नत एंडोस्कोपी प्रक्रियाओं के लिए संपूर्ण देखभाल मिलती है। अस्पताल सुरक्षित, प्रभावी और आरामदायक उपचार प्रदान करने के लिए आधुनिक चिकित्सा सुविधाओं को मरीज़-पहले के दृष्टिकोण के साथ जोड़ता है।
          </p>
          <p className="text-lg leading-relaxed text-muted" data-en>
            From preventive screening and routine consultations to second opinions and complex endoscopic procedures, Dr. Deepak Kumar Sharma and his team are committed to delivering high-quality gastroenterology, hepatology, and advanced endoscopy care in Agra.
          </p>
          <p className="text-lg leading-relaxed text-muted" data-hi lang="hi">
            निवारक जांच और नियमित परामर्श से लेकर दूसरी राय और जटिल एंडोस्कोपिक प्रक्रियाओं तक, डॉ. दीपक कुमार शर्मा और उनकी टीम आगरा में उच्च गुणवत्ता वाली गैस्ट्रोएंटरोलॉजी, हेपेटोलॉजी और उन्नत एंडोस्कोपी देखभाल प्रदान करने के लिए प्रतिबद्ध हैं।
          </p>
        </div>
        <div className="mt-8 rounded border border-line bg-soft p-6">
          <h3 className="inline-lang text-2xl font-black text-ink">
            <span data-en>Book a Consultation</span>
            <span data-hi lang="hi">परामर्श बुक करें</span>
          </h3>
          <p className="mt-3 max-w-4xl text-muted" data-en>
            Take the first step toward better digestive and liver health by scheduling a consultation with Dr. Deepak Kumar Sharma at Mudgal Gastromedics Hospital, Agra.
          </p>
          <p className="mt-3 max-w-4xl text-muted" data-hi lang="hi">
            मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल, आगरा में डॉ. दीपक कुमार शर्मा के साथ परामर्श निर्धारित करके बेहतर पाचन और लिवर स्वास्थ्य की दिशा में पहला कदम उठाएं।
          </p>
          <AppointmentCtaPanel className="mt-5 max-w-3xl" />
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Consultation Guide" title="When to consult, what to bring and what to expect">
          <p data-en>Use this guide before booking an appointment with Dr. Deepak Kumar Sharma.</p>
          <p data-hi lang="hi">डॉ. दीपक कुमार शर्मा के साथ अपॉइंटमेंट बुक करने से पहले इस गाइड का उपयोग करें।</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {consultationGuide.map((block) => (
            <article key={block.title} className="rounded border border-line bg-white p-5 shadow-soft">
              <h2 className="inline-lang text-2xl font-black leading-tight text-ink">
                <span data-en>{block.title}</span>
                <span data-hi lang="hi">{block.titleHi}</span>
              </h2>
              <p className="mt-3 inline-lang text-sm leading-relaxed text-muted">
                <span data-en>{block.text}</span>
                <span data-hi lang="hi">{block.textHi}</span>
              </p>
              <ul className="mt-4 grid gap-3">
                {block.items.map((item) => (
                  <li key={item.en} className="flex gap-3 text-sm text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={17} />
                    <span className="inline-lang">
                      <span data-en>{item.en}</span>
                      <span data-hi lang="hi">{item.hi}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Care Pathway" title="How the visit is usually planned" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { title: "Consultation", titleHi: "परामर्श", text: "Symptoms, duration, medicine history and previous reports are reviewed carefully.", textHi: "लक्षण, अवधि, दवा इतिहास और पिछली रिपोर्ट की सावधानीपूर्वक समीक्षा की जाती है।", icon: Stethoscope },
            { title: "Diagnosis plan", titleHi: "निदान योजना", text: "Blood tests, imaging, endoscopy, colonoscopy, FibroScan or ERCP are advised only when clinically useful.", textHi: "रक्त जांच, इमेजिंग, एंडोस्कोपी, कोलोनोस्कोपी, फाइब्रोस्कैन या ईआरसीपी की सलाह केवल तभी दी जाती है जब यह चिकित्सकीय रूप से उपयोगी हो।", icon: HeartPulse },
            { title: "Follow-up", titleHi: "फॉलो-अप", text: "Treatment response, reports, diet, lifestyle and warning signs are discussed for ongoing care.", textHi: "निरंतर देखभाल के लिए उपचार की प्रतिक्रिया, रिपोर्ट, आहार, जीवनशैली और चेतावनी संकेतों पर चर्चा की जाती है।", icon: ShieldCheck }
          ].map(({ title, titleHi, text, textHi, icon: Icon }) => (
            <article key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded bg-soft text-brand">
                <Icon size={21} />
              </span>
              <h2 className="inline-lang text-xl font-black text-ink">
                <span data-en>{title}</span>
                <span data-hi lang="hi">{titleHi}</span>
              </h2>
              <p className="mt-2 inline-lang text-muted">
                <span data-en>{text}</span>
                <span data-hi lang="hi">{textHi}</span>
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="FAQs" title="Frequently asked questions about Dr. Deepak Kumar Sharma" />
        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map(({ question, questionHi, answer, answerHi }) => (
            <details key={question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-start gap-3 font-black text-ink">
                <HelpCircle className="mt-1 shrink-0 text-brand" size={18} />
                <span className="inline-lang">
                  <span data-en>{question}</span>
                  <span data-hi lang="hi">{questionHi}</span>
                </span>
              </summary>
              <p className="mt-3 inline-lang pl-8 leading-relaxed text-muted">
                <span data-en>{answer}</span>
                <span data-hi lang="hi">{answerHi}</span>
              </p>
            </details>
          ))}
        </div>
      </Section>
    </main>
  );
}

function InfoLine({ icon, text }: { icon: ReactNode; text: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-brand">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

function FeaturePill({ text }: { text: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded border border-line bg-white px-4 py-3 shadow-sm">
      <CheckCircle2 className="shrink-0 text-teal" size={18} />
      <span className="font-semibold text-teal-dark">{text}</span>
    </div>
  );
}

function ArticleCard({ eyebrow, title, text, items }: { eyebrow: string; title: string; text: ReactNode; items: { en: string; hi: string }[] }) {
  return (
    <MotionReveal>
      <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-ink">{title}</h2>
        <p className="inline-lang mt-4 leading-relaxed text-muted">{text}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <FeaturePill
              key={item.en}
              text={
                <span className="inline-lang">
                  <span data-en>{item.en}</span>
                  <span data-hi lang="hi">{item.hi}</span>
                </span>
              }
            />
          ))}
        </div>
      </article>
    </MotionReveal>
  );
}
