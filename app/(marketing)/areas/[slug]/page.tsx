import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, HelpCircle, MapPin, Route, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { LocalProminencePanel } from "@/components/site/LocalProminencePanel";
import { Section, SectionHead } from "@/components/site/Section";
import { getLocalSeoPage, getLocalSeoPageDetail, localSeoPages } from "@/lib/local-seo-pages";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { fullAddress, hospitalEntityId, site } from "@/lib/site-data";

type LocalAreaPageProps = {
  params: Promise<{ slug: string }>;
};

const opdTimingAreaSlugs = new Set([
  "liver-specialist-in-agra",
  "gastroenterologist-near-fatehabad-road-agra",
  "liver-specialist-near-tajganj-agra",
  "gastro-hospital-in-shaheed-nagar-agra"
]);

export function generateStaticParams() {
  return localSeoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: LocalAreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getLocalSeoPage(slug);
  if (!page) return {};

  // Suffixed so the <title> tag never collides byte-for-byte with a procedure
  // or service page that shares the same core phrase (e.g. "Colonoscopy in
  // Agra" is both an area-page title and the default /procedures/colonoscopy
  // title) — the on-page <h1> still uses the bare page.title, unaffected.
  const title = `${page.title} - Local Care Guide`;
  const fullTitle = `${title} | ${site.name}`;
  const url = `${site.url}/areas/${page.slug}`;

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: page.description,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: `/areas/${page.slug}/opengraph-image`, width: 1200, height: 630, alt: page.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: page.description,
      images: [`/areas/${page.slug}/opengraph-image`]
    }
  };
}

export default async function LocalAreaPage({ params }: LocalAreaPageProps) {
  const { slug } = await params;
  const page = getLocalSeoPage(slug);
  if (!page) notFound();
  const detail = getLocalSeoPageDetail(page.slug);
  const showOpdTimingCard = opdTimingAreaSlugs.has(page.slug);
  const pageUrl = `${site.url}/areas/${page.slug}`;
  const serviceEntityId = `${pageUrl}#service`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        name: page.title,
        url: pageUrl,
        description: page.description,
        about: page.primaryService,
        mainEntity: { "@id": serviceEntityId },
        audience: {
          "@type": "PeopleAudience",
          geographicArea: page.nearbyAreas
        },
        provider: {
          "@type": ["Hospital", "MedicalClinic"],
          "@id": hospitalEntityId,
          name: site.name,
          url: site.url,
          telephone: site.mobile,
          address: {
            "@type": "PostalAddress",
            streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
            addressLocality: site.city,
            addressRegion: site.region,
            postalCode: site.postalCode,
            addressCountry: site.country
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: site.latitude,
            longitude: site.longitude
          },
          medicalSpecialty: ["Gastroenterology", "Hepatology", "Endoscopy"],
          hasMap: site.directionsUrl
        },
        mainContentOfPage: detail?.careDifference
      },
      {
        "@type": "Service",
        "@id": serviceEntityId,
        name: page.title,
        serviceType: page.primaryService,
        description: page.description,
        url: pageUrl,
        provider: { "@id": hospitalEntityId },
        areaServed: page.nearbyAreas.map((area) => ({
          "@type": "Place",
          name: area
        })),
        availableChannel: {
          "@type": "ServiceChannel",
          servicePhone: site.mobile,
          serviceUrl: `${site.url}/contact`
        }
      },
      ...(detail?.faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: detail.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer }
              }))
            }
          ]
        : []),
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: page.title, url: `/areas/${page.slug}` }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              Local Gastro Care
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-[0.98] md:text-6xl">{page.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl">{page.hero}</p>
            <AppointmentCtaPanel className="mt-8 max-w-3xl" />
          </div>

          <div className="rounded border border-white/20 bg-white/12 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
            <div className="mb-5 flex items-center gap-3">
              <BrandIconTile className="h-12 w-12 bg-cyan-100/15" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Primary Focus</p>
                <h2 className="text-2xl font-black">{page.shortTitle}</h2>
              </div>
            </div>
            <div className="grid gap-3">
              {page.patientIntent.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded border border-white/14 bg-white/10 p-4 text-sm font-bold text-white/88">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-100" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showOpdTimingCard ? (
        <Section className="overflow-hidden">
          <HeroOpdTimingCard />
        </Section>
      ) : null}

      <Section>
        <SectionHead eyebrow="Local Care Guide" title={`${page.shortTitle} near you`}>
          <p>{page.description}</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
          <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
            <BrandIconTile className="mb-5 h-14 w-14" />
            <h2 className="text-3xl font-black leading-tight text-ink">Why patients choose this care</h2>
            <p className="mt-4 text-lg leading-8 text-muted">{page.localFocus}</p>
            {detail ? <p className="mt-4 text-lg leading-8 text-muted">{detail.careDifference}</p> : null}
            <div className="mt-6 grid gap-3">
              {(detail?.localHighlights ?? [
                { title: "Specialist care", text: "Specialist gastroenterology and liver care under one hospital setting." },
                { title: "Procedure planning", text: "Procedure planning support for endoscopy, colonoscopy, ERCP and FibroScan-related care." },
                { title: "Clear guidance", text: "Clear guidance for fasting, medicines, previous reports and urgent warning symptoms." }
              ]).map((item) => (
                <div key={item.title} className="flex gap-3 rounded border border-line bg-soft/55 p-4 text-muted">
                  <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={19} />
                  <span><strong className="text-ink">{item.title}:</strong> {item.text}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Hospital Location</p>
            <h2 className="mt-3 text-2xl font-black text-ink">Shaheed Nagar, Agra</h2>
            <p className="mt-3 leading-7 text-muted">{fullAddress}</p>
            {detail ? (
              <div className="mt-5 flex items-start gap-3 rounded border border-line bg-soft/55 p-4 text-muted">
                <Route className="mt-1 shrink-0 text-brand-dark" size={20} />
                <span>{detail.routeContext}</span>
              </div>
            ) : null}
            <div className="mt-5 flex items-start gap-3 rounded border border-line bg-soft/55 p-4 text-muted">
              <MapPin className="mt-1 shrink-0 text-brand-dark" size={20} />
              <span>Call reception before visiting for urgent symptoms such as vomiting blood, black stools, severe pain, fever with jaundice or breathing difficulty.</span>
            </div>
          </aside>
        </div>
      </Section>

      {detail ? (
        <Section muted>
          <SectionHead eyebrow="Before You Visit" title={`Prepare for ${page.shortTitle.toLowerCase()}`}>
            <p>These notes are specific to this local care pathway and help reception guide timing, reports and preparation.</p>
          </SectionHead>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-4">
            {detail.preparationNotes.map((note) => (
              <article key={note} className="rounded border border-line bg-white p-5 shadow-soft">
                <ShieldCheck className="mb-4 text-teal" size={22} />
                <p className="font-semibold leading-relaxed text-muted">{note}</p>
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      <Section muted>
        <SectionHead eyebrow="Related Care" title="Services and guides linked to this search">
          <p>These pages help patients understand the related care pathway before booking a visit.</p>
        </SectionHead>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-4">
          {page.relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex min-h-28 items-center justify-between gap-4 rounded border border-line bg-white p-5 text-lg font-black text-ink shadow-soft transition hover:-translate-y-1 hover:border-cyan-200 hover:text-brand-dark"
            >
              <span>{link.label}</span>
              <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={20} />
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Areas Served" title="Patients commonly visit from">
          <p>This page is focused on high-intent local searches around Agra and nearby care areas.</p>
        </SectionHead>
        <div className="flex flex-wrap gap-3">
          {page.nearbyAreas.map((area) => (
            <span key={area} className="rounded-full border border-[#bfe5ea] bg-[#eefbfb] px-5 py-3 text-base font-black text-teal-dark">
              {area}
            </span>
          ))}
        </div>
      </Section>

      {detail?.faqs.length ? (
        <Section muted>
          <SectionHead eyebrow="Local FAQs" title={`Common questions about ${page.shortTitle.toLowerCase()}`} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
            {detail.faqs.map((faq) => (
              <details key={faq.question} className="group rounded border border-line bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-start gap-3 font-black text-ink">
                  <HelpCircle className="mt-1 shrink-0 text-brand-dark" size={18} />
                  <span>{faq.question}</span>
                </summary>
                <p className="mt-3 pl-8 leading-relaxed text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : null}

      <Section muted>
        <LocalProminencePanel compact />
      </Section>

      <Section muted>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Book / Call / Directions</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Need help choosing the right next step?</h2>
            <p className="mt-3 max-w-3xl text-muted">
              Share symptoms, previous reports and current medicines with reception. The team can guide appointment timing, preparation and whether urgent review is needed.
            </p>
          </div>
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>
    </main>
  );
}
