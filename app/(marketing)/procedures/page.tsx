import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, PhoneCall } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { Section, SectionHead } from "@/components/site/Section";
import { getPublicProcedures } from "@/lib/cms-public";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { hospitalEntityId, site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gastroenterology Procedures in Agra",
  description:
    "Browse endoscopy, colonoscopy, ERCP, FibroScan and other gastroenterology and liver procedures at Mudgal Gastromedics Hospital, Agra — what each involves, preparation notes and when it's advised.",
  alternates: { canonical: "/procedures" },
  openGraph: {
    title: `Gastroenterology Procedures in Agra | ${site.name}`,
    description:
      "Find preparation notes, what to expect and when each digestive and liver procedure is advised at Mudgal Gastromedics Hospital in Shaheed Nagar, Agra.",
    url: `${site.url}/procedures`,
    siteName: site.name,
    type: "website",
    images: [{ url: "/mgm-logo.png", width: 1200, height: 630, alt: site.name }]
  }
};

const planningSteps = [
  {
    title: "Consultation",
    titleHi: "परामर्श",
    text: "The doctor reviews symptoms and reports, and advises the specific procedure if needed."
  },
  {
    title: "Preparation instructions",
    titleHi: "तैयारी निर्देश",
    text: "Fasting, medicine adjustments and attendant requirements are explained before the visit."
  },
  {
    title: "Procedure day",
    titleHi: "प्रक्रिया का दिन",
    text: "The team confirms readiness, explains the process and monitors comfort throughout."
  },
  {
    title: "Report & follow-up",
    titleHi: "रिपोर्ट और फॉलो-अप",
    text: "Findings, next steps and a personalized care plan are discussed after the procedure."
  }
];

const visitChecklist = [
  "Current medicines and allergy list",
  "Previous prescriptions and reports",
  "Fasting or preparation instructions, if advised",
  "An attendant, if sedation is planned"
];

export default async function ProceduresPage() {
  const procedures = await getPublicProcedures();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Gastroenterology Procedures in Agra",
        url: `${site.url}/procedures`,
        description: metadata.description,
        about: ["Gastroenterology", "Hepatology", "Endoscopy", "Digestive disease care"],
        provider: { "@id": hospitalEntityId },
        hasPart: procedures.map((procedure) => ({
          "@type": "MedicalWebPage",
          name: procedure.title,
          url: `${site.url}/procedures/${procedure.slug}`,
          description: procedure.summary
        }))
      },
      {
        "@type": "ItemList",
        name: "Mudgal Gastromedics procedure listings",
        itemListElement: procedures.map((procedure, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: procedure.title,
          url: `${site.url}/procedures/${procedure.slug}`
        }))
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Procedures", url: "/procedures" }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div>
            <p className="inline-lang mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <span data-en>Procedures</span>
              <span data-hi lang="hi">प्रक्रियाएं</span>
            </p>
            <h1 className="inline-lang max-w-5xl text-4xl font-black leading-[0.98] sm:text-5xl md:text-7xl">
              <span data-en>Gastroenterology and liver procedures in Agra.</span>
              <span data-hi lang="hi">आगरा में गैस्ट्रोएंटरोलॉजी और लिवर प्रक्रियाएं।</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl" data-en>
              Browse endoscopy, colonoscopy, ERCP, FibroScan and related digestive and liver procedures — what each involves, preparation notes and when it&apos;s advised.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl" data-hi lang="hi">
              एंडोस्कोपी, कोलोनोस्कोपी, ईआरसीपी, फाइब्रोस्कैन और संबंधित पाचन व लिवर प्रक्रियाएं देखें — प्रत्येक में क्या शामिल है, तैयारी की जानकारी और कब सलाह दी जाती है।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/portal#appointment">Book Appointment</ButtonLink>
              <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost">
                <PhoneCall size={18} /> Call Reception
              </ButtonLink>
            </div>
          </div>

          <div className="rounded border border-white/20 bg-white/12 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
            <BrandIconTile className="mb-5 h-14 w-14 bg-cyan-100/15" />
            <p className="inline-lang text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <span data-en>How procedures are planned</span>
              <span data-hi lang="hi">प्रक्रियाओं की योजना कैसे बनती है</span>
            </p>
            <div className="mt-6 grid gap-3">
              {planningSteps.map((step) => (
                <span key={step.title} className="flex gap-3 rounded border border-white/14 bg-white/10 p-3 text-sm font-bold text-white/86">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-100" size={18} />
                  <span className="inline-lang">
                    <span data-en>{step.title}</span>
                    <span data-hi lang="hi">{step.titleHi}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section id="procedure-list">
        <SectionHead eyebrow="All Procedures" title="Browse procedure listings">
          <p data-en>Each page explains what the procedure involves, preparation notes, what to expect and when it&apos;s advised.</p>
          <p data-hi lang="hi">प्रत्येक पेज में प्रक्रिया में क्या शामिल है, तैयारी की जानकारी, क्या अपेक्षा करें और कब सलाह दी जाती है, यह बताया गया है।</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
          {procedures.map((procedure) => (
            <Link
              key={procedure.slug}
              href={`/procedures/${procedure.slug}`}
              className="group flex h-full flex-col rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <BrandIconTile className="h-11 w-11" />
                <ArrowRight className="text-brand-dark transition group-hover:translate-x-1" size={20} />
              </div>
              <h2 className="inline-lang text-2xl font-black leading-tight text-ink transition group-hover:text-brand-dark">
                <span data-en>{procedure.title}</span>
                <span data-hi lang="hi">{procedure.hiTitle}</span>
              </h2>
              <p className="mt-3 grow leading-relaxed text-muted" data-en>{procedure.summary}</p>
              <p className="mt-3 grow leading-relaxed text-muted" data-hi lang="hi">{procedure.hiSummary}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Quick Reference" title="All procedures at a glance">
          <p data-en>A scannable summary of every procedure and condition covered on this page.</p>
          <p data-hi lang="hi">इस पेज पर शामिल हर प्रक्रिया और स्थिति का एक संक्षिप्त सारांश।</p>
        </SectionHead>
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-soft/60">
                <th scope="col" className="p-4 text-xs font-black uppercase tracking-wider text-muted">Procedure</th>
                <th scope="col" className="p-4 text-xs font-black uppercase tracking-wider text-muted">What it involves</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map((procedure) => (
                <tr key={procedure.slug} className="border-b border-line last:border-0 hover:bg-soft/40">
                  <th scope="row" className="whitespace-nowrap p-4 align-top font-black text-ink">
                    <Link href={`/procedures/${procedure.slug}`} className="hover:text-brand-dark">
                      {procedure.title}
                    </Link>
                  </th>
                  <td className="p-4 align-top text-muted">{procedure.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section muted>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-2xl border border-line bg-white p-6 shadow-lift lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Before Your Procedure</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink md:text-5xl">Bring reports and follow preparation instructions.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Bring old prescriptions, blood reports and any related scans. Follow fasting or preparation instructions if advised, and arrange an attendant if sedation is planned.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/faqs">Read FAQs</ButtonLink>
              <ButtonLink href="/contact" variant="ghost">Contact Hospital</ButtonLink>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-soft/60 p-5">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark">
              <ClipboardList size={18} /> Common visit checklist
            </p>
            <div className="mt-5 grid gap-3">
              {visitChecklist.map((item) => (
                <span key={item} className="flex gap-3 rounded border border-line bg-white p-3 text-sm font-bold text-muted">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={17} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-line bg-ink p-6 text-white shadow-lift md:p-8">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Need help choosing?</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Reception can guide the right procedure appointment.</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-white/72">
                Share symptoms, duration, current medicines and available reports so the team can help plan the right consultation or procedure visit.
              </p>
            </div>
            <AppointmentCtaPanel className="lg:min-w-[520px]" />
          </div>
        </div>
      </Section>
    </main>
  );
}
