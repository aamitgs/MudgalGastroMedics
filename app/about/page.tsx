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
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "About Mudgal Gastromedics Hospital, a specialty hospital in Agra for gastroenterology, hepatology, digestive health and advanced endoscopic care.",
  alternates: { canonical: "/about" }
};

const missionCommitments = [
  "Delivering accurate diagnosis and evidence-based treatment for gastrointestinal, liver, pancreatic, and digestive disorders.",
  "Providing advanced diagnostic and therapeutic endoscopy using modern technology and internationally accepted medical practices.",
  "Offering compassionate, respectful, and individualized care to every patient.",
  "Promoting preventive healthcare through awareness, education, and early detection.",
  "Maintaining the highest standards of patient safety, clinical quality, and ethical medical practice.",
  "Continuously investing in advanced technology and the professional development of our healthcare team.",
  "Making specialized gastroenterology services accessible, affordable, and reliable for the community."
];

const coreValues = [
  {
    title: "Compassion",
    description:
      "We care for every patient with empathy, kindness, and respect. We understand that every healthcare journey is unique, and we strive to provide emotional support alongside medical treatment.",
    icon: HeartHandshake
  },
  {
    title: "Patient First",
    description:
      "Every decision we make is centered around the needs, comfort, and well-being of our patients. We believe in listening carefully, communicating openly, and involving patients in their treatment decisions.",
    icon: Stethoscope
  },
  {
    title: "Clinical Excellence",
    description:
      "We are committed to delivering the highest standards of healthcare through evidence-based medicine, continuous learning, and the adoption of advanced medical technologies.",
    icon: Sparkles
  },
  {
    title: "Integrity & Ethics",
    description:
      "Honesty, transparency, confidentiality, and ethical medical practice are fundamental to the trust our patients place in us. We uphold these principles in every consultation, diagnosis, and treatment.",
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
      "We embrace medical advancements and minimally invasive procedures to provide safer, more accurate diagnoses and more effective treatments with faster recovery whenever possible.",
    icon: Lightbulb
  },
  {
    title: "Respect",
    description:
      "We treat every patient, family member, visitor, and healthcare professional with dignity, courtesy, and respect, regardless of background or circumstance.",
    icon: HeartHandshake
  },
  {
    title: "Teamwork",
    description:
      "Quality healthcare is achieved through collaboration. Our doctors, nurses, technicians, and support staff work together to provide seamless, coordinated, and compassionate care.",
    icon: Users
  },
  {
    title: "Continuous Improvement",
    description:
      "We continuously evaluate and enhance our services, clinical practices, and patient experience to ensure we remain at the forefront of digestive healthcare.",
    icon: Activity
  },
  {
    title: "Community Commitment",
    description:
      "We believe healthcare extends beyond the hospital. Through health awareness programs, preventive screenings, and patient education, we strive to improve the digestive health of our community.",
    icon: Users
  }
];

const diagnostics = [
  "Upper GI Endoscopy",
  "Colonoscopy",
  "FibroScan",
  "Capsule Endoscopy",
  "Liver Function Assessment",
  "Gastrointestinal Disease Screening"
];

const therapeuticProcedures = [
  "ERCP",
  "Endoscopic Polypectomy",
  "Variceal Band Ligation",
  "Argon Plasma Coagulation (APC)",
  "PEG Tube Placement",
  "Endoscopic Hemostasis",
  "Foreign Body Removal",
  "Advanced Therapeutic Endoscopy"
];

const whyChoose = [
  {
    title: "Specialized Expertise",
    description: "Dedicated care for diseases affecting the digestive system, liver, pancreas, gallbladder, and gastrointestinal tract."
  },
  {
    title: "Experienced Medical Team",
    description:
      "Our specialists and healthcare professionals are dedicated to delivering evidence-based care with compassion, professionalism, and clinical excellence."
  },
  {
    title: "Personalized Care",
    description:
      "Every patient receives an individualized treatment plan based on their medical condition, health history, lifestyle, and long-term wellness goals."
  },
  {
    title: "Modern Infrastructure",
    description:
      "Our hospital is equipped with advanced medical technology, comfortable patient facilities, and a safe, hygienic environment designed to support high-quality healthcare."
  }
];

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
              <span data-en>About {site.name}</span>
              <span data-hi lang="hi">{site.name} के बारे में</span>
            </p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              <span data-en>Compassionate Care. Advanced Gastroenterology. Trusted Expertise.</span>
              <span data-hi lang="hi">दयालु देखभाल। उन्नत गैस्ट्रोएंटरोलॉजी। विश्वसनीय विशेषज्ञता।</span>
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>
              Specialized gastroenterology, hepatology, digestive health, and advanced endoscopic care in Agra, Uttar Pradesh.
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">
              आगरा, उत्तर प्रदेश में विशेषज्ञ गैस्ट्रोएंटरोलॉजी, हेपेटोलॉजी, पाचन स्वास्थ्य और उन्नत एंडोस्कोपिक देखभाल।
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

      <Section className="-mt-10 relative z-10 pt-0">
        <MotionReveal>
          <article className="rounded border border-line bg-white p-7 shadow-lift md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">About Mudgal Gastromedics Hospital</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">Comprehensive digestive healthcare with clinical excellence and compassion</h2>
            <div className="mt-6 grid gap-5 text-muted lg:grid-cols-3">
              <p className="leading-relaxed">
                Mudgal Gastromedics Hospital is a leading specialty hospital dedicated to providing comprehensive gastroenterology, hepatology, digestive health, and advanced endoscopic care in Agra, Uttar Pradesh. Built on the principles of clinical excellence, compassion, and ethical medical practice, our hospital is committed to delivering high-quality healthcare for patients with disorders of the digestive system, liver, pancreas, gallbladder, and gastrointestinal tract.
              </p>
              <p className="leading-relaxed">
                We understand that digestive health plays a vital role in overall well-being. Our goal is not only to diagnose and treat diseases but also to educate patients, promote preventive healthcare, and support long-term wellness. Every patient receives personalized attention, evidence-based treatment, and compassionate care in a safe and comfortable environment.
              </p>
              <p className="leading-relaxed">
                At Mudgal Gastromedics Hospital, we combine experienced medical professionals, modern diagnostic technology, and advanced therapeutic procedures to ensure accurate diagnosis, effective treatment, and the best possible clinical outcomes. Whether you need a routine consultation, preventive screening, advanced endoscopy, or specialized treatment for complex gastrointestinal disorders, our team is committed to guiding you at every stage of your healthcare journey.
              </p>
            </div>
          </article>
        </MotionReveal>
      </Section>

      <Section id="why-choose" muted>
        <div className="grid gap-5 lg:grid-cols-2">
          <MotionReveal>
            <article className="h-full rounded border border-line bg-white p-7 shadow-soft">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-brand text-white">
                <Target size={26} />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Our Vision</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-ink">To be the most trusted and preferred center for digestive healthcare</h2>
              <p className="mt-4 leading-relaxed text-muted">
                To be the most trusted and preferred center for gastroenterology, liver care, digestive health, and advanced endoscopic services in Agra and across North India by delivering compassionate, ethical, and evidence-based healthcare.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                We aspire to set new benchmarks in patient care through clinical excellence, innovation, advanced technology, and a commitment to improving the quality of life for every individual we serve.
              </p>
            </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <article className="h-full rounded border border-line bg-white p-7 shadow-soft">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-teal text-white">
                <Stethoscope size={26} />
              </span>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Our Mission</p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-ink">Patient-centered digestive healthcare through advanced expertise</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Our mission is to provide comprehensive, accessible, and patient-centered digestive healthcare through advanced medical expertise and personalized treatment.
              </p>
            </article>
          </MotionReveal>
        </div>
      </Section>

      <Section className="pt-0" muted>
        <SectionHead eyebrow="Our Mission" title="We are committed to">
          <p>Clear diagnosis, respectful communication, patient safety, and reliable specialized gastroenterology care for the community.</p>
        </SectionHead>
        <div className="grid gap-4 md:grid-cols-2">
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
        <SectionHead eyebrow="Our Core Values" title="The values guiding every decision">
          <p>Our values define who we are and reflect our commitment to exceptional patient care and medical excellence.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {coreValues.map(({ title, description, icon: Icon }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.03, 0.2)}>
              <article className="group h-full rounded border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
                <span className="mb-5 grid h-12 w-12 place-items-center rounded bg-soft text-brand transition group-hover:bg-brand group-hover:text-white">
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map(({ title, description }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
              <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
                <h2 className="text-xl font-black text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <MotionReveal>
            <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded bg-brand text-white">
                  <Microscope size={24} />
                </span>
                <h2 className="text-2xl font-black text-ink">Advanced Diagnostics</h2>
              </div>
              <p className="mt-3 text-muted">State-of-the-art diagnostic facilities for early detection and accurate diagnosis.</p>
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
              <p className="mt-3 text-muted">Comprehensive treatment options using modern endoscopic techniques.</p>
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
        <div className="grid gap-5 lg:grid-cols-3">
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
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{item.eyebrow}</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-ink">{item.title}</h2>
                <p className="mt-4 leading-relaxed text-muted">{item.text}</p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section muted>
        <MotionReveal>
          <div className="rounded border border-line bg-white p-8 text-center shadow-lift md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Your Health. Our Expertise. Our Commitment.</p>
            <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black leading-tight text-ink md:text-5xl">
              Experience compassionate care, advanced medical expertise, and trusted gastroenterology services all under one roof.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl leading-relaxed text-muted">
              Whether you are seeking preventive care, expert consultation, advanced diagnostic services, or specialized treatment for complex digestive disorders, Mudgal Gastromedics Hospital is here to support you every step of the way.
            </p>
          </div>
        </MotionReveal>
      </Section>
    </main>
  );
}
