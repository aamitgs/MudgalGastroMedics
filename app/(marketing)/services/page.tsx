import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, PhoneCall, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { servicePages } from "@/lib/service-pages";
import { hospitalEntityId, site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Digestive, Liver & Endoscopy Services in Agra",
  description:
    "Browse gastroenterology, liver care, endoscopy, colonoscopy, ERCP, FibroScan, GI bleeding, pancreas, bowel, GERD, screening and weight management services at Mudgal Gastromedics Hospital, Agra.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Digestive, Liver & Endoscopy Services in Agra | ${site.name}`,
    description:
      "Find the right digestive, liver, endoscopy, diagnostic or preventive care service at Mudgal Gastromedics Hospital in Shaheed Nagar, Agra.",
    url: `${site.url}/services`,
    siteName: site.name,
    type: "website",
    images: [{ url: "/mgm-logo.png", width: 1200, height: 630, alt: site.name }]
  }
};

const serviceGroups = [
  {
    title: "Core Specialist Care",
    text: "For patients who need doctor-led evaluation, treatment planning and follow-up.",
    slugs: ["gastroenterology", "hepatology-liver-care", "liver-clinic"]
  },
  {
    title: "Procedures & Diagnostics",
    text: "For patients advised endoscopy, colonoscopy, FibroScan, ERCP or investigation planning.",
    slugs: ["advanced-endoscopy-centre", "diagnostic-services", "endoscopy-services", "colonoscopy-services", "ercp-bile-duct-care", "fibroscan-fatty-liver-assessment"]
  },
  {
    title: "Urgent & Organ-Focused Care",
    text: "For bleeding warning signs, pancreas problems, bile duct disease and higher-risk symptom pathways.",
    slugs: ["gi-bleeding-emergency-gastro-care", "pancreas-biliary-clinic"]
  },
  {
    title: "Symptom Clinics",
    text: "For common recurring symptoms that need structured evaluation and follow-up.",
    slugs: ["ibs-constipation-bowel-disorder-clinic", "acidity-gerd-ulcer-clinic"]
  },
  {
    title: "Prevention & Metabolic Care",
    text: "For preventive screening, GI cancer risk, fatty liver risk and supervised weight planning.",
    slugs: ["preventive-health-check-up", "medical-weight-management", "gi-cancer-screening-polyp-clinic"]
  }
];

const carePathways = [
  {
    title: "Stomach, bowel or acidity symptoms",
    text: "Start with gastroenterology consultation for acidity, pain, bloating, bowel changes, bleeding symptoms or swallowing difficulty.",
    href: "/services/gastroenterology"
  },
  {
    title: "Fatty liver, jaundice or abnormal LFT",
    text: "Choose hepatology/liver care for fatty liver, FibroScan review, jaundice, cirrhosis, ascites or abnormal liver reports.",
    href: "/services/hepatology-liver-care"
  },
  {
    title: "Endoscopy, colonoscopy or ERCP advised",
    text: "Choose advanced endoscopy if a doctor has advised a diagnostic or therapeutic endoscopic procedure.",
    href: "/services/advanced-endoscopy-centre"
  },
  {
    title: "Vomiting blood, black stool or blood in stool",
    text: "Open the GI bleeding service and call reception before visiting if bleeding symptoms, weakness or dizziness are present.",
    href: "/services/gi-bleeding-emergency-gastro-care"
  },
  {
    title: "Gas, bloating, constipation or diarrhea",
    text: "Use the bowel disorder clinic for recurring IBS-like symptoms, constipation, diarrhea or bowel habit change.",
    href: "/services/ibs-constipation-bowel-disorder-clinic"
  },
  {
    title: "Cancer screening or colon polyps",
    text: "Use the screening and polyp clinic for family history, anemia, colon polyps, biopsy review or colon cancer screening questions.",
    href: "/services/gi-cancer-screening-polyp-clinic"
  }
];

function serviceBySlug(slug: string) {
  const page = servicePages.find((service) => service.slug === slug);
  if (!page) throw new Error(`Missing service page: ${slug}`);
  return page;
}

export default function ServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Digestive, Liver & Endoscopy Services in Agra",
        url: `${site.url}/services`,
        description: metadata.description,
        about: ["Gastroenterology", "Hepatology", "Endoscopy", "Digestive disease care"],
        provider: { "@id": hospitalEntityId },
        hasPart: servicePages.map((service) => ({
          "@type": "MedicalWebPage",
          name: service.title,
          url: `${site.url}/services/${service.slug}`,
          description: service.description
        }))
      },
      {
        "@type": "ItemList",
        name: "Mudgal Gastromedics service listings",
        itemListElement: servicePages.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: service.shortTitle,
          url: `${site.url}/services/${service.slug}`
        }))
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Services", url: "/services" }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              Services
            </p>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.98] md:text-7xl">
              Digestive, liver and endoscopy services in Agra.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl">
              Choose the right care pathway for gastroenterology symptoms, liver reports, endoscopy procedures, diagnostic planning, preventive check-ups and weight-related digestive health.
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">How to choose</p>
            <h2 className="mt-3 text-3xl font-black leading-tight">Start from your symptom, report or advised procedure.</h2>
            <div className="mt-6 grid gap-3">
              {["Persistent symptoms", "Abnormal reports", "Procedure advised", "Preventive screening"].map((item) => (
                <span key={item} className="flex gap-3 rounded border border-white/14 bg-white/10 p-3 text-sm font-bold text-white/86">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-100" size={18} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section id="service-list">
        <SectionHead eyebrow="All Services" title="Browse service listings">
          <p>Each service page explains symptoms covered, reports to bring, related procedures and when to call before visiting.</p>
        </SectionHead>
        <div className="grid gap-8">
          {serviceGroups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-line bg-white p-5 shadow-soft md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">{group.title}</p>
                  <p className="mt-2 max-w-3xl text-muted">{group.text}</p>
                </div>
                <span className="w-fit rounded-full border border-line bg-soft px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
                  {group.slugs.length} services
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {group.slugs.map((slug) => {
                  const service = serviceBySlug(slug);
                  return (
                    <Link
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-line bg-[linear-gradient(145deg,#ffffff,#f7fbfb)] p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <BrandIconTile className="h-12 w-12" />
                        <ArrowRight className="text-brand-dark transition group-hover:translate-x-1" size={20} />
                      </div>
                      <h2 className="text-2xl font-black leading-tight text-ink transition group-hover:text-brand-dark">{service.shortTitle}</h2>
                      <p className="mt-3 grow leading-relaxed text-muted">{service.description}</p>
                      <div className="mt-5 grid gap-2">
                        {service.highlights.slice(0, 3).map((highlight) => (
                          <span key={highlight} className="flex gap-2 text-sm font-semibold text-muted">
                            <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={16} />
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Choose Faster" title="Which service should I open first?" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {carePathways.map((pathway) => (
            <Link key={pathway.title} href={pathway.href} className="group rounded-xl border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <Stethoscope className="text-brand-dark" size={30} />
              <h2 className="mt-5 text-2xl font-black leading-tight text-ink">{pathway.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{pathway.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-black text-brand-dark">
                Open service <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 rounded-2xl border border-line bg-white p-6 shadow-lift lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Before You Visit</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink md:text-5xl">Bring reports and call early for urgent warning signs.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Bring old prescriptions, blood reports, ultrasound/CT/MRCP, endoscopy or colonoscopy reports. Call reception first for vomiting blood, black stools, severe pain, fever with jaundice or persistent vomiting.
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
              {["Current medicines and allergies", "Previous prescriptions", "Blood and liver reports", "Ultrasound, CT, MRCP or FibroScan", "Endoscopy or colonoscopy reports"].map((item) => (
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
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Need help choosing?</p>
              <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Reception can guide the right appointment category.</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-white/72">
                Share symptoms, duration, current medicines and available reports so the team can help plan OPD consultation or procedure coordination.
              </p>
            </div>
            <AppointmentCtaPanel className="lg:min-w-[520px]" />
          </div>
        </div>
      </Section>
    </main>
  );
}
