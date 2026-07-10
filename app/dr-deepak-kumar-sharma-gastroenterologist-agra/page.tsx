import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { Award, CheckCircle2, GraduationCap, HeartPulse, HelpCircle, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/AppointmentCtaPanel";
import { ButtonLink } from "@/components/ButtonLink";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
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
  "Fatty Liver Disease",
  "Hepatitis B and Hepatitis C",
  "Liver Cirrhosis",
  "Liver Failure",
  "Liver Cancer",
  "Alcohol-Related Liver Disease",
  "GERD and Acid Reflux",
  "Gastritis and Peptic Ulcers",
  "Peptic Esophagitis",
  "Esophageal Stricture",
  "Ulcerative Colitis",
  "Crohn's Disease",
  "Inflammatory Bowel Disease",
  "Irritable Bowel Syndrome",
  "Gastrointestinal Bleeding",
  "Rectal Bleeding",
  "Chronic Constipation",
  "Chronic Diarrhea",
  "Abdominal Pain and Bloating",
  "Enteritis and Enteric Fever",
  "Pancreatic Disorders",
  "Gallbladder and Biliary Disorders"
];

const procedures = [
  "Upper GI Endoscopy",
  "Colonoscopy",
  "ERCP",
  "FibroScan",
  "Capsule Endoscopy",
  "Polypectomy",
  "Variceal Band Ligation",
  "Endoscopic Hemostasis",
  "Advanced Therapeutic Endoscopy"
];

const keyServices = [
  "Liver Disease Treatment",
  "Therapeutic Endoscopy",
  "Colonoscopy",
  "ERCP",
  "GI Cancer Screening",
  "Obesity Endoscopy",
  "Pancreatic Disorder Treatment",
  "Gallbladder and Biliary Disease Management"
];

const whyChoose = [
  "Specialist care in gastroenterology and hepatology",
  "Advanced endoscopy and diagnostic facilities",
  "Experience in liver, pancreatic, biliary, and intestinal diseases",
  "Evidence-based diagnosis and treatment planning",
  "Patient-focused consultation and follow-up care",
  "Comprehensive care under one roof at Mudgal Gastromedics Hospital"
];

const consultationGuide = [
  {
    title: "When to consult Dr. Deepak",
    text: "Patients should consider gastroenterology consultation when symptoms persist, recur, or are linked with warning signs.",
    items: ["Frequent acidity, abdominal pain, bloating or vomiting", "Constipation, diarrhea or altered bowel habits", "Blood in stool, black stools or vomiting blood", "Jaundice, fatty liver or abnormal liver tests", "Difficulty swallowing or unexplained weight loss"]
  },
  {
    title: "What to bring",
    text: "Previous records help avoid repeat testing and make the consultation more useful.",
    items: ["Old prescriptions and current medicines", "Blood reports, LFT, CBC, INR and stool reports", "Ultrasound, CT, MRCP or FibroScan reports", "Endoscopy, colonoscopy, biopsy or discharge summaries", "Diabetes, BP, allergy and blood thinner details"]
  },
  {
    title: "What happens during consultation",
    text: "The consultation focuses on symptom pattern, report review, diagnosis, treatment planning and follow-up guidance.",
    items: ["History and warning-sign review", "Previous report assessment", "Medicine and diet guidance", "Test or procedure planning if needed", "Follow-up and emergency warning advice"]
  },
  {
    title: "When to call urgently",
    text: "Some symptoms should not wait for a routine appointment.",
    items: ["Vomiting blood or black stools", "Severe abdominal pain or persistent vomiting", "Fever with jaundice", "Fainting, severe weakness or dehydration", "Confusion or increasing abdominal swelling in liver disease"]
  }
];

const educationRows = [
  ["DM Gastroenterology", "SMS Medical College, Jaipur, 2017"],
  ["MD Medicine", "S.N. Medical College, Agra, 2013"],
  ["Advanced Clinical Experience", "Max Super Specialty Hospital, Shalimar Bagh, 2018-2019"],
  ["Current Practice", "Mudgal Gastromedics Hospital, Agra, 2019-Present"]
];

const faqs = [
  ["Who is Dr. Deepak Kumar Sharma?", "Dr. Deepak Kumar Sharma is a Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra. He is the Founder and Principal Consultant at Mudgal Gastromedics Hospital and specializes in digestive, liver, pancreatic, intestinal, and biliary disorders."],
  ["What conditions does Dr. Deepak Kumar Sharma treat?", "Dr. Sharma treats fatty liver disease, hepatitis B and C, liver cirrhosis, GERD, acidity, gastritis, ulcers, inflammatory bowel disease, constipation, diarrhea, abdominal pain, GI bleeding, pancreatic disorders, and gallbladder diseases."],
  ["Does Dr. Deepak Kumar Sharma perform endoscopy and colonoscopy?", "Yes. Dr. Sharma performs diagnostic and therapeutic procedures including upper GI endoscopy, colonoscopy, ERCP, FibroScan, polypectomy, variceal band ligation, and endoscopic hemostasis."],
  ["Where does Dr. Deepak Kumar Sharma practice?", `Dr. Deepak Kumar Sharma practices at ${site.name}, ${fullAddress}.`],
  ["Is Dr. Deepak Kumar Sharma a liver specialist in Agra?", "Yes. Dr. Sharma diagnoses and treats liver diseases including fatty liver, hepatitis B, hepatitis C, alcohol-related liver disease, liver cirrhosis, liver failure, and liver cancer."],
  ["How can I book a consultation with Dr. Deepak Kumar Sharma?", `You can book a consultation by calling ${site.mobile}, sending a WhatsApp message, or using the appointment form on the website.`],
  ["What symptoms should I see a gastroenterologist for?", "Consult a gastroenterologist for frequent acidity, heartburn, stomach pain, bloating, vomiting, difficulty swallowing, constipation, diarrhea, blood in stool, unexplained weight loss, jaundice, or long-term digestive discomfort."],
  ["When should I consult a liver specialist in Agra?", "Consult a liver specialist for jaundice, fatty liver, abnormal liver function tests, hepatitis B or C, alcohol-related liver problems, abdominal swelling, unexplained tiredness, or suspected liver cirrhosis."],
  ["What is ERCP and when is it required?", "ERCP is an advanced endoscopic procedure used to diagnose and treat bile duct, pancreas, and gallbladder system problems such as bile duct stones, blocked ducts, jaundice, and pancreato-biliary disorders."],
  ["Is colonoscopy available at Mudgal Gastromedics Hospital?", "Yes. Colonoscopy is available at Mudgal Gastromedics Hospital, Agra. It helps evaluate rectal bleeding, chronic diarrhea, inflammatory bowel disease, polyps, colon cancer risk, and other intestinal concerns."],
  ["What is the difference between endoscopy and colonoscopy?", "Upper GI endoscopy examines the food pipe, stomach, and upper part of the small intestine, while colonoscopy examines the large intestine and rectum."],
  ["Does Dr. Deepak Kumar Sharma treat fatty liver disease?", "Yes. Dr. Sharma provides evaluation and treatment for fatty liver disease, including lifestyle guidance, diagnostic testing, risk assessment, and follow-up care."],
  ["Can Dr. Deepak Kumar Sharma treat acidity and GERD?", "Yes. Dr. Sharma treats acidity, GERD, acid reflux, heartburn, gastritis, peptic ulcers, and related upper digestive symptoms."],
  ["What is FibroScan used for?", "FibroScan is a non-invasive test used to assess liver stiffness and fatty changes. It is commonly used for fatty liver disease, hepatitis, liver fibrosis, and cirrhosis risk assessment."],
  ["Does Dr. Deepak Kumar Sharma treat pancreatic disorders?", "Yes. Dr. Sharma provides consultation and treatment for pancreatic disorders, including pancreatitis and pancreato-biliary conditions."],
  ["Can I consult Dr. Deepak Kumar Sharma for abdominal pain and bloating?", "Yes. Persistent abdominal pain, gas, bloating, indigestion, altered bowel habits, or unexplained stomach discomfort should be evaluated by a gastroenterologist."],
  ["Does Mudgal Gastromedics Hospital provide GI cancer screening?", "Yes. The hospital provides gastroenterology consultation and diagnostic procedures that may support GI cancer screening, including endoscopy and colonoscopy when medically advised."],
  ["Is Dr. Deepak Kumar Sharma a DM Gastroenterologist in Agra?", "Yes. Dr. Deepak Kumar Sharma completed DM Gastroenterology from SMS Medical College, Jaipur and practices as a qualified Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra."],
  ["What digestive problems require urgent medical attention?", "Severe abdominal pain, vomiting blood, black stools, rectal bleeding, sudden jaundice, severe dehydration, persistent vomiting, or rapid unexplained weight loss should be evaluated urgently."],
  ["Can I visit for a second opinion on liver or digestive disease?", "Yes. Patients may consult Dr. Sharma for a second opinion related to digestive disorders, liver disease, pancreatic conditions, gallbladder disease, endoscopy findings, colonoscopy reports, or ERCP-related concerns."]
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
        mainEntity: faqs.map(([question, answer]) => ({
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
              <Stethoscope size={16} /> Gastroenterologist in Agra
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">
              Dr. Deepak Kumar Sharma
            </h1>
            <p className="mt-5 max-w-3xl text-2xl font-black leading-tight text-cyan-50 md:text-4xl">
              Gastroenterologist, Liver Specialist & Advanced Endoscopist in Agra
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/86">
              Trusted DM Gastroenterologist in Agra for digestive disorders, liver disease, ERCP, colonoscopy, endoscopy, pancreatic care and pancreato-biliary diseases.
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

      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr]">
          <MotionReveal>
            <div className="sticky top-32 rounded border border-line bg-white p-6 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Profile Summary</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-ink">Founder and Principal Consultant</h2>
              <div className="mt-5 grid gap-3 text-muted">
                <InfoLine icon={<Award size={18} />} text="DM Gastroenterology, SMS Medical College, Jaipur" />
                <InfoLine icon={<GraduationCap size={18} />} text="MD Medicine, S.N. Medical College, Agra" />
                <InfoLine icon={<ShieldCheck size={18} />} text="Registration: MCI-57000" />
                <InfoLine icon={<MapPin size={18} />} text={fullAddress} />
              </div>
              <AppointmentCtaPanel className="mt-6" />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="prose prose-lg max-w-none text-muted prose-headings:text-ink">
              <h2>About Dr. Deepak Kumar Sharma</h2>
              <p>
                Dr. Deepak Kumar Sharma is a trusted Gastroenterologist, Hepatologist, and Advanced Endoscopist in Agra, specializing in the diagnosis and treatment of digestive, liver, pancreatic, intestinal, and pancreato-biliary diseases. With advanced qualifications including MBBS, MD in General Medicine, and DM in Gastroenterology, Dr. Sharma brings strong clinical expertise, accurate diagnosis, and patient-focused care to every consultation.
              </p>
              <p>
                As the Founder and Principal Consultant at Mudgal Gastromedics Hospital, Agra, Dr. Sharma provides comprehensive gastroenterology and hepatology care under one roof. His practice focuses on evidence-based treatment, advanced diagnostic technology, minimally invasive endoscopic procedures, and compassionate care tailored to each patient’s condition.
              </p>
              <p>
                Patients from Agra and nearby regions consult Dr. Deepak Kumar Sharma for common digestive symptoms as well as complex gastrointestinal, liver, pancreatic, and biliary disorders.
              </p>
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Digestive & Liver Disorders" title="Comprehensive care for gastroenterology, liver and pancreato-biliary conditions" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expertise.map((item) => (
            <FeaturePill key={item} text={item} />
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-lg leading-relaxed text-muted">
          Whether you are experiencing acidity, abdominal discomfort, jaundice, digestive bleeding, altered bowel habits, chronic liver concerns, or pancreatic symptoms, Dr. Sharma offers detailed evaluation and personalized treatment planning.
        </p>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <ArticleCard
            eyebrow="Advanced Endoscopy"
            title="Diagnostic and therapeutic procedures in Agra"
            text="Mudgal Gastromedics Hospital is equipped to provide advanced diagnostic and therapeutic gastroenterology procedures. Dr. Sharma is experienced in minimally invasive endoscopic procedures that support accurate diagnosis, early detection, and effective treatment planning."
            items={procedures}
          />
          <ArticleCard
            eyebrow="Focused Services"
            title="Specialist care for digestive, liver and pancreatic disease"
            text="His clinical focus includes identifying the root cause of symptoms, explaining the diagnosis clearly, and offering treatment options based on each patient's condition and medical needs."
            items={keyServices}
          />
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <MotionReveal>
            <SectionHead eyebrow="Why Patients Choose Dr. Sharma" title="Specialist consultation with clear diagnosis and follow-up care" />
            <p className="max-w-3xl text-lg leading-relaxed text-muted">
              Patients choose Dr. Deepak Kumar Sharma for detailed consultations, accurate diagnosis, ethical medical guidance, and a compassionate approach. His focus is not only on treating symptoms but also on identifying the root cause and creating a personalized treatment plan for long-term digestive and liver health.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {whyChoose.map((item) => (
                <FeaturePill key={item} text={item} />
              ))}
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-2xl font-black text-ink">Education & Experience</h3>
              <div className="mt-5 divide-y divide-line">
                {educationRows.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-4 sm:grid-cols-[0.45fr_1fr]">
                    <p className="font-black text-ink">{label}</p>
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
          <p className="text-lg leading-relaxed text-muted">
            At Mudgal Gastromedics Hospital, patients receive complete care for digestive diseases, liver disorders, pancreatic conditions, gallbladder diseases, and advanced endoscopy procedures. The hospital combines modern medical facilities with a patient-first approach to provide safe, effective, and comfortable treatment.
          </p>
          <p className="text-lg leading-relaxed text-muted">
            From preventive screening and routine consultations to second opinions and complex endoscopic procedures, Dr. Deepak Kumar Sharma and his team are committed to delivering high-quality gastroenterology, hepatology, and advanced endoscopy care in Agra.
          </p>
        </div>
        <div className="mt-8 rounded border border-line bg-soft p-6">
          <h3 className="text-2xl font-black text-ink">Book a Consultation</h3>
          <p className="mt-3 max-w-4xl text-muted">
            Take the first step toward better digestive and liver health by scheduling a consultation with Dr. Deepak Kumar Sharma at Mudgal Gastromedics Hospital, Agra.
          </p>
          <AppointmentCtaPanel className="mt-5 max-w-3xl" />
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Consultation Guide" title="When to consult, what to bring and what to expect">
          <p>Use this guide before booking an appointment with Dr. Deepak Kumar Sharma.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {consultationGuide.map((block) => (
            <article key={block.title} className="rounded border border-line bg-white p-5 shadow-soft">
              <h2 className="text-2xl font-black leading-tight text-ink">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{block.text}</p>
              <ul className="mt-4 grid gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={17} />
                    <span>{item}</span>
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
            { title: "Consultation", text: "Symptoms, duration, medicine history and previous reports are reviewed carefully.", icon: Stethoscope },
            { title: "Diagnosis plan", text: "Blood tests, imaging, endoscopy, colonoscopy, FibroScan or ERCP are advised only when clinically useful.", icon: HeartPulse },
            { title: "Follow-up", text: "Treatment response, reports, diet, lifestyle and warning signs are discussed for ongoing care.", icon: ShieldCheck }
          ].map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded bg-soft text-brand">
                <Icon size={21} />
              </span>
              <h2 className="text-xl font-black text-ink">{title}</h2>
              <p className="mt-2 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="FAQs" title="Frequently asked questions about Dr. Deepak Kumar Sharma" />
        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-start gap-3 font-black text-ink">
                <HelpCircle className="mt-1 shrink-0 text-brand" size={18} />
                <span>{question}</span>
              </summary>
              <p className="mt-3 pl-8 leading-relaxed text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </main>
  );
}

function InfoLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-brand">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

function FeaturePill({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded border border-line bg-white px-4 py-3 shadow-sm">
      <CheckCircle2 className="shrink-0 text-teal" size={18} />
      <span className="font-semibold text-teal-dark">{text}</span>
    </div>
  );
}

function ArticleCard({ eyebrow, title, text, items }: { eyebrow: string; title: string; text: string; items: string[] }) {
  return (
    <MotionReveal>
      <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black leading-tight text-ink">{title}</h2>
        <p className="mt-4 leading-relaxed text-muted">{text}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <FeaturePill key={item} text={item} />
          ))}
        </div>
      </article>
    </MotionReveal>
  );
}
