/**
 * Shared procedure-category classification + structured pre-visit prep
 * checklist, reused by the public procedure page and the downloadable/
 * WhatsApp-shareable prep PDF (one source of truth for both).
 *
 * Deliberately conservative, hedge-worded guidance matching the tone already
 * shipped in this page's "How To Prepare" section — logistics reminders
 * (fasting window, escort, medicines) rather than novel precise clinical
 * facts (exact drug/dose timing) this codebase isn't positioned to assert.
 * Every item defers specifics to "your doctor" or "the hospital team."
 */

export const diseaseSlugs = new Set([
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

export const ercpLikeSlugs = new Set(["ercp", "cbd-stone-removal", "pancreatic-duct-stone-removal", "bile-duct-stenting"]);

export const colonLikeSlugs = new Set(["colonoscopy", "polypectomy", "colon-polyp-removal", "ibd-colitis", "colon-polyps", "ibs", "chronic-constipation", "chronic-diarrhea"]);

export const liverLikeSlugs = new Set(["fibroscan", "fatty-liver", "liver-cirrhosis", "liver-fibrosis", "varices", "ascites", "ascitic-fluid-tapping"]);

export type PrepChecklistItem = {
  timing: string;
  timingHi: string;
  instruction: string;
  instructionHi: string;
};

export function getPrepChecklist(slug: string): PrepChecklistItem[] {
  const isDisease = diseaseSlugs.has(slug);
  const isErcpLike = ercpLikeSlugs.has(slug);
  const isColonLike = colonLikeSlugs.has(slug);
  const isLiverLike = liverLikeSlugs.has(slug);

  if (isDisease) {
    return [
      {
        timing: "Before your visit",
        timingHi: "आपकी विज़िट से पहले",
        instruction: "Gather previous prescriptions, blood reports, ultrasound/CT/MRCP reports and any endoscopy or colonoscopy reports.",
        instructionHi: "पिछले पर्चे, ब्लड रिपोर्ट, अल्ट्रासाउंड/सीटी/एमआरसीपी रिपोर्ट और कोई भी एंडोस्कोपी या कोलोनोस्कोपी रिपोर्ट इकट्ठा करें।"
      },
      {
        timing: "Before your visit",
        timingHi: "आपकी विज़िट से पहले",
        instruction: "Write down your current medicines, allergies, and any blood thinner use (aspirin, clopidogrel, warfarin) — do not stop any medicine on your own.",
        instructionHi: "अपनी वर्तमान दवाओं, एलर्जी और किसी भी ब्लड थिनर (एस्पिरिन, क्लोपिडोग्रेल, वारफारिन) के उपयोग को लिख लें — स्वयं कोई दवा बंद न करें।"
      },
      {
        timing: "Day of your visit",
        timingHi: "आपकी विज़िट के दिन",
        instruction: "Note your symptoms, how long you've had them, and anything that seems to trigger or ease them.",
        instructionHi: "अपने लक्षणों, वे कब से हैं, और किसी भी ऐसी चीज़ को नोट करें जो उन्हें बढ़ाती या कम करती लगती हो।"
      },
      {
        timing: "If urgent",
        timingHi: "यदि तत्काल आवश्यकता हो",
        instruction: "For vomiting blood, black stool, severe pain or jaundice with fever, call reception before travelling.",
        instructionHi: "खून की उल्टी, काला मल, गंभीर दर्द या बुखार के साथ पीलिया के लिए, यात्रा से पहले रिसेप्शन को कॉल करें।"
      }
    ];
  }

  const fastingItem = isColonLike
    ? {
        timing: "The evening before",
        timingHi: "पिछली शाम",
        instruction: "Follow the bowel-cleansing (laxative) course and clear-liquid diet exactly as timed by the hospital team; avoid red or purple colored liquids.",
        instructionHi: "अस्पताल की टीम द्वारा बताए गए समय पर आंत्र-सफाई (लैक्सेटिव) कोर्स और स्पष्ट तरल आहार का पालन करें; लाल या बैंगनी रंग के तरल पदार्थों से बचें।"
      }
    : {
        timing: "The evening before",
        timingHi: "पिछली शाम",
        instruction: "Fasting is usually needed for 6–8 hours before the procedure, but confirm the exact timing with the hospital team.",
        instructionHi: "प्रक्रिया से पहले आमतौर पर 6–8 घंटे के उपवास की आवश्यकता होती है, लेकिन सटीक समय की पुष्टि अस्पताल की टीम से करें।"
      };

  return [
    {
      timing: "A few days before",
      timingHi: "कुछ दिन पहले",
      instruction: "Tell the team about diabetes, high BP, heart or kidney disease, pregnancy, allergies, or any previous anesthesia problems.",
      instructionHi: "टीम को डायबिटीज़, हाई बीपी, हृदय या किडनी रोग, गर्भावस्था, एलर्जी, या पिछली किसी एनेस्थीसिया समस्या के बारे में बताएं।"
    },
    {
      timing: "A few days before",
      timingHi: "कुछ दिन पहले",
      instruction: isErcpLike
        ? "Discuss aspirin, clopidogrel, warfarin, apixaban, rivaroxaban or any other blood thinner with the doctor well in advance — some may need to be paused under medical guidance."
        : "Tell the doctor about aspirin, clopidogrel, warfarin or any other blood thinner you take.",
      instructionHi: isErcpLike
        ? "एस्पिरिन, क्लोपिडोग्रेल, वारफारिन, एपिक्साबान, रिवारोक्साबान या किसी अन्य ब्लड थिनर के बारे में डॉक्टर से पहले ही चर्चा करें — चिकित्सीय मार्गदर्शन में कुछ को रोकने की आवश्यकता हो सकती है।"
        : "डॉक्टर को एस्पिरिन, क्लोपिडोग्रेल, वारफारिन या किसी अन्य ब्लड थिनर के बारे में बताएं।"
    },
    fastingItem,
    {
      timing: "Day of your procedure",
      timingHi: "आपकी प्रक्रिया के दिन",
      instruction: isLiverLike
        ? "No special fasting is usually needed for a liver scan, but confirm with the team and wear comfortable clothing."
        : "Bring previous reports, arrive with time to spare, and come with an adult attendant if sedation is planned.",
      instructionHi: isLiverLike
        ? "लिवर स्कैन के लिए आमतौर पर विशेष उपवास की आवश्यकता नहीं होती, लेकिन टीम से पुष्टि करें और आरामदायक कपड़े पहनें।"
        : "पिछली रिपोर्ट साथ लाएं, समय से पहले पहुंचें, और यदि सेडेशन की योजना है तो किसी वयस्क परिजन के साथ आएं।"
    },
    {
      timing: "After your procedure",
      timingHi: "आपकी प्रक्रिया के बाद",
      instruction: "If sedation was given, avoid driving, alcohol or important decisions for the rest of the day — arrange a ride home.",
      instructionHi: "यदि सेडेशन दिया गया है, तो दिन के बाकी समय ड्राइविंग, शराब या महत्वपूर्ण निर्णयों से बचें — घर जाने के लिए सवारी की व्यवस्था करें।"
    }
  ];
}
