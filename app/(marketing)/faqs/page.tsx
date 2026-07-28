import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, CalendarClock, HelpCircle, MapPin, Phone, ShieldAlert, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { hospitalEntityId, site } from "@/lib/site-data";

type FaqItem = {
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
};

type FaqCategory = {
  title: string;
  titleHi: string;
  summary: string;
  summaryHi: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  items: FaqItem[];
};

const pageUrl = `${site.url}/faqs`;
const pageTitle = "Gastroenterology, Liver Care & Endoscopy FAQs";
const pageFullTitle = `${pageTitle} | ${site.name}`;
const pageDescription =
  "Patient FAQs for gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan, OPD timing, warning symptoms and visit preparation at Mudgal Gastromedics Hospital, Agra.";

const faqKeywords = [
  "gastroenterologist FAQs Agra",
  "gastroenterologist in Agra questions",
  "liver specialist Agra FAQs",
  "endoscopy FAQs Agra",
  "colonoscopy FAQs Agra",
  "FibroScan FAQs Agra",
  "ERCP FAQs Agra",
  "fatty liver questions",
  "acidity GERD doctor Agra",
  "blood in stool doctor Agra",
  "black stool vomiting blood warning signs",
  "Mudgal Gastromedics Hospital FAQs"
];

const relatedFaqLinks = [
  { href: "/areas/gastroenterologist-in-agra", label: "Gastroenterologist in Agra" },
  { href: "/areas/liver-specialist-in-agra", label: "Liver Specialist in Agra" },
  { href: "/areas/endoscopy-in-agra", label: "Endoscopy in Agra" },
  { href: "/areas/colonoscopy-in-agra", label: "Colonoscopy in Agra" },
  { href: "/areas/ercp-specialist-in-agra", label: "ERCP Specialist in Agra" },
  { href: "/areas/fibroscan-in-agra", label: "FibroScan in Agra" },
  { href: "/procedures/gastrointestinal-bleeding-management", label: "GI Bleeding Care" },
  { href: "/procedures/fatty-liver", label: "Fatty Liver" },
  { href: "/contact", label: "Contact & Directions" }
];

const faqCategories: FaqCategory[] = [
  {
    title: "Contact, OPD Timing & Location",
    titleHi: "संपर्क, ओपीडी समय और स्थान",
    summary: "Basic visit planning, appointment and location questions.",
    summaryHi: "बुनियादी विज़िट योजना, अपॉइंटमेंट और स्थान संबंधी प्रश्न।",
    icon: CalendarClock,
    items: [
      {
        question: "What are the OPD timings at Mudgal Gastromedics Hospital?",
        questionHi: "मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल में ओपीडी का समय क्या है?",
        answer: "OPD consultation usually runs Monday to Saturday from 11:00 AM to 2:00 PM and 5:00 PM to 6:00 PM. Sunday OPD is closed.",
        answerHi: "ओपीडी परामर्श आमतौर पर सोमवार से शनिवार सुबह 11:00 बजे से दोपहर 2:00 बजे तक और शाम 5:00 बजे से 6:00 बजे तक चलता है। रविवार को ओपीडी बंद रहता है।"
      },
      {
        question: "Is the hospital available 24 x 7?",
        questionHi: "क्या अस्पताल 24 x 7 उपलब्ध है?",
        answer: "Hospital support remains available for patients and attendants. OPD consultation runs during scheduled OPD hours, so call reception before visiting outside OPD timing.",
        answerHi: "मरीज़ों और परिजनों के लिए अस्पताल सहायता उपलब्ध रहती है। ओपीडी परामर्श निर्धारित ओपीडी समय के दौरान चलता है, इसलिए ओपीडी समय के बाहर आने से पहले रिसेप्शन को कॉल करें।"
      },
      {
        question: "How can I book an appointment?",
        questionHi: "मैं अपॉइंटमेंट कैसे बुक कर सकता हूं?",
        answer: `You can call ${site.mobile}, WhatsApp reception, or use the appointment form on the patient portal.`,
        answerHi: `आप ${site.mobile} पर कॉल कर सकते हैं, रिसेप्शन को व्हाट्सएप कर सकते हैं, या पेशेंट पोर्टल पर अपॉइंटमेंट फॉर्म का उपयोग कर सकते हैं।`
      },
      {
        question: "Where is Mudgal Gastromedics Hospital located?",
        questionHi: "मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल कहां स्थित है?",
        answer: "The hospital is located at 16 HIG, Shaheed Nagar, behind Shaheed Nagar Police Chowki, Agra, Uttar Pradesh 282001.",
        answerHi: "अस्पताल 16 एचआईजी, शहीद नगर, शहीद नगर पुलिस चौकी के पीछे, आगरा, उत्तर प्रदेश 282001 में स्थित है।"
      },
      {
        question: "Should I call before visiting?",
        questionHi: "क्या मुझे आने से पहले कॉल करना चाहिए?",
        answer: "Yes. Calling before visiting helps reception confirm OPD timing, procedure preparation, doctor availability and whether urgent symptoms need faster guidance.",
        answerHi: "हां। आने से पहले कॉल करने से रिसेप्शन को ओपीडी का समय, प्रक्रिया की तैयारी, डॉक्टर की उपलब्धता और यह पुष्टि करने में मदद मिलती है कि तत्काल लक्षणों के लिए तेज़ मार्गदर्शन चाहिए या नहीं।"
      }
    ]
  },
  {
    title: "Doctor & Consultation",
    titleHi: "डॉक्टर और परामर्श",
    summary: "When to consult and what to bring for the visit.",
    summaryHi: "कब परामर्श लें और विज़िट के लिए क्या लाएं।",
    icon: Stethoscope,
    items: [
      {
        question: "Which symptoms should I consult a gastroenterologist for?",
        questionHi: "किन लक्षणों के लिए मुझे गैस्ट्रोएंटरोलॉजिस्ट से परामर्श लेना चाहिए?",
        answer: "Consult for persistent acidity, reflux, stomach pain, bloating, vomiting, constipation, diarrhea, blood in stool, black stool, unexplained weight loss, jaundice or abnormal liver reports.",
        answerHi: "लगातार एसिडिटी, रिफ्लक्स, पेट दर्द, सूजन, उल्टी, कब्ज़, दस्त, मल में खून, काला मल, अस्पष्टीकृत वज़न घटना, पीलिया या असामान्य लिवर रिपोर्ट के लिए परामर्श लें।"
      },
      {
        question: "Do I need previous reports for consultation?",
        questionHi: "क्या मुझे परामर्श के लिए पिछली रिपोर्ट की आवश्यकता है?",
        answer: "Previous prescriptions, blood tests, stool tests, ultrasound, CT, MRI, endoscopy, colonoscopy, biopsy and liver reports are useful. Bring them if available.",
        answerHi: "पिछले पर्चे, ब्लड टेस्ट, स्टूल टेस्ट, अल्ट्रासाउंड, सीटी, एमआरआई, एंडोस्कोपी, कोलोनोस्कोपी, बायोप्सी और लिवर रिपोर्ट उपयोगी होती हैं। यदि उपलब्ध हों तो साथ लाएं।"
      },
      {
        question: "Can I consult for acidity, gas or bloating?",
        questionHi: "क्या मैं एसिडिटी, गैस या सूजन के लिए परामर्श ले सकता हूं?",
        answer: "Yes. Persistent acidity, gas, bloating, reflux, burping, nausea or stomach burning can be evaluated during gastroenterology consultation.",
        answerHi: "हां। लगातार एसिडिटी, गैस, सूजन, रिफ्लक्स, डकार, मतली या पेट में जलन का गैस्ट्रोएंटरोलॉजी परामर्श के दौरान मूल्यांकन किया जा सकता है।"
      },
      {
        question: "Can I visit for fatty liver or high SGPT/SGOT?",
        questionHi: "क्या मैं फैटी लिवर या उच्च एसजीपीटी/एसजीओटी के लिए आ सकता हूं?",
        answer: "Yes. Fatty liver, high SGPT/SGOT, abnormal LFT, hepatitis markers, jaundice and cirrhosis-related concerns can be reviewed by the liver care team.",
        answerHi: "हां। फैटी लिवर, उच्च एसजीपीटी/एसजीओटी, असामान्य एलएफटी, हेपेटाइटिस मार्कर, पीलिया और सिरोसिस से संबंधित चिंताओं की समीक्षा लिवर केयर टीम द्वारा की जा सकती है।"
      },
      {
        question: "Can I consult a gastroenterologist in Agra without a referral?",
        questionHi: "क्या मैं बिना रेफरल के आगरा में गैस्ट्रोएंटरोलॉजिस्ट से परामर्श ले सकता हूं?",
        answer: "Yes. Patients can contact reception directly for gastroenterology or liver consultation. A referral is useful if available, but it is not always required for booking.",
        answerHi: "हां। मरीज़ गैस्ट्रोएंटरोलॉजी या लिवर परामर्श के लिए सीधे रिसेप्शन से संपर्क कर सकते हैं। यदि उपलब्ध हो तो रेफरल उपयोगी है, लेकिन बुकिंग के लिए हमेशा आवश्यक नहीं है।"
      },
      {
        question: "Which areas of Agra does the hospital commonly serve?",
        questionHi: "अस्पताल आगरा के किन क्षेत्रों को आमतौर पर सेवा देता है?",
        answer: "Patients commonly visit from Shaheed Nagar, Rajpur Chungi, Fatehabad Road, Tajganj, Agra Cantt, Civil Lines, Kamla Nagar, Dayal Bagh and nearby Agra areas.",
        answerHi: "मरीज़ आमतौर पर शहीद नगर, राजपुर चुंगी, फ़तेहाबाद रोड, ताजगंज, आगरा कैंट, सिविल लाइंस, कमला नगर, दयालबाग और आसपास के आगरा क्षेत्रों से आते हैं।"
      },
      {
        question: "Is Mudgal Gastromedics Hospital near Fatehabad Road?",
        questionHi: "क्या मुदगल गैस्ट्रोमेडिक्स हॉस्पिटल फ़तेहाबाद रोड के पास है?",
        answer: "The hospital is located in Shaheed Nagar, with common access from Fatehabad Road, Rajpur Chungi, Tajganj and nearby Agra routes. Use Google directions or call reception before visiting.",
        answerHi: "अस्पताल शहीद नगर में स्थित है, जिसका सामान्य आगमन फ़तेहाबाद रोड, राजपुर चुंगी, ताजगंज और आसपास के आगरा मार्गों से होता है। आने से पहले गूगल दिशा-निर्देश का उपयोग करें या रिसेप्शन को कॉल करें।"
      },
      {
        question: "Is the hospital accessible from Agra Cantt?",
        questionHi: "क्या अस्पताल आगरा कैंट से पहुंच योग्य है?",
        answer: "Patients from Agra Cantt, Sadar Bazar, Idgah, Kheria and nearby areas commonly use the Shaheed Nagar route. Check traffic and directions before travelling.",
        answerHi: "आगरा कैंट, सदर बाज़ार, ईदगाह, खेरिया और आसपास के क्षेत्रों के मरीज़ आमतौर पर शहीद नगर मार्ग का उपयोग करते हैं। यात्रा से पहले ट्रैफिक और दिशा-निर्देश जांच लें।"
      },
      {
        question: "Can nearby city patients visit from Mathura, Firozabad or Bharatpur?",
        questionHi: "क्या मथुरा, फ़िरोज़ाबाद या भरतपुर के आसपास के शहर के मरीज़ आ सकते हैं?",
        answer: "Patients from nearby cities can contact reception before travelling to confirm timing, preparation and whether reports should be shared first.",
        answerHi: "आसपास के शहरों के मरीज़ यात्रा से पहले समय, तैयारी और रिपोर्ट पहले साझा करनी चाहिए या नहीं, इसकी पुष्टि के लिए रिसेप्शन से संपर्क कर सकते हैं।"
      },
      {
        question: "Can I get a second opinion for gastro or liver reports?",
        questionHi: "क्या मैं गैस्ट्रो या लिवर रिपोर्ट के लिए दूसरी राय ले सकता हूं?",
        answer: "Yes. Bring previous prescriptions, investigation reports, scans and procedure reports so the doctor can review the case properly.",
        answerHi: "हां। पिछले पर्चे, जांच रिपोर्ट, स्कैन और प्रक्रिया रिपोर्ट साथ लाएं ताकि डॉक्टर मामले की ठीक से समीक्षा कर सकें।"
      },
      {
        question: "Can elderly patients consult for digestive or liver problems?",
        questionHi: "क्या बुज़ुर्ग मरीज़ पाचन या लिवर संबंधी समस्याओं के लिए परामर्श ले सकते हैं?",
        answer: "Yes. Elderly patients can consult for acidity, bleeding symptoms, constipation, appetite loss, liver reports, anemia, jaundice or procedure planning. Bring medicines and prior records.",
        answerHi: "हां। बुज़ुर्ग मरीज़ एसिडिटी, रक्तस्राव के लक्षण, कब्ज़, भूख न लगना, लिवर रिपोर्ट, एनीमिया, पीलिया या प्रक्रिया योजना के लिए परामर्श ले सकते हैं। दवाएं और पिछले रिकॉर्ड साथ लाएं।"
      },
      {
        question: "Can children or teenagers be seen for stomach symptoms?",
        questionHi: "क्या बच्चों या किशोरों को पेट के लक्षणों के लिए देखा जा सकता है?",
        answer: "Reception can guide appointment suitability for younger patients. Call before visiting and bring prior prescriptions, growth details and reports if available.",
        answerHi: "रिसेप्शन छोटे मरीज़ों के लिए अपॉइंटमेंट की उपयुक्तता के बारे में मार्गदर्शन कर सकता है। आने से पहले कॉल करें और यदि उपलब्ध हों तो पिछले पर्चे, वृद्धि विवरण और रिपोर्ट साथ लाएं।"
      }
    ]
  },
  {
    title: "Common Digestive Problems",
    titleHi: "सामान्य पाचन समस्याएं",
    summary: "Acidity, IBS, constipation, diarrhea and stomach infection questions.",
    summaryHi: "एसिडिटी, आईबीएस, कब्ज़, दस्त और पेट के संक्रमण संबंधी प्रश्न।",
    icon: Stethoscope,
    items: [
      {
        question: "When should acidity or GERD be shown to a gastroenterologist?",
        questionHi: "एसिडिटी या जीईआरडी को गैस्ट्रोएंटरोलॉजिस्ट को कब दिखाना चाहिए?",
        answer: "Acidity, reflux or heartburn should be reviewed if it is persistent, recurring despite medicines, associated with swallowing difficulty, vomiting, weight loss, anemia or black stools.",
        answerHi: "यदि एसिडिटी, रिफ्लक्स या सीने में जलन लगातार बनी रहे, दवाओं के बावजूद बार-बार हो, या निगलने में कठिनाई, उल्टी, वज़न घटना, एनीमिया या काले मल के साथ हो, तो इसकी समीक्षा करानी चाहिए।"
      },
      {
        question: "What can cause frequent gas and bloating?",
        questionHi: "बार-बार गैस और सूजन का कारण क्या हो सकता है?",
        answer: "Gas and bloating can be linked with diet, constipation, acidity, IBS, food intolerance, gut infection, medicines or other digestive conditions. Persistent symptoms should be evaluated.",
        answerHi: "गैस और सूजन आहार, कब्ज़, एसिडिटी, आईबीएस, भोजन असहिष्णुता, आंत संक्रमण, दवाओं या अन्य पाचन स्थितियों से जुड़ी हो सकती है। लगातार लक्षणों का मूल्यांकन कराना चाहिए।"
      },
      {
        question: "When is constipation a concern?",
        questionHi: "कब्ज़ कब चिंता का विषय है?",
        answer: "Constipation needs medical advice if it is new, persistent, associated with blood in stool, weight loss, severe pain, vomiting, anemia or a major change in bowel habit.",
        answerHi: "यदि कब्ज़ नई हो, लगातार बनी रहे, मल में खून, वज़न घटना, गंभीर दर्द, उल्टी, एनीमिया या मल त्याग की आदत में बड़े बदलाव के साथ हो, तो चिकित्सा सलाह आवश्यक है।"
      },
      {
        question: "When should chronic diarrhea be checked?",
        questionHi: "पुराने दस्त की जांच कब करानी चाहिए?",
        answer: "Diarrhea lasting more than a few days, recurring diarrhea, blood or mucus in stool, fever, weight loss, dehydration or night-time symptoms should be assessed.",
        answerHi: "कुछ दिनों से अधिक चलने वाले दस्त, बार-बार होने वाले दस्त, मल में खून या बलगम, बुखार, वज़न घटना, डिहाइड्रेशन या रात के लक्षणों का मूल्यांकन कराना चाहिए।"
      },
      {
        question: "What is IBS and when should I consult?",
        questionHi: "आईबीएस क्या है और मुझे कब परामर्श लेना चाहिए?",
        answer: "IBS can cause recurrent abdominal pain, bloating, constipation, diarrhea or mixed bowel habits. A consultation helps rule out warning signs and plan symptom control.",
        answerHi: "आईबीएस बार-बार पेट दर्द, सूजन, कब्ज़, दस्त या मिश्रित मल त्याग की आदतों का कारण बन सकता है। परामर्श से चेतावनी संकेतों को खारिज करने और लक्षण नियंत्रण की योजना बनाने में मदद मिलती है।"
      },
      {
        question: "What is H. pylori infection?",
        questionHi: "एच. पाइलोरी संक्रमण क्या है?",
        answer: "H. pylori is a stomach infection that can be associated with gastritis, ulcers, acidity or pain. Testing and treatment depend on symptoms and clinical assessment.",
        answerHi: "एच. पाइलोरी एक पेट का संक्रमण है जो गैस्ट्राइटिस, अल्सर, एसिडिटी या दर्द से जुड़ा हो सकता है। जांच और उपचार लक्षणों और नैदानिक मूल्यांकन पर निर्भर करते हैं।"
      },
      {
        question: "Can stomach pain be related to gallbladder or pancreas disease?",
        questionHi: "क्या पेट दर्द पित्ताशय या अग्न्याशय रोग से संबंधित हो सकता है?",
        answer: "Yes. Upper abdominal pain, pain after meals, vomiting, fever, jaundice or pain radiating to the back can sometimes relate to gallbladder, bile duct or pancreatic disease.",
        answerHi: "हां। ऊपरी पेट दर्द, भोजन के बाद दर्द, उल्टी, बुखार, पीलिया या पीठ तक फैलने वाला दर्द कभी-कभी पित्ताशय, पित्त नली या अग्न्याशय रोग से संबंधित हो सकता है।"
      },
      {
        question: "When should loss of appetite be checked?",
        questionHi: "भूख न लगने की जांच कब करानी चाहिए?",
        answer: "Loss of appetite should be reviewed if it persists, is associated with weight loss, vomiting, jaundice, pain, anemia, fever or bowel habit changes.",
        answerHi: "यदि भूख न लगना बना रहे, वज़न घटना, उल्टी, पीलिया, दर्द, एनीमिया, बुखार या मल त्याग की आदतों में बदलाव के साथ हो, तो इसकी समीक्षा करानी चाहिए।"
      },
      {
        question: "Can frequent burping be a digestive problem?",
        questionHi: "क्या बार-बार डकार आना पाचन संबंधी समस्या हो सकती है?",
        answer: "Frequent burping can be related to reflux, gastritis, food habits, aerophagia, delayed stomach emptying or other digestive issues. Persistent symptoms can be assessed.",
        answerHi: "बार-बार डकार आना रिफ्लक्स, गैस्ट्राइटिस, खान-पान की आदतों, एरोफेजिया, पेट खाली होने में देरी या अन्य पाचन समस्याओं से संबंधित हो सकता है। लगातार लक्षणों का मूल्यांकन किया जा सकता है।"
      },
      {
        question: "What can cause burning in the stomach?",
        questionHi: "पेट में जलन का कारण क्या हो सकता है?",
        answer: "Stomach burning can be linked with acidity, gastritis, ulcers, H. pylori infection, medicines, diet triggers or reflux. Warning symptoms need early review.",
        answerHi: "पेट में जलन एसिडिटी, गैस्ट्राइटिस, अल्सर, एच. पाइलोरी संक्रमण, दवाओं, आहार ट्रिगर्स या रिफ्लक्स से जुड़ी हो सकती है। चेतावनी लक्षणों की जल्दी समीक्षा आवश्यक है।"
      },
      {
        question: "When should mucus in stool be checked?",
        questionHi: "मल में बलगम की जांच कब करानी चाहिए?",
        answer: "Mucus in stool should be assessed if it is persistent, recurrent, associated with blood, diarrhea, pain, fever, weight loss or suspected colitis.",
        answerHi: "यदि मल में बलगम लगातार बना रहे, बार-बार हो, या खून, दस्त, दर्द, बुखार, वज़न घटना या संदिग्ध कोलाइटिस के साथ हो, तो इसका मूल्यांकन कराना चाहिए।"
      },
      {
        question: "Can stress worsen acidity or IBS symptoms?",
        questionHi: "क्या तनाव एसिडिटी या आईबीएस के लक्षणों को बिगाड़ सकता है?",
        answer: "Stress can worsen reflux, bloating and IBS-like symptoms in some patients, but persistent or warning symptoms should not be assumed to be stress alone.",
        answerHi: "तनाव कुछ मरीज़ों में रिफ्लक्स, सूजन और आईबीएस जैसे लक्षणों को बिगाड़ सकता है, लेकिन लगातार या चेतावनी लक्षणों को केवल तनाव मानकर नज़रअंदाज़ नहीं करना चाहिए।"
      }
    ]
  },
  {
    title: "Endoscopy & Colonoscopy",
    titleHi: "एंडोस्कोपी और कोलोनोस्कोपी",
    summary: "Procedure planning, preparation and report questions.",
    summaryHi: "प्रक्रिया योजना, तैयारी और रिपोर्ट संबंधी प्रश्न।",
    icon: HelpCircle,
    items: [
      {
        question: "When is endoscopy needed?",
        questionHi: "एंडोस्कोपी कब आवश्यक है?",
        answer: "Endoscopy may be advised for persistent acidity, ulcer symptoms, vomiting, black stools, anemia, swallowing difficulty, food sticking, suspected bleeding or biopsy planning.",
        answerHi: "लगातार एसिडिटी, अल्सर के लक्षण, उल्टी, काला मल, एनीमिया, निगलने में कठिनाई, भोजन अटकना, संदिग्ध रक्तस्राव या बायोप्सी योजना के लिए एंडोस्कोपी की सलाह दी जा सकती है।"
      },
      {
        question: "Is fasting required before endoscopy?",
        questionHi: "क्या एंडोस्कोपी से पहले उपवास आवश्यक है?",
        answer: "Fasting is commonly required before upper GI endoscopy. Confirm exact fasting instructions with reception or the care team before arrival.",
        answerHi: "अपर जीआई एंडोस्कोपी से पहले आमतौर पर उपवास आवश्यक होता है। आने से पहले रिसेप्शन या केयर टीम से सटीक उपवास निर्देशों की पुष्टि करें।"
      },
      {
        question: "When is colonoscopy needed?",
        questionHi: "कोलोनोस्कोपी कब आवश्यक है?",
        answer: "Colonoscopy may be advised for blood in stool, chronic constipation, chronic diarrhea, mucus in stool, suspected colitis, colon polyps, anemia or colon cancer screening.",
        answerHi: "मल में खून, पुरानी कब्ज़, पुराने दस्त, मल में बलगम, संदिग्ध कोलाइटिस, कोलन पॉलिप्स, एनीमिया या कोलन कैंसर स्क्रीनिंग के लिए कोलोनोस्कोपी की सलाह दी जा सकती है।"
      },
      {
        question: "Is bowel preparation required for colonoscopy?",
        questionHi: "क्या कोलोनोस्कोपी के लिए आंत्र तैयारी आवश्यक है?",
        answer: "Yes. Colonoscopy usually needs bowel preparation. The team will guide diet, medicines and timing based on the planned procedure.",
        answerHi: "हां। कोलोनोस्कोपी के लिए आमतौर पर आंत्र तैयारी आवश्यक होती है। टीम नियोजित प्रक्रिया के आधार पर आहार, दवाओं और समय के बारे में मार्गदर्शन देगी।"
      },
      {
        question: "Can biopsy or polyp removal be done during endoscopy or colonoscopy?",
        questionHi: "क्या एंडोस्कोपी या कोलोनोस्कोपी के दौरान बायोप्सी या पॉलिप निकाला जा सकता है?",
        answer: "Biopsy or selected polyp removal may be done when clinically appropriate. The doctor will explain the need, consent and follow-up plan.",
        answerHi: "नैदानिक रूप से उपयुक्त होने पर बायोप्सी या चुनिंदा पॉलिप निकाला जा सकता है। डॉक्टर आवश्यकता, सहमति और फॉलो-अप योजना समझाएंगे।"
      },
      {
        question: "Is endoscopy useful for black stools or vomiting blood?",
        questionHi: "क्या काले मल या खून की उल्टी के लिए एंडोस्कोपी उपयोगी है?",
        answer: "Endoscopy is often used to identify and sometimes treat upper gastrointestinal bleeding. Vomiting blood or black stools should be discussed urgently before travelling.",
        answerHi: "एंडोस्कोपी का उपयोग अक्सर ऊपरी जठरांत्र रक्तस्राव की पहचान और कभी-कभी उपचार के लिए किया जाता है। खून की उल्टी या काले मल के बारे में यात्रा से पहले तत्काल चर्चा करनी चाहिए।"
      },
      {
        question: "Can colonoscopy detect colon polyps?",
        questionHi: "क्या कोलोनोस्कोपी से कोलन पॉलिप्स का पता चल सकता है?",
        answer: "Yes. Colonoscopy can help detect colon polyps, inflammation, bleeding sources and other bowel conditions. Selected polyps may be removed when clinically appropriate.",
        answerHi: "हां। कोलोनोस्कोपी कोलन पॉलिप्स, सूजन, रक्तस्राव के स्रोत और अन्य आंत्र स्थितियों का पता लगाने में मदद कर सकती है। नैदानिक रूप से उपयुक्त होने पर चुनिंदा पॉलिप्स निकाले जा सकते हैं।"
      },
      {
        question: "How long does an endoscopy or colonoscopy visit take?",
        questionHi: "एंडोस्कोपी या कोलोनोस्कोपी विज़िट में कितना समय लगता है?",
        answer: "Timing depends on preparation, sedation, procedure type, recovery and reporting. Ask reception for expected timing when booking.",
        answerHi: "समय तैयारी, सेडेशन, प्रक्रिया के प्रकार, रिकवरी और रिपोर्टिंग पर निर्भर करता है। बुकिंग के समय रिसेप्शन से अपेक्षित समय के बारे में पूछें।"
      },
      {
        question: "What is ERCP used for?",
        questionHi: "ईआरसीपी का उपयोग किस लिए किया जाता है?",
        answer: "ERCP is used for selected bile duct and pancreatic duct conditions such as CBD stones, obstructive jaundice, bile duct narrowing and stenting needs.",
        answerHi: "ईआरसीपी का उपयोग चुनिंदा पित्त नली और अग्न्याशय नली की स्थितियों जैसे सीबीडी पथरी, ऑब्सट्रक्टिव पीलिया, पित्त नली संकुचन और स्टेंटिंग आवश्यकताओं के लिए किया जाता है।"
      },
      {
        question: "When should CBD stone or obstructive jaundice be reviewed urgently?",
        questionHi: "सीबीडी पथरी या ऑब्सट्रक्टिव पीलिया की तत्काल समीक्षा कब करानी चाहिए?",
        answer: "CBD stone or jaundice with fever, chills, severe pain, vomiting, confusion or weakness can be urgent and should be discussed immediately.",
        answerHi: "बुखार, ठंड लगना, गंभीर दर्द, उल्टी, भ्रम या कमज़ोरी के साथ सीबीडी पथरी या पीलिया तत्काल हो सकता है और इस पर तुरंत चर्चा करनी चाहिए।"
      },
      {
        question: "What should I bring before an endoscopy appointment?",
        questionHi: "एंडोस्कोपी अपॉइंटमेंट से पहले मुझे क्या लाना चाहिए?",
        answer: "Bring previous reports, current medicines, allergy details, diabetes or blood thinner information and any prior endoscopy or biopsy reports.",
        answerHi: "पिछली रिपोर्ट, वर्तमान दवाएं, एलर्जी का विवरण, डायबिटीज़ या ब्लड थिनर की जानकारी और कोई भी पिछली एंडोस्कोपी या बायोप्सी रिपोर्ट साथ लाएं।"
      },
      {
        question: "What should I bring before a colonoscopy appointment?",
        questionHi: "कोलोनोस्कोपी अपॉइंटमेंट से पहले मुझे क्या लाना चाहिए?",
        answer: "Bring previous colonoscopy reports, biopsy reports, blood tests, current medicines and details of heart disease, diabetes, kidney disease or blood thinner use.",
        answerHi: "पिछली कोलोनोस्कोपी रिपोर्ट, बायोप्सी रिपोर्ट, ब्लड टेस्ट, वर्तमान दवाएं और हृदय रोग, डायबिटीज़, किडनी रोग या ब्लड थिनर के उपयोग का विवरण साथ लाएं।"
      },
      {
        question: "Can endoscopy detect ulcers?",
        questionHi: "क्या एंडोस्कोपी से अल्सर का पता चल सकता है?",
        answer: "Upper GI endoscopy can help detect ulcers, gastritis, esophagitis, bleeding points, growths, narrowing and other upper digestive tract problems.",
        answerHi: "अपर जीआई एंडोस्कोपी अल्सर, गैस्ट्राइटिस, एसोफेजाइटिस, रक्तस्राव के बिंदु, वृद्धि, संकुचन और अन्य ऊपरी पाचन तंत्र की समस्याओं का पता लगाने में मदद कर सकती है।"
      },
      {
        question: "Can colonoscopy help in chronic constipation?",
        questionHi: "क्या कोलोनोस्कोपी पुरानी कब्ज़ में मदद कर सकती है?",
        answer: "Colonoscopy may be advised in selected constipation cases, especially with warning signs such as blood in stool, anemia, weight loss, older age onset or major bowel habit change.",
        answerHi: "चुनिंदा कब्ज़ के मामलों में कोलोनोस्कोपी की सलाह दी जा सकती है, विशेष रूप से मल में खून, एनीमिया, वज़न घटना, बड़ी उम्र में शुरुआत या मल त्याग की आदत में बड़े बदलाव जैसे चेतावनी संकेतों के साथ।"
      },
      {
        question: "Is sedation always required for endoscopy or colonoscopy?",
        questionHi: "क्या एंडोस्कोपी या कोलोनोस्कोपी के लिए सेडेशन हमेशा आवश्यक है?",
        answer: "Sedation depends on the procedure, patient condition and doctor advice. If sedation is planned, an attendant and recovery time may be required.",
        answerHi: "सेडेशन प्रक्रिया, मरीज़ की स्थिति और डॉक्टर की सलाह पर निर्भर करता है। यदि सेडेशन की योजना है, तो एक परिजन और रिकवरी समय आवश्यक हो सकता है।"
      }
    ]
  },
  {
    title: "Liver Care & FibroScan",
    titleHi: "लिवर देखभाल और फाइब्रोस्कैन",
    summary: "Common questions about liver reports and liver stiffness testing.",
    summaryHi: "लिवर रिपोर्ट और लिवर कठोरता जांच संबंधी सामान्य प्रश्न।",
    icon: ShieldAlert,
    items: [
      {
        question: "When should I see a liver specialist?",
        questionHi: "मुझे लिवर विशेषज्ञ से कब मिलना चाहिए?",
        answer: "See a liver specialist for jaundice, high SGPT/SGOT, fatty liver, hepatitis B or C, cirrhosis, ascites, low platelets, vomiting blood, black stool or abnormal ultrasound findings.",
        answerHi: "पीलिया, उच्च एसजीपीटी/एसजीओटी, फैटी लिवर, हेपेटाइटिस बी या सी, सिरोसिस, एसाइटिस, कम प्लेटलेट्स, खून की उल्टी, काला मल या असामान्य अल्ट्रासाउंड निष्कर्षों के लिए लिवर विशेषज्ञ से मिलें।"
      },
      {
        question: "What does high SGPT or SGOT mean?",
        questionHi: "उच्च एसजीपीटी या एसजीओटी का क्या मतलब है?",
        answer: "High SGPT or SGOT can happen due to fatty liver, viral hepatitis, alcohol-related liver injury, medicines, metabolic risk or other liver conditions. It should be interpreted with other reports.",
        answerHi: "उच्च एसजीपीटी या एसजीओटी फैटी लिवर, वायरल हेपेटाइटिस, शराब से संबंधित लिवर क्षति, दवाओं, मेटाबॉलिक जोखिम या अन्य लिवर स्थितियों के कारण हो सकता है। इसे अन्य रिपोर्ट के साथ समझा जाना चाहिए।"
      },
      {
        question: "What is FibroScan used for?",
        questionHi: "फाइब्रोस्कैन का उपयोग किस लिए किया जाता है?",
        answer: "FibroScan is a non-invasive test used to assess liver stiffness and fatty liver risk in selected patients with fatty liver, hepatitis, high liver enzymes or chronic liver disease.",
        answerHi: "फाइब्रोस्कैन एक नॉन-इनवेसिव जांच है जिसका उपयोग फैटी लिवर, हेपेटाइटिस, उच्च लिवर एंज़ाइम या पुराने लिवर रोग वाले चुनिंदा मरीज़ों में लिवर की कठोरता और फैटी लिवर जोखिम का आकलन करने के लिए किया जाता है।"
      },
      {
        question: "Is FibroScan painful?",
        questionHi: "क्या फाइब्रोस्कैन दर्दनाक है?",
        answer: "FibroScan is generally non-invasive and does not involve a needle. The care team will explain the process before the test.",
        answerHi: "फाइब्रोस्कैन आमतौर पर नॉन-इनवेसिव होता है और इसमें सुई शामिल नहीं होती। केयर टीम जांच से पहले प्रक्रिया समझाएगी।"
      },
      {
        question: "Does fatty liver need treatment?",
        questionHi: "क्या फैटी लिवर को उपचार की आवश्यकता है?",
        answer: "Fatty liver may need lifestyle, metabolic risk and liver fibrosis assessment. Treatment depends on reports, diabetes risk, weight, alcohol intake and liver stiffness stage.",
        answerHi: "फैटी लिवर के लिए जीवनशैली, मेटाबॉलिक जोखिम और लिवर फाइब्रोसिस मूल्यांकन की आवश्यकता हो सकती है। उपचार रिपोर्ट, डायबिटीज़ जोखिम, वज़न, शराब सेवन और लिवर कठोरता के चरण पर निर्भर करता है।"
      },
      {
        question: "Can fatty liver become serious?",
        questionHi: "क्या फैटी लिवर गंभीर हो सकता है?",
        answer: "Fatty liver can be mild in many patients, but some develop inflammation, fibrosis or cirrhosis risk. Risk is higher with diabetes, obesity, alcohol use or persistently abnormal liver enzymes.",
        answerHi: "कई मरीज़ों में फैटी लिवर हल्का हो सकता है, लेकिन कुछ में सूजन, फाइब्रोसिस या सिरोसिस का जोखिम विकसित हो सकता है। डायबिटीज़, मोटापा, शराब सेवन या लगातार असामान्य लिवर एंज़ाइम के साथ जोखिम अधिक होता है।"
      },
      {
        question: "Which tests are useful for fatty liver assessment?",
        questionHi: "फैटी लिवर के मूल्यांकन के लिए कौन सी जांच उपयोगी हैं?",
        answer: "Common assessment may include LFT, CBC, sugar profile, lipid profile, ultrasound and, in selected patients, FibroScan or other tests advised by the doctor.",
        answerHi: "सामान्य मूल्यांकन में एलएफटी, सीबीसी, शुगर प्रोफाइल, लिपिड प्रोफाइल, अल्ट्रासाउंड और चुनिंदा मरीज़ों में फाइब्रोस्कैन या डॉक्टर द्वारा सुझाई गई अन्य जांच शामिल हो सकती हैं।"
      },
      {
        question: "What symptoms can liver cirrhosis cause?",
        questionHi: "लिवर सिरोसिस किन लक्षणों का कारण बन सकता है?",
        answer: "Cirrhosis may cause weakness, swelling, abdominal fluid, jaundice, itching, vomiting blood, black stools, confusion or low platelets, but some patients may have few symptoms early.",
        answerHi: "सिरोसिस कमज़ोरी, सूजन, पेट में तरल पदार्थ, पीलिया, खुजली, खून की उल्टी, काला मल, भ्रम या कम प्लेटलेट्स का कारण बन सकता है, लेकिन कुछ मरीज़ों में शुरुआत में कम लक्षण हो सकते हैं।"
      },
      {
        question: "Should hepatitis B or hepatitis C be reviewed even without symptoms?",
        questionHi: "क्या बिना लक्षणों के भी हेपेटाइटिस बी या हेपेटाइटिस सी की समीक्षा करानी चाहिए?",
        answer: "Yes. Hepatitis B or C can affect the liver silently. Review helps decide monitoring, viral load testing, liver stiffness assessment and treatment need.",
        answerHi: "हां। हेपेटाइटिस बी या सी चुपचाप लिवर को प्रभावित कर सकते हैं। समीक्षा से निगरानी, वायरल लोड जांच, लिवर कठोरता मूल्यांकन और उपचार की आवश्यकता तय करने में मदद मिलती है।"
      },
      {
        question: "What is liver fibrosis?",
        questionHi: "लिवर फाइब्रोसिस क्या है?",
        answer: "Liver fibrosis means scarring in the liver. It can occur with fatty liver, hepatitis, alcohol-related liver disease or other chronic liver conditions and may need monitoring.",
        answerHi: "लिवर फाइब्रोसिस का अर्थ है लिवर में स्कारिंग। यह फैटी लिवर, हेपेटाइटिस, शराब से संबंधित लिवर रोग या अन्य पुरानी लिवर स्थितियों के साथ हो सकता है और इसकी निगरानी आवश्यक हो सकती है।"
      },
      {
        question: "What is ascites?",
        questionHi: "एसाइटिस क्या है?",
        answer: "Ascites means fluid collection in the abdomen. It can be linked with advanced liver disease and should be reviewed, especially with swelling, breathlessness, fever or pain.",
        answerHi: "एसाइटिस का अर्थ है पेट में तरल पदार्थ जमा होना। यह उन्नत लिवर रोग से जुड़ा हो सकता है और विशेष रूप से सूजन, सांस फूलने, बुखार या दर्द के साथ इसकी समीक्षा करानी चाहिए।"
      },
      {
        question: "Can alcohol affect liver test results?",
        questionHi: "क्या शराब लिवर टेस्ट के परिणामों को प्रभावित कर सकती है?",
        answer: "Alcohol can affect liver enzymes and liver health. Be honest about alcohol intake during consultation so the doctor can assess risk safely.",
        answerHi: "शराब लिवर एंज़ाइम और लिवर स्वास्थ्य को प्रभावित कर सकती है। परामर्श के दौरान शराब सेवन के बारे में ईमानदार रहें ताकि डॉक्टर सुरक्षित रूप से जोखिम का आकलन कर सकें।"
      },
      {
        question: "Is ultrasound enough for fatty liver assessment?",
        questionHi: "क्या फैटी लिवर के मूल्यांकन के लिए अल्ट्रासाउंड पर्याप्त है?",
        answer: "Ultrasound can detect fatty liver, but it may not fully show fibrosis risk. Some patients need blood tests, metabolic assessment or FibroScan based on clinical context.",
        answerHi: "अल्ट्रासाउंड फैटी लिवर का पता लगा सकता है, लेकिन यह फाइब्रोसिस जोखिम को पूरी तरह नहीं दिखा सकता। कुछ मरीज़ों को नैदानिक संदर्भ के आधार पर ब्लड टेस्ट, मेटाबॉलिक मूल्यांकन या फाइब्रोस्कैन की आवश्यकता होती है।"
      },
      {
        question: "Can diabetes increase fatty liver risk?",
        questionHi: "क्या डायबिटीज़ फैटी लिवर के जोखिम को बढ़ा सकती है?",
        answer: "Yes. Diabetes, obesity, high triglycerides and metabolic risk can increase fatty liver and fibrosis risk. Regular liver assessment may be useful.",
        answerHi: "हां। डायबिटीज़, मोटापा, उच्च ट्राइग्लिसराइड्स और मेटाबॉलिक जोखिम फैटी लिवर और फाइब्रोसिस के जोखिम को बढ़ा सकते हैं। नियमित लिवर मूल्यांकन उपयोगी हो सकता है।"
      }
    ]
  },
  {
    title: "Warning Symptoms",
    titleHi: "चेतावनी लक्षण",
    summary: "Symptoms where patients should call before visiting.",
    summaryHi: "ऐसे लक्षण जहां मरीज़ों को आने से पहले कॉल करना चाहिए।",
    icon: Phone,
    items: [
      {
        question: "When should I call urgently?",
        questionHi: "मुझे तत्काल कॉल कब करना चाहिए?",
        answer: "Call urgently for vomiting blood, black stool, blood in stool, severe abdominal pain, persistent vomiting, fever with jaundice, fainting, confusion or increasing abdominal swelling.",
        answerHi: "खून की उल्टी, काला मल, मल में खून, गंभीर पेट दर्द, लगातार उल्टी, पीलिया के साथ बुखार, बेहोशी, भ्रम या बढ़ते पेट फूलने के लिए तत्काल कॉल करें।"
      },
      {
        question: "What should I do for vomiting blood?",
        questionHi: "खून की उल्टी होने पर मुझे क्या करना चाहिए?",
        answer: "Vomiting blood can be serious. Call reception or emergency medical support immediately and do not delay care.",
        answerHi: "खून की उल्टी गंभीर हो सकती है। तुरंत रिसेप्शन या आपातकालीन चिकित्सा सहायता को कॉल करें और देखभाल में देरी न करें।"
      },
      {
        question: "Is black stool serious?",
        questionHi: "क्या काला मल गंभीर है?",
        answer: "Black stool can suggest upper gastrointestinal bleeding, especially with weakness, dizziness, vomiting blood or anemia. Call before visiting.",
        answerHi: "काला मल ऊपरी जठरांत्र रक्तस्राव का संकेत दे सकता है, विशेष रूप से कमज़ोरी, चक्कर, खून की उल्टी या एनीमिया के साथ। आने से पहले कॉल करें।"
      },
      {
        question: "Is jaundice with fever urgent?",
        questionHi: "क्या बुखार के साथ पीलिया तत्काल है?",
        answer: "Jaundice with fever, chills, severe pain or vomiting can be urgent and may need prompt medical assessment.",
        answerHi: "बुखार, ठंड लगना, गंभीर दर्द या उल्टी के साथ पीलिया तत्काल हो सकता है और इसके लिए तुरंत चिकित्सा मूल्यांकन आवश्यक हो सकता है।"
      },
      {
        question: "When is severe abdominal pain an emergency?",
        questionHi: "गंभीर पेट दर्द आपातकाल कब है?",
        answer: "Severe pain with fever, vomiting, fainting, swelling, blood in stool, black stool, pregnancy, chest discomfort or worsening weakness needs urgent medical advice.",
        answerHi: "बुखार, उल्टी, बेहोशी, सूजन, मल में खून, काला मल, गर्भावस्था, सीने में परेशानी या बिगड़ती कमज़ोरी के साथ गंभीर दर्द के लिए तत्काल चिकित्सा सलाह आवश्यक है।"
      },
      {
        question: "Is blood in stool always piles?",
        questionHi: "क्या मल में खून हमेशा बवासीर होता है?",
        answer: "No. Blood in stool can come from piles, fissure, colitis, polyps, infection, cancer or other bowel conditions. Persistent or recurrent bleeding should be evaluated.",
        answerHi: "नहीं। मल में खून बवासीर, फिशर, कोलाइटिस, पॉलिप्स, संक्रमण, कैंसर या अन्य आंत्र स्थितियों से आ सकता है। लगातार या बार-बार होने वाले रक्तस्राव का मूल्यांकन कराना चाहिए।"
      },
      {
        question: "Is unexplained weight loss a warning symptom?",
        questionHi: "क्या अस्पष्टीकृत वज़न घटना एक चेतावनी लक्षण है?",
        answer: "Yes. Unexplained weight loss with poor appetite, vomiting, bowel changes, anemia, pain, jaundice or bleeding symptoms should be reviewed.",
        answerHi: "हां। भूख न लगना, उल्टी, मल त्याग में बदलाव, एनीमिया, दर्द, पीलिया या रक्तस्राव के लक्षणों के साथ अस्पष्टीकृत वज़न घटने की समीक्षा करानी चाहिए।"
      },
      {
        question: "When should persistent vomiting be checked?",
        questionHi: "लगातार उल्टी की जांच कब करानी चाहिए?",
        answer: "Persistent vomiting, dehydration, blood in vomit, severe pain, jaundice, fever, weakness or inability to keep fluids down needs medical advice.",
        answerHi: "लगातार उल्टी, डिहाइड्रेशन, उल्टी में खून, गंभीर दर्द, पीलिया, बुखार, कमज़ोरी या तरल पदार्थ न रुक पाने के लिए चिकित्सा सलाह आवश्यक है।"
      },
      {
        question: "Is anemia related to digestive disease?",
        questionHi: "क्या एनीमिया पाचन रोग से संबंधित है?",
        answer: "Anemia can sometimes be linked with ulcers, bleeding, poor absorption, bowel inflammation, colon polyps or other digestive conditions. It should be evaluated with reports.",
        answerHi: "एनीमिया कभी-कभी अल्सर, रक्तस्राव, खराब अवशोषण, आंत्र सूजन, कोलन पॉलिप्स या अन्य पाचन स्थितियों से जुड़ा हो सकता है। इसका मूल्यांकन रिपोर्ट के साथ कराना चाहिए।"
      },
      {
        question: "When is difficulty swallowing serious?",
        questionHi: "निगलने में कठिनाई कब गंभीर है?",
        answer: "Difficulty swallowing, food sticking, pain while swallowing, weight loss, vomiting or anemia should be reviewed by a gastroenterologist.",
        answerHi: "निगलने में कठिनाई, भोजन अटकना, निगलते समय दर्द, वज़न घटना, उल्टी या एनीमिया की समीक्षा गैस्ट्रोएंटरोलॉजिस्ट से करानी चाहिए।"
      },
      {
        question: "Can fever with stomach pain be serious?",
        questionHi: "क्या पेट दर्द के साथ बुखार गंभीर हो सकता है?",
        answer: "Fever with severe abdominal pain, vomiting, jaundice, swelling, diarrhea with blood or weakness can be serious and should be discussed promptly.",
        answerHi: "गंभीर पेट दर्द, उल्टी, पीलिया, सूजन, खून के साथ दस्त या कमज़ोरी के साथ बुखार गंभीर हो सकता है और इस पर तुरंत चर्चा करनी चाहिए।"
      },
      {
        question: "When should abdominal swelling be checked?",
        questionHi: "पेट फूलने की जांच कब करानी चाहिए?",
        answer: "Abdominal swelling with pain, vomiting, jaundice, breathing difficulty, leg swelling, fever or known liver disease should be reviewed.",
        answerHi: "दर्द, उल्टी, पीलिया, सांस लेने में कठिनाई, पैरों में सूजन, बुखार या ज्ञात लिवर रोग के साथ पेट फूलने की समीक्षा करानी चाहिए।"
      }
    ]
  },
  {
    title: "Visit Preparation & Facilities",
    titleHi: "विज़िट तैयारी और सुविधाएं",
    summary: "Reports, fasting, attendants and hospital facilities.",
    summaryHi: "रिपोर्ट, उपवास, परिजन और अस्पताल की सुविधाएं।",
    icon: MapPin,
    items: [
      {
        question: "What reports should I bring?",
        questionHi: "मुझे कौन सी रिपोर्ट लानी चाहिए?",
        answer: "Bring current medicines, previous prescriptions, blood tests, ultrasound, CT/MRI, stool reports, endoscopy, colonoscopy, biopsy, discharge summaries and liver reports if available.",
        answerHi: "यदि उपलब्ध हों तो वर्तमान दवाएं, पिछले पर्चे, ब्लड टेस्ट, अल्ट्रासाउंड, सीटी/एमआरआई, स्टूल रिपोर्ट, एंडोस्कोपी, कोलोनोस्कोपी, बायोप्सी, डिस्चार्ज समरी और लिवर रिपोर्ट साथ लाएं।"
      },
      {
        question: "Should I come fasting?",
        questionHi: "क्या मुझे उपवास करके आना चाहिए?",
        answer: "Some tests and procedures require fasting. For consultation alone, fasting may not always be needed. Confirm with reception before arrival.",
        answerHi: "कुछ जांच और प्रक्रियाओं के लिए उपवास आवश्यक होता है। केवल परामर्श के लिए उपवास हमेशा आवश्यक नहीं होता। आने से पहले रिसेप्शन से पुष्टि करें।"
      },
      {
        question: "Can I take regular medicines before a procedure?",
        questionHi: "क्या मैं प्रक्रिया से पहले नियमित दवाएं ले सकता हूं?",
        answer: "Tell the team about diabetes medicines, blood thinners, BP medicines and heart medicines before any procedure. Do not stop important medicines without medical advice.",
        answerHi: "किसी भी प्रक्रिया से पहले टीम को डायबिटीज़ की दवाओं, ब्लड थिनर, बीपी की दवाओं और हृदय की दवाओं के बारे में बताएं। चिकित्सा सलाह के बिना महत्वपूर्ण दवाएं बंद न करें।"
      },
      {
        question: "Do I need an attendant?",
        questionHi: "क्या मुझे किसी परिजन की आवश्यकता है?",
        answer: "An attendant is recommended for procedures, sedation, elderly patients, children, patients with weakness or anyone with urgent warning symptoms.",
        answerHi: "प्रक्रियाओं, सेडेशन, बुज़ुर्ग मरीज़ों, बच्चों, कमज़ोर मरीज़ों या तत्काल चेतावनी लक्षणों वाले किसी भी व्यक्ति के लिए परिजन की सलाह दी जाती है।"
      },
      {
        question: "What facilities are available at the hospital?",
        questionHi: "अस्पताल में कौन सी सुविधाएं उपलब्ध हैं?",
        answer: "The hospital has gastroenterology consultation, endoscopy-related care, liver care, FibroScan-related assessment, pharmacy, lift access, waiting areas, patient rooms and HDU support.",
        answerHi: "अस्पताल में गैस्ट्रोएंटरोलॉजी परामर्श, एंडोस्कोपी से संबंधित देखभाल, लिवर देखभाल, फाइब्रोस्कैन से संबंधित मूल्यांकन, फार्मेसी, लिफ्ट सुविधा, प्रतीक्षा क्षेत्र, मरीज़ कक्ष और एचडीयू सहायता उपलब्ध है।"
      },
      {
        question: "Is FibroScan available at the hospital?",
        questionHi: "क्या अस्पताल में फाइब्रोस्कैन उपलब्ध है?",
        answer: "FibroScan-related assessment is available for selected liver care patients. Call reception to confirm timing and preparation before visiting.",
        answerHi: "चुनिंदा लिवर देखभाल मरीज़ों के लिए फाइब्रोस्कैन से संबंधित मूल्यांकन उपलब्ध है। आने से पहले समय और तैयारी की पुष्टि के लिए रिसेप्शन को कॉल करें।"
      },
      {
        question: "Are endoscopy and colonoscopy facilities available in-house?",
        questionHi: "क्या एंडोस्कोपी और कोलोनोस्कोपी सुविधाएं अस्पताल में ही उपलब्ध हैं?",
        answer: "Endoscopy and colonoscopy-related care is available at the hospital. The team can guide preparation, consent, timing and follow-up.",
        answerHi: "एंडोस्कोपी और कोलोनोस्कोपी से संबंधित देखभाल अस्पताल में उपलब्ध है। टीम तैयारी, सहमति, समय और फॉलो-अप के बारे में मार्गदर्शन कर सकती है।"
      },
      {
        question: "Can I see hospital photos before visiting?",
        questionHi: "क्या मैं आने से पहले अस्पताल की तस्वीरें देख सकता हूं?",
        answer: "Yes. The website gallery shows hospital areas such as reception, consultation spaces, endoscopy unit, patient rooms, pharmacy, HDU and equipment.",
        answerHi: "हां। वेबसाइट गैलरी में रिसेप्शन, परामर्श स्थान, एंडोस्कोपी यूनिट, मरीज़ कक्ष, फार्मेसी, एचडीयू और उपकरण जैसे अस्पताल के क्षेत्र दिखाए गए हैं।"
      },
      {
        question: "Should diabetic patients ask before fasting for a procedure?",
        questionHi: "क्या डायबिटीज़ के मरीज़ों को प्रक्रिया के लिए उपवास से पहले पूछना चाहिए?",
        answer: "Yes. Diabetic patients should ask for specific fasting and medicine instructions before endoscopy, colonoscopy, FibroScan or any planned procedure.",
        answerHi: "हां। डायबिटीज़ के मरीज़ों को एंडोस्कोपी, कोलोनोस्कोपी, फाइब्रोस्कैन या किसी भी नियोजित प्रक्रिया से पहले विशिष्ट उपवास और दवा निर्देश पूछने चाहिए।"
      },
      {
        question: "Should patients on blood thinners call before a procedure?",
        questionHi: "क्या ब्लड थिनर लेने वाले मरीज़ों को प्रक्रिया से पहले कॉल करना चाहिए?",
        answer: "Yes. Blood thinners must be discussed before endoscopy, colonoscopy, biopsy, polyp removal or ERCP planning. Do not stop them without medical advice.",
        answerHi: "हां। एंडोस्कोपी, कोलोनोस्कोपी, बायोप्सी, पॉलिप निकालने या ईआरसीपी योजना से पहले ब्लड थिनर के बारे में चर्चा करनी चाहिए। चिकित्सा सलाह के बिना इन्हें बंद न करें।"
      },
      {
        question: "Can I eat after endoscopy or colonoscopy?",
        questionHi: "क्या मैं एंडोस्कोपी या कोलोनोस्कोपी के बाद खा सकता हूं?",
        answer: "Eating after a procedure depends on the procedure type, sedation, findings and doctor advice. Follow the discharge instructions given by the care team.",
        answerHi: "प्रक्रिया के बाद खाना प्रक्रिया के प्रकार, सेडेशन, निष्कर्षों और डॉक्टर की सलाह पर निर्भर करता है। केयर टीम द्वारा दिए गए डिस्चार्ज निर्देशों का पालन करें।"
      },
      {
        question: "How can I get directions to the hospital?",
        questionHi: "मैं अस्पताल का रास्ता कैसे पा सकता हूं?",
        answer: "Use the Google Maps directions link on the website or call reception for help with the Shaheed Nagar location.",
        answerHi: "वेबसाइट पर गूगल मैप्स दिशा-निर्देश लिंक का उपयोग करें या शहीद नगर स्थान में मदद के लिए रिसेप्शन को कॉल करें।"
      }
    ]
  }
];

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: faqKeywords,
  alternates: { canonical: "/faqs" },
  openGraph: {
    title: pageFullTitle,
    description: pageDescription,
    url: pageUrl,
    siteName: site.name,
    type: "website",
    images: [{ url: "/mgm-logo.png", width: 1200, height: 630, alt: site.name }]
  },
  twitter: {
    card: "summary_large_image",
    title: pageFullTitle,
    description: pageDescription,
    images: ["/mgm-logo.png"]
  }
};

export default function FaqsPage() {
  const allFaqs = faqCategories.flatMap((category) => category.items);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageFullTitle,
        description: pageDescription,
        inLanguage: "en-IN",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${site.url}/#website`,
          name: site.name,
          url: site.url
        },
        publisher: { "@id": hospitalEntityId },
        about: [
          "Gastroenterology",
          "Hepatology",
          "Endoscopy",
          "Colonoscopy",
          "ERCP",
          "FibroScan",
          "Digestive disease care in Agra"
        ],
        specialty: ["Gastroenterology", "Hepatology", "Endoscopy"],
        primaryImageOfPage: `${site.url}/mgm-logo.png`,
        significantLink: relatedFaqLinks.map((link) => `${site.url}${link.href}`),
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["[data-speakable=\"faq\"]"]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        name: `Patient FAQs - ${site.name}`,
        url: pageUrl,
        isPartOf: { "@id": `${pageUrl}#webpage` },
        publisher: { "@id": hospitalEntityId },
        mainEntity: allFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer
          }
        }))
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#faq-categories`,
        name: "FAQ categories",
        itemListElement: faqCategories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.title,
          url: `${pageUrl}#${toAnchor(category.title)}`
        }))
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "FAQs", url: "/faqs" }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)]">
          <div>
            <p className="inline-lang mb-4 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <span data-en>Patient FAQs</span>
              <span data-hi lang="hi">मरीज़ों के सामान्य प्रश्न</span>
            </p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">
              <span data-en>Answers before your gastro or liver visit.</span>
              <span data-hi lang="hi">आपकी गैस्ट्रो या लिवर विज़िट से पहले जवाब।</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl" data-en>
              Common questions about OPD timing, consultation, endoscopy, colonoscopy, liver care, FibroScan, warning symptoms and visit preparation.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl" data-hi lang="hi">
              ओपीडी समय, परामर्श, एंडोस्कोपी, कोलोनोस्कोपी, लिवर देखभाल, फाइब्रोस्कैन, चेतावनी लक्षण और विज़िट तैयारी के बारे में सामान्य प्रश्न।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/portal#appointment" className="inline-lang inline-flex min-h-12 items-center justify-center gap-2 rounded border border-cyan-200/40 bg-white px-5 font-black text-ink shadow-[0_18px_42px_rgba(8,64,84,0.2)] transition hover:-translate-y-1 hover:text-brand-dark">
                <span data-en>Book appointment</span>
                <span data-hi lang="hi">अपॉइंटमेंट बुक करें</span> <ArrowRight size={18} />
              </Link>
              <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-lang inline-flex min-h-12 items-center justify-center gap-2 rounded border border-white/25 bg-white/12 px-5 font-black text-white shadow-[0_18px_42px_rgba(2,22,29,0.2)] backdrop-blur transition hover:-translate-y-1 hover:bg-white/18">
                <span data-en>Call reception</span>
                <span data-hi lang="hi">रिसेप्शन को कॉल करें</span> <Phone size={18} />
              </a>
            </div>
          </div>

          <div className="rounded border border-white/20 bg-white/12 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
            <p className="inline-lang text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <span data-en>Quick Topics</span>
              <span data-hi lang="hi">त्वरित विषय</span>
            </p>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
              {faqCategories.map(({ title, titleHi, icon: Icon }) => (
                <a key={title} href={`#${toAnchor(title)}`} className="flex min-h-16 items-center gap-3 rounded border border-white/14 bg-white/10 p-3 text-sm font-black text-white/88 transition hover:bg-white/16">
                  <Icon className="shrink-0 text-cyan-100" size={19} />
                  <span className="inline-lang">
                    <span data-en>{title}</span>
                    <span data-hi lang="hi">{titleHi}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section className="pt-0">
        <div className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
            <span data-en>Gastro & Liver Help Topics</span>
            <span data-hi lang="hi">गैस्ट्रो और लिवर सहायता विषय</span>
          </p>
          <h2 className="inline-lang mt-2 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">
            <span data-en>Find answers by symptom, test, procedure or visit plan.</span>
            <span data-hi lang="hi">लक्षण, जांच, प्रक्रिया या विज़िट योजना के अनुसार जवाब खोजें।</span>
          </h2>
          <p className="mt-4 max-w-4xl leading-7 text-muted" data-en>
            This FAQ page supports patients searching for gastroenterology, liver specialist care, endoscopy, colonoscopy, ERCP, FibroScan and warning symptom guidance in Agra. It is general information only; call reception for appointment timing, preparation instructions or urgent symptoms.
          </p>
          <p className="mt-4 max-w-4xl leading-7 text-muted" data-hi lang="hi">
            यह एफएक्यू पेज आगरा में गैस्ट्रोएंटरोलॉजी, लिवर विशेषज्ञ देखभाल, एंडोस्कोपी, कोलोनोस्कोपी, ईआरसीपी, फाइब्रोस्कैन और चेतावनी लक्षण मार्गदर्शन खोजने वाले मरीज़ों की मदद करता है। यह केवल सामान्य जानकारी है; अपॉइंटमेंट समय, तैयारी निर्देश या तत्काल लक्षणों के लिए रिसेप्शन को कॉल करें।
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {relatedFaqLinks.slice(0, 6).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-soft px-4 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand-dark"
              >
                {link.label} <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section muted className="pt-0">
        <SectionHead eyebrow="Questions" title="Browse by topic">
          <p data-en>These answers are for general patient guidance. For severe symptoms or procedure preparation, call reception before travelling.</p>
          <p data-hi lang="hi">ये जवाब सामान्य मरीज़ मार्गदर्शन के लिए हैं। गंभीर लक्षणों या प्रक्रिया की तैयारी के लिए, यात्रा से पहले रिसेप्शन को कॉल करें।</p>
        </SectionHead>
        <div className="grid gap-6">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
            <section key={category.title} id={toAnchor(category.title)} className="scroll-mt-32 rounded border border-line bg-white p-5 shadow-soft md:p-7">
              <div className="mb-5 flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-[#ecfeff] text-brand-dark">
                  <Icon size={22} />
                </span>
                <div>
                  <h2 className="inline-lang text-2xl font-black leading-tight text-ink md:text-3xl">
                    <span data-en>{category.title}</span>
                    <span data-hi lang="hi">{category.titleHi}</span>
                  </h2>
                  <p className="inline-lang mt-1 text-muted">
                    <span data-en>{category.summary}</span>
                    <span data-hi lang="hi">{category.summaryHi}</span>
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {category.items.map((faq) => (
                  <details key={faq.question} data-speakable="faq" className="group rounded border border-line bg-soft/45 p-4 transition open:bg-white open:shadow-sm">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-ink">
                      <span className="inline-lang">
                        <span data-en>{faq.question}</span>
                        <span data-hi lang="hi">{faq.questionHi}</span>
                      </span>
                      <ArrowRight size={18} className="mt-1 shrink-0 text-brand-dark transition group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 leading-7 text-muted" data-en>{faq.answer}</p>
                    <p className="mt-3 leading-7 text-muted" data-hi lang="hi">{faq.answerHi}</p>
                  </details>
                ))}
              </div>
            </section>
            );
          })}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Related Care" title="Useful next pages">
          <p data-en>Use these pages when a question points to a specific consultation, procedure or local care need.</p>
          <p data-hi lang="hi">जब कोई प्रश्न किसी विशिष्ट परामर्श, प्रक्रिया या स्थानीय देखभाल आवश्यकता की ओर इशारा करे, तो इन पेजों का उपयोग करें।</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-3">
          {relatedFaqLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex min-h-24 items-center justify-between gap-4 rounded border border-line bg-white p-5 text-lg font-black text-ink shadow-soft transition hover:-translate-y-1 hover:border-cyan-200 hover:text-brand-dark"
            >
              <span>{link.label}</span>
              <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={20} />
            </Link>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
              <span data-en>Still Need Help?</span>
              <span data-hi lang="hi">अभी भी मदद चाहिए?</span>
            </p>
            <h2 className="inline-lang mt-2 text-3xl font-black text-ink">
              <span data-en>Share symptoms and reports with reception.</span>
              <span data-hi lang="hi">लक्षण और रिपोर्ट रिसेप्शन के साथ साझा करें।</span>
            </h2>
            <p className="mt-3 max-w-3xl text-muted" data-en>
              The team can guide appointment timing, preparation and whether you should call before visiting for urgent symptoms.
            </p>
            <p className="mt-3 max-w-3xl text-muted" data-hi lang="hi">
              टीम अपॉइंटमेंट समय, तैयारी और तत्काल लक्षणों के लिए आने से पहले कॉल करना चाहिए या नहीं, इसके बारे में मार्गदर्शन कर सकती है।
            </p>
          </div>
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>
    </main>
  );
}

function toAnchor(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
