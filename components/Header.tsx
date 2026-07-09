"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { site } from "@/lib/site-data";
import { ButtonLink } from "@/components/ButtonLink";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LiveClockWeather } from "@/components/LiveClockWeather";

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
      { href: "/contact#appointment", label: "Book Appointment" }
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
      { href: "/procedures/ascites", label: "Ascites" }
    ]
  },
  {
    href: "/contact#appointment",
    label: "Symptoms",
    children: [
      { href: "/contact#appointment", label: "Abdominal Pain" },
      { href: "/contact#appointment", label: "Acidity / Reflux" },
      { href: "/contact#appointment", label: "Jaundice" },
      { href: "/contact#appointment", label: "Blood in Stool" },
      { href: "/contact#appointment", label: "Vomiting Blood" },
      { href: "/contact#appointment", label: "Black Stools" },
      { href: "/contact#appointment", label: "Severe Diarrhea" },
      { href: "/contact#appointment", label: "Persistent Vomiting" },
      { href: "/contact#appointment", label: "Difficulty Swallowing" },
      { href: "/contact#appointment", label: "Unexplained Weight Loss" },
      { href: "/contact#appointment", label: "Abdominal Swelling" },
      { href: "/contact#appointment", label: "Liver Cirrhosis Symptoms" },
      { href: "/contact#appointment", label: "Severe Constipation" },
      { href: "/contact#appointment", label: "Pancreatic Pain" }
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
            <span className="inline-flex items-center gap-1.5"><Clock size={15} /> OPD: Mon-Sat, 11 AM-6 PM</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><MapPin size={15} /> Shaheed Nagar, Agra</span>
          </div>
        </div>
      </section>

      <header className="sticky top-0 z-40 border-b border-line bg-white/95 text-ink shadow-[0_12px_28px_rgba(20,36,43,0.08)] backdrop-blur">
        <div className="mx-auto flex min-h-[96px] w-[min(1620px,calc(100%-40px))] items-center gap-5 2xl:gap-7">
          <Link href="/" className="shrink-0 rounded bg-white p-1.5" aria-label="Mudgal Gastromedics Hospital home">
            <Image src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" width={260} height={96} priority className="rounded" style={{ width: "168px", height: "auto" }} />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 font-semibold tracking-normal text-ink min-[1280px]:flex xl:gap-5 2xl:gap-6">
            {navItems.map((item) => (
              <div key={`${item.href}-${item.label}`} className="group relative">
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap py-9 text-[15px] font-semibold transition hover:text-[#19c7f3] xl:text-[16px] 2xl:text-[17px] ${item.label === "Home" ? "text-[#19c7f3]" : ""}`}
                >
                  <NavLabel label={item.label} />
                  {item.children?.length ? <ChevronDown size={17} strokeWidth={3} /> : null}
                </Link>
                {item.children?.length ? (
                  <div className="invisible absolute left-0 top-full max-h-[70vh] min-w-64 translate-y-2 overflow-y-auto rounded border border-line bg-white p-2.5 opacity-0 shadow-soft transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href + child.label} href={child.href} className="block rounded px-4 py-3 text-[15px] font-semibold text-ink/80 hover:bg-soft hover:text-brand">
                        <NavLabel label={child.label} />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <ButtonLink href="/portal#book" className="hidden min-w-[176px] whitespace-nowrap border-coral bg-coral px-5 text-base hover:bg-brand-dark md:inline-flex">
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
                <Link href={item.href} onClick={() => setOpen(false)} className={`flex items-center justify-between rounded px-2 py-3 hover:bg-soft ${item.label === "Home" ? "text-brand" : ""}`}>
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
            <ButtonLink href="/contact#appointment" className="mt-2">
              Book Appointment
            </ButtonLink>
          </motion.nav>
        ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}
