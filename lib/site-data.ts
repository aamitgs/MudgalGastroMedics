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
  email: "mudgalreception@gmail.com",
  emailAlt: "mudgalgastromedics@gmail.com",
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

export const localServiceAreas = [
  "Agra",
  "Fatehpur Sikri",
  "Mathura",
  "Firozabad",
  "Etmadpur",
  "Tundla",
  "Bharatpur",
  "Dholpur",
  "Mainpuri",
  "Hathras",
  "Aligarh"
];

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
    slug: "gi-stenting",
    title: "GI Stenting",
    hiTitle: "जीआई स्टेंटिंग",
    summary: "Stent placement for selected GI blockages, strictures, bile duct obstruction, and palliative care needs.",
    hiSummary: "जीआई रुकावट, स्ट्रिक्चर और पित्त नली अवरोध में स्टेंटिंग।"
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
  }
];

export const galleryItems = [
  ["Hospital Exterior", "Hospital Front View", "hospital-front-view", "/images/hospital/hospital-front-view.jpg"],
  ["Hospital Exterior", "Entrance", "entrance", "/images/hospital/entrance.jpg"],
  ["Reception", "Reception Desk", "reception-desk", "/images/hospital/reception-desk.jpg"],
  ["Reception", "Waiting Area", "reception-waiting-area", "/images/hospital/reception-waiting-area.jpg"],
  ["Consultation Areas", "Doctor Chamber", "doctor-chamber", "/images/hospital/doctor-chamber.jpg"],
  ["Endoscopy Unit", "Endoscopy Room", "endoscopy-room", "/images/hospital/endoscopy-room.jpg"],
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
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
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
