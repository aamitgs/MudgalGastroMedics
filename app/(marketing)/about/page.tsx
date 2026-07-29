import type { Metadata } from "next";
import {
  Activity,
  HeartHandshake,
  Lightbulb,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users
} from "lucide-react";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { agraLocalAreas, nearbyServiceCities, site } from "@/lib/site-data";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About", url: "/about" }
  ])
};

export const metadata: Metadata = {
  title: "About Mudgal Gastromedics Hospital",
  description:
    "About Mudgal Gastromedics Hospital, a super-speciality centre in Agra for gastroenterology, liver care, digestive health and advanced therapeutic endoscopy.",
  alternates: { canonical: "/about" }
};

const missionCommitments = [
  "Delivering accurate diagnosis and personalized treatment for gastrointestinal, liver, pancreatic, and biliary disorders.",
  "Providing advanced diagnostic and therapeutic endoscopic procedures using modern technology.",
  "Promoting preventive healthcare through patient education, early detection, and regular screening.",
  "Maintaining the highest standards of patient safety, infection control, and clinical excellence.",
  "Offering ethical, transparent, and compassionate healthcare for every patient.",
  "Continuously upgrading our medical knowledge, technology, and healthcare services.",
  "Making specialized gastroenterology and liver care accessible and affordable for patients across the region."
];

const coreValues = [
  {
    title: "Compassion",
    description:
      "We treat every patient with empathy, dignity, and respect, ensuring personalized care throughout their healthcare journey.",
    icon: HeartHandshake
  },
  {
    title: "Patient First",
    description:
      "Every treatment decision is made with the patient's health, comfort, safety, and long-term well-being as our highest priority.",
    icon: Stethoscope
  },
  {
    title: "Clinical Excellence",
    description:
      "We are committed to providing evidence-based healthcare through continuous learning, advanced technology, and internationally accepted medical standards.",
    icon: Sparkles
  },
  {
    title: "Integrity",
    description:
      "We practice medicine with honesty, transparency, confidentiality, and the highest ethical standards, building lasting trust with our patients.",
    icon: ShieldCheck
  },
  {
    title: "Safety & Quality",
    description:
      "Patient safety is our highest priority. We follow strict infection-control protocols, maintain modern clinical standards, and continuously improve the quality of our healthcare services.",
    icon: ShieldCheck
  },
  {
    title: "Innovation",
    description:
      "We embrace modern diagnostic techniques and minimally invasive therapeutic procedures to provide safer treatments, faster recovery, and better clinical outcomes.",
    icon: Lightbulb
  },
  {
    title: "Teamwork",
    description:
      "Our doctors, nurses, technicians, and support staff work together to deliver coordinated, efficient, and compassionate healthcare.",
    icon: Users
  },
  {
    title: "Community Commitment",
    description:
      "We believe healthcare extends beyond hospital walls. Through health awareness, preventive screenings, and patient education, we strive to build a healthier community.",
    icon: Users
  }
];

const careAreas = [
  {
    title: "Liver Diseases",
    items: ["Fatty Liver Disease", "Metabolic Liver Disease", "Genetic Liver Disorders", "Hepatitis A, B & C", "Liver Cirrhosis", "Liver Failure", "Liver Cancer", "Hemochromatosis", "Portal Hypertension"]
  },
  {
    title: "Esophageal & Stomach Disorders",
    items: ["GERD / Acid Reflux", "Gastritis", "Peptic Ulcer Disease", "Esophagitis", "Esophageal Stricture", "Difficulty Swallowing", "H. pylori Infection"]
  },
  {
    title: "Intestinal Disorders",
    items: ["Irritable Bowel Syndrome", "Inflammatory Bowel Disease", "Ulcerative Colitis", "Crohn's Disease", "Chronic Constipation", "Chronic Diarrhea", "Enteritis", "Colon Polyps"]
  },
  {
    title: "Pancreatic & Gallbladder Disorders",
    items: ["Pancreatitis", "Gallstones", "Biliary Disorders", "Gallbladder Diseases", "Pancreatic Disorders"]
  }
];

const diagnostics = [
  "Upper GI Endoscopy",
  "Colonoscopy",
  "FibroScan",
  "Liver Biopsy",
  "Liver Function Assessment",
  "Liver Function Tests",
  "Gastrointestinal Cancer Screening",
  "Colon Cancer Screening",
  "Gastric Cancer Screening",
  "Esophageal Cancer Screening",
  "Pancreatic Disease Evaluation",
  "Gallbladder Disease Evaluation",
  "Medical Weight Assessment",
  "Digestive Health Check-up",
  "Executive GI Health Check-up"
];

const therapeuticProcedures = [
  "ERCP",
  "Argon Plasma Coagulation (APC)",
  "Variceal Band Ligation",
  "Endoscopic Hemostasis",
  "Foreign Body Removal",
  "Enteral Stent Placement",
  "PEG Tube Placement",
  "Endoscopic Dilatation of Esophageal Strictures",
  "Endoscopic Management of Gastrointestinal Bleeding",
  "Endoscopic Removal of Gastrointestinal Polyps",
  "Biliary Stone Removal",
  "Biliary & Pancreatic Stenting"
];

const whyChoose = [
  {
    title: "Specialized Expertise",
    description: "Focused care for diseases of the digestive system, liver, pancreas, and biliary tract."
  },
  {
    title: "Advanced Technology",
    description:
      "Modern diagnostic and therapeutic equipment designed to support accurate diagnosis and minimally invasive treatment."
  },
  {
    title: "Personalized Care",
    description:
      "Every patient receives an individualized treatment plan based on their medical condition, health history, lifestyle, and long-term wellness goals."
  },
  {
    title: "Experienced Leadership",
    description:
      "Under the guidance of Dr. Deepak Kumar Sharma, patients receive expert care backed by advanced training and clinical experience in gastroenterology and hepatology."
  },
  {
    title: "Ethical & Transparent Healthcare",
    description:
      "We believe in clear communication, evidence-based medicine, informed decision-making, and compassionate patient care."
  },
  {
    title: "Patient Safety",
    description:
      "Our hospital follows stringent infection-control practices, quality assurance protocols, and accepted standards of patient safety."
  }
];

export default function AboutPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
              <span data-en>About {site.name}</span>
              <span data-hi lang="hi">{site.name} के बारे में</span>
            </p>
            <h1 className="inline-lang max-w-4xl break-words text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
              <span data-en>Advanced Gastroenterology, Liver Care & Therapeutic Endoscopy in Agra</span>
              <span data-hi lang="hi">आगरा में उन्नत गैस्ट्रोएंटरोलॉजी, लिवर केयर और चिकित्सीय एंडोस्कोपी।</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>
              Prevention, diagnosis, and treatment for diseases affecting the digestive system, liver, pancreas, gallbladder, and gastrointestinal tract.
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">
              पाचन तंत्र, लिवर, अग्न्याशय, पित्ताशय और जठरांत्र मार्ग को प्रभावित करने वाली बीमारियों की रोकथाम, निदान और उपचार।
            </p>
          </div>
          <div className="rounded border border-white/20 bg-white/12 p-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <p className="inline-lang text-xs font-black uppercase tracking-[0.12em] text-cyan-100">
              <span data-en>Care Focus</span>
              <span data-hi lang="hi">देखभाल क्षेत्र</span>
            </p>
            <div className="mt-4 grid gap-3">
              {[
                ["Digestive System", "पाचन तंत्र"],
                ["Liver & Pancreas", "लिवर और अग्न्याशय"],
                ["Gallbladder Care", "पित्ताशय देखभाल"],
                ["Advanced Endoscopy", "उन्नत एंडोस्कोपी"]
              ].map(([item, hiItem]) => (
                <div key={item} className="rounded border border-white/15 bg-white/10 p-4">
                  <p className="inline-lang font-black text-white">
                    <span data-en>{item}</span>
                    <span data-hi lang="hi">{hiItem}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section className="relative z-10 pt-0">
        <MotionReveal>
          <article className="rounded border border-line bg-white p-7 shadow-lift md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">About Mudgal Gastromedics Hospital</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">Comprehensive digestive healthcare with clinical excellence and compassion</h2>
            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 text-muted lg:grid-cols-3">
              <p className="leading-relaxed">
                Mudgal Gastromedics Hospital is a premier super-speciality center dedicated to the prevention, diagnosis, and treatment of diseases affecting the digestive system, liver, pancreas, gallbladder, and gastrointestinal tract. Located in Shaheed Nagar, Agra, our hospital is committed to delivering world-class gastroenterology and hepatology services through clinical excellence, advanced technology, evidence-based medicine, and compassionate patient care.
              </p>
              <p className="leading-relaxed">
                Founded with the vision of making advanced digestive healthcare accessible to everyone, Mudgal Gastromedics Hospital combines experienced medical expertise with modern diagnostic and therapeutic facilities to provide comprehensive care under one roof. From routine digestive consultations and preventive health check-ups to complex therapeutic endoscopic procedures and liver disease management, we are dedicated to helping every patient achieve better health and an improved quality of life.
              </p>
              <p className="leading-relaxed">
                Led by Dr. Deepak Kumar Sharma, Founder & Principal Consultant Gastroenterologist, Hepatologist and Advanced Endoscopist, the hospital has earned the trust of patients from Agra and neighboring districts by providing personalized treatment, accurate diagnosis, and ethical medical care.
              </p>
            </div>
          </article>
        </MotionReveal>
      </Section>

      <Section id="why-choose" muted>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <MotionReveal>
            <article className="h-full rounded border border-line bg-white p-7 shadow-soft">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-brand text-white">
                <Target size={26} />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Our Vision</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-ink">To be the most trusted and preferred center for digestive healthcare</h2>
              <p className="mt-4 leading-relaxed text-muted">
                To become the most trusted and preferred center for gastroenterology, hepatology, digestive health, and advanced endoscopic care in Agra and North India by delivering exceptional patient care, clinical excellence, innovation, and ethical medical practice.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                We aspire to improve lives through early diagnosis, advanced treatment, preventive healthcare, and continuous medical innovation while maintaining the highest standards of safety, quality, and compassion.
              </p>
            </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="h-full rounded border border-line bg-white p-7 shadow-soft">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-teal text-white">
                <Stethoscope size={26} />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Our Mission</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-ink">Patient-centered digestive healthcare through advanced expertise</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Our mission is to provide comprehensive, patient-centered digestive healthcare through advanced medical expertise, state-of-the-art technology, and evidence-based treatment.
              </p>
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section className="pt-0" muted>
        <SectionHead eyebrow="Our Mission" title="We are committed to">
          <p>Clear diagnosis, respectful communication, patient safety, and reliable specialized gastroenterology care for the community.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          {missionCommitments.map((item, index) => (
            <MotionReveal key={item} delay={Math.min(index * 0.03, 0.18)}>
              <div className="flex h-full gap-4 rounded border border-line bg-white p-5 shadow-soft">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded bg-brand text-sm font-black text-white">{index + 1}</span>
                <p className="leading-relaxed text-muted">{item}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Comprehensive Gastroenterology & Liver Care" title="Specialized care for digestive, liver, pancreatic, and biliary diseases">
          <p>Mudgal Gastromedics Hospital provides focused evaluation and treatment planning for a wide range of digestive and liver conditions.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-4">
          {careAreas.map((area, index) => (
            <MotionReveal key={area.title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
              <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
                <h2 className="text-xl font-black text-ink">{area.title}</h2>
                <div className="mt-4 grid gap-2">
                  {area.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm font-medium text-muted">
                      <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={16} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Our Core Values" title="The values guiding every decision">
          <p>Our values define who we are and reflect our commitment to exceptional patient care and medical excellence.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 lg:grid-cols-4">
          {coreValues.map(({ title, description, icon: Icon }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.03, 0.2)}>
              <article className="group h-full rounded border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
                <span className="mb-5 grid h-12 w-12 place-items-center rounded bg-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                  <Icon size={24} />
                </span>
                <h2 className="text-lg font-black text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Why Choose Mudgal Gastromedics Hospital?" title="Specialized digestive healthcare with quality, safety, and personal attention">
          <p>Choosing the right healthcare provider is one of the most important decisions for you and your family.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map(({ title, description }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
              <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
                <h2 className="text-xl font-black text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <MotionReveal>
            <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded bg-brand text-white">
                  <Microscope size={24} />
                </span>
                <h2 className="text-2xl font-black text-ink">Advanced Diagnostic Services</h2>
              </div>
              <p className="mt-3 text-muted">Accurate diagnosis is the foundation of successful treatment. Our hospital offers modern diagnostic services to evaluate digestive and liver disorders with precision.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {diagnostics.map((item) => (
                  <span key={item} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">{item}</span>
                ))}
              </div>
            </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded bg-teal text-white">
                  <Activity size={24} />
                </span>
                <h2 className="text-2xl font-black text-ink">Advanced Therapeutic Procedures</h2>
              </div>
              <p className="mt-3 text-muted">Mudgal Gastromedics Hospital is equipped to perform a comprehensive range of advanced therapeutic endoscopic procedures that reduce the need for major surgery and promote faster recovery.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {therapeuticProcedures.map((item) => (
                  <span key={item} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">{item}</span>
                ))}
              </div>
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
          {[
            {
              eyebrow: "Quality & Patient Safety",
              title: "Safe, reliable, and effective healthcare",
              text:
                "Quality and patient safety are the foundation of everything we do. We maintain strict clinical protocols, infection prevention measures, and quality assurance systems to provide safe, reliable, and effective healthcare. Our team is committed to continuous improvement by adopting modern medical practices, investing in advanced technology, and participating in ongoing professional education."
            },
            {
              eyebrow: "Serving Our Community",
              title: "Prevention, early diagnosis, and awareness",
              text:
                "At Mudgal Gastromedics Hospital, we believe that prevention is the key to better health. We actively encourage preventive screenings, early diagnosis, and public awareness about digestive health and liver diseases. Through patient education and community outreach, we empower individuals to make informed healthcare decisions and lead healthier lives."
            },
            {
              eyebrow: "Our Promise",
              title: "Trusted care from consultation to advanced procedures",
              text:
                "At Mudgal Gastromedics Hospital, we are committed to delivering trusted, compassionate, and specialized healthcare for every patient who walks through our doors. From routine consultations to advanced endoscopic procedures, our goal is to provide world-class digestive healthcare with professionalism, integrity, and compassion."
            }
          ].map((item, index) => (
            <MotionReveal key={item.eyebrow} className="h-full" delay={Math.min(index * 0.06, 0.18)}>
              <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">{item.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-ink">{item.title}</h2>
                <p className="mt-4 leading-relaxed text-muted">{item.text}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Serving Patients Across Agra & Beyond" title="Specialized gastroenterology and liver care for the region">
          <p>Patients visit Mudgal Gastromedics Hospital from Shaheed Nagar and many nearby areas for digestive, liver, and advanced endoscopic care.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <MotionReveal>
            <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-black text-ink">Agra local areas</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {agraLocalAreas.slice(0, 15).map((area) => (
                  <span key={area} className="rounded-full border border-line bg-soft px-3 py-2 text-sm font-bold text-teal-dark">{area}</span>
                ))}
              </div>
              {agraLocalAreas.length > 15 ? (
                <details className="group mt-3">
                  <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-line bg-white px-4 text-sm font-black text-brand-dark shadow-sm transition hover:border-brand hover:bg-soft [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Show more Agra areas</span>
                    <span className="hidden group-open:inline">Show fewer Agra areas</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agraLocalAreas.slice(15).map((area) => (
                      <span key={area} className="rounded-full border border-line bg-soft px-3 py-2 text-sm font-bold text-teal-dark">{area}</span>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-black text-ink">Nearby cities and districts</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {nearbyServiceCities.slice(0, 12).map((city) => (
                  <span key={city} className="rounded-full border border-line bg-soft px-3 py-2 text-sm font-bold text-teal-dark">{city}</span>
                ))}
              </div>
              {nearbyServiceCities.length > 12 ? (
                <details className="group mt-3">
                  <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-line bg-white px-4 text-sm font-black text-brand-dark shadow-sm transition hover:border-brand hover:bg-soft [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">Show more nearby cities</span>
                    <span className="hidden group-open:inline">Show fewer nearby cities</span>
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {nearbyServiceCities.slice(12).map((city) => (
                      <span key={city} className="rounded-full border border-line bg-soft px-3 py-2 text-sm font-bold text-teal-dark">{city}</span>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <MotionReveal>
          <div className="rounded border border-line bg-white p-8 text-center shadow-lift md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Your Digestive Health is Our Priority</p>
            <h2 className="mx-auto mt-3 max-w-4xl break-words text-3xl font-black leading-tight text-ink md:text-5xl">
              Experience trusted gastroenterology, advanced liver care, and modern endoscopic treatment at Mudgal Gastromedics Hospital.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl leading-relaxed text-muted">
              Whether you need a routine digestive health consultation, preventive screening, advanced therapeutic endoscopy, or specialized treatment for complex gastrointestinal or liver diseases, our dedicated team is here to help you achieve better health with confidence.
            </p>
          </div>
        </MotionReveal>
      </Section>
    </main>
  );
}
