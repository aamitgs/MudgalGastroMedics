import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarCheck, ClipboardList, FileText, HeartPulse, MessageCircle, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { LocalCareLinks } from "@/components/site/LocalCareLinks";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { seoBlogPosts } from "@/lib/blog-posts";
import { getPublicProcedure, getPublicProcedures } from "@/lib/cms-public";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { site } from "@/lib/site-data";

type ProcedurePageProps = {
  params: Promise<{ slug: string }>;
};

type PageCopy = {
  overview: string;
  overviewHi: string;
  consultCues: string[];
  consultCuesHi: string[];
  relatedTerms: string[];
  pathway: Array<{ title: string; titleHi: string; text: string; textHi: string }>;
};

type ArticleSection = {
  title: string;
  titleHi: string;
  text: string;
  textHi: string;
  items?: string[];
  itemsHi?: string[];
};

type ArticleFaq = {
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
};

type ProcedureArticle = {
  sections: ArticleSection[];
  faqs: ArticleFaq[];
};

const diseaseSlugs = new Set([
  "varices",
  "liver-cirrhosis",
  "fatty-liver",
  "liver-fibrosis",
  "obstructive-jaundice",
  "bile-duct-stricture",
  "pancreatic-disorders",
  "acidity-gerd",
  "peptic-ulcer-disease",
  "difficulty-swallowing",
  "gi-stricture",
  "colon-polyps",
  "ibd-colitis",
  "ibs",
  "chronic-constipation",
  "chronic-diarrhea",
  "ascites"
]);

const opdTimingProcedureSlugs = new Set([
  "endoscopy",
  "colonoscopy",
  "ercp",
  "fibroscan",
  "variceal-banding",
  "gastrointestinal-bleeding-management"
]);

const pageCopyBySlug: Record<string, PageCopy> = {
  "endoscopy": {
    overview: "Upper GI endoscopy helps examine the food pipe, stomach and first part of the small intestine for acidity-related damage, ulcers, bleeding, narrowing, growths or swallowing difficulty. At Mudgal Gastromedics Hospital, the procedure is planned with clear preparation instructions and post-procedure guidance.",
    overviewHi: "अपर जीआई एंडोस्कोपी से भोजन नली, पेट और छोटी आंत के पहले हिस्से में एसिडिटी से जुड़ी क्षति, अल्सर, रक्तस्राव, संकुचन, वृद्धि या निगलने में कठिनाई की जांच की जाती है। मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में इस प्रक्रिया की योजना स्पष्ट तैयारी निर्देशों और प्रक्रिया के बाद के मार्गदर्शन के साथ बनाई जाती है।",
    consultCues: ["Long-standing acidity, reflux or burning chest discomfort", "Upper abdominal pain, nausea, bloating or repeated vomiting", "Difficulty swallowing, food sticking sensation or unexplained weight loss", "Black stools, anemia, suspected ulcer or doctor-advised biopsy"],
    consultCuesHi: ["लंबे समय से एसिडिटी, रिफ्लक्स या सीने में जलन", "ऊपरी पेट दर्द, मतली, सूजन या बार-बार उल्टी", "निगलने में कठिनाई, भोजन अटकने का एहसास या अस्पष्टीकृत वज़न घटना", "काला मल, एनीमिया, संदिग्ध अल्सर या डॉक्टर द्वारा सुझाई गई बायोप्सी"],
    relatedTerms: ["Upper GI endoscopy in Agra", "Gastroscopy in Agra", "Acidity endoscopy Agra", "Stomach ulcer diagnosis Agra"],
    pathway: [
      { title: "Symptom review", titleHi: "लक्षण समीक्षा", text: "Acidity, pain, vomiting, swallowing difficulty and previous reports are reviewed before advising endoscopy.", textHi: "एंडोस्कोपी की सलाह देने से पहले एसिडिटी, दर्द, उल्टी, निगलने में कठिनाई और पिछली रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Endoscopy preparation", titleHi: "एंडोस्कोपी तैयारी", text: "Fasting, medicine instructions and attendant requirements are explained before the procedure.", textHi: "प्रक्रिया से पहले उपवास, दवा निर्देश और परिजन की आवश्यकताएं समझाई जाती हैं।" },
      { title: "Report guidance", titleHi: "रिपोर्ट मार्गदर्शन", text: "Findings, biopsy advice if needed and treatment steps are discussed after the procedure.", textHi: "प्रक्रिया के बाद निष्कर्ष, आवश्यकता पड़ने पर बायोप्सी सलाह और उपचार के चरणों पर चर्चा की जाती है।" }
    ]
  },
  "colonoscopy": {
    overview: "Colonoscopy examines the large intestine and rectum to evaluate bleeding, bowel habit changes, polyps, inflammation and cancer-screening needs. The care team guides bowel preparation, procedure expectations and follow-up reporting.",
    overviewHi: "कोलोनोस्कोपी से बड़ी आंत और मलाशय की जांच की जाती है ताकि रक्तस्राव, मल त्याग की आदतों में बदलाव, पॉलिप्स, सूजन और कैंसर स्क्रीनिंग की आवश्यकताओं का आकलन किया जा सके। केयर टीम आंत की तैयारी, प्रक्रिया की अपेक्षाओं और फॉलो-अप रिपोर्टिंग में मार्गदर्शन करती है।",
    consultCues: ["Blood in stool, black stool or unexplained anemia", "Chronic diarrhea, constipation or change in bowel habits", "Suspected polyps, colitis or inflammatory bowel disease", "Colon cancer screening or family history of colon cancer"],
    consultCuesHi: ["मल में खून, काला मल या अस्पष्टीकृत एनीमिया", "पुराना दस्त, कब्ज़ या मल त्याग की आदतों में बदलाव", "संदिग्ध पॉलिप्स, कोलाइटिस या इंफ्लेमेटरी बाउल डिजीज़", "कोलन कैंसर स्क्रीनिंग या कोलन कैंसर का पारिवारिक इतिहास"],
    relatedTerms: ["Colonoscopy in Agra", "Colon cancer screening Agra", "Blood in stool doctor Agra", "Colitis specialist Agra"],
    pathway: [
      { title: "Bowel symptom review", titleHi: "आंत लक्षण समीक्षा", text: "Bleeding, stool changes, pain and prior reports are reviewed to plan the right investigation.", textHi: "सही जांच की योजना बनाने के लिए रक्तस्राव, मल में बदलाव, दर्द और पिछली रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Bowel preparation", titleHi: "आंत की तैयारी", text: "Diet, laxative timing, fasting and medicine instructions are explained clearly.", textHi: "आहार, लैक्सेटिव का समय, उपवास और दवा निर्देश स्पष्ट रूप से समझाए जाते हैं।" },
      { title: "Polyp and biopsy follow-up", titleHi: "पॉलिप और बायोप्सी फॉलो-अप", text: "Findings, biopsy reports and future surveillance timing are planned after colonoscopy.", textHi: "कोलोनोस्कोपी के बाद निष्कर्ष, बायोप्सी रिपोर्ट और भविष्य की निगरानी का समय तय किया जाता है।" }
    ]
  },
  "enteroscopy": {
    overview: "Enteroscopy helps assess the small intestine when routine endoscopy and colonoscopy do not fully explain symptoms such as obscure bleeding, anemia or suspected small bowel lesions.",
    overviewHi: "एंटरोस्कोपी छोटी आंत का आकलन करने में मदद करती है जब नियमित एंडोस्कोपी और कोलोनोस्कोपी अस्पष्ट रक्तस्राव, एनीमिया या संदिग्ध छोटी आंत की समस्याओं जैसे लक्षणों को पूरी तरह स्पष्ट नहीं कर पातीं।",
    consultCues: ["Unexplained anemia or suspected small bowel bleeding", "Black stools with unclear source after initial tests", "Suspected small bowel ulcers, lesions or strictures", "Doctor-advised small bowel evaluation after prior reports"],
    consultCuesHi: ["अस्पष्टीकृत एनीमिया या संदिग्ध छोटी आंत रक्तस्राव", "प्रारंभिक जांच के बाद भी अस्पष्ट कारण वाला काला मल", "संदिग्ध छोटी आंत अल्सर, घाव या स्ट्रिक्चर", "पिछली रिपोर्ट के बाद डॉक्टर द्वारा सुझाया गया छोटी आंत मूल्यांकन"],
    relatedTerms: ["Enteroscopy in Agra", "Small bowel bleeding Agra", "Obscure GI bleeding Agra", "Small intestine specialist Agra"],
    pathway: [
      { title: "Report review", titleHi: "रिपोर्ट समीक्षा", text: "Prior endoscopy, colonoscopy, scans and blood reports are reviewed before enteroscopy planning.", textHi: "एंटरोस्कोपी की योजना से पहले पिछली एंडोस्कोपी, कोलोनोस्कोपी, स्कैन और ब्लड रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Small bowel evaluation", titleHi: "छोटी आंत मूल्यांकन", text: "The appropriate approach is selected based on symptoms, suspected site and patient condition.", textHi: "लक्षणों, संदिग्ध स्थान और मरीज़ की स्थिति के आधार पर उपयुक्त तरीका चुना जाता है।" },
      { title: "Targeted treatment plan", titleHi: "लक्षित उपचार योजना", text: "Findings guide biopsy, bleeding control, medicine or further imaging decisions.", textHi: "निष्कर्ष बायोप्सी, रक्तस्राव नियंत्रण, दवा या आगे की इमेजिंग के निर्णयों का मार्गदर्शन करते हैं।" }
    ]
  },
  "ercp": {
    overview: "ERCP is an advanced endoscopic procedure used for bile duct and pancreatic duct problems such as stones, jaundice, strictures, infection and selected stenting needs.",
    overviewHi: "ईआरसीपी एक उन्नत एंडोस्कोपिक प्रक्रिया है जिसका उपयोग पित्त नली और अग्न्याशय नली की समस्याओं जैसे पथरी, पीलिया, स्ट्रिक्चर, संक्रमण और चुनिंदा स्टेंटिंग आवश्यकताओं के लिए किया जाता है।",
    consultCues: ["Jaundice with suspected bile duct blockage", "CBD stone, bile duct infection or abnormal liver reports", "Bile duct stricture or post-surgery bile leak", "Pancreatic duct stone or recurrent pancreatic symptoms"],
    consultCuesHi: ["पित्त नली में रुकावट की आशंका के साथ पीलिया", "सीबीडी पथरी, पित्त नली संक्रमण या असामान्य लिवर रिपोर्ट", "पित्त नली स्ट्रिक्चर या सर्जरी के बाद पित्त रिसाव", "अग्न्याशय नली पथरी या बार-बार होने वाले अग्न्याशय लक्षण"],
    relatedTerms: ["ERCP in Agra", "CBD stone ERCP Agra", "Jaundice treatment Agra", "Bile duct specialist Agra"],
    pathway: [
      { title: "Imaging review", titleHi: "इमेजिंग समीक्षा", text: "Ultrasound, CT, MRCP and liver reports are reviewed before ERCP planning.", textHi: "ईआरसीपी की योजना से पहले अल्ट्रासाउंड, सीटी, एमआरसीपी और लिवर रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Duct treatment planning", titleHi: "नली उपचार योजना", text: "Stone removal, sphincterotomy, drainage or stenting is planned according to the condition.", textHi: "स्थिति के अनुसार पथरी निकालना, स्फिंक्टरोटॉमी, ड्रेनेज या स्टेंटिंग की योजना बनाई जाती है।" },
      { title: "Recovery monitoring", titleHi: "रिकवरी निगरानी", text: "Post-procedure symptoms, diet, medicines and warning signs are explained before discharge.", textHi: "डिस्चार्ज से पहले प्रक्रिया के बाद के लक्षण, आहार, दवाएं और चेतावनी संकेत समझाए जाते हैं।" }
    ]
  },
  "gastrointestinal-bleeding-management": {
    overview: "GI bleeding needs timely evaluation because bleeding may arise from ulcers, varices, vascular lesions, polyps, tumors or inflammation. Endoscopy or colonoscopy may be required urgently depending on symptoms and stability.",
    overviewHi: "जीआई रक्तस्राव के लिए समय पर मूल्यांकन आवश्यक है क्योंकि रक्तस्राव अल्सर, वेरिसेस, वैस्कुलर घावों, पॉलिप्स, ट्यूमर या सूजन से हो सकता है। लक्षणों और स्थिरता के आधार पर एंडोस्कोपी या कोलोनोस्कोपी की तुरंत आवश्यकता हो सकती है।",
    consultCues: ["Vomiting blood or coffee-ground material", "Black stools, red blood in stool or unexplained anemia", "Dizziness, weakness or recurrent bleeding symptoms", "Known liver disease with suspected variceal bleeding"],
    consultCuesHi: ["खून की उल्टी या कॉफी जैसे रंग की उल्टी", "काला मल, मल में लाल खून या अस्पष्टीकृत एनीमिया", "चक्कर आना, कमज़ोरी या बार-बार रक्तस्राव के लक्षण", "ज्ञात लिवर रोग के साथ संदिग्ध वेरिसियल रक्तस्राव"],
    relatedTerms: ["GI bleeding treatment Agra", "Vomiting blood doctor Agra", "Black stool treatment Agra", "Emergency endoscopy Agra"],
    pathway: [
      { title: "Urgency assessment", titleHi: "तात्कालिकता आकलन", text: "Bleeding severity, blood pressure, pulse, hemoglobin and liver history are reviewed quickly.", textHi: "रक्तस्राव की गंभीरता, ब्लड प्रेशर, पल्स, हीमोग्लोबिन और लिवर इतिहास की जल्दी समीक्षा की जाती है।" },
      { title: "Bleeding source control", titleHi: "रक्तस्राव स्रोत नियंत्रण", text: "Endoscopy, colonoscopy, banding, injection, clipping or other therapy is planned when suitable.", textHi: "उपयुक्त होने पर एंडोस्कोपी, कोलोनोस्कोपी, बैंडिंग, इंजेक्शन, क्लिपिंग या अन्य थेरेपी की योजना बनाई जाती है।" },
      { title: "Prevention plan", titleHi: "रोकथाम योजना", text: "Medicines, repeat endoscopy, liver care or follow-up testing are planned to reduce recurrence.", textHi: "पुनरावृत्ति कम करने के लिए दवाएं, दोबारा एंडोस्कोपी, लिवर देखभाल या फॉलो-अप जांच की योजना बनाई जाती है।" }
    ]
  },
  "variceal-banding": {
    overview: "Variceal banding is an endoscopic treatment for enlarged veins in the food pipe, usually related to portal hypertension and chronic liver disease, to reduce bleeding risk or control active bleeding.",
    overviewHi: "वेरिसियल बैंडिंग भोजन नली में बढ़ी हुई नसों के लिए एक एंडोस्कोपिक उपचार है, जो आमतौर पर पोर्टल हाइपरटेंशन और पुराने लिवर रोग से जुड़ी होती है, ताकि रक्तस्राव का जोखिम कम किया जा सके या सक्रिय रक्तस्राव को नियंत्रित किया जा सके।",
    consultCues: ["Known cirrhosis with varices on endoscopy", "Vomiting blood or black stools with liver disease", "Doctor-advised repeat banding session", "Low platelets, enlarged spleen or portal hypertension"],
    consultCuesHi: ["एंडोस्कोपी में वेरिसेस के साथ ज्ञात सिरोसिस", "लिवर रोग के साथ खून की उल्टी या काला मल", "डॉक्टर द्वारा सुझाया गया दोबारा बैंडिंग सत्र", "कम प्लेटलेट्स, बढ़ी हुई तिल्ली या पोर्टल हाइपरटेंशन"],
    relatedTerms: ["Variceal banding Agra", "Esophageal varices treatment Agra", "Cirrhosis bleeding Agra", "Liver varices doctor Agra"],
    pathway: [
      { title: "Bleeding risk review", titleHi: "रक्तस्राव जोखिम समीक्षा", text: "Liver status, prior bleeding, platelet count and previous endoscopy findings are reviewed.", textHi: "लिवर की स्थिति, पिछला रक्तस्राव, प्लेटलेट काउंट और पिछली एंडोस्कोपी के निष्कर्षों की समीक्षा की जाती है।" },
      { title: "Banding session", titleHi: "बैंडिंग सत्र", text: "Bands are placed endoscopically on suitable varices to reduce bleeding risk.", textHi: "रक्तस्राव का जोखिम कम करने के लिए उपयुक्त वेरिसेस पर एंडोस्कोपिक रूप से बैंड लगाए जाते हैं।" },
      { title: "Repeat surveillance", titleHi: "दोबारा निगरानी", text: "Follow-up sessions, medicines and liver care are planned based on variceal size.", textHi: "वेरिसेस के आकार के आधार पर फॉलो-अप सत्र, दवाएं और लिवर देखभाल की योजना बनाई जाती है।" }
    ]
  },
  "sclerotherapy": {
    overview: "Sclerotherapy is an injection-based endoscopic therapy used in selected bleeding varices or vascular lesions when clinically appropriate.",
    overviewHi: "स्क्लेरोथेरेपी एक इंजेक्शन-आधारित एंडोस्कोपिक थेरेपी है जिसका उपयोग चिकित्सकीय रूप से उपयुक्त होने पर चुनिंदा रक्तस्रावी वेरिसेस या वैस्कुलर घावों में किया जाता है।",
    consultCues: ["Selected bleeding varices needing injection therapy", "Vascular lesions with recurrent bleeding", "Bleeding not suitable for simpler medical treatment alone", "Doctor-advised therapeutic endoscopy"],
    consultCuesHi: ["इंजेक्शन थेरेपी की आवश्यकता वाले चुनिंदा रक्तस्रावी वेरिसेस", "बार-बार रक्तस्राव वाले वैस्कुलर घाव", "रक्तस्राव जो केवल सरल चिकित्सा उपचार के लिए उपयुक्त नहीं है", "डॉक्टर द्वारा सुझाई गई चिकित्सीय एंडोस्कोपी"],
    relatedTerms: ["Sclerotherapy Agra", "Endoscopic injection therapy Agra", "Variceal bleeding treatment Agra", "GI vascular bleeding Agra"],
    pathway: [
      { title: "Bleeding source confirmation", titleHi: "रक्तस्राव स्रोत पुष्टि", text: "Endoscopic findings and bleeding pattern guide whether sclerotherapy is suitable.", textHi: "एंडोस्कोपिक निष्कर्ष और रक्तस्राव का पैटर्न यह तय करते हैं कि स्क्लेरोथेरेपी उपयुक्त है या नहीं।" },
      { title: "Injection therapy", titleHi: "इंजेक्शन थेरेपी", text: "The sclerosant is injected into selected lesions under endoscopic guidance.", textHi: "एंडोस्कोपिक मार्गदर्शन में चुनिंदा घावों में स्क्लेरोसेंट इंजेक्ट किया जाता है।" },
      { title: "Monitoring and prevention", titleHi: "निगरानी और रोकथाम", text: "Follow-up endoscopy, medicines and recurrence prevention are planned after treatment.", textHi: "उपचार के बाद फॉलो-अप एंडोस्कोपी, दवाएं और पुनरावृत्ति रोकथाम की योजना बनाई जाती है।" }
    ]
  },
  "foreign-body-removal": {
    overview: "Foreign body removal is used when swallowed objects or impacted food are stuck in the food pipe, stomach or upper digestive tract and need endoscopic retrieval.",
    overviewHi: "फॉरेन बॉडी रिमूवल का उपयोग तब किया जाता है जब निगली गई वस्तुएं या फंसा हुआ भोजन भोजन नली, पेट या ऊपरी पाचन तंत्र में अटक जाता है और एंडोस्कोपिक रूप से निकालने की आवश्यकता होती है।",
    consultCues: ["Swallowed coin, denture, bone, pin, battery or sharp object", "Food bolus stuck in the throat or chest", "Pain, drooling, vomiting or inability to swallow after ingestion", "Doctor-advised urgent endoscopic removal"],
    consultCuesHi: ["निगला हुआ सिक्का, नकली दांत, हड्डी, पिन, बैटरी या नुकीली वस्तु", "गले या सीने में फंसा हुआ भोजन का टुकड़ा", "निगलने के बाद दर्द, लार टपकना, उल्टी या निगलने में असमर्थता", "डॉक्टर द्वारा सुझाई गई तत्काल एंडोस्कोपिक निकासी"],
    relatedTerms: ["Foreign body removal Agra", "Swallowed object endoscopy Agra", "Food bolus removal Agra", "Emergency endoscopy Agra"],
    pathway: [
      { title: "Object and timing review", titleHi: "वस्तु और समय समीक्षा", text: "The type of object, time since swallowing and symptoms determine urgency.", textHi: "वस्तु का प्रकार, निगलने के बाद का समय और लक्षण तात्कालिकता तय करते हैं।" },
      { title: "Safe retrieval planning", titleHi: "सुरक्षित निष्कासन योजना", text: "Endoscopic tools and airway precautions are selected based on object location.", textHi: "वस्तु के स्थान के आधार पर एंडोस्कोपिक उपकरण और वायुमार्ग सावधानियां चुनी जाती हैं।" },
      { title: "Injury check", titleHi: "चोट जांच", text: "The digestive lining is checked for cuts, ulcers or narrowing after removal.", textHi: "निकालने के बाद पाचन तंत्र की परत में कट, अल्सर या संकुचन की जांच की जाती है।" }
    ]
  },
  "polypectomy": {
    overview: "Polypectomy is endoscopic removal of selected stomach or colon polyps. It supports diagnosis, symptom evaluation and cancer-prevention planning when polyps are found.",
    overviewHi: "पॉलीपेक्टॉमी चुनिंदा पेट या कोलन पॉलिप्स की एंडोस्कोपिक निकासी है। यह पॉलिप्स मिलने पर निदान, लक्षण मूल्यांकन और कैंसर-रोकथाम योजना में सहायक होती है।",
    consultCues: ["Polyp found during endoscopy or colonoscopy", "Colon cancer screening with suspected polyp", "Bleeding or anemia linked to possible polyp", "Biopsy or removal advised by the doctor"],
    consultCuesHi: ["एंडोस्कोपी या कोलोनोस्कोपी के दौरान मिला पॉलिप", "संदिग्ध पॉलिप के साथ कोलन कैंसर स्क्रीनिंग", "संभावित पॉलिप से जुड़ा रक्तस्राव या एनीमिया", "डॉक्टर द्वारा सुझाई गई बायोप्सी या निकासी"],
    relatedTerms: ["Polypectomy in Agra", "Colon polyp removal Agra", "Stomach polyp treatment Agra", "Endoscopic polyp removal Agra"],
    pathway: [
      { title: "Polyp assessment", titleHi: "पॉलिप आकलन", text: "Size, site, shape and bleeding risk are reviewed before removal.", textHi: "निकासी से पहले आकार, स्थान, आकृति और रक्तस्राव जोखिम की समीक्षा की जाती है।" },
      { title: "Endoscopic removal", titleHi: "एंडोस्कोपिक निकासी", text: "Suitable polyps are removed using appropriate endoscopic technique.", textHi: "उपयुक्त एंडोस्कोपिक तकनीक का उपयोग करके उपयुक्त पॉलिप्स निकाले जाते हैं।" },
      { title: "Biopsy follow-up", titleHi: "बायोप्सी फॉलो-अप", text: "Histopathology results guide future surveillance and treatment planning.", textHi: "हिस्टोपैथोलॉजी परिणाम भविष्य की निगरानी और उपचार योजना का मार्गदर्शन करते हैं।" }
    ]
  },
  "colon-polyp-removal": {
    overview: "Colon polyp removal is performed during colonoscopy when suitable polyps are found. Removing polyps can help diagnose symptoms, prevent bleeding and reduce future cancer risk depending on pathology.",
    overviewHi: "कोलन पॉलिप निकासी कोलोनोस्कोपी के दौरान की जाती है जब उपयुक्त पॉलिप्स मिलते हैं। पॉलिप्स निकालने से लक्षणों का निदान करने, रक्तस्राव रोकने और पैथोलॉजी के आधार पर भविष्य के कैंसर जोखिम को कम करने में मदद मिल सकती है।",
    consultCues: ["Polyp seen during colonoscopy or screening", "Family history of colon cancer or colon polyps", "Blood in stool, anemia or bowel habit changes", "Doctor-advised polyp removal or surveillance colonoscopy"],
    consultCuesHi: ["कोलोनोस्कोपी या स्क्रीनिंग के दौरान दिखा पॉलिप", "कोलन कैंसर या कोलन पॉलिप्स का पारिवारिक इतिहास", "मल में खून, एनीमिया या मल त्याग की आदतों में बदलाव", "डॉक्टर द्वारा सुझाई गई पॉलिप निकासी या निगरानी कोलोनोस्कोपी"],
    relatedTerms: ["Colon polyp removal Agra", "Colonoscopy polyp removal Agra", "Colon cancer prevention Agra", "Polypectomy specialist Agra"],
    pathway: [
      { title: "Polyp review", titleHi: "पॉलिप समीक्षा", text: "Location, size, number and appearance of polyps are reviewed before removal.", textHi: "निकासी से पहले पॉलिप्स के स्थान, आकार, संख्या और स्वरूप की समीक्षा की जाती है।" },
      { title: "Colonoscopy removal", titleHi: "कोलोनोस्कोपी निकासी", text: "Suitable polyps are removed with snare, cautery or other endoscopic technique.", textHi: "उपयुक्त पॉलिप्स को स्नेयर, कॉटरी या अन्य एंडोस्कोपिक तकनीक से निकाला जाता है।" },
      { title: "Surveillance plan", titleHi: "निगरानी योजना", text: "Biopsy results guide medicines, diet advice and next colonoscopy timing.", textHi: "बायोप्सी परिणाम दवाओं, आहार सलाह और अगली कोलोनोस्कोपी के समय का मार्गदर्शन करते हैं।" }
    ]
  },
  "endoscopic-biopsy": {
    overview: "Endoscopic biopsy collects small tissue samples from suspicious or inflamed areas during endoscopy or colonoscopy. It helps confirm diagnoses such as ulcers, infection, celiac disease, colitis, polyps or suspected growths.",
    overviewHi: "एंडोस्कोपिक बायोप्सी एंडोस्कोपी या कोलोनोस्कोपी के दौरान संदिग्ध या सूजन वाले क्षेत्रों से छोटे टिशू सैंपल लेती है। यह अल्सर, संक्रमण, सीलिएक रोग, कोलाइटिस, पॉलिप्स या संदिग्ध वृद्धि जैसे निदान की पुष्टि में मदद करती है।",
    consultCues: ["Ulcer, inflammation, polyp or growth seen on endoscopy", "Persistent symptoms needing tissue diagnosis", "Suspected H. pylori, celiac disease, colitis or malignancy", "Doctor-advised biopsy after abnormal imaging or reports"],
    consultCuesHi: ["एंडोस्कोपी में दिखा अल्सर, सूजन, पॉलिप या वृद्धि", "टिशू निदान की आवश्यकता वाले लगातार लक्षण", "संदिग्ध एच. पाइलोरी, सीलिएक रोग, कोलाइटिस या मैलिग्नेंसी", "असामान्य इमेजिंग या रिपोर्ट के बाद डॉक्टर द्वारा सुझाई गई बायोप्सी"],
    relatedTerms: ["Endoscopic biopsy Agra", "Stomach biopsy Agra", "Colon biopsy Agra", "H pylori biopsy Agra"],
    pathway: [
      { title: "Target selection", titleHi: "लक्ष्य चयन", text: "The suspicious or abnormal area is identified during endoscopy or colonoscopy.", textHi: "एंडोस्कोपी या कोलोनोस्कोपी के दौरान संदिग्ध या असामान्य क्षेत्र की पहचान की जाती है।" },
      { title: "Tissue sampling", titleHi: "टिशू सैंपलिंग", text: "Small tissue samples are collected safely using endoscopic biopsy forceps.", textHi: "एंडोस्कोपिक बायोप्सी फोर्सेप्स का उपयोग करके सुरक्षित रूप से छोटे टिशू सैंपल लिए जाते हैं।" },
      { title: "Pathology follow-up", titleHi: "पैथोलॉजी फॉलो-अप", text: "Biopsy results guide diagnosis, medicines and further treatment decisions.", textHi: "बायोप्सी परिणाम निदान, दवाओं और आगे के उपचार निर्णयों का मार्गदर्शन करते हैं।" }
    ]
  },
  "ryles-tube-placement": {
    overview: "Ryle's tube placement supports feeding, stomach decompression or inpatient care in selected patients who cannot eat safely or need gastric drainage.",
    overviewHi: "राइल्स ट्यूब प्लेसमेंट उन चुनिंदा मरीज़ों में फीडिंग, पेट डीकंप्रेशन या इनपेशेंट देखभाल में सहायता करती है जो सुरक्षित रूप से खा नहीं सकते या जिन्हें गैस्ट्रिक ड्रेनेज की आवश्यकता होती है।",
    consultCues: ["Need for temporary feeding support", "Repeated vomiting or stomach decompression requirement", "Swallowing difficulty with nutrition concerns", "Inpatient or procedure-related tube support advised"],
    consultCuesHi: ["अस्थायी फीडिंग सहायता की आवश्यकता", "बार-बार उल्टी या पेट डीकंप्रेशन की आवश्यकता", "पोषण संबंधी चिंताओं के साथ निगलने में कठिनाई", "इनपेशेंट या प्रक्रिया से संबंधित ट्यूब सहायता की सलाह"],
    relatedTerms: ["Ryle's tube placement Agra", "Feeding tube support Agra", "NG tube placement Agra", "Nutrition support gastro Agra"],
    pathway: [
      { title: "Need assessment", titleHi: "आवश्यकता आकलन", text: "Nutrition, swallowing ability, vomiting and inpatient needs are reviewed.", textHi: "पोषण, निगलने की क्षमता, उल्टी और इनपेशेंट आवश्यकताओं की समीक्षा की जाती है।" },
      { title: "Tube placement", titleHi: "ट्यूब प्लेसमेंट", text: "Tube size, route and placement safety are checked during insertion.", textHi: "डालने के दौरान ट्यूब का आकार, मार्ग और प्लेसमेंट सुरक्षा की जांच की जाती है।" },
      { title: "Care instructions", titleHi: "देखभाल निर्देश", text: "Feeding, flushing, position and warning signs are explained to attendants.", textHi: "परिजनों को फीडिंग, फ्लशिंग, स्थिति और चेतावनी संकेत समझाए जाते हैं।" }
    ]
  },
  "nasojejunal-tube-placement": {
    overview: "Nasojejunal tube placement provides feeding beyond the stomach in selected patients, often when gastric feeding is not tolerated or pancreatitis-related nutrition support is needed.",
    overviewHi: "नैसोजेजुनल ट्यूब प्लेसमेंट चुनिंदा मरीज़ों में पेट से आगे फीडिंग प्रदान करती है, अक्सर तब जब गैस्ट्रिक फीडिंग सहन नहीं होती या पैंक्रियाटाइटिस से संबंधित पोषण सहायता की आवश्यकता होती है।",
    consultCues: ["Pancreatitis needing enteral nutrition support", "Poor tolerance of stomach feeding", "High aspiration risk or repeated vomiting", "Doctor-advised jejunal feeding route"],
    consultCuesHi: ["एंटरल न्यूट्रिशन सहायता की आवश्यकता वाला पैंक्रियाटाइटिस", "पेट की फीडिंग की खराब सहनशीलता", "उच्च एस्पिरेशन जोखिम या बार-बार उल्टी", "डॉक्टर द्वारा सुझाया गया जेजुनल फीडिंग मार्ग"],
    relatedTerms: ["Nasojejunal tube Agra", "NJ tube placement Agra", "Pancreatitis feeding support Agra", "Enteral nutrition Agra"],
    pathway: [
      { title: "Nutrition route planning", titleHi: "पोषण मार्ग योजना", text: "The reason for jejunal feeding and patient stability are reviewed first.", textHi: "सबसे पहले जेजुनल फीडिंग का कारण और मरीज़ की स्थिरता की समीक्षा की जाती है।" },
      { title: "Tube placement beyond stomach", titleHi: "पेट से आगे ट्यूब प्लेसमेंट", text: "Placement is guided so feeding can reach the small intestine.", textHi: "प्लेसमेंट इस तरह किया जाता है कि फीडिंग छोटी आंत तक पहुंच सके।" },
      { title: "Feeding protocol", titleHi: "फीडिंग प्रोटोकॉल", text: "Feed rate, flushing and care instructions are shared with caregivers.", textHi: "देखभाल करने वालों के साथ फीड दर, फ्लशिंग और देखभाल निर्देश साझा किए जाते हैं।" }
    ]
  },
  "peg-tube-placement": {
    overview: "PEG tube placement is an endoscopic feeding tube option for patients who need longer-term nutrition support when oral intake is unsafe or inadequate.",
    overviewHi: "पीईजी ट्यूब प्लेसमेंट उन मरीज़ों के लिए एक एंडोस्कोपिक फीडिंग ट्यूब विकल्प है जिन्हें मुंह से भोजन असुरक्षित या अपर्याप्त होने पर दीर्घकालिक पोषण सहायता की आवश्यकता होती है।",
    consultCues: ["Long-term swallowing difficulty", "Neurological or medical condition limiting safe oral intake", "Need for reliable nutrition support at home", "Doctor-advised endoscopic feeding tube"],
    consultCuesHi: ["दीर्घकालिक निगलने में कठिनाई", "सुरक्षित मौखिक सेवन को सीमित करने वाली न्यूरोलॉजिकल या चिकित्सीय स्थिति", "घर पर विश्वसनीय पोषण सहायता की आवश्यकता", "डॉक्टर द्वारा सुझाई गई एंडोस्कोपिक फीडिंग ट्यूब"],
    relatedTerms: ["PEG tube placement Agra", "Endoscopic feeding tube Agra", "Long term feeding support Agra", "Gastrostomy tube Agra"],
    pathway: [
      { title: "Suitability check", titleHi: "उपयुक्तता जांच", text: "Nutrition need, infection risk, medicines and caregiver readiness are reviewed.", textHi: "पोषण आवश्यकता, संक्रमण जोखिम, दवाओं और देखभालकर्ता की तैयारी की समीक्षा की जाती है।" },
      { title: "PEG placement", titleHi: "पीईजी प्लेसमेंट", text: "The feeding tube is placed endoscopically through the abdominal wall into the stomach.", textHi: "फीडिंग ट्यूब को पेट की दीवार के माध्यम से एंडोस्कोपिक रूप से पेट में डाला जाता है।" },
      { title: "Home care guidance", titleHi: "घरेलू देखभाल मार्गदर्शन", text: "Tube cleaning, feeding, flushing and warning signs are explained before follow-up.", textHi: "फॉलो-अप से पहले ट्यूब की सफाई, फीडिंग, फ्लशिंग और चेतावनी संकेत समझाए जाते हैं।" }
    ]
  },
  "cbd-stone-removal": {
    overview: "CBD stone removal treats stones in the common bile duct, usually through ERCP, when stones cause jaundice, pain, fever, infection or abnormal liver reports.",
    overviewHi: "सीबीडी स्टोन रिमूवल कॉमन बाइल डक्ट में पथरी का उपचार करता है, आमतौर पर ईआरसीपी के माध्यम से, जब पथरी पीलिया, दर्द, बुखार, संक्रमण या असामान्य लिवर रिपोर्ट का कारण बनती है।",
    consultCues: ["CBD stone seen on ultrasound, CT or MRCP", "Jaundice with upper abdominal pain", "Fever or infection with suspected bile duct blockage", "Recurrent biliary pain after gallbladder stone disease"],
    consultCuesHi: ["अल्ट्रासाउंड, सीटी या एमआरसीपी में दिखी सीबीडी पथरी", "ऊपरी पेट दर्द के साथ पीलिया", "पित्त नली में रुकावट की आशंका के साथ बुखार या संक्रमण", "पित्ताशय की पथरी के बाद बार-बार होने वाला पित्त संबंधी दर्द"],
    relatedTerms: ["CBD stone removal Agra", "Common bile duct stone Agra", "ERCP stone removal Agra", "Bile duct stone specialist Agra"],
    pathway: [
      { title: "Stone confirmation", titleHi: "पथरी पुष्टि", text: "Imaging and liver tests are reviewed to confirm location and urgency.", textHi: "स्थान और तात्कालिकता की पुष्टि के लिए इमेजिंग और लिवर टेस्ट की समीक्षा की जाती है।" },
      { title: "ERCP removal", titleHi: "ईआरसीपी निकासी", text: "Stone extraction, drainage or stenting is planned based on duct findings.", textHi: "नली के निष्कर्षों के आधार पर पथरी निकालना, ड्रेनेज या स्टेंटिंग की योजना बनाई जाती है।" },
      { title: "Recurrence prevention", titleHi: "पुनरावृत्ति रोकथाम", text: "Gallbladder, infection and follow-up needs are discussed after treatment.", textHi: "उपचार के बाद पित्ताशय, संक्रमण और फॉलो-अप आवश्यकताओं पर चर्चा की जाती है।" }
    ]
  },
  "pancreatic-duct-stone-removal": {
    overview: "Pancreatic duct stone removal is considered in selected chronic pancreatitis cases where duct stones contribute to pain, duct blockage or recurrent pancreatic symptoms.",
    overviewHi: "पैंक्रियाटिक डक्ट स्टोन रिमूवल पर चुनिंदा क्रोनिक पैंक्रियाटाइटिस मामलों में विचार किया जाता है जहां नली की पथरी दर्द, नली में रुकावट या बार-बार होने वाले अग्न्याशय लक्षणों में योगदान देती है।",
    consultCues: ["Chronic pancreatitis with duct stone on imaging", "Recurrent upper abdominal pain radiating to the back", "Pancreatic duct blockage or dilation", "Doctor-advised ERCP-based pancreatic therapy"],
    consultCuesHi: ["इमेजिंग में नली की पथरी के साथ क्रोनिक पैंक्रियाटाइटिस", "पीठ तक फैलने वाला बार-बार ऊपरी पेट दर्द", "अग्न्याशय नली में रुकावट या फैलाव", "डॉक्टर द्वारा सुझाई गई ईआरसीपी-आधारित अग्न्याशय थेरेपी"],
    relatedTerms: ["Pancreatic duct stone Agra", "Chronic pancreatitis treatment Agra", "Pancreatic ERCP Agra", "Pancreas specialist Agra"],
    pathway: [
      { title: "Pancreas imaging review", titleHi: "अग्न्याशय इमेजिंग समीक्षा", text: "CT, MRCP or prior reports are reviewed to locate stones and duct changes.", textHi: "पथरी और नली में बदलाव का पता लगाने के लिए सीटी, एमआरसीपी या पिछली रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Duct therapy planning", titleHi: "नली थेरेपी योजना", text: "Stone extraction, stenting or staged treatment is considered based on suitability.", textHi: "उपयुक्तता के आधार पर पथरी निकालना, स्टेंटिंग या चरणबद्ध उपचार पर विचार किया जाता है।" },
      { title: "Pain and follow-up plan", titleHi: "दर्द और फॉलो-अप योजना", text: "Diet, medicines, enzyme support and repeat treatment needs are discussed.", textHi: "आहार, दवाओं, एंज़ाइम सहायता और दोबारा उपचार की आवश्यकताओं पर चर्चा की जाती है।" }
    ]
  },
  "stricture-dilation": {
    overview: "Stricture dilation widens selected narrowed areas in the food pipe or GI tract to improve swallowing, passage of food or relief from obstruction symptoms.",
    overviewHi: "स्ट्रिक्चर डाइलेशन भोजन नली या जीआई ट्रैक्ट के चुनिंदा संकुचित क्षेत्रों को चौड़ा करता है ताकि निगलने, भोजन के मार्ग या रुकावट के लक्षणों से राहत में सुधार हो सके।",
    consultCues: ["Difficulty swallowing solids or liquids", "Food sticking sensation or recurrent vomiting", "Known food-pipe, stomach outlet or intestinal narrowing", "Doctor-advised endoscopic dilation"],
    consultCuesHi: ["ठोस या तरल पदार्थ निगलने में कठिनाई", "भोजन अटकने का एहसास या बार-बार उल्टी", "ज्ञात भोजन नली, पेट के आउटलेट या आंत का संकुचन", "डॉक्टर द्वारा सुझाया गया एंडोस्कोपिक डाइलेशन"],
    relatedTerms: ["Stricture dilation Agra", "Food pipe narrowing treatment Agra", "Esophageal dilation Agra", "GI narrowing treatment Agra"],
    pathway: [
      { title: "Narrowing assessment", titleHi: "संकुचन आकलन", text: "Symptoms, endoscopy findings and imaging are reviewed before dilation.", textHi: "डाइलेशन से पहले लक्षण, एंडोस्कोपी निष्कर्ष और इमेजिंग की समीक्षा की जाती है।" },
      { title: "Dilation planning", titleHi: "डाइलेशन योजना", text: "Balloon or bougie dilation is selected based on site, cause and safety.", textHi: "स्थान, कारण और सुरक्षा के आधार पर बैलून या बूजी डाइलेशन चुना जाता है।" },
      { title: "Diet and repeat sessions", titleHi: "आहार और दोबारा सत्र", text: "Food progression, medicines and need for staged dilation are explained.", textHi: "भोजन की प्रगति, दवाएं और चरणबद्ध डाइलेशन की आवश्यकता समझाई जाती है।" }
    ]
  },
  "esophageal-dilation": {
    overview: "Esophageal dilation is used to widen selected narrowing in the food pipe that causes swallowing difficulty, food sticking or recurrent obstruction symptoms.",
    overviewHi: "एसोफेजियल डाइलेशन का उपयोग भोजन नली के चुनिंदा संकुचन को चौड़ा करने के लिए किया जाता है जो निगलने में कठिनाई, भोजन अटकने या बार-बार रुकावट के लक्षणों का कारण बनता है।",
    consultCues: ["Difficulty swallowing solids or liquids", "Food sticking in chest or throat", "Known food-pipe stricture, ring or reflux-related narrowing", "Need for repeat dilation after prior endoscopy"],
    consultCuesHi: ["ठोस या तरल पदार्थ निगलने में कठिनाई", "सीने या गले में भोजन अटकना", "ज्ञात भोजन नली स्ट्रिक्चर, रिंग या रिफ्लक्स से संबंधित संकुचन", "पिछली एंडोस्कोपी के बाद दोबारा डाइलेशन की आवश्यकता"],
    relatedTerms: ["Esophageal dilation Agra", "Food pipe dilation Agra", "Dysphagia treatment Agra", "Esophageal stricture treatment Agra"],
    pathway: [
      { title: "Swallowing assessment", titleHi: "निगलने का आकलन", text: "Symptom progression, prior endoscopy and warning signs are reviewed first.", textHi: "सबसे पहले लक्षणों की प्रगति, पिछली एंडोस्कोपी और चेतावनी संकेतों की समीक्षा की जाती है।" },
      { title: "Dilation procedure", titleHi: "डाइलेशन प्रक्रिया", text: "Balloon or bougie dilation is selected based on narrowing type and location.", textHi: "संकुचन के प्रकार और स्थान के आधार पर बैलून या बूजी डाइलेशन चुना जाता है।" },
      { title: "Diet progression", titleHi: "आहार प्रगति", text: "Food texture, reflux medicines and repeat session need are discussed.", textHi: "भोजन की बनावट, रिफ्लक्स दवाओं और दोबारा सत्र की आवश्यकता पर चर्चा की जाती है।" }
    ]
  },
  "gi-stenting": {
    overview: "GI stenting helps relieve selected blockages or strictures in the digestive tract or bile duct, supporting swallowing, drainage, palliation or symptom relief.",
    overviewHi: "जीआई स्टेंटिंग पाचन तंत्र या पित्त नली में चुनिंदा रुकावटों या स्ट्रिक्चर से राहत देने में मदद करती है, जिससे निगलने, ड्रेनेज, उपशमन या लक्षणों से राहत में सहायता मिलती है।",
    consultCues: ["Food pipe, stomach, intestine or bile duct blockage", "Difficulty swallowing due to narrowing", "Obstructive jaundice needing drainage", "Doctor-advised palliative or bridge stenting"],
    consultCuesHi: ["भोजन नली, पेट, आंत या पित्त नली में रुकावट", "संकुचन के कारण निगलने में कठिनाई", "ड्रेनेज की आवश्यकता वाला ऑब्सट्रक्टिव पीलिया", "डॉक्टर द्वारा सुझाई गई उपशामक या ब्रिज स्टेंटिंग"],
    relatedTerms: ["GI stenting Agra", "Esophageal stent Agra", "Bile duct stent Agra", "Intestinal blockage stent Agra"],
    pathway: [
      { title: "Blockage mapping", titleHi: "रुकावट मैपिंग", text: "Endoscopy, imaging and clinical status define the site and purpose of stenting.", textHi: "एंडोस्कोपी, इमेजिंग और नैदानिक स्थिति स्टेंटिंग के स्थान और उद्देश्य को परिभाषित करती है।" },
      { title: "Stent selection", titleHi: "स्टेंट चयन", text: "Stent type and placement approach are chosen according to the condition.", textHi: "स्थिति के अनुसार स्टेंट का प्रकार और प्लेसमेंट का तरीका चुना जाता है।" },
      { title: "Post-stent care", titleHi: "स्टेंट के बाद देखभाल", text: "Diet, warning symptoms and follow-up imaging or endoscopy are planned.", textHi: "आहार, चेतावनी लक्षण और फॉलो-अप इमेजिंग या एंडोस्कोपी की योजना बनाई जाती है।" }
    ]
  },
  "bile-duct-stenting": {
    overview: "Bile duct stenting is an ERCP-guided procedure used to relieve blocked bile flow from stones, strictures, tumors or pancreaticobiliary disease. It can reduce jaundice, itching, infection risk and abnormal liver test changes.",
    overviewHi: "बाइल डक्ट स्टेंटिंग एक ईआरसीपी-निर्देशित प्रक्रिया है जिसका उपयोग पथरी, स्ट्रिक्चर, ट्यूमर या पैंक्रियाटो-बिलियरी रोग से अवरुद्ध पित्त प्रवाह को राहत देने के लिए किया जाता है। यह पीलिया, खुजली, संक्रमण जोखिम और असामान्य लिवर टेस्ट में बदलाव को कम कर सकती है।",
    consultCues: ["Obstructive jaundice with bile duct blockage", "Bile duct stricture or tumor-related narrowing", "Cholangitis, fever or infection with duct obstruction", "Temporary drainage needed before further treatment"],
    consultCuesHi: ["पित्त नली में रुकावट के साथ ऑब्सट्रक्टिव पीलिया", "पित्त नली स्ट्रिक्चर या ट्यूमर से संबंधित संकुचन", "नली में रुकावट के साथ कोलैंजाइटिस, बुखार या संक्रमण", "आगे के उपचार से पहले अस्थायी ड्रेनेज की आवश्यकता"],
    relatedTerms: ["Bile duct stenting Agra", "ERCP stent Agra", "Jaundice stenting Agra", "Biliary stent Agra"],
    pathway: [
      { title: "Obstruction review", titleHi: "रुकावट समीक्षा", text: "Liver tests, ultrasound, CT or MRCP help confirm the site and cause.", textHi: "लिवर टेस्ट, अल्ट्रासाउंड, सीटी या एमआरसीपी स्थान और कारण की पुष्टि में मदद करते हैं।" },
      { title: "ERCP stent placement", titleHi: "ईआरसीपी स्टेंट प्लेसमेंट", text: "A suitable stent is placed to improve bile drainage when clinically appropriate.", textHi: "चिकित्सकीय रूप से उपयुक्त होने पर पित्त प्रवाह में सुधार के लिए उपयुक्त स्टेंट लगाया जाता है।" },
      { title: "Stent follow-up", titleHi: "स्टेंट फॉलो-अप", text: "Repeat testing, stent change timing and warning symptoms are explained.", textHi: "दोबारा जांच, स्टेंट बदलने का समय और चेतावनी लक्षण समझाए जाते हैं।" }
    ]
  },
  "endoscopic-hemostasis": {
    overview: "Endoscopic hemostasis controls selected gastrointestinal bleeding using clips, injection therapy, thermal therapy or other endoscopic methods depending on the bleeding source.",
    overviewHi: "एंडोस्कोपिक हीमोस्टेसिस रक्तस्राव के स्रोत के आधार पर क्लिप्स, इंजेक्शन थेरेपी, थर्मल थेरेपी या अन्य एंडोस्कोपिक तरीकों का उपयोग करके चुनिंदा जठरांत्र रक्तस्राव को नियंत्रित करता है।",
    consultCues: ["Vomiting blood, black stools or red blood in stool", "Bleeding ulcer or visible vessel on endoscopy", "Post-polypectomy bleeding or vascular bleeding lesion", "Anemia or recurrent bleeding needing endoscopic therapy"],
    consultCuesHi: ["खून की उल्टी, काला मल या मल में लाल खून", "एंडोस्कोपी में दिखने वाला रक्तस्रावी अल्सर या दिखाई देने वाली रक्त वाहिका", "पॉलीपेक्टॉमी के बाद रक्तस्राव या वैस्कुलर रक्तस्रावी घाव", "एंडोस्कोपिक थेरेपी की आवश्यकता वाला एनीमिया या बार-बार रक्तस्राव"],
    relatedTerms: ["Endoscopic hemostasis Agra", "GI bleeding control Agra", "Bleeding ulcer treatment Agra", "Endoscopic clipping Agra"],
    pathway: [
      { title: "Bleeding source check", titleHi: "रक्तस्राव स्रोत जांच", text: "Endoscopy or colonoscopy identifies the bleeding location and severity.", textHi: "एंडोस्कोपी या कोलोनोस्कोपी रक्तस्राव के स्थान और गंभीरता की पहचान करती है।" },
      { title: "Hemostasis technique", titleHi: "हीमोस्टेसिस तकनीक", text: "Clips, injection, cautery or combined therapy is selected based on the lesion.", textHi: "घाव के आधार पर क्लिप्स, इंजेक्शन, कॉटरी या संयुक्त थेरेपी चुनी जाती है।" },
      { title: "Rebleeding prevention", titleHi: "दोबारा रक्तस्राव रोकथाम", text: "Medicines, monitoring, diet and repeat endoscopy need are planned.", textHi: "दवाओं, निगरानी, आहार और दोबारा एंडोस्कोपी की आवश्यकता की योजना बनाई जाती है।" }
    ]
  },
  "argon-plasma-coagulation": {
    overview: "Argon Plasma Coagulation (APC) is a non-contact endoscopic coagulation technique used for selected superficial bleeding lesions, vascular malformations and radiation-related injury.",
    overviewHi: "आर्गन प्लाज़्मा कोएगुलेशन (एपीसी) एक नॉन-कॉन्टैक्ट एंडोस्कोपिक कोएगुलेशन तकनीक है जिसका उपयोग चुनिंदा सतही रक्तस्रावी घावों, वैस्कुलर विकृतियों और रेडिएशन से संबंधित चोट के लिए किया जाता है।",
    consultCues: ["Recurrent bleeding from vascular lesions", "Radiation proctitis or superficial bleeding areas", "Selected oozing lesions seen on endoscopy or colonoscopy", "Doctor-advised APC for controlled coagulation"],
    consultCuesHi: ["वैस्कुलर घावों से बार-बार रक्तस्राव", "रेडिएशन प्रोक्टाइटिस या सतही रक्तस्रावी क्षेत्र", "एंडोस्कोपी या कोलोनोस्कोपी में दिखे चुनिंदा रिसते घाव", "नियंत्रित कोएगुलेशन के लिए डॉक्टर द्वारा सुझाई गई एपीसी"],
    relatedTerms: ["Argon plasma coagulation Agra", "APC endoscopy Agra", "Radiation proctitis treatment Agra", "Vascular lesion bleeding Agra"],
    pathway: [
      { title: "Lesion assessment", titleHi: "घाव आकलन", text: "The site, depth and bleeding pattern are checked before APC is selected.", textHi: "एपीसी चुनने से पहले स्थान, गहराई और रक्तस्राव के पैटर्न की जांच की जाती है।" },
      { title: "APC therapy", titleHi: "एपीसी थेरेपी", text: "Argon plasma energy is applied endoscopically to coagulate suitable tissue.", textHi: "उपयुक्त टिशू को जमाने के लिए आर्गन प्लाज़्मा ऊर्जा एंडोस्कोपिक रूप से लगाई जाती है।" },
      { title: "Follow-up planning", titleHi: "फॉलो-अप योजना", text: "Response, repeat sessions and bleeding recurrence are monitored.", textHi: "प्रतिक्रिया, दोबारा सत्र और रक्तस्राव की पुनरावृत्ति की निगरानी की जाती है।" }
    ]
  },
  "intragastric-balloon-placement": {
    overview: "Intragastric balloon placement is a non-surgical endoscopic weight-loss support option for selected patients, combined with lifestyle and nutrition guidance.",
    overviewHi: "इंट्रागैस्ट्रिक बैलून प्लेसमेंट चुनिंदा मरीज़ों के लिए एक गैर-सर्जिकल एंडोस्कोपिक वज़न घटाने की सहायता है, जो जीवनशैली और पोषण मार्गदर्शन के साथ जुड़ी होती है।",
    consultCues: ["Need for non-surgical weight-loss support", "Obesity with metabolic risk factors", "Lifestyle program advised with endoscopic support", "Patient suitable after gastroenterology assessment"],
    consultCuesHi: ["गैर-सर्जिकल वज़न घटाने की सहायता की आवश्यकता", "मेटाबॉलिक जोखिम कारकों के साथ मोटापा", "एंडोस्कोपिक सहायता के साथ सुझाया गया जीवनशैली कार्यक्रम", "गैस्ट्रोएंटरोलॉजी मूल्यांकन के बाद उपयुक्त पाया गया मरीज़"],
    relatedTerms: ["Intragastric balloon Agra", "Endoscopic weight loss Agra", "Non surgical obesity treatment Agra", "Gastric balloon Agra"],
    pathway: [
      { title: "Eligibility review", titleHi: "पात्रता समीक्षा", text: "BMI, medical history, eating pattern and contraindications are reviewed first.", textHi: "सबसे पहले बीएमआई, चिकित्सा इतिहास, खाने के पैटर्न और contraindications की समीक्षा की जाती है।" },
      { title: "Balloon placement", titleHi: "बैलून प्लेसमेंट", text: "The balloon is placed endoscopically with safety and recovery instructions.", textHi: "सुरक्षा और रिकवरी निर्देशों के साथ बैलून को एंडोस्कोपिक रूप से रखा जाता है।" },
      { title: "Nutrition follow-up", titleHi: "पोषण फॉलो-अप", text: "Diet stages, lifestyle changes and removal timing are planned.", textHi: "आहार के चरण, जीवनशैली में बदलाव और निकालने का समय तय किया जाता है।" }
    ]
  },
  "fibroscan": {
    overview: "Fibroscan is a non-invasive test that estimates liver stiffness and fatty change, helping monitor fatty liver, fibrosis, cirrhosis risk and chronic liver disease.",
    overviewHi: "फाइब्रोस्कैन एक नॉन-इनवेसिव जांच है जो लिवर की कठोरता और फैटी बदलाव का अनुमान लगाती है, जिससे फैटी लिवर, फाइब्रोसिस, सिरोसिस जोखिम और पुराने लिवर रोग की निगरानी में मदद मिलती है।",
    consultCues: ["Fatty liver on ultrasound", "Abnormal liver function tests", "Diabetes, obesity or metabolic risk with liver concerns", "Chronic hepatitis, alcohol-related liver risk or fibrosis monitoring"],
    consultCuesHi: ["अल्ट्रासाउंड में फैटी लिवर", "असामान्य लिवर फंक्शन टेस्ट", "लिवर संबंधी चिंताओं के साथ डायबिटीज़, मोटापा या मेटाबॉलिक जोखिम", "क्रोनिक हेपेटाइटिस, शराब से संबंधित लिवर जोखिम या फाइब्रोसिस निगरानी"],
    relatedTerms: ["Fibroscan in Agra", "Fatty liver test Agra", "Liver stiffness test Agra", "Liver fibrosis scan Agra"],
    pathway: [
      { title: "Risk assessment", titleHi: "जोखिम आकलन", text: "Weight, diabetes, alcohol history, viral markers and liver reports are reviewed.", textHi: "वज़न, डायबिटीज़, शराब का इतिहास, वायरल मार्कर और लिवर रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Non-invasive scan", titleHi: "नॉन-इनवेसिव स्कैन", text: "Liver stiffness and fat parameters are measured without incision or sedation.", textHi: "बिना चीरे या सेडेशन के लिवर की कठोरता और फैट पैरामीटर मापे जाते हैं।" },
      { title: "Liver plan", titleHi: "लिवर योजना", text: "Results guide lifestyle, medicines, monitoring frequency and further testing.", textHi: "परिणाम जीवनशैली, दवाओं, निगरानी की आवृत्ति और आगे की जांच का मार्गदर्शन करते हैं।" }
    ]
  },
  "ascitic-fluid-tapping": {
    overview: "Ascitic fluid tapping helps diagnose or relieve abdominal fluid buildup, often linked with liver disease, infection or other medical conditions.",
    overviewHi: "एसाइटिक फ्लूइड टैपिंग पेट में तरल पदार्थ जमा होने का निदान करने या राहत देने में मदद करती है, जो अक्सर लिवर रोग, संक्रमण या अन्य चिकित्सीय स्थितियों से जुड़ी होती है।",
    consultCues: ["Increasing abdominal swelling or tightness", "Known liver disease with fluid in abdomen", "Fever, pain or suspected infected ascitic fluid", "Doctor-advised fluid testing or therapeutic drainage"],
    consultCuesHi: ["बढ़ता हुआ पेट फूलना या कसाव", "पेट में तरल पदार्थ के साथ ज्ञात लिवर रोग", "बुखार, दर्द या संदिग्ध संक्रमित एसाइटिक फ्लूइड", "डॉक्टर द्वारा सुझाई गई फ्लूइड जांच या चिकित्सीय ड्रेनेज"],
    relatedTerms: ["Ascitic fluid tapping Agra", "Ascites drainage Agra", "Abdominal fluid test Agra", "Liver ascites treatment Agra"],
    pathway: [
      { title: "Fluid assessment", titleHi: "फ्लूइड आकलन", text: "Cause, amount of fluid, infection risk and blood reports are reviewed.", textHi: "कारण, तरल पदार्थ की मात्रा, संक्रमण जोखिम और ब्लड रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Safe tapping", titleHi: "सुरक्षित टैपिंग", text: "Diagnostic or therapeutic fluid removal is planned with sterile precautions.", textHi: "स्टेराइल सावधानियों के साथ डायग्नोस्टिक या चिकित्सीय फ्लूइड निकासी की योजना बनाई जाती है।" },
      { title: "Cause treatment", titleHi: "कारण उपचार", text: "Liver care, medicines, salt restriction and follow-up testing are discussed.", textHi: "लिवर देखभाल, दवाओं, नमक प्रतिबंध और फॉलो-अप जांच पर चर्चा की जाती है।" }
    ]
  },
  "varices": {
    overview: "Varices are enlarged veins in the food pipe or stomach, usually caused by portal hypertension from chronic liver disease. They need monitoring because they can bleed suddenly.",
    overviewHi: "वेरिसेस भोजन नली या पेट में बढ़ी हुई नसें हैं, जो आमतौर पर पुराने लिवर रोग से होने वाले पोर्टल हाइपरटेंशन के कारण होती हैं। इन्हें निगरानी की आवश्यकता होती है क्योंकि ये अचानक रक्तस्राव कर सकती हैं।",
    consultCues: ["Cirrhosis or chronic liver disease with suspected varices", "Vomiting blood, black stools or anemia", "Endoscopy report showing esophageal or gastric varices", "Need for screening or repeat surveillance endoscopy"],
    consultCuesHi: ["संदिग्ध वेरिसेस के साथ सिरोसिस या पुराना लिवर रोग", "खून की उल्टी, काला मल या एनीमिया", "एसोफेजियल या गैस्ट्रिक वेरिसेस दिखाने वाली एंडोस्कोपी रिपोर्ट", "स्क्रीनिंग या दोबारा निगरानी एंडोस्कोपी की आवश्यकता"],
    relatedTerms: ["Varices treatment Agra", "Esophageal varices Agra", "Portal hypertension Agra", "Liver varices specialist Agra"],
    pathway: [
      { title: "Liver risk review", titleHi: "लिवर जोखिम समीक्षा", text: "Cirrhosis stage, platelet count, spleen size and prior bleeding history are reviewed.", textHi: "सिरोसिस का चरण, प्लेटलेट काउंट, तिल्ली का आकार और पिछले रक्तस्राव का इतिहास समीक्षा किया जाता है।" },
      { title: "Endoscopic screening", titleHi: "एंडोस्कोपिक स्क्रीनिंग", text: "Endoscopy helps grade varices and decide medicines or banding need.", textHi: "एंडोस्कोपी वेरिसेस को ग्रेड करने और दवाओं या बैंडिंग की आवश्यकता तय करने में मदद करती है।" },
      { title: "Bleeding prevention", titleHi: "रक्तस्राव रोकथाम", text: "Surveillance, banding sessions and liver care reduce future bleeding risk.", textHi: "निगरानी, बैंडिंग सत्र और लिवर देखभाल भविष्य के रक्तस्राव जोखिम को कम करते हैं।" }
    ]
  },
  "liver-cirrhosis": {
    overview: "Liver cirrhosis is advanced liver scarring that can cause jaundice, swelling, fluid in the abdomen, bleeding varices, confusion and infection risk. Specialist follow-up helps detect complications early.",
    overviewHi: "लिवर सिरोसिस उन्नत लिवर स्कारिंग है जो पीलिया, सूजन, पेट में तरल पदार्थ, रक्तस्रावी वेरिसेस, भ्रम और संक्रमण के जोखिम का कारण बन सकती है। विशेषज्ञ फॉलो-अप जटिलताओं का जल्दी पता लगाने में मदद करता है।",
    consultCues: ["Known cirrhosis, low platelets or enlarged spleen", "Jaundice, abdominal fluid, leg swelling or fatigue", "Vomiting blood, black stools or confusion", "Need for Fibroscan, endoscopy surveillance or long-term liver care"],
    consultCuesHi: ["ज्ञात सिरोसिस, कम प्लेटलेट्स या बढ़ी हुई तिल्ली", "पीलिया, पेट में तरल पदार्थ, पैरों में सूजन या थकान", "खून की उल्टी, काला मल या भ्रम", "फाइब्रोस्कैन, एंडोस्कोपी निगरानी या दीर्घकालिक लिवर देखभाल की आवश्यकता"],
    relatedTerms: ["Liver cirrhosis doctor Agra", "Liver specialist Agra", "Cirrhosis treatment Agra", "Portal hypertension Agra"],
    pathway: [
      { title: "Stage and cause review", titleHi: "चरण और कारण समीक्षा", text: "Alcohol, fatty liver, viral hepatitis and autoimmune causes are assessed with reports.", textHi: "रिपोर्ट के साथ शराब, फैटी लिवर, वायरल हेपेटाइटिस और ऑटोइम्यून कारणों का आकलन किया जाता है।" },
      { title: "Complication screening", titleHi: "जटिलता स्क्रीनिंग", text: "Varices, ascites, infection risk and liver cancer surveillance are planned.", textHi: "वेरिसेस, एसाइटिस, संक्रमण जोखिम और लिवर कैंसर निगरानी की योजना बनाई जाती है।" },
      { title: "Long-term care", titleHi: "दीर्घकालिक देखभाल", text: "Medicines, diet, vaccinations, monitoring and emergency warning signs are discussed.", textHi: "दवाओं, आहार, टीकाकरण, निगरानी और आपातकालीन चेतावनी संकेतों पर चर्चा की जाती है।" }
    ]
  },
  "fatty-liver": {
    overview: "Fatty liver is commonly linked with obesity, diabetes, cholesterol, alcohol or metabolic risk. Early evaluation helps prevent progression to fibrosis and cirrhosis.",
    overviewHi: "फैटी लिवर आमतौर पर मोटापे, डायबिटीज़, कोलेस्ट्रॉल, शराब या मेटाबॉलिक जोखिम से जुड़ा होता है। जल्दी मूल्यांकन फाइब्रोसिस और सिरोसिस की ओर बढ़ने से रोकने में मदद करता है।",
    consultCues: ["Fatty liver seen on ultrasound", "Raised SGOT, SGPT or abnormal liver function tests", "Diabetes, obesity, high cholesterol or metabolic syndrome", "Need for Fibroscan and lifestyle-based liver plan"],
    consultCuesHi: ["अल्ट्रासाउंड में दिखा फैटी लिवर", "बढ़ा हुआ एसजीओटी, एसजीपीटी या असामान्य लिवर फंक्शन टेस्ट", "डायबिटीज़, मोटापा, उच्च कोलेस्ट्रॉल या मेटाबॉलिक सिंड्रोम", "फाइब्रोस्कैन और जीवनशैली-आधारित लिवर योजना की आवश्यकता"],
    relatedTerms: ["Fatty liver treatment Agra", "Fatty liver doctor Agra", "Liver fat scan Agra", "SGPT high treatment Agra"],
    pathway: [
      { title: "Metabolic risk review", titleHi: "मेटाबॉलिक जोखिम समीक्षा", text: "Weight, sugar, cholesterol, alcohol intake and liver reports are reviewed.", textHi: "वज़न, शुगर, कोलेस्ट्रॉल, शराब सेवन और लिवर रिपोर्ट की समीक्षा की जाती है।" },
      { title: "Fibrosis check", titleHi: "फाइब्रोसिस जांच", text: "Fibroscan or other tests help assess liver stiffness and progression risk.", textHi: "फाइब्रोस्कैन या अन्य जांच लिवर की कठोरता और बढ़ने के जोखिम का आकलन करने में मदद करती हैं।" },
      { title: "Lifestyle plan", titleHi: "जीवनशैली योजना", text: "Diet, exercise, weight loss targets and follow-up labs are planned.", textHi: "आहार, व्यायाम, वज़न घटाने के लक्ष्य और फॉलो-अप लैब की योजना बनाई जाती है।" }
    ]
  },
  "liver-fibrosis": {
    overview: "Liver fibrosis means scarring in the liver from chronic injury. It can be caused by fatty liver, alcohol, hepatitis or other liver diseases and needs monitoring to prevent progression.",
    overviewHi: "लिवर फाइब्रोसिस का अर्थ है पुरानी चोट से लिवर में स्कारिंग। यह फैटी लिवर, शराब, हेपेटाइटिस या अन्य लिवर रोगों के कारण हो सकता है और बढ़ने से रोकने के लिए निगरानी की आवश्यकता होती है।",
    consultCues: ["Fibroscan or ultrasound suggesting fibrosis", "Long-standing fatty liver or abnormal liver tests", "Alcohol-related or viral hepatitis-related liver risk", "Need to monitor liver stiffness over time"],
    consultCuesHi: ["फाइब्रोसिस का संकेत देने वाला फाइब्रोस्कैन या अल्ट्रासाउंड", "लंबे समय से फैटी लिवर या असामान्य लिवर टेस्ट", "शराब या वायरल हेपेटाइटिस से संबंधित लिवर जोखिम", "समय के साथ लिवर की कठोरता की निगरानी की आवश्यकता"],
    relatedTerms: ["Liver fibrosis Agra", "Fibroscan liver fibrosis Agra", "Liver scarring treatment Agra", "Chronic liver disease Agra"],
    pathway: [
      { title: "Cause identification", titleHi: "कारण पहचान", text: "Fatty liver, alcohol, viral hepatitis and other causes are checked.", textHi: "फैटी लिवर, शराब, वायरल हेपेटाइटिस और अन्य कारणों की जांच की जाती है।" },
      { title: "Stiffness monitoring", titleHi: "कठोरता निगरानी", text: "Fibroscan and blood tests help track fibrosis severity.", textHi: "फाइब्रोस्कैन और ब्लड टेस्ट फाइब्रोसिस की गंभीरता को ट्रैक करने में मदद करते हैं।" },
      { title: "Progression prevention", titleHi: "प्रगति रोकथाम", text: "Risk control, medicines when needed and regular follow-up are planned.", textHi: "जोखिम नियंत्रण, आवश्यकता पड़ने पर दवाएं और नियमित फॉलो-अप की योजना बनाई जाती है।" }
    ]
  },
  "obstructive-jaundice": {
    overview: "Obstructive jaundice occurs when bile flow is blocked by stones, strictures, tumors or pancreaticobiliary disease. It may need urgent evaluation if fever, pain or infection is present.",
    overviewHi: "ऑब्सट्रक्टिव पीलिया तब होता है जब पथरी, स्ट्रिक्चर, ट्यूमर या पैंक्रियाटो-बिलियरी रोग द्वारा पित्त प्रवाह अवरुद्ध हो जाता है। बुखार, दर्द या संक्रमण होने पर इसे तत्काल मूल्यांकन की आवश्यकता हो सकती है।",
    consultCues: ["Yellow eyes or urine with pale stool", "Jaundice with fever, chills or abdominal pain", "Bile duct blockage on ultrasound, CT or MRCP", "Suspected CBD stone, stricture or pancreaticobiliary obstruction"],
    consultCuesHi: ["पीली आंखें या पेशाब के साथ हल्के रंग का मल", "बुखार, ठंड लगना या पेट दर्द के साथ पीलिया", "अल्ट्रासाउंड, सीटी या एमआरसीपी में पित्त नली में रुकावट", "संदिग्ध सीबीडी पथरी, स्ट्रिक्चर या पैंक्रियाटो-बिलियरी रुकावट"],
    relatedTerms: ["Obstructive jaundice Agra", "Jaundice specialist Agra", "Bile duct blockage Agra", "ERCP jaundice Agra"],
    pathway: [
      { title: "Blockage evaluation", titleHi: "रुकावट मूल्यांकन", text: "Liver tests and imaging identify the level and likely cause of obstruction.", textHi: "लिवर टेस्ट और इमेजिंग रुकावट के स्तर और संभावित कारण की पहचान करते हैं।" },
      { title: "Drainage planning", titleHi: "ड्रेनेज योजना", text: "ERCP, stenting or stone removal is considered based on cause and urgency.", textHi: "कारण और तात्कालिकता के आधार पर ईआरसीपी, स्टेंटिंग या पथरी निकालने पर विचार किया जाता है।" },
      { title: "Cause follow-up", titleHi: "कारण फॉलो-अप", text: "Further testing, biopsy or surgery referral is planned if required.", textHi: "आवश्यकता पड़ने पर आगे की जांच, बायोप्सी या सर्जरी रेफरल की योजना बनाई जाती है।" }
    ]
  },
  "bile-duct-stricture": {
    overview: "Bile duct stricture is narrowing of the bile duct that can cause jaundice, itching, infection and abnormal liver reports. Evaluation focuses on the cause and whether drainage or stenting is needed.",
    overviewHi: "बाइल डक्ट स्ट्रिक्चर पित्त नली का संकुचन है जो पीलिया, खुजली, संक्रमण और असामान्य लिवर रिपोर्ट का कारण बन सकता है। मूल्यांकन कारण पर और ड्रेनेज या स्टेंटिंग की आवश्यकता पर केंद्रित होता है।",
    consultCues: ["Recurrent jaundice or itching", "Bile duct narrowing on MRCP, CT or ERCP", "Repeated cholangitis or fever with abnormal liver tests", "Post-surgery or chronic pancreatitis-related bile duct narrowing"],
    consultCuesHi: ["बार-बार पीलिया या खुजली", "एमआरसीपी, सीटी या ईआरसीपी में पित्त नली का संकुचन", "असामान्य लिवर टेस्ट के साथ बार-बार कोलैंजाइटिस या बुखार", "सर्जरी के बाद या क्रोनिक पैंक्रियाटाइटिस से संबंधित पित्त नली संकुचन"],
    relatedTerms: ["Bile duct stricture Agra", "Bile duct stenting Agra", "Cholangitis treatment Agra", "ERCP stenting Agra"],
    pathway: [
      { title: "Stricture cause review", titleHi: "स्ट्रिक्चर कारण समीक्षा", text: "Imaging, prior surgery, pancreatitis and tumor risk are reviewed.", textHi: "इमेजिंग, पिछली सर्जरी, पैंक्रियाटाइटिस और ट्यूमर जोखिम की समीक्षा की जाती है।" },
      { title: "Drainage decision", titleHi: "ड्रेनेज निर्णय", text: "ERCP, dilation, brush cytology or stenting is planned when suitable.", textHi: "उपयुक्त होने पर ईआरसीपी, डाइलेशन, ब्रश साइटोलॉजी या स्टेंटिंग की योजना बनाई जाती है।" },
      { title: "Ongoing monitoring", titleHi: "निरंतर निगरानी", text: "Liver tests, stent changes and recurrence symptoms are tracked.", textHi: "लिवर टेस्ट, स्टेंट में बदलाव और पुनरावृत्ति के लक्षणों को ट्रैक किया जाता है।" }
    ]
  },
  "pancreatic-disorders": {
    overview: "Pancreatic disorders include acute or chronic pancreatitis, duct stones, fluid collections and pancreaticobiliary problems. Care depends on pain pattern, imaging and complication risk.",
    overviewHi: "अग्न्याशय संबंधी रोगों में एक्यूट या क्रोनिक पैंक्रियाटाइटिस, नली की पथरी, फ्लूइड जमाव और पैंक्रियाटो-बिलियरी समस्याएं शामिल हैं। देखभाल दर्द के पैटर्न, इमेजिंग और जटिलता जोखिम पर निर्भर करती है।",
    consultCues: ["Recurrent upper abdominal pain radiating to the back", "History of acute or chronic pancreatitis", "Pancreatic duct stone, pseudocyst or fluid collection", "Weight loss, oily stools or diabetes with pancreatic disease"],
    consultCuesHi: ["पीठ तक फैलने वाला बार-बार ऊपरी पेट दर्द", "एक्यूट या क्रोनिक पैंक्रियाटाइटिस का इतिहास", "अग्न्याशय नली पथरी, स्यूडोसिस्ट या फ्लूइड जमाव", "अग्न्याशय रोग के साथ वज़न घटना, चिकना मल या डायबिटीज़"],
    relatedTerms: ["Pancreas specialist Agra", "Pancreatitis treatment Agra", "Pancreatic duct stone Agra", "Chronic pancreatitis Agra"],
    pathway: [
      { title: "Pancreas history review", titleHi: "अग्न्याशय इतिहास समीक्षा", text: "Pain, alcohol history, gallstones, diabetes and prior imaging are assessed.", textHi: "दर्द, शराब का इतिहास, पित्ताशय की पथरी, डायबिटीज़ और पिछली इमेजिंग का आकलन किया जाता है।" },
      { title: "Complication check", titleHi: "जटिलता जांच", text: "Duct stones, narrowing, fluid collections and nutrition issues are evaluated.", textHi: "नली की पथरी, संकुचन, फ्लूइड जमाव और पोषण संबंधी समस्याओं का मूल्यांकन किया जाता है।" },
      { title: "Treatment planning", titleHi: "उपचार योजना", text: "Medicines, enzymes, diet, ERCP or referral decisions are planned.", textHi: "दवाओं, एंज़ाइम, आहार, ईआरसीपी या रेफरल निर्णयों की योजना बनाई जाती है।" }
    ]
  },
  "acidity-gerd": {
    overview: "Acidity and GERD can cause heartburn, sour belching, chest discomfort, throat irritation and sleep disturbance. Long-standing or alarm symptoms may require endoscopy.",
    overviewHi: "एसिडिटी और जीईआरडी सीने में जलन, खट्टी डकार, सीने में परेशानी, गले में जलन और नींद में गड़बड़ी का कारण बन सकते हैं। लंबे समय से चले आ रहे या चेतावनी लक्षणों के लिए एंडोस्कोपी की आवश्यकता हो सकती है।",
    consultCues: ["Frequent heartburn, reflux or sour belching", "Symptoms despite regular acidity medicines", "Difficulty swallowing, vomiting, weight loss or anemia", "Long-standing GERD needing endoscopy evaluation"],
    consultCuesHi: ["बार-बार सीने में जलन, रिफ्लक्स या खट्टी डकार", "नियमित एसिडिटी दवाओं के बावजूद लक्षण", "निगलने में कठिनाई, उल्टी, वज़न घटना या एनीमिया", "एंडोस्कोपी मूल्यांकन की आवश्यकता वाला लंबे समय से चला आ रहा जीईआरडी"],
    relatedTerms: ["Acidity treatment Agra", "GERD specialist Agra", "Reflux doctor Agra", "Heartburn treatment Agra"],
    pathway: [
      { title: "Symptom pattern review", titleHi: "लक्षण पैटर्न समीक्षा", text: "Meal relation, night symptoms, medicines and alarm symptoms are reviewed.", textHi: "भोजन से संबंध, रात के लक्षण, दवाएं और चेतावनी लक्षणों की समीक्षा की जाती है।" },
      { title: "Endoscopy decision", titleHi: "एंडोस्कोपी निर्णय", text: "Endoscopy is considered when symptoms are persistent or warning signs are present.", textHi: "लक्षण लगातार बने रहने या चेतावनी संकेत होने पर एंडोस्कोपी पर विचार किया जाता है।" },
      { title: "Lifestyle and medicine plan", titleHi: "जीवनशैली और दवा योजना", text: "Diet timing, weight control, medicines and follow-up are personalized.", textHi: "आहार का समय, वज़न नियंत्रण, दवाएं और फॉलो-अप व्यक्तिगत रूप से तय किए जाते हैं।" }
    ]
  },
  "peptic-ulcer-disease": {
    overview: "Peptic ulcer disease affects the stomach or duodenum and may cause pain, acidity, vomiting, anemia, black stools or bleeding. Diagnosis often involves endoscopy and targeted medicines.",
    overviewHi: "पेप्टिक अल्सर रोग पेट या ड्यूडेनम को प्रभावित करता है और दर्द, एसिडिटी, उल्टी, एनीमिया, काला मल या रक्तस्राव का कारण बन सकता है। निदान में अक्सर एंडोस्कोपी और लक्षित दवाएं शामिल होती हैं।",
    consultCues: ["Burning upper abdominal pain or pain related to meals", "Black stools, vomiting blood or unexplained anemia", "Painkiller use, acidity medicines or suspected H. pylori infection", "Recurrent ulcer symptoms or prior ulcer history"],
    consultCuesHi: ["ऊपरी पेट में जलन वाला दर्द या भोजन से संबंधित दर्द", "काला मल, खून की उल्टी या अस्पष्टीकृत एनीमिया", "पेनकिलर का उपयोग, एसिडिटी दवाएं या संदिग्ध एच. पाइलोरी संक्रमण", "बार-बार अल्सर के लक्षण या पिछला अल्सर इतिहास"],
    relatedTerms: ["Peptic ulcer treatment Agra", "Stomach ulcer doctor Agra", "H pylori treatment Agra", "Black stool ulcer Agra"],
    pathway: [
      { title: "Risk review", titleHi: "जोखिम समीक्षा", text: "Painkillers, H. pylori risk, acidity symptoms and bleeding signs are assessed.", textHi: "पेनकिलर, एच. पाइलोरी जोखिम, एसिडिटी लक्षण और रक्तस्राव के संकेतों का आकलन किया जाता है।" },
      { title: "Endoscopy and testing", titleHi: "एंडोस्कोपी और जांच", text: "Endoscopy and biopsy/testing may be planned to confirm cause.", textHi: "कारण की पुष्टि के लिए एंडोस्कोपी और बायोप्सी/जांच की योजना बनाई जा सकती है।" },
      { title: "Healing plan", titleHi: "उपचार योजना", text: "Medicines, H. pylori treatment and repeat evaluation are advised when needed.", textHi: "आवश्यकता पड़ने पर दवाएं, एच. पाइलोरी उपचार और दोबारा मूल्यांकन की सलाह दी जाती है।" }
    ]
  },
  "difficulty-swallowing": {
    overview: "Difficulty swallowing can come from food-pipe narrowing, reflux injury, rings, strictures, motility problems or growths. Early evaluation is important when symptoms progress.",
    overviewHi: "निगलने में कठिनाई भोजन नली के संकुचन, रिफ्लक्स से चोट, रिंग्स, स्ट्रिक्चर, मोटिलिटी समस्याओं या वृद्धि से हो सकती है। लक्षण बढ़ने पर जल्दी मूल्यांकन महत्वपूर्ण है।",
    consultCues: ["Food sticking in throat or chest", "Progressive difficulty swallowing solids or liquids", "Weight loss, vomiting, anemia or chest discomfort", "Known stricture, reflux injury or suspected food-pipe narrowing"],
    consultCuesHi: ["गले या सीने में भोजन अटकना", "ठोस या तरल पदार्थ निगलने में बढ़ती कठिनाई", "वज़न घटना, उल्टी, एनीमिया या सीने में परेशानी", "ज्ञात स्ट्रिक्चर, रिफ्लक्स चोट या संदिग्ध भोजन नली संकुचन"],
    relatedTerms: ["Difficulty swallowing Agra", "Dysphagia doctor Agra", "Food pipe narrowing Agra", "Esophageal stricture Agra"],
    pathway: [
      { title: "Swallowing history", titleHi: "निगलने का इतिहास", text: "Solid/liquid difficulty, progression and warning symptoms are reviewed.", textHi: "ठोस/तरल पदार्थ की कठिनाई, प्रगति और चेतावनी लक्षणों की समीक्षा की जाती है।" },
      { title: "Endoscopy evaluation", titleHi: "एंडोस्कोपी मूल्यांकन", text: "The food pipe is examined for narrowing, injury, inflammation or growth.", textHi: "संकुचन, चोट, सूजन या वृद्धि के लिए भोजन नली की जांच की जाती है।" },
      { title: "Dilation or treatment plan", titleHi: "डाइलेशन या उपचार योजना", text: "Dilation, biopsy, medicines or further tests are planned based on findings.", textHi: "निष्कर्षों के आधार पर डाइलेशन, बायोप्सी, दवाएं या आगे की जांच की योजना बनाई जाती है।" }
    ]
  },
  "gi-stricture": {
    overview: "GI stricture means narrowing in part of the digestive tract or bile duct. It may cause swallowing difficulty, vomiting, obstruction, jaundice or recurrent symptoms depending on location.",
    overviewHi: "जीआई स्ट्रिक्चर का अर्थ है पाचन तंत्र या पित्त नली के किसी हिस्से में संकुचन। स्थान के आधार पर यह निगलने में कठिनाई, उल्टी, रुकावट, पीलिया या बार-बार लक्षणों का कारण बन सकता है।",
    consultCues: ["Known narrowing in food pipe, stomach, intestine, colon or bile duct", "Vomiting, bloating, obstruction symptoms or difficulty swallowing", "Jaundice due to duct narrowing", "Need for dilation, stenting or biopsy evaluation"],
    consultCuesHi: ["भोजन नली, पेट, आंत, कोलन या पित्त नली में ज्ञात संकुचन", "उल्टी, सूजन, रुकावट के लक्षण या निगलने में कठिनाई", "नली के संकुचन के कारण पीलिया", "डाइलेशन, स्टेंटिंग या बायोप्सी मूल्यांकन की आवश्यकता"],
    relatedTerms: ["GI stricture treatment Agra", "Digestive tract narrowing Agra", "Endoscopic dilation Agra", "GI stenting Agra"],
    pathway: [
      { title: "Site and cause assessment", titleHi: "स्थान और कारण आकलन", text: "Endoscopy and imaging identify the level, length and likely cause of narrowing.", textHi: "एंडोस्कोपी और इमेजिंग संकुचन के स्तर, लंबाई और संभावित कारण की पहचान करते हैं।" },
      { title: "Dilation or stent planning", titleHi: "डाइलेशन या स्टेंट योजना", text: "Suitable strictures may need balloon dilation, stenting or biopsy.", textHi: "उपयुक्त स्ट्रिक्चर के लिए बैलून डाइलेशन, स्टेंटिंग या बायोप्सी की आवश्यकता हो सकती है।" },
      { title: "Recurrence follow-up", titleHi: "पुनरावृत्ति फॉलो-अप", text: "Repeat sessions, diet guidance and warning signs are reviewed.", textHi: "दोबारा सत्र, आहार मार्गदर्शन और चेतावनी संकेतों की समीक्षा की जाती है।" }
    ]
  },
  "colon-polyps": {
    overview: "Colon polyps are growths in the large intestine. Some polyps can become cancer over time, so colonoscopy-based removal and pathology follow-up are important.",
    overviewHi: "कोलन पॉलिप्स बड़ी आंत में वृद्धि हैं। कुछ पॉलिप्स समय के साथ कैंसर बन सकते हैं, इसलिए कोलोनोस्कोपी-आधारित निकासी और पैथोलॉजी फॉलो-अप महत्वपूर्ण हैं।",
    consultCues: ["Polyp found on colonoscopy or scan", "Blood in stool or unexplained anemia", "Family history of colon cancer or polyps", "Need for screening colonoscopy or surveillance"],
    consultCuesHi: ["कोलोनोस्कोपी या स्कैन में मिला पॉलिप", "मल में खून या अस्पष्टीकृत एनीमिया", "कोलन कैंसर या पॉलिप्स का पारिवारिक इतिहास", "स्क्रीनिंग कोलोनोस्कोपी या निगरानी की आवश्यकता"],
    relatedTerms: ["Colon polyps treatment Agra", "Polyp removal Agra", "Colon cancer screening Agra", "Colonoscopy polypectomy Agra"],
    pathway: [
      { title: "Screening need review", titleHi: "स्क्रीनिंग आवश्यकता समीक्षा", text: "Age, family history, bleeding and prior colonoscopy findings are reviewed.", textHi: "आयु, पारिवारिक इतिहास, रक्तस्राव और पिछली कोलोनोस्कोपी के निष्कर्षों की समीक्षा की जाती है।" },
      { title: "Polyp removal planning", titleHi: "पॉलिप निकासी योजना", text: "Suitable polyps are removed endoscopically and sent for pathology.", textHi: "उपयुक्त पॉलिप्स को एंडोस्कोपिक रूप से निकालकर पैथोलॉजी के लिए भेजा जाता है।" },
      { title: "Surveillance schedule", titleHi: "निगरानी शेड्यूल", text: "Future colonoscopy timing depends on number, size and biopsy type.", textHi: "भविष्य की कोलोनोस्कोपी का समय संख्या, आकार और बायोप्सी के प्रकार पर निर्भर करता है।" }
    ]
  },
  "ibd-colitis": {
    overview: "IBD and colitis can cause chronic diarrhea, bleeding, abdominal pain, urgency, weight loss and anemia. Diagnosis and monitoring often need colonoscopy, biopsy and long-term care.",
    overviewHi: "आईबीडी और कोलाइटिस पुराने दस्त, रक्तस्राव, पेट दर्द, तात्कालिकता, वज़न घटना और एनीमिया का कारण बन सकते हैं। निदान और निगरानी के लिए अक्सर कोलोनोस्कोपी, बायोप्सी और दीर्घकालिक देखभाल की आवश्यकता होती है।",
    consultCues: ["Chronic diarrhea lasting weeks or months", "Blood or mucus in stool", "Abdominal pain, urgency, fever, weight loss or anemia", "Known ulcerative colitis or Crohn's disease needing monitoring"],
    consultCuesHi: ["हफ्तों या महीनों तक चलने वाला पुराना दस्त", "मल में खून या बलगम", "पेट दर्द, तात्कालिकता, बुखार, वज़न घटना या एनीमिया", "निगरानी की आवश्यकता वाला ज्ञात अल्सरेटिव कोलाइटिस या क्रोहन रोग"],
    relatedTerms: ["IBD specialist Agra", "Colitis treatment Agra", "Ulcerative colitis Agra", "Crohn's disease Agra"],
    pathway: [
      { title: "Inflammation assessment", titleHi: "सूजन आकलन", text: "Symptoms, stool tests, blood reports and prior treatment are reviewed.", textHi: "लक्षण, स्टूल टेस्ट, ब्लड रिपोर्ट और पिछले उपचार की समीक्षा की जाती है।" },
      { title: "Colonoscopy and biopsy", titleHi: "कोलोनोस्कोपी और बायोप्सी", text: "Colonoscopy helps define extent, severity and biopsy diagnosis.", textHi: "कोलोनोस्कोपी सीमा, गंभीरता और बायोप्सी निदान तय करने में मदद करती है।" },
      { title: "Long-term control", titleHi: "दीर्घकालिक नियंत्रण", text: "Medicines, diet, flare warning signs and surveillance are planned.", textHi: "दवाओं, आहार, भड़कने के चेतावनी संकेतों और निगरानी की योजना बनाई जाती है।" }
    ]
  },
  "ibs": {
    overview: "IBS care focuses on recurrent abdominal pain, bloating, gas, constipation, diarrhea or mixed bowel habits when warning signs are absent or have been ruled out. The goal is to identify triggers, avoid unnecessary medicines and build a practical long-term symptom-control plan.",
    overviewHi: "आईबीएस देखभाल बार-बार पेट दर्द, सूजन, गैस, कब्ज़, दस्त या मिश्रित मल त्याग की आदतों पर केंद्रित होती है जब चेतावनी संकेत अनुपस्थित हों या खारिज किए जा चुके हों। लक्ष्य ट्रिगर्स की पहचान करना, अनावश्यक दवाओं से बचना और एक व्यावहारिक दीर्घकालिक लक्षण-नियंत्रण योजना बनाना है।",
    consultCues: ["Abdominal cramps linked with bowel movement", "Bloating, gas or urgency after meals", "Constipation, diarrhea or alternating bowel habits", "Symptoms worsened by stress, irregular meals or poor sleep"],
    consultCuesHi: ["मल त्याग से जुड़ी पेट में ऐंठन", "भोजन के बाद सूजन, गैस या तात्कालिकता", "कब्ज़, दस्त या बदलती मल त्याग की आदतें", "तनाव, अनियमित भोजन या खराब नींद से बढ़ने वाले लक्षण"],
    relatedTerms: ["IBS treatment Agra", "Irritable bowel syndrome doctor Agra", "Bloating treatment Agra", "Digestive problems doctor Agra"],
    pathway: [
      { title: "Symptom and trigger review", titleHi: "लक्षण और ट्रिगर समीक्षा", text: "Pain pattern, stool frequency, diet, stress, sleep and medicine history are reviewed.", textHi: "दर्द का पैटर्न, मल त्याग की आवृत्ति, आहार, तनाव, नींद और दवा के इतिहास की समीक्षा की जाती है।" },
      { title: "Warning sign check", titleHi: "चेतावनी संकेत जांच", text: "Blood in stool, anemia, weight loss, fever, night symptoms and family history are checked before labeling IBS.", textHi: "आईबीएस लेबल करने से पहले मल में खून, एनीमिया, वज़न घटना, बुखार, रात के लक्षण और पारिवारिक इतिहास की जांच की जाती है।" },
      { title: "Personalized control plan", titleHi: "व्यक्तिगत नियंत्रण योजना", text: "Diet, bowel routine, stress management and medicines are planned according to IBS type.", textHi: "आईबीएस के प्रकार के अनुसार आहार, मल त्याग की दिनचर्या, तनाव प्रबंधन और दवाओं की योजना बनाई जाती है।" }
    ]
  },
  "chronic-constipation": {
    overview: "Chronic constipation care evaluates hard stool, straining, incomplete evacuation, bloating and long-term laxative use. The plan may include diet correction, medicine review, bowel routine and colon evaluation when warning signs are present.",
    overviewHi: "पुरानी कब्ज़ की देखभाल में कठोर मल, ज़ोर लगाना, अधूरा मल त्याग, सूजन और दीर्घकालिक लैक्सेटिव उपयोग का मूल्यांकन किया जाता है। चेतावनी संकेत होने पर योजना में आहार सुधार, दवा समीक्षा, मल त्याग की दिनचर्या और कोलन मूल्यांकन शामिल हो सकता है।",
    consultCues: ["Constipation lasting weeks or months", "Hard stool, straining or incomplete evacuation", "Bloating, abdominal discomfort or poor appetite", "Blood in stool, anemia, weight loss or new constipation in older age"],
    consultCuesHi: ["हफ्तों या महीनों तक चलने वाली कब्ज़", "कठोर मल, ज़ोर लगाना या अधूरा मल त्याग", "सूजन, पेट में परेशानी या भूख न लगना", "मल में खून, एनीमिया, वज़न घटना या बड़ी उम्र में नई कब्ज़"],
    relatedTerms: ["Chronic constipation treatment Agra", "Constipation doctor Agra", "Colonoscopy for constipation Agra", "Digestive problems doctor Agra"],
    pathway: [
      { title: "Cause assessment", titleHi: "कारण आकलन", text: "Diet, hydration, activity, thyroid/diabetes risk and constipating medicines are reviewed.", textHi: "आहार, हाइड्रेशन, गतिविधि, थायरॉइड/डायबिटीज़ जोखिम और कब्ज़ पैदा करने वाली दवाओं की समीक्षा की जाती है।" },
      { title: "Warning symptom evaluation", titleHi: "चेतावनी लक्षण मूल्यांकन", text: "Bleeding, anemia, weight loss, severe pain and age-related screening needs are checked.", textHi: "रक्तस्राव, एनीमिया, वज़न घटना, गंभीर दर्द और आयु-संबंधित स्क्रीनिंग आवश्यकताओं की जांच की जाती है।" },
      { title: "Bowel plan", titleHi: "मल त्याग योजना", text: "Fiber, fluids, toilet routine and safe medicines are planned with follow-up.", textHi: "फाइबर, तरल पदार्थ, शौचालय दिनचर्या और सुरक्षित दवाओं की फॉलो-अप के साथ योजना बनाई जाती है।" }
    ]
  },
  "chronic-diarrhea": {
    overview: "Chronic diarrhea care investigates loose stools lasting several weeks, urgency, mucus, blood, weight loss or night-time stools. Evaluation may include stool tests, blood tests, celiac screening, colonoscopy or biopsy depending on symptoms.",
    overviewHi: "पुराने दस्त की देखभाल में कई हफ्तों तक चलने वाले ढीले मल, तात्कालिकता, बलगम, खून, वज़न घटना या रात में मल त्याग की जांच की जाती है। लक्षणों के आधार पर मूल्यांकन में स्टूल टेस्ट, ब्लड टेस्ट, सीलिएक स्क्रीनिंग, कोलोनोस्कोपी या बायोप्सी शामिल हो सकते हैं।",
    consultCues: ["Loose stools continuing for more than 3-4 weeks", "Blood or mucus in stool", "Night-time diarrhea, fever, anemia or weight loss", "Repeated antibiotics without lasting improvement"],
    consultCuesHi: ["3-4 हफ्तों से अधिक समय से जारी ढीले मल", "मल में खून या बलगम", "रात में दस्त, बुखार, एनीमिया या वज़न घटना", "स्थायी सुधार के बिना बार-बार एंटीबायोटिक्स"],
    relatedTerms: ["Chronic diarrhea treatment Agra", "Diarrhea specialist Agra", "Colitis evaluation Agra", "IBS diarrhea Agra"],
    pathway: [
      { title: "Pattern review", titleHi: "पैटर्न समीक्षा", text: "Duration, frequency, blood, mucus, fever, food relation and weight changes are reviewed.", textHi: "अवधि, आवृत्ति, खून, बलगम, बुखार, भोजन से संबंध और वज़न में बदलाव की समीक्षा की जाती है।" },
      { title: "Targeted testing", titleHi: "लक्षित जांच", text: "Stool tests, blood tests, celiac testing, colonoscopy or biopsy are selected based on warning signs.", textHi: "चेतावनी संकेतों के आधार पर स्टूल टेस्ट, ब्लड टेस्ट, सीलिएक जांच, कोलोनोस्कोपी या बायोप्सी चुनी जाती है।" },
      { title: "Cause-based treatment", titleHi: "कारण-आधारित उपचार", text: "Treatment is planned for infection, IBS, colitis, malabsorption or medicine-related diarrhea.", textHi: "संक्रमण, आईबीएस, कोलाइटिस, मैलएब्जॉर्प्शन या दवा से संबंधित दस्त के लिए उपचार की योजना बनाई जाती है।" }
    ]
  },
  "ascites": {
    overview: "Ascites is fluid buildup in the abdomen, most often related to liver disease but sometimes caused by infection, low protein states or other conditions. Evaluation identifies cause and complications.",
    overviewHi: "एसाइटिस पेट में तरल पदार्थ जमा होना है, जो अक्सर लिवर रोग से संबंधित होता है लेकिन कभी-कभी संक्रमण, कम प्रोटीन स्थितियों या अन्य स्थितियों के कारण होता है। मूल्यांकन कारण और जटिलताओं की पहचान करता है।",
    consultCues: ["Increasing abdominal swelling or tightness", "Known liver disease with fluid in abdomen", "Breathlessness, leg swelling or reduced appetite due to fluid", "Fever, pain or suspected infection in ascitic fluid"],
    consultCuesHi: ["बढ़ता हुआ पेट फूलना या कसाव", "पेट में तरल पदार्थ के साथ ज्ञात लिवर रोग", "तरल पदार्थ के कारण सांस फूलना, पैरों में सूजन या भूख कम लगना", "बुखार, दर्द या एसाइटिक फ्लूइड में संदिग्ध संक्रमण"],
    relatedTerms: ["Ascites treatment Agra", "Fluid in abdomen Agra", "Liver ascites doctor Agra", "Ascitic fluid tapping Agra"],
    pathway: [
      { title: "Cause evaluation", titleHi: "कारण मूल्यांकन", text: "Liver reports, ultrasound, kidney function and infection signs are reviewed.", textHi: "लिवर रिपोर्ट, अल्ट्रासाउंड, किडनी फंक्शन और संक्रमण के संकेतों की समीक्षा की जाती है।" },
      { title: "Fluid testing or drainage", titleHi: "फ्लूइड जांच या ड्रेनेज", text: "Ascitic tapping may be planned for diagnosis or symptom relief.", textHi: "निदान या लक्षणों से राहत के लिए एसाइटिक टैपिंग की योजना बनाई जा सकती है।" },
      { title: "Prevention care", titleHi: "रोकथाम देखभाल", text: "Salt restriction, medicines, monitoring and emergency warning signs are explained.", textHi: "नमक प्रतिबंध, दवाएं, निगरानी और आपातकालीन चेतावनी संकेत समझाए जाते हैं।" }
    ]
  }
};

function getPageCopy(slug: string, title: string, isDisease: boolean): PageCopy {
  return pageCopyBySlug[slug] ?? {
    overview: `Mudgal Gastromedics Hospital provides focused ${isDisease ? "evaluation and treatment planning" : "procedure planning"} for ${title.toLowerCase()} with clear counselling, safety checks and follow-up care.`,
    overviewHi: `मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल ${title} के लिए स्पष्ट परामर्श, सुरक्षा जांच और फॉलो-अप देखभाल के साथ केंद्रित ${isDisease ? "मूल्यांकन और उपचार योजना" : "प्रक्रिया योजना"} प्रदान करता है।`,
    consultCues: [
      "Persistent digestive symptoms or abdominal pain",
      "Jaundice, swallowing difficulty or bowel habit changes",
      "Unexplained anemia, bleeding symptoms or abnormal reports",
      "Doctor-advised screening, biopsy or follow-up care"
    ],
    consultCuesHi: [
      "लगातार पाचन संबंधी लक्षण या पेट दर्द",
      "पीलिया, निगलने में कठिनाई या मल त्याग की आदतों में बदलाव",
      "अस्पष्टीकृत एनीमिया, रक्तस्राव के लक्षण या असामान्य रिपोर्ट",
      "डॉक्टर द्वारा सुझाई गई स्क्रीनिंग, बायोप्सी या फॉलो-अप देखभाल"
    ],
    relatedTerms: ["Gastroenterologist in Agra", "Liver specialist in Agra", "Endoscopy centre in Agra", "Digestive disease care Agra"],
    pathway: [
      {
        title: "Clinical evaluation",
        titleHi: "नैदानिक मूल्यांकन",
        text: "History, examination and review of prior reports before recommending the next step.",
        textHi: "अगला कदम सुझाने से पहले इतिहास, जांच और पिछली रिपोर्ट की समीक्षा।"
      },
      {
        title: isDisease ? "Care planning" : "Procedure planning",
        titleHi: isDisease ? "देखभाल योजना" : "प्रक्रिया योजना",
        text: isDisease ? "Clear guidance about medicines, tests, diet, procedures if needed and warning symptoms to watch." : "Clear instructions about preparation, fasting, medicines and attendant requirements.",
        textHi: isDisease ? "दवाओं, जांच, आहार, आवश्यकता पड़ने पर प्रक्रियाओं और देखने योग्य चेतावनी लक्षणों के बारे में स्पष्ट मार्गदर्शन।" : "तैयारी, उपवास, दवाओं और परिजन की आवश्यकताओं के बारे में स्पष्ट निर्देश।"
      },
      {
        title: "Follow-up support",
        titleHi: "फॉलो-अप सहायता",
        text: isDisease ? "Report review, monitoring advice and a personalized treatment plan after consultation." : "Reports, biopsy guidance if needed and a personalized treatment plan after the procedure.",
        textHi: isDisease ? "परामर्श के बाद रिपोर्ट समीक्षा, निगरानी सलाह और व्यक्तिगत उपचार योजना।" : "प्रक्रिया के बाद रिपोर्ट, आवश्यकता पड़ने पर बायोप्सी मार्गदर्शन और व्यक्तिगत उपचार योजना।"
      }
    ]
  };
}

function getCareMode(slug: string, isDisease: boolean) {
  const noSedation = new Set(["fibroscan", "ascitic-fluid-tapping"]);
  const therapeutic = new Set([
    "ercp",
    "cbd-stone-removal",
    "pancreatic-duct-stone-removal",
    "bile-duct-stenting",
    "variceal-banding",
    "sclerotherapy",
    "polypectomy",
    "colon-polyp-removal",
    "stricture-dilation",
    "esophageal-dilation",
    "gi-stenting",
    "peg-tube-placement",
    "endoscopic-hemostasis",
    "argon-plasma-coagulation",
    "foreign-body-removal",
    "intragastric-balloon-placement"
  ]);
  if (isDisease) return "consultation";
  if (noSedation.has(slug)) return "minor";
  if (therapeutic.has(slug)) return "therapeutic";
  return "diagnostic";
}

function getProcedureArticle(slug: string, title: string, isDisease: boolean, pageCopy: PageCopy): ProcedureArticle {
  const mode = getCareMode(slug, isDisease);
  const lowerTitle = title.toLowerCase();
  const isErcpLike = ["ercp", "cbd-stone-removal", "pancreatic-duct-stone-removal", "bile-duct-stenting"].includes(slug);
  const isColonLike = ["colonoscopy", "polypectomy", "colon-polyp-removal", "ibd-colitis", "colon-polyps", "ibs", "chronic-constipation", "chronic-diarrhea"].includes(slug);
  const isLiverLike = ["fibroscan", "fatty-liver", "liver-cirrhosis", "liver-fibrosis", "varices", "ascites", "ascitic-fluid-tapping"].includes(slug);

  const preparationItems = isDisease
    ? [
        "Bring previous prescriptions, blood reports, ultrasound/CT/MRCP reports, discharge summaries and endoscopy or colonoscopy reports.",
        "Carry a list of current medicines, allergies, diabetes or BP history and any blood thinner use such as aspirin, clopidogrel or warfarin.",
        "Do not stop important medicines on your own; reception or the doctor will guide changes if a procedure is planned.",
        "For urgent symptoms such as vomiting blood, black stool, severe pain or jaundice with fever, call reception before travelling."
      ]
    : [
        isColonLike ? "Follow the bowel preparation and diet plan exactly as advised; poor preparation can reduce report quality." : "Fasting is usually needed for 6-8 hours, but the final instruction depends on your procedure and medical condition.",
        "Inform the team if you have diabetes, high BP, heart disease, kidney disease, pregnancy, allergies or previous anesthesia problems.",
        "Tell the doctor about aspirin, clopidogrel, warfarin, apixaban, rivaroxaban or any other blood thinner before the procedure.",
        "Bring previous reports and come with an adult attendant if sedation or a therapeutic procedure is planned."
      ];

  const preparationItemsHi = isDisease
    ? [
        "पिछले पर्चे, ब्लड रिपोर्ट, अल्ट्रासाउंड/सीटी/एमआरसीपी रिपोर्ट, डिस्चार्ज समरी और एंडोस्कोपी या कोलोनोस्कोपी रिपोर्ट साथ लाएं।",
        "वर्तमान दवाओं, एलर्जी, डायबिटीज़ या बीपी के इतिहास और एस्पिरिन, क्लोपिडोग्रेल या वारफारिन जैसी किसी भी ब्लड थिनर के उपयोग की सूची साथ रखें।",
        "महत्वपूर्ण दवाएं स्वयं बंद न करें; प्रक्रिया की योजना होने पर रिसेप्शन या डॉक्टर बदलाव के लिए मार्गदर्शन देंगे।",
        "खून की उल्टी, काला मल, गंभीर दर्द या बुखार के साथ पीलिया जैसे तत्काल लक्षणों के लिए, यात्रा से पहले रिसेप्शन को कॉल करें।"
      ]
    : [
        isColonLike ? "बताई गई आंत्र तैयारी और आहार योजना का ठीक-ठीक पालन करें; खराब तैयारी रिपोर्ट की गुणवत्ता कम कर सकती है।" : "आमतौर पर 6-8 घंटे का उपवास आवश्यक होता है, लेकिन अंतिम निर्देश आपकी प्रक्रिया और चिकित्सा स्थिति पर निर्भर करता है।",
        "यदि आपको डायबिटीज़, हाई बीपी, हृदय रोग, किडनी रोग, गर्भावस्था, एलर्जी या पहले एनेस्थीसिया से जुड़ी समस्या है तो टीम को सूचित करें।",
        "प्रक्रिया से पहले डॉक्टर को एस्पिरिन, क्लोपिडोग्रेल, वारफारिन, एपिक्साबान, रिवारोक्साबान या किसी अन्य ब्लड थिनर के बारे में बताएं।",
        "पिछली रिपोर्ट साथ लाएं और यदि सेडेशन या चिकित्सीय प्रक्रिया की योजना है तो किसी वयस्क परिजन के साथ आएं।"
      ];

  const risks = isDisease
    ? [
        "Delay in evaluation may allow bleeding, jaundice, liver disease or intestinal inflammation to worsen.",
        "Some conditions need blood tests, imaging or endoscopy/colonoscopy before the final plan is clear.",
        "Treatment response varies by cause, stage of disease, age, diabetes, alcohol use and other medical problems."
      ]
    : [
        "Most procedures are completed safely, but uncommon risks may include bleeding, infection, medicine reaction or aspiration.",
        mode === "therapeutic" ? "Therapeutic procedures may carry additional risks depending on the site treated, biopsy, dilation, stent, stone removal or bleeding control." : "Diagnostic procedures may rarely need biopsy or additional therapy if an abnormality is found.",
        isErcpLike ? "ERCP-related procedures can rarely cause pancreatitis, infection, bleeding or perforation and may need observation or admission." : "Perforation is uncommon but important and needs urgent medical attention if it occurs."
      ];

  const risksHi = isDisease
    ? [
        "मूल्यांकन में देरी से रक्तस्राव, पीलिया, लिवर रोग या आंत की सूजन बिगड़ सकती है।",
        "कुछ स्थितियों में अंतिम योजना स्पष्ट होने से पहले ब्लड टेस्ट, इमेजिंग या एंडोस्कोपी/कोलोनोस्कोपी की आवश्यकता होती है।",
        "उपचार की प्रतिक्रिया कारण, रोग के चरण, आयु, डायबिटीज़, शराब के उपयोग और अन्य चिकित्सा समस्याओं के अनुसार अलग-अलग होती है।"
      ]
    : [
        "अधिकांश प्रक्रियाएं सुरक्षित रूप से पूरी होती हैं, लेकिन दुर्लभ जोखिमों में रक्तस्राव, संक्रमण, दवा प्रतिक्रिया या एस्पिरेशन शामिल हो सकते हैं।",
        mode === "therapeutic" ? "चिकित्सीय प्रक्रियाओं में उपचारित स्थान, बायोप्सी, डाइलेशन, स्टेंट, पथरी निकालने या रक्तस्राव नियंत्रण के आधार पर अतिरिक्त जोखिम हो सकते हैं।" : "यदि कोई असामान्यता पाई जाती है तो डायग्नोस्टिक प्रक्रियाओं में शायद ही कभी बायोप्सी या अतिरिक्त उपचार की आवश्यकता होती है।",
        isErcpLike ? "ईआरसीपी से संबंधित प्रक्रियाएं शायद ही कभी पैंक्रियाटाइटिस, संक्रमण, रक्तस्राव या पर्फोरेशन का कारण बन सकती हैं और इसके लिए निगरानी या भर्ती की आवश्यकता हो सकती है।" : "पर्फोरेशन दुर्लभ है लेकिन महत्वपूर्ण है और होने पर तत्काल चिकित्सा ध्यान देने की आवश्यकता होती है।"
      ];

  const recoveryItems = isDisease
    ? [
        "Follow the medicine, diet, lifestyle and testing plan explained during consultation.",
        "Keep follow-up dates, especially for liver disease, IBD, pancreatic disorders, bleeding symptoms or abnormal reports.",
        "Call reception if symptoms worsen before the planned review."
      ]
    : [
        mode === "minor" ? "Most patients can resume routine activity soon after observation, unless the doctor advises rest." : "Rest after sedation and avoid driving, alcohol, heavy machinery or important decisions for the rest of the day.",
        "Eating and medicines are restarted as advised after the report or procedure note is reviewed.",
        "Biopsy, stent, polyp or therapeutic procedure reports may need follow-up discussion and further planning."
      ];

  const recoveryItemsHi = isDisease
    ? [
        "परामर्श के दौरान बताई गई दवा, आहार, जीवनशैली और जांच योजना का पालन करें।",
        "फॉलो-अप तारीखें बनाए रखें, विशेष रूप से लिवर रोग, आईबीडी, अग्न्याशय संबंधी विकार, रक्तस्राव के लक्षण या असामान्य रिपोर्ट के लिए।",
        "यदि नियोजित समीक्षा से पहले लक्षण बिगड़ें तो रिसेप्शन को कॉल करें।"
      ]
    : [
        mode === "minor" ? "अधिकांश मरीज़ निगरानी के तुरंत बाद नियमित गतिविधि फिर से शुरू कर सकते हैं, जब तक कि डॉक्टर आराम की सलाह न दें।" : "सेडेशन के बाद आराम करें और दिन के बाकी समय ड्राइविंग, शराब, भारी मशीनरी या महत्वपूर्ण निर्णयों से बचें।",
        "रिपोर्ट या प्रक्रिया नोट की समीक्षा के बाद सलाह अनुसार भोजन और दवाएं फिर से शुरू की जाती हैं।",
        "बायोप्सी, स्टेंट, पॉलिप या चिकित्सीय प्रक्रिया रिपोर्ट के लिए फॉलो-अप चर्चा और आगे की योजना की आवश्यकता हो सकती है।"
      ];

  const sections: ArticleSection[] = [
    {
      title: "What Is It?",
      titleHi: "यह क्या है?",
      text: isDisease
        ? `${title} care at Mudgal Gastromedics Hospital focuses on identifying the cause of symptoms, reviewing reports and planning treatment for digestive, liver, pancreatic or intestinal disease. ${pageCopy.overview}`
        : `${title} is a gastroenterology service used to diagnose, monitor or treat selected digestive, liver, pancreatic, biliary or intestinal problems. ${pageCopy.overview}`,
      textHi: isDisease
        ? `मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में ${title} देखभाल लक्षणों के कारण की पहचान करने, रिपोर्ट की समीक्षा करने और पाचन, लिवर, अग्न्याशय या आंत संबंधी रोग के उपचार की योजना बनाने पर केंद्रित है। ${pageCopy.overviewHi}`
        : `${title} एक गैस्ट्रोएंटरोलॉजी सेवा है जिसका उपयोग चुनिंदा पाचन, लिवर, अग्न्याशय, पित्त या आंत संबंधी समस्याओं का निदान, निगरानी या उपचार करने के लिए किया जाता है। ${pageCopy.overviewHi}`
    },
    {
      title: "Why Is It Done?",
      titleHi: "यह क्यों किया जाता है?",
      text: `${title} may be advised when symptoms, blood reports, imaging or previous endoscopy/colonoscopy findings suggest that specialist gastroenterology review is needed.`,
      textHi: `जब लक्षण, ब्लड रिपोर्ट, इमेजिंग या पिछली एंडोस्कोपी/कोलोनोस्कोपी के निष्कर्ष विशेषज्ञ गैस्ट्रोएंटरोलॉजी समीक्षा की आवश्यकता का संकेत देते हैं, तो ${title} की सलाह दी जा सकती है।`,
      items: pageCopy.consultCues,
      itemsHi: pageCopy.consultCuesHi
    },
    {
      title: "Who May Need It?",
      titleHi: "इसकी आवश्यकता किसे हो सकती है?",
      text: "Indian patients commonly seek gastro care when symptoms are persistent, recurring, unexplained or affecting daily life.",
      textHi: "भारतीय मरीज़ आमतौर पर गैस्ट्रो देखभाल तब लेते हैं जब लक्षण लगातार बने रहते हैं, बार-बार होते हैं, अस्पष्टीकृत होते हैं या दैनिक जीवन को प्रभावित करते हैं।",
      items: [
        isLiverLike ? "Patients with fatty liver, jaundice, abnormal liver tests, hepatitis, alcohol-related liver risk or abdominal swelling." : "Patients with acidity, abdominal pain, bloating, vomiting, difficulty swallowing or unexplained weight loss.",
        isColonLike ? "Patients with blood in stool, black stool, chronic constipation, chronic diarrhea, anemia, polyps or family history of colon disease." : "Patients with blood in stool, black stool, anemia, jaundice, pancreatic pain or abnormal ultrasound/CT/MRCP findings.",
        "Patients from Agra, Shaheed Nagar, Tajganj, Fatehabad Road, Kamla Nagar, Sikandra, Mathura, Firozabad, Bharatpur and nearby areas looking for specialist digestive care."
      ],
      itemsHi: [
        isLiverLike ? "फैटी लिवर, पीलिया, असामान्य लिवर टेस्ट, हेपेटाइटिस, शराब से संबंधित लिवर जोखिम या पेट में सूजन वाले मरीज़।" : "एसिडिटी, पेट दर्द, सूजन, उल्टी, निगलने में कठिनाई या अस्पष्टीकृत वज़न घटने वाले मरीज़।",
        isColonLike ? "मल में खून, काला मल, पुरानी कब्ज़, पुराने दस्त, एनीमिया, पॉलिप्स या कोलन रोग के पारिवारिक इतिहास वाले मरीज़।" : "मल में खून, काला मल, एनीमिया, पीलिया, अग्न्याशय दर्द या असामान्य अल्ट्रासाउंड/सीटी/एमआरसीपी निष्कर्षों वाले मरीज़।",
        "आगरा, शहीद नगर, ताजगंज, फ़तेहाबाद रोड, कमला नगर, सिकंदरा, मथुरा, फ़िरोज़ाबाद, भरतपुर और आसपास के क्षेत्रों से विशेषज्ञ पाचन देखभाल की तलाश करने वाले मरीज़।"
      ]
    },
    {
      title: "How To Prepare",
      titleHi: "तैयारी कैसे करें",
      text: "Preparation depends on the procedure, symptoms and medical condition. The hospital team confirms final instructions before your visit.",
      textHi: "तैयारी प्रक्रिया, लक्षणों और चिकित्सा स्थिति पर निर्भर करती है। अस्पताल की टीम आपकी विज़िट से पहले अंतिम निर्देशों की पुष्टि करती है।",
      items: preparationItems,
      itemsHi: preparationItemsHi
    },
    {
      title: isDisease ? "What Happens During Consultation?" : "What Happens During The Procedure?",
      titleHi: isDisease ? "परामर्श के दौरान क्या होता है?" : "प्रक्रिया के दौरान क्या होता है?",
      text: isDisease
        ? "The doctor reviews symptoms, previous records, medicines and risk factors, examines the patient when needed and explains whether tests, medicines, diet changes or procedures are required."
        : "The team verifies identity, reports, consent and fitness. Monitoring is done when required, the procedure is performed using appropriate equipment and the findings are explained after recovery.",
      textHi: isDisease
        ? "डॉक्टर लक्षणों, पिछले रिकॉर्ड, दवाओं और जोखिम कारकों की समीक्षा करते हैं, आवश्यकता पड़ने पर मरीज़ की जांच करते हैं और बताते हैं कि जांच, दवाएं, आहार में बदलाव या प्रक्रियाओं की आवश्यकता है या नहीं।"
        : "टीम पहचान, रिपोर्ट, सहमति और फिटनेस की पुष्टि करती है। आवश्यकता पड़ने पर निगरानी की जाती है, उपयुक्त उपकरणों का उपयोग करके प्रक्रिया की जाती है और रिकवरी के बाद निष्कर्ष समझाए जाते हैं।",
      items: [
        "Bring prior reports so the doctor can compare current findings with earlier disease status.",
        "Ask questions about the reason for the test, expected benefit, alternatives and follow-up plan.",
        "Available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra."
      ],
      itemsHi: [
        "पिछली रिपोर्ट साथ लाएं ताकि डॉक्टर वर्तमान निष्कर्षों की तुलना पहले की रोग स्थिति से कर सकें।",
        "जांच के कारण, अपेक्षित लाभ, विकल्पों और फॉलो-अप योजना के बारे में प्रश्न पूछें।",
        "मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल, शहीद नगर, आगरा में उपलब्ध।"
      ]
    },
    {
      title: "Is It Painful?",
      titleHi: "क्या इसमें दर्द होता है?",
      text: isDisease
        ? "Consultation itself is not painful. If a test or procedure is needed, comfort options and preparation are explained before scheduling."
        : mode === "minor"
          ? `${title} is usually done with local comfort measures or simple observation, depending on the service. The team explains what to expect before starting.`
          : `${title} may involve sedation or anesthesia support when appropriate. Most patients remember little discomfort, but throat irritation, bloating, mild cramps or tiredness can occur depending on the procedure.`,
      textHi: isDisease
        ? "परामर्श स्वयं दर्दनाक नहीं है। यदि किसी जांच या प्रक्रिया की आवश्यकता हो, तो शेड्यूलिंग से पहले आराम के विकल्प और तैयारी समझाई जाती है।"
        : mode === "minor"
          ? `${title} आमतौर पर सेवा के आधार पर स्थानीय आराम उपायों या सामान्य निगरानी के साथ किया जाता है। टीम शुरू करने से पहले बताती है कि क्या अपेक्षा करें।`
          : `उपयुक्त होने पर ${title} में सेडेशन या एनेस्थीसिया सहायता शामिल हो सकती है। अधिकांश मरीज़ों को बहुत कम असुविधा याद रहती है, लेकिन प्रक्रिया के आधार पर गले में जलन, सूजन, हल्की ऐंठन या थकान हो सकती है।`
    },
    {
      title: "Risks & Safety",
      titleHi: "जोखिम और सुरक्षा",
      text: "The doctor balances benefit and risk before advising any test or procedure. Risks are usually uncommon but should be understood clearly.",
      textHi: "डॉक्टर किसी भी जांच या प्रक्रिया की सलाह देने से पहले लाभ और जोखिम को संतुलित करते हैं। जोखिम आमतौर पर दुर्लभ होते हैं लेकिन इन्हें स्पष्ट रूप से समझना चाहिए।",
      items: risks,
      itemsHi: risksHi
    },
    {
      title: "Recovery & Aftercare",
      titleHi: "रिकवरी और आफ्टरकेयर",
      text: "Recovery advice depends on whether the visit was a consultation, diagnostic test or therapeutic procedure.",
      textHi: "रिकवरी सलाह इस बात पर निर्भर करती है कि विज़िट परामर्श, डायग्नोस्टिक जांच या चिकित्सीय प्रक्रिया थी।",
      items: recoveryItems,
      itemsHi: recoveryItemsHi
    },
    {
      title: "When To Call The Hospital Urgently",
      titleHi: "अस्पताल को तुरंत कब कॉल करें",
      text: "Do not wait for a routine appointment if warning symptoms occur.",
      textHi: "यदि चेतावनी लक्षण दिखाई दें तो नियमित अपॉइंटमेंट का इंतज़ार न करें।",
      items: [
        "Fever with jaundice, chills, severe abdominal pain or persistent vomiting.",
        "Vomiting blood, black stool, fresh blood in stool, fainting or severe weakness.",
        "Breathing difficulty, chest discomfort, severe dehydration or worsening abdominal swelling.",
        "Severe pain after a procedure, repeated vomiting, inability to eat/drink or any symptom that feels unsafe."
      ],
      itemsHi: [
        "पीलिया, ठंड लगना, गंभीर पेट दर्द या लगातार उल्टी के साथ बुखार।",
        "खून की उल्टी, काला मल, मल में ताज़ा खून, बेहोशी या गंभीर कमज़ोरी।",
        "सांस लेने में कठिनाई, सीने में परेशानी, गंभीर डिहाइड्रेशन या बढ़ता हुआ पेट फूलना।",
        "प्रक्रिया के बाद गंभीर दर्द, बार-बार उल्टी, खाने/पीने में असमर्थता या कोई भी लक्षण जो असुरक्षित लगे।"
      ]
    },
    {
      title: "Cost & Insurance Notes",
      titleHi: "लागत और बीमा नोट्स",
      text: "The cost depends on consultation type, procedure complexity, biopsy, stent, anesthesia, consumables, admission need and insurance or cashless process. Reception can guide estimated billing before scheduling where possible.",
      textHi: "लागत परामर्श के प्रकार, प्रक्रिया की जटिलता, बायोप्सी, स्टेंट, एनेस्थीसिया, उपभोज्य सामग्री, भर्ती की आवश्यकता और बीमा या कैशलेस प्रक्रिया पर निर्भर करती है। जहां संभव हो, रिसेप्शन शेड्यूलिंग से पहले अनुमानित बिलिंग के बारे में मार्गदर्शन कर सकता है।"
    }
  ];

  const faqs: ArticleFaq[] = [
    {
      question: `Is ${title} available in Agra?`,
      questionHi: `क्या आगरा में ${title} उपलब्ध है?`,
      answer: `Yes. ${title} care is available at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra, with gastroenterology consultation and procedure planning where clinically required.`,
      answerHi: `हां। ${title} देखभाल मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल, शहीद नगर, आगरा में उपलब्ध है, जिसमें आवश्यकता पड़ने पर गैस्ट्रोएंटरोलॉजी परामर्श और प्रक्रिया योजना शामिल है।`
    },
    {
      question: `Do I need fasting for ${lowerTitle}?`,
      questionHi: `क्या मुझे ${lowerTitle} के लिए उपवास की आवश्यकता है?`,
      answer: isDisease
        ? "Fasting is usually not required for a routine consultation, but it may be advised if same-day tests or procedures are planned."
        : isColonLike
          ? "Colonoscopy-related procedures need bowel preparation and dietary restrictions. Follow the hospital instructions exactly."
          : "Fasting is commonly required for many endoscopy-related procedures, usually 6-8 hours, but the doctor or reception will confirm exact instructions.",
      answerHi: isDisease
        ? "नियमित परामर्श के लिए आमतौर पर उपवास की आवश्यकता नहीं होती, लेकिन यदि उसी दिन जांच या प्रक्रियाओं की योजना है तो इसकी सलाह दी जा सकती है।"
        : isColonLike
          ? "कोलोनोस्कोपी से संबंधित प्रक्रियाओं के लिए आंत्र तैयारी और आहार प्रतिबंध की आवश्यकता होती है। अस्पताल के निर्देशों का ठीक-ठीक पालन करें।"
          : "कई एंडोस्कोपी से संबंधित प्रक्रियाओं के लिए आमतौर पर उपवास आवश्यक होता है, आमतौर पर 6-8 घंटे, लेकिन डॉक्टर या रिसेप्शन सटीक निर्देशों की पुष्टि करेंगे।"
    },
    {
      question: "Should I stop diabetes, BP or blood thinner medicines?",
      questionHi: "क्या मुझे डायबिटीज़, बीपी या ब्लड थिनर की दवाएं बंद कर देनी चाहिए?",
      answer: "Do not stop medicines on your own. Tell the doctor about insulin, diabetes tablets, BP medicines, aspirin, clopidogrel, warfarin or other blood thinners so safe instructions can be given.",
      answerHi: "दवाएं स्वयं बंद न करें। डॉक्टर को इंसुलिन, डायबिटीज़ की गोलियों, बीपी की दवाओं, एस्पिरिन, क्लोपिडोग्रेल, वारफारिन या अन्य ब्लड थिनर के बारे में बताएं ताकि सुरक्षित निर्देश दिए जा सकें।"
    },
    {
      question: "Do I need an attendant?",
      questionHi: "क्या मुझे किसी परिजन की आवश्यकता है?",
      answer: mode === "diagnostic" || mode === "therapeutic"
        ? "An adult attendant is usually advised when sedation, anesthesia or a therapeutic procedure is planned."
        : "An attendant is helpful for elderly patients, weak patients, urgent symptoms or when procedures may be scheduled.",
      answerHi: mode === "diagnostic" || mode === "therapeutic"
        ? "जब सेडेशन, एनेस्थीसिया या चिकित्सीय प्रक्रिया की योजना हो, तो आमतौर पर एक वयस्क परिजन की सलाह दी जाती है।"
        : "बुज़ुर्ग मरीज़ों, कमज़ोर मरीज़ों, तत्काल लक्षणों या जब प्रक्रियाएं निर्धारित की जा सकती हैं, तब परिजन का साथ होना सहायक होता है।"
    },
    {
      question: "What reports should I bring?",
      questionHi: "मुझे कौन सी रिपोर्ट लानी चाहिए?",
      answer: "Bring previous prescriptions, blood tests, ultrasound, CT, MRCP, FibroScan, endoscopy, colonoscopy, biopsy and discharge summaries if available.",
      answerHi: "यदि उपलब्ध हों तो पिछले पर्चे, ब्लड टेस्ट, अल्ट्रासाउंड, सीटी, एमआरसीपी, फाइब्रोस्कैन, एंडोस्कोपी, कोलोनोस्कोपी, बायोप्सी और डिस्चार्ज समरी साथ लाएं।"
    },
    {
      question: `Is ${lowerTitle} safe?`,
      questionHi: `क्या ${lowerTitle} सुरक्षित है?`,
      answer: "The doctor advises it only when the expected benefit is greater than the risk. Most patients do well, but risks and safety instructions are explained before any procedure.",
      answerHi: "डॉक्टर इसकी सलाह तभी देते हैं जब अपेक्षित लाभ जोखिम से अधिक हो। अधिकांश मरीज़ ठीक रहते हैं, लेकिन किसी भी प्रक्रिया से पहले जोखिम और सुरक्षा निर्देश समझाए जाते हैं।"
    },
    {
      question: "How do I book an appointment?",
      questionHi: "मैं अपॉइंटमेंट कैसे बुक करूं?",
      answer: `Call reception at ${site.mobile}, send a WhatsApp message, or use the appointment form on this website.`,
      answerHi: `${site.mobile} पर रिसेप्शन को कॉल करें, व्हाट्सएप संदेश भेजें, या इस वेबसाइट पर अपॉइंटमेंट फॉर्म का उपयोग करें।`
    }
  ];

  return { sections, faqs };
}

export async function generateStaticParams() {
  return (await getPublicProcedures()).map((procedure) => ({ slug: procedure.slug }));
}

export async function generateMetadata({ params }: ProcedurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);

  if (!procedure) return {};

  return {
    title: procedure.seoTitle || `${procedure.title} in Agra`,
    description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
    alternates: { canonical: `/procedures/${procedure.slug}` },
    openGraph: {
      title: procedure.seoTitle || `${procedure.title} in Agra`,
      description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
      url: `${site.url}/procedures/${procedure.slug}`,
      type: "article",
      images: [`/procedures/${procedure.slug}/opengraph-image`]
    },
    twitter: {
      card: "summary_large_image",
      title: procedure.seoTitle || `${procedure.title} in Agra`,
      description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
      images: [`/procedures/${procedure.slug}/opengraph-image`]
    }
  };
}

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);
  if (!procedure) notFound();
  const isBleeding = procedure.slug === "gastrointestinal-bleeding-management";
  const showOpdTimingCard = opdTimingProcedureSlugs.has(procedure.slug);
  const isDisease = diseaseSlugs.has(procedure.slug);
  const pageCopy = getPageCopy(procedure.slug, procedure.title, isDisease);
  const article = getProcedureArticle(procedure.slug, procedure.title, isDisease, pageCopy);
  const relatedBlogPosts = seoBlogPosts.filter((post) => post.relatedHref === `/procedures/${procedure.slug}`);

  const heroImage = isBleeding ? "/images/hospital/cbd-stone-removal.jpg" : "/images/hospital/endoscopy-room.jpg";
  const quickFacts = [
    ["Specialty", "विशेषज्ञता", "Gastroenterology", "गैस्ट्रोएंटरोलॉजी"],
    [
      "Care Type",
      "देखभाल प्रकार",
      isBleeding ? "Urgent endoscopic care" : isDisease ? "Consultation and treatment planning" : "Consultation and procedure planning",
      isBleeding ? "तत्काल एंडोस्कोपिक देखभाल" : isDisease ? "परामर्श और उपचार योजना" : "परामर्श और प्रक्रिया योजना"
    ],
    ["Location", "स्थान", "Shaheed Nagar, Agra", "शहीद नगर, आगरा"],
    ["Appointment", "अपॉइंटमेंट", "Call or WhatsApp reception", "कॉल करें या रिसेप्शन को व्हाट्सएप करें"]
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": isDisease ? "MedicalCondition" : "MedicalProcedure",
        name: procedure.title,
        description: procedure.summary,
        provider: {
          "@type": "Hospital",
          name: site.name,
          url: site.url
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: article.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: isDisease ? "GI Diseases" : "Special Procedures", url: "/#procedures" },
        { name: `${procedure.title} in Agra`, url: `/procedures/${procedure.slug}` }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
              <span data-en>Gastroenterology Hospital in Agra</span>
              <span data-hi lang="hi">आगरा में गैस्ट्रोएंटरोलॉजी अस्पताल</span>
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">{procedure.title} in Agra</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>{procedure.summary}</p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">{procedure.hiSummary}</p>
            <AppointmentCtaPanel className="mt-8 max-w-3xl" />
          </div>
          <div className="rounded border border-white/20 bg-white/12 p-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-cyan-100">
              <span data-en>Quick Information</span>
              <span data-hi lang="hi">त्वरित जानकारी</span>
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickFacts.map(([label, labelHi, value, valueHi]) => (
                <div key={label} className="rounded border border-white/15 bg-white/10 p-4">
                  <p className="inline-lang text-xs font-black uppercase tracking-wider text-white/55">
                    <span data-en>{label}</span>
                    <span data-hi lang="hi">{labelHi}</span>
                  </p>
                  <p className="inline-lang mt-1 font-black text-white">
                    <span data-en>{value}</span>
                    <span data-hi lang="hi">{valueHi}</span>
                  </p>
                </div>
              ))}
            </div>
            {isBleeding ? (
              <div className="mt-4 flex gap-3 rounded border border-red-300/30 bg-red-600/20 p-4 text-sm leading-relaxed text-white/85">
                <AlertCircle className="mt-0.5 shrink-0 text-red-100" size={19} />
                <span className="inline-lang">
                  <span data-en>Severe or active bleeding symptoms need immediate medical attention. Call reception or local emergency services urgently.</span>
                  <span data-hi lang="hi">गंभीर या सक्रिय रक्तस्राव के लक्षणों के लिए तत्काल चिकित्सा ध्यान देने की आवश्यकता है। तुरंत रिसेप्शन या स्थानीय आपातकालीन सेवाओं को कॉल करें।</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {showOpdTimingCard ? (
        <Section className="overflow-hidden">
          <HeroOpdTimingCard />
        </Section>
      ) : null}

      <Section className={`${showOpdTimingCard ? "" : "-mt-10"} relative z-10 pt-0`}>
        <div className="grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <MotionReveal>
          <article className="overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="relative aspect-[4/3] bg-soft">
              <Image src={heroImage} alt={`${procedure.title} facility at Mudgal Gastromedics Hospital`} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand">
                <span data-en>{isDisease ? "Care Overview" : "Procedure Overview"}</span>
                <span data-hi lang="hi">{isDisease ? "देखभाल अवलोकन" : "प्रक्रिया अवलोकन"}</span>
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Specialized {procedure.title} care by a gastroenterology team</h2>
              <p className="mt-4 text-muted" data-en>
                {pageCopy.overview}
              </p>
              <p className="mt-4 text-muted" data-hi lang="hi">
                {pageCopy.overviewHi}
              </p>
            </div>
          </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
          <div className="grid gap-5">
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <BrandIconTile className="mb-4 h-12 w-12" />
              <h2 className="inline-lang text-3xl font-black leading-tight">
                <span data-en>When to consult</span>
                <span data-hi lang="hi">कब परामर्श लें</span>
              </h2>
              <div className="mt-5 grid gap-3">
                {pageCopy.consultCues.map((cue, index) => (
                  <div key={cue} className="flex gap-3 rounded border border-line bg-soft/60 p-3 text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                    <span className="inline-lang">
                      <span data-en>{cue}</span>
                      <span data-hi lang="hi">{pageCopy.consultCuesHi[index]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="inline-lang text-xl font-black">
                <span data-en>Related search terms</span>
                <span data-hi lang="hi">संबंधित खोज शब्द</span>
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {pageCopy.relatedTerms.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-sm font-black text-teal-dark">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          </MotionReveal>
        </div>
      </Section>

      <Section>
        <MotionReveal>
          <div className="relative overflow-hidden rounded border border-line bg-ink p-6 text-white shadow-lift md:p-8">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.22),transparent_24rem),linear-gradient(135deg,rgba(8,145,178,0.42),rgba(5,150,105,0.22)_48%,rgba(2,22,29,0.96))]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="inline-lang text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                  <span data-en>Patient Education Guide</span>
                  <span data-hi lang="hi">मरीज़ शिक्षा गाइड</span>
                </p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">{procedure.title}: complete guide for Indian patients</h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/82" data-en>
                  Clear information about why it is done, preparation, medicine precautions, safety, recovery, cost factors and when to call reception.
                </p>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/82" data-hi lang="hi">
                  यह क्यों किया जाता है, तैयारी, दवा संबंधी सावधानियां, सुरक्षा, रिकवरी, लागत कारक और रिसेप्शन को कब कॉल करें, इसके बारे में स्पष्ट जानकारी।
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  ["Bring previous reports", "पिछली रिपोर्ट लाएं"],
                  ["Ask about fasting", "उपवास के बारे में पूछें"],
                  ["Discuss blood thinners", "ब्लड थिनर पर चर्चा करें"],
                  ["Call reception for urgent symptoms", "तत्काल लक्षणों के लिए रिसेप्शन को कॉल करें"]
                ].map(([item, itemHi]) => (
                  <div key={item} className="inline-lang rounded border border-white/15 bg-white/10 px-4 py-3 font-semibold text-cyan-50 backdrop-blur">
                    <span data-en>{item}</span>
                    <span data-hi lang="hi">{itemHi}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Guide" title={`${procedure.title}: what patients should know`} />
        <div className="grid gap-5 lg:grid-cols-2">
          {article.sections.map((section) => (
            <article key={section.title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="inline-lang text-2xl font-black leading-tight text-ink">
                <span data-en>{section.title}</span>
                <span data-hi lang="hi">{section.titleHi}</span>
              </h3>
              <p className="mt-3 leading-relaxed text-muted" data-en>{section.text}</p>
              <p className="mt-3 leading-relaxed text-muted" data-hi lang="hi">{section.textHi}</p>
              {section.items?.length ? (
                <ul className="mt-4 grid gap-3">
                  {section.items.map((item, index) => (
                    <li key={item} className="flex gap-3 text-muted">
                      <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                      <span className="inline-lang">
                        <span data-en>{item}</span>
                        <span data-hi lang="hi">{section.itemsHi?.[index]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Care Pathway" title="What patients can expect" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { ...pageCopy.pathway[0], icon: ClipboardList },
            { ...pageCopy.pathway[1], icon: HeartPulse },
            { ...pageCopy.pathway[2], icon: FileText }
          ].map(({ title, titleHi, text, textHi, icon: Icon }) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <BrandIconTile className="mb-4 h-11 w-11" />
              <h3 className="inline-lang text-xl font-black">
                <span data-en>{title}</span>
                <span data-hi lang="hi">{titleHi}</span>
              </h3>
              <p className="inline-lang mt-2 text-muted">
                <span data-en>{text}</span>
                <span data-hi lang="hi">{textHi}</span>
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="FAQs" title={`${procedure.title} FAQs`} />
        <div className="grid gap-4 lg:grid-cols-2">
          {article.faqs.map((faq) => (
            <details key={faq.question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="inline-lang cursor-pointer list-none text-lg font-black text-ink">
                <span data-en>{faq.question}</span>
                <span data-hi lang="hi">{faq.questionHi}</span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted" data-en>{faq.answer}</p>
              <p className="mt-3 leading-relaxed text-muted" data-hi lang="hi">{faq.answerHi}</p>
            </details>
          ))}
        </div>
      </Section>

      {relatedBlogPosts.length ? (
        <Section muted>
          <SectionHead eyebrow="Related Reading" title={`Patient guides for ${procedure.title}`} />
          <div className="grid gap-5 md:grid-cols-2">
            {relatedBlogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{post.category}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-ink">{post.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{post.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-black text-brand">
                  Read guide <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <LocalCareLinks />
      </Section>

      <Section>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand">
              <span data-en>Need guidance?</span>
              <span data-hi lang="hi">मार्गदर्शन चाहिए?</span>
            </p>
            <h2 className="inline-lang mt-2 text-3xl font-black">
              <span data-en>Talk to reception before planning your visit.</span>
              <span data-hi lang="hi">अपनी विज़िट की योजना बनाने से पहले रिसेप्शन से बात करें।</span>
            </h2>
            <p className="mt-2 max-w-2xl text-muted" data-en>Share symptoms, prior reports and preferred appointment timing so the hospital team can guide the next step.</p>
            <p className="mt-2 max-w-2xl text-muted" data-hi lang="hi">लक्षण, पिछली रिपोर्ट और पसंदीदा अपॉइंटमेंट समय साझा करें ताकि अस्पताल की टीम अगले कदम के लिए मार्गदर्शन कर सके।</p>
          </div>
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>
    </main>
  );
}
