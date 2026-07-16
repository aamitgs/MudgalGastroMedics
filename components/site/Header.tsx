"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { opdWindows, site } from "@/lib/site-data";
import { ButtonLink } from "@/components/site/ButtonLink";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { LiveClockWeather } from "@/components/site/LiveClockWeather";

const navItems = [
  { href: "/", label: "Home" },
  {
    href: "/about",
    label: "About Us",
    children: [
      { href: "/about", label: "About MGM" },
      { href: "/dr-deepak-kumar-sharma-gastroenterologist-agra", label: "Doctor Profile" },
      { href: "/duty-doctor", label: "Duty Doctor" },
      { href: "/#procedures", label: "Treatments" },
      { href: "/about#why-choose", label: "Why Choose Us" },
      { href: "/gallery", label: "Our Facilities" },
      { href: "/patient-rights-responsibilities", label: "Patient Rights" },
      { href: "/portal#appointment", label: "Book Appointment" }
    ]
  },
  {
    href: "/gallery",
    label: "Facilities",
    children: [
      { href: "/gallery#hospital-gallery", label: "Hospital Gallery" },
      { href: "/gallery#reception", label: "Reception & Waiting Area" },
      { href: "/gallery#consultation-areas", label: "OPD Consultation Rooms" },
      { href: "/gallery#endoscopy-unit", label: "Endoscopy Unit" },
      { href: "/gallery#ercp-setup", label: "ERCP Setup" },
      { href: "/gallery#hdu", label: "HDU & Day Care" },
      { href: "/gallery#patient-rooms", label: "Patient Rooms" },
      { href: "/gallery#pharmacy", label: "Pharmacy" },
      { href: "/gallery#equipment", label: "Equipment" },
      { href: "/gallery#accessibility", label: "Accessibility Facilities" }
    ]
  },
  {
    href: "/services",
    label: "Services",
    children: [
      { href: "/services", label: "All Services" },
      { href: "/services/gastroenterology", label: "Gastroenterology" },
      { href: "/services/hepatology-liver-care", label: "Hepatology / Liver Care" },
      { href: "/services/liver-clinic", label: "Liver Clinic" },
      { href: "/services/advanced-endoscopy-centre", label: "Advanced Endoscopy Centre" },
      { href: "/services/diagnostic-services", label: "Diagnostic Services" },
      { href: "/services/endoscopy-services", label: "Endoscopy Services" },
      { href: "/services/colonoscopy-services", label: "Colonoscopy Services" },
      { href: "/services/ercp-bile-duct-care", label: "ERCP & Bile Duct Care" },
      { href: "/services/fibroscan-fatty-liver-assessment", label: "FibroScan & Fatty Liver Assessment" },
      { href: "/services/gi-bleeding-emergency-gastro-care", label: "GI Bleeding & Emergency Gastro Care" },
      { href: "/services/pancreas-biliary-clinic", label: "Pancreas & Biliary Clinic" },
      { href: "/services/ibs-constipation-bowel-disorder-clinic", label: "IBS, Constipation & Bowel Disorder Clinic" },
      { href: "/services/acidity-gerd-ulcer-clinic", label: "Acidity, GERD & Ulcer Clinic" },
      { href: "/services/preventive-health-check-up", label: "Preventive Health Check-up" },
      { href: "/services/gi-cancer-screening-polyp-clinic", label: "GI Cancer Screening & Polyp Clinic" },
      { href: "/services/medical-weight-management", label: "Medical Weight Management" }
    ]
  },
  {
    href: "/#procedures",
    label: "Special Procedures",
    children: [
      { href: "/procedures/endoscopy", label: "Endoscopy" },
      { href: "/procedures/colonoscopy", label: "Colonoscopy" },
      { href: "/procedures/enteroscopy", label: "Enteroscopy" },
      { href: "/procedures/ercp", label: "ERCP" },
      { href: "/procedures/fibroscan", label: "Fibroscan" },
      { href: "/procedures/cbd-stone-removal", label: "CBD Stone Removal" },
      { href: "/procedures/polypectomy", label: "Polypectomy" },
      { href: "/procedures/variceal-banding", label: "Variceal Banding" },
      { href: "/procedures/stricture-dilation", label: "Stricture Dilation" },
      { href: "/procedures/gi-stenting", label: "GI Stenting" },
      { href: "/procedures/peg-tube-placement", label: "PEG Tube Placement" },
      { href: "/procedures/ascitic-fluid-tapping", label: "Ascitic Fluid Tapping" }
    ]
  },
  {
    href: "/#procedures",
    label: "GI Diseases",
    children: [
      { href: "/procedures/gastrointestinal-bleeding-management", label: "GI Bleeding" },
      { href: "/procedures/varices", label: "Varices" },
      { href: "/procedures/liver-cirrhosis", label: "Liver Cirrhosis" },
      { href: "/procedures/fatty-liver", label: "Fatty Liver" },
      { href: "/procedures/liver-fibrosis", label: "Liver Fibrosis" },
      { href: "/procedures/obstructive-jaundice", label: "Obstructive Jaundice" },
      { href: "/procedures/cbd-stone-removal", label: "CBD Stone" },
      { href: "/procedures/bile-duct-stricture", label: "Bile Duct Stricture" },
      { href: "/procedures/pancreatic-disorders", label: "Pancreatic Disorders" },
      { href: "/procedures/pancreatic-duct-stone-removal", label: "Pancreatic Duct Stone" },
      { href: "/procedures/acidity-gerd", label: "Acidity & GERD" },
      { href: "/procedures/peptic-ulcer-disease", label: "Peptic Ulcer Disease" },
      { href: "/procedures/difficulty-swallowing", label: "Difficulty Swallowing" },
      { href: "/procedures/gi-stricture", label: "GI Stricture" },
      { href: "/procedures/colon-polyps", label: "Colon Polyps" },
      { href: "/procedures/ibd-colitis", label: "IBD / Colitis" },
      { href: "/procedures/ibs", label: "IBS" },
      { href: "/procedures/chronic-constipation", label: "Chronic Constipation" },
      { href: "/procedures/chronic-diarrhea", label: "Chronic Diarrhea" },
      { href: "/procedures/ascites", label: "Ascites" }
    ]
  },
  {
    href: "/portal#appointment",
    label: "Symptoms",
    children: [
      { href: "/services/gastroenterology", label: "Abdominal Pain" },
      { href: "/procedures/acidity-gerd", label: "Acidity / Reflux" },
      { href: "/procedures/obstructive-jaundice", label: "Jaundice" },
      { href: "/procedures/gastrointestinal-bleeding-management", label: "Blood in Stool" },
      { href: "/procedures/gastrointestinal-bleeding-management", label: "Vomiting Blood" },
      { href: "/procedures/gastrointestinal-bleeding-management", label: "Black Stools" },
      { href: "/procedures/chronic-diarrhea", label: "Severe Diarrhea" },
      { href: "/services/gastroenterology", label: "Persistent Vomiting" },
      { href: "/procedures/difficulty-swallowing", label: "Difficulty Swallowing" },
      { href: "/services/diagnostic-services", label: "Unexplained Weight Loss" },
      { href: "/procedures/ascites", label: "Abdominal Swelling" },
      { href: "/procedures/liver-cirrhosis", label: "Liver Cirrhosis Symptoms" },
      { href: "/procedures/chronic-constipation", label: "Severe Constipation" },
      { href: "/procedures/pancreatic-disorders", label: "Pancreatic Pain" }
    ]
  },
  { href: "/life-at-mgm", label: "Life@MGM" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" }
] satisfies Array<{
  href: string;
  label: string;
  children?: Array<{ href: string; label: string }>;
}>;

/** Hindi nav labels shown when the language toggle is on; entries without one stay English. */
const navHindi: Record<string, string> = {
  "Home": "होम",
  "About Us": "हमारे बारे में",
  "Facilities": "सुविधाएँ",
  "Services": "सेवाएँ",
  "All Services": "सभी सेवाएँ",
  "Gastroenterology": "गैस्ट्रोएंटरोलॉजी",
  "Hepatology / Liver Care": "हेपेटोलॉजी / लिवर केयर",
  "Liver Clinic": "लिवर क्लिनिक",
  "Advanced Endoscopy Centre": "एडवांस्ड एंडोस्कोपी सेंटर",
  "Diagnostic Services": "डायग्नोस्टिक सेवाएँ",
  "Endoscopy Services": "एंडोस्कोपी सेवाएँ",
  "Colonoscopy Services": "कोलोनोस्कोपी सेवाएँ",
  "ERCP & Bile Duct Care": "ईआरसीपी और बाइल डक्ट केयर",
  "FibroScan & Fatty Liver Assessment": "फाइब्रोस्कैन और फैटी लिवर आकलन",
  "GI Bleeding & Emergency Gastro Care": "जीआई ब्लीडिंग और इमरजेंसी गैस्ट्रो केयर",
  "Pancreas & Biliary Clinic": "पैंक्रियास और बाइलरी क्लिनिक",
  "IBS, Constipation & Bowel Disorder Clinic": "आईबीएस, कब्ज और बाउल क्लिनिक",
  "Acidity, GERD & Ulcer Clinic": "एसिडिटी, जीईआरडी और अल्सर क्लिनिक",
  "GI Cancer Screening & Polyp Clinic": "जीआई कैंसर स्क्रीनिंग और पॉलीप क्लिनिक",
  "Preventive Health Check-up": "प्रीवेंटिव हेल्थ चेक-अप",
  "Medical Weight Management": "मेडिकल वेट मैनेजमेंट",
  "Hospital Gallery": "हॉस्पिटल गैलरी",
  "Reception & Waiting Area": "रिसेप्शन और वेटिंग एरिया",
  "OPD Consultation Rooms": "ओपीडी कंसल्टेशन रूम",
  "Endoscopy Unit": "एंडोस्कोपी यूनिट",
  "ERCP Setup": "ईआरसीपी सेटअप",
  "HDU & Day Care": "एचडीयू और डे केयर",
  "Patient Rooms": "मरीज कक्ष",
  "Pharmacy": "फार्मेसी",
  "Equipment": "उपकरण",
  "Accessibility Facilities": "सुगम्यता सुविधाएँ",
  "Special Procedures": "विशेष प्रक्रियाएँ",
  "GI Diseases": "जीआई रोग",
  "Symptoms": "लक्षण",
  "Blog": "ब्लॉग",
  "Contact Us": "संपर्क करें",
  "About MGM": "एमजीएम के बारे में",
  "Abdominal Pain": "पेट दर्द",
  "Acidity / Reflux": "एसिडिटी / रिफ्लक्स",
  "Jaundice": "पीलिया",
  "Blood in Stool": "मल में खून",
  "Vomiting Blood": "खून की उल्टी",
  "Black Stools": "काला मल",
  "Severe Diarrhea": "गंभीर दस्त",
  "Persistent Vomiting": "लगातार उल्टी",
  "Difficulty Swallowing": "निगलने में दिक्कत",
  "Unexplained Weight Loss": "बिना कारण वजन घटना",
  "Abdominal Swelling": "पेट में सूजन",
  "Liver Cirrhosis Symptoms": "लिवर सिरोसिस के लक्षण",
  "Severe Constipation": "गंभीर कब्ज",
  "Pancreatic Pain": "पैंक्रियास दर्द",
  "Endoscopy": "एंडोस्कोपी",
  "Colonoscopy": "कोलोनोस्कोपी",
  "Enteroscopy": "एंटेरोस्कोपी",
  "ERCP": "ईआरसीपी",
  "Fibroscan": "फाइब्रोस्कैन",
  "CBD Stone Removal": "सीबीडी स्टोन रिमूवल",
  "Polypectomy": "पॉलीपेक्टॉमी",
  "Variceal Banding": "वेरिसियल बैंडिंग",
  "Stricture Dilation": "स्ट्रिक्चर डाइलेशन",
  "GI Stenting": "जीआई स्टेंटिंग",
  "PEG Tube Placement": "पीईजी ट्यूब प्लेसमेंट",
  "Ascitic Fluid Tapping": "एसाइटिक फ्लूइड टैपिंग",
  "GI Bleeding": "जीआई ब्लीडिंग",
  "Varices": "वेरिसेस",
  "Liver Cirrhosis": "लिवर सिरोसिस",
  "Fatty Liver": "फैटी लिवर",
  "Liver Fibrosis": "लिवर फाइब्रोसिस",
  "Obstructive Jaundice": "अवरोधक पीलिया",
  "CBD Stone": "सीबीडी स्टोन",
  "Bile Duct Stricture": "बाइल डक्ट सिकुड़न",
  "Pancreatic Disorders": "पैंक्रियास रोग",
  "Pancreatic Duct Stone": "पैंक्रियाटिक डक्ट स्टोन",
  "Acidity & GERD": "एसिडिटी और जीईआरडी",
  "Peptic Ulcer Disease": "पेप्टिक अल्सर रोग",
  "GI Stricture": "जीआई सिकुड़न",
  "Colon Polyps": "कोलन पॉलीप्स",
  "IBD / Colitis": "आईबीडी / कोलाइटिस",
  "IBS": "आईबीएस",
  "Chronic Constipation": "लंबे समय की कब्ज",
  "Chronic Diarrhea": "लंबे समय के दस्त",
  "Ascites": "पेट में पानी",
  "Doctor Profile": "डॉक्टर प्रोफ़ाइल",
  "Duty Doctor": "ड्यूटी डॉक्टर",
  "Treatments": "उपचार",
  "Why Choose Us": "हमें क्यों चुनें",
  "Our Facilities": "हमारी सुविधाएँ",
  "Patient Rights": "मरीज अधिकार",
  "Book Appointment": "बुक करें"
};

function NavLabel({ label }: { label: string }) {
  const hindi = navHindi[label];
  if (!hindi) return <>{label}</>;
  return (
    <>
      <span data-en>{label}</span>
      <span data-hi lang="hi">{hindi}</span>
    </>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <section aria-label="Hospital contact details" className="border-b border-line bg-ink text-sm text-white">
        <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-col justify-between gap-2 py-2 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-cyan-200">
              <Phone size={15} /> {site.mobile}
            </a>
            <a href={`https://wa.me/${site.whatsapp}`} className="inline-flex items-center gap-1.5 hover:text-cyan-200">
              WhatsApp {site.mobile}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/75">
            <LiveClockWeather variant="site" />
            <span className="inline-flex items-center gap-1.5"><Clock size={15} /> OPD: Mon-Sat, {opdWindows[0].startLabel}-{opdWindows[0].endLabel} & {opdWindows[1].startLabel}-{opdWindows[1].endLabel}. Sun closed</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><MapPin size={15} /> Shaheed Nagar, Agra</span>
          </div>
        </div>
      </section>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 text-ink shadow-[0_12px_28px_rgba(20,36,43,0.08)] backdrop-blur">
        <div className="mx-auto flex min-h-[88px] w-[min(1620px,calc(100%-40px))] items-center gap-4 2xl:gap-5">
          <Link href="/" className="shrink-0 rounded bg-white p-1.5" aria-label="Mudgal Gastromedics Hospital home">
            <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} priority className="rounded" style={{ width: "168px", height: "auto" }} />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 font-semibold tracking-normal text-ink min-[1280px]:flex xl:gap-4 2xl:gap-5">
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 whitespace-nowrap py-8 text-[13px] font-semibold transition hover:text-[#19c7f3] xl:text-[14px] 2xl:text-[15px]"
                >
                  <NavLabel label={item.label} />
                  {item.children?.length ? <ChevronDown size={15} strokeWidth={3} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="invisible absolute left-0 top-full max-h-[70vh] min-w-64 translate-y-2 overflow-y-auto rounded border border-line bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} className="block rounded px-4 py-2.5 text-[13px] font-semibold text-ink/78 hover:bg-soft hover:text-brand xl:text-[14px]">
                        <NavLabel label={child.label} />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LanguageToggle compact className="h-12 min-w-[98px] rounded px-4 text-[15px] xl:h-[52px] xl:min-w-[108px]" />
            <ButtonLink href="/portal#appointment" className="hidden min-w-[144px] whitespace-nowrap border-coral bg-coral px-3.5 text-[13px] hover:bg-brand-dark md:inline-flex xl:min-w-[156px] xl:text-sm">
              <span data-en>Book Appointment</span>
              <span data-hi lang="hi">बुक करें</span>
            </ButtonLink>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded border border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_10px_24px_rgba(8,64,84,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:text-brand focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 min-[1280px]:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
        {open ? (
          <motion.nav
            className="grid max-h-[calc(100vh-88px)] gap-1 overflow-y-auto border-t border-line bg-white px-5 py-4 font-extrabold text-ink shadow-soft min-[1280px]:hidden"
            initial={reducedMotion ? false : { opacity: 0, y: -8 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`}>
                <Link href={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded px-2 py-3 hover:bg-soft">
                  <NavLabel label={item.label} />
                  {item.children?.length ? <ChevronDown size={18} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="ml-3 grid border-l border-line pl-3">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm text-ink/70 hover:bg-soft hover:text-brand">
                        <NavLabel label={child.label} />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <ButtonLink href="/portal#appointment" className="mt-2">
              Book Appointment
            </ButtonLink>
          </motion.nav>
        ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
