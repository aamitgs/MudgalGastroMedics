import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, FileText, HeartPulse, MessageCircle, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
import { getServicePage, servicePages } from "@/lib/service-pages";
import { fullAddress, site } from "@/lib/site-data";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

type ServiceGuideSection = {
  title: string;
  text: string;
  items?: string[];
};

function getServiceGuide(page: NonNullable<ReturnType<typeof getServicePage>>) {
  const serviceName = page.shortTitle.toLowerCase();
  const relatedList = page.relatedLinks.map((link) => link.label).join(", ");

  const sections: ServiceGuideSection[] = [
    {
      title: "What Is It?",
      text: `${page.shortTitle} is a focused hospital service at Mudgal Gastromedics Hospital for patients who need evaluation, treatment planning and follow-up for digestive, liver and related health concerns in Agra.`,
      items: page.highlights
    },
    {
      title: "Why Is It Done?",
      text: `This service helps patients understand the cause of symptoms, review previous reports, decide whether tests or procedures are needed, and create a practical treatment plan.`,
      items: [
        "To identify the likely cause of persistent digestive or liver symptoms.",
        "To decide whether medicines, lifestyle changes, tests or procedures are needed.",
        "To plan follow-up, warning-sign monitoring and prevention where possible."
      ]
    },
    {
      title: "Who May Need It?",
      text: `Patients may need ${serviceName} when symptoms continue, reports are abnormal, or a previous doctor has advised specialist gastroenterology or liver evaluation.`,
      items: [
        "Acidity, abdominal pain, bloating, vomiting, constipation or diarrhea.",
        "Jaundice, fatty liver, abnormal liver tests, ascites or suspected cirrhosis.",
        "Blood in stool, black stools, anemia, swallowing difficulty or unexplained weight loss.",
        "Need for screening, second opinion, procedure planning or long-term follow-up."
      ]
    },
    {
      title: "How To Prepare",
      text: "A good consultation is easier when the doctor can see your full medical picture. Bring important documents and medicine details.",
      items: [
        "Bring previous prescriptions, discharge summaries, blood reports, ultrasound, CT, MRCP, endoscopy or colonoscopy reports.",
        "Carry a list of current medicines, allergies, diabetes, BP, heart, kidney or liver history.",
        "Tell the doctor about aspirin, clopidogrel, warfarin, apixaban, rivaroxaban or other blood thinners.",
        "Do not stop important medicines on your own; ask reception or the doctor for instructions."
      ]
    },
    {
      title: "What Happens During The Visit",
      text: "The doctor reviews your symptoms, duration, previous treatment, reports and risk factors. A focused examination and next-step plan are discussed clearly.",
      items: [
        "Symptom history and warning signs are reviewed.",
        "Previous reports and current medicines are checked.",
        "Tests, procedures or treatment changes are advised only when clinically useful.",
        relatedList ? `Relevant care may include: ${relatedList}.` : "Follow-up timing and report review are planned."
      ]
    },
    {
      title: "Is It Painful?",
      text: "A consultation is not painful. If a test or procedure is advised later, the team explains fasting, sedation, preparation, attendant requirement and recovery before scheduling."
    },
    {
      title: "Risks & Safety",
      text: "The main risk is delaying evaluation when warning symptoms are present. If a procedure is advised, the doctor explains benefits, alternatives and uncommon but important risks.",
      items: [
        "Tell the team about pregnancy, allergies, prior anesthesia issues and major illnesses.",
        "Discuss diabetes medicines, insulin and blood thinners before any procedure.",
        "Urgent symptoms should be discussed with reception before travelling."
      ]
    },
    {
      title: "Recovery & Follow-Up",
      text: "Follow-up depends on diagnosis. Some patients need medicines and lifestyle changes; others may need reports, imaging, endoscopy, colonoscopy, FibroScan or repeat review.",
      items: [
        "Keep reports and prescriptions together for follow-up visits.",
        "Follow diet, medicine and monitoring advice as explained.",
        "Return earlier if symptoms worsen or warning signs develop."
      ]
    },
    {
      title: "When To Call The Hospital Urgently",
      text: "Some symptoms should not wait for a routine appointment.",
      items: [
        "Vomiting blood, black stools or heavy blood in stool.",
        "Severe abdominal pain, persistent vomiting or dehydration.",
        "Fever with jaundice, increasing abdominal swelling or breathing difficulty.",
        "Confusion, severe weakness, fainting or rapidly worsening symptoms."
      ]
    },
    {
      title: "Cost & Insurance Notes",
      text: "Cost depends on consultation, tests, procedure type, biopsy, stent, anesthesia, admission, consumables and insurance terms. Reception can guide estimates after the doctor advises the next step."
    }
  ];

  const faqs = [
    {
      question: `Do I need an appointment for ${page.shortTitle}?`,
      answer: `An appointment is recommended. Call reception at ${site.mobile}, send a WhatsApp message, or use the appointment form so the team can guide timing and reports to bring.`
    },
    {
      question: "Should I bring previous reports?",
      answer: "Yes. Bring blood reports, ultrasound, CT/MRCP, discharge summaries, endoscopy or colonoscopy reports, biopsy reports and current prescriptions if available."
    },
    {
      question: "Will I need endoscopy or colonoscopy on the same day?",
      answer: "Not always. The doctor first reviews symptoms and reports. If a procedure is needed, preparation, fasting, medicines and attendant requirements are explained."
    },
    {
      question: "Can I take diabetes, BP or blood thinner medicines before visiting?",
      answer: "Do not stop regular medicines on your own. Tell the doctor about diabetes medicines, insulin, BP tablets and blood thinners so safe instructions can be given."
    },
    {
      question: "When should I call reception urgently?",
      answer: "Call urgently for vomiting blood, black stools, severe abdominal pain, fever with jaundice, persistent vomiting, fainting, breathing difficulty or rapidly worsening symptoms."
    },
    {
      question: `Is ${page.shortTitle} available at Shaheed Nagar, Agra?`,
      answer: `Yes. ${page.shortTitle} is available at Mudgal Gastromedics Hospital, ${fullAddress}.`
    }
  ];

  return { sections, faqs };
}

export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};

  const title = `${page.title} | ${site.name}`;
  const url = `${site.url}/services/${page.slug}`;

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description: page.description,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: `/services/${page.slug}/opengraph-image`, width: 1200, height: 630, alt: page.title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [`/services/${page.slug}/opengraph-image`]
    }
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();
  const guide = getServiceGuide(page);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: `${site.name} - ${page.shortTitle}`,
    url: `${site.url}/services/${page.slug}`,
    description: page.description,
    telephone: site.mobile,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
      addressLocality: site.city,
      addressRegion: site.region,
      postalCode: site.postalCode,
      addressCountry: site.country
    },
    medicalSpecialty: ["Gastroenterology", "Hepatology"]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <MotionReveal>
            <div>
              <p className="mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                Services
              </p>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.98] md:text-6xl">{page.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl">{page.hero}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact#appointment" className="min-w-[190px]">
                  Book Appointment
                </ButtonLink>
                <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="min-w-[180px] gap-2">
                  <Phone size={18} /> Call Reception
                </ButtonLink>
                <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-w-[160px] gap-2">
                  <MessageCircle size={18} /> WhatsApp
                </ButtonLink>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.1}>
            <div className="rounded border border-white/20 bg-white/12 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded bg-cyan-100/15 text-cyan-100">
                  <Stethoscope size={24} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Quick Focus</p>
                  <h2 className="text-2xl font-black">{page.shortTitle}</h2>
                </div>
              </div>
              <div className="grid gap-3">
                {page.highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded border border-white/14 bg-white/10 p-4 text-sm font-bold text-white/88">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-100" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      <Section>
        <SectionHead eyebrow="Patient care pathway" title={`About ${page.shortTitle}`}>
          <p>{page.description}</p>
        </SectionHead>
        <div className="grid gap-6 md:grid-cols-3">
          {page.sections.map((section) => (
            <MotionReveal key={section.title}>
              <article className="h-full rounded border border-line bg-white p-6 shadow-soft">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded bg-soft text-brand">
                  {section.items?.length ? <ClipboardList size={24} /> : <ShieldCheck size={24} />}
                </div>
                <h2 className="text-2xl font-black text-ink">{section.title}</h2>
                <p className="mt-3 leading-7 text-muted">{section.text}</p>
                {section.items?.length ? (
                  <ul className="mt-5 grid gap-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm font-semibold text-ink/78">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={17} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Related care" title="Connected Procedures & Conditions">
          <p>Use these related pages to understand the tests, procedures and conditions commonly linked with this service.</p>
        </SectionHead>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {page.relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex min-h-28 items-center justify-between gap-4 rounded border border-line bg-white p-5 text-lg font-black text-ink shadow-soft transition hover:-translate-y-1 hover:border-cyan-200 hover:text-brand"
            >
              <span>{link.label}</span>
              <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={20} />
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <MotionReveal>
          <div className="relative overflow-hidden rounded border border-line bg-ink p-6 text-white shadow-lift md:p-8">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.22),transparent_24rem),linear-gradient(135deg,rgba(8,145,178,0.42),rgba(5,150,105,0.22)_48%,rgba(2,22,29,0.96))]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Patient Education Guide</p>
                <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">{page.shortTitle}: complete guide for Indian patients</h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/82">
                  Clear information about why this service is needed, what to bring, medicine precautions, testing, safety, follow-up, cost factors and when to call reception.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {["Bring previous reports", "Share all medicines", "Discuss blood thinners", "Call reception for urgent symptoms"].map((item) => (
                  <div key={item} className="rounded border border-white/15 bg-white/10 px-4 py-3 font-semibold text-cyan-50 backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Patient Guide" title={`${page.shortTitle}: what patients should know`} />
        <div className="grid gap-5 lg:grid-cols-2">
          {guide.sections.map((section) => (
            <article key={section.title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-2xl font-black leading-tight text-ink">{section.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{section.text}</p>
              {section.items?.length ? (
                <ul className="mt-4 grid gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-muted">
                      <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                      <span>{item}</span>
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
            { title: "Consultation", text: "Symptoms, history, medicines and previous reports are reviewed before deciding the next step.", icon: ClipboardList },
            { title: "Testing or treatment plan", text: "If needed, tests or procedures are planned with preparation and safety instructions.", icon: HeartPulse },
            { title: "Follow-up", text: "Reports, medicine response, warning signs and long-term monitoring are discussed clearly.", icon: FileText }
          ].map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded bg-soft text-brand">
                <Icon size={21} />
              </span>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="FAQs" title={`${page.shortTitle} FAQs`} />
        <div className="grid gap-4 lg:grid-cols-2">
          {guide.faqs.map((faq) => (
            <details key={faq.question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-lg font-black text-ink">
                {faq.question}
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="relative overflow-hidden rounded border border-line bg-white p-6 text-ink shadow-lift md:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-teal" />
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">Mudgal Gastromedics Hospital</p>
              <h2 className="max-w-3xl text-3xl font-black leading-tight text-ink md:text-5xl">Need help choosing the right service?</h2>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-ink/82">
                Call reception at {site.mobile} or visit {fullAddress}. For urgent symptoms such as vomiting blood, black stools, severe pain, fever with jaundice or breathing difficulty, call before visiting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="gap-2 border-line bg-white text-ink">
                <Phone size={18} /> Call Reception
              </ButtonLink>
              <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
