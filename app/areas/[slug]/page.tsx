import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/BrandIconTile";
import { HeroOpdTimingCard } from "@/components/HeroOpdTimingCard";
import { Section, SectionHead } from "@/components/Section";
import { getLocalSeoPage, localSeoPages } from "@/lib/local-seo-pages";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { fullAddress, site } from "@/lib/site-data";

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

  const title = `${page.title} | ${site.name}`;
  const url = `${site.url}/areas/${page.slug}`;

  return {
    title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: page.description,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: "/mgm-logo.png", width: 1200, height: 630, alt: site.name }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: ["/mgm-logo.png"]
    }
  };
}

export default async function LocalAreaPage({ params }: LocalAreaPageProps) {
  const { slug } = await params;
  const page = getLocalSeoPage(slug);
  if (!page) notFound();
  const showOpdTimingCard = opdTimingAreaSlugs.has(page.slug);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MedicalClinic", "LocalBusiness"],
        name: `${page.title} - ${site.name}`,
        url: `${site.url}/areas/${page.slug}`,
        description: page.description,
        telephone: site.mobile,
        priceRange: "₹₹",
        medicalSpecialty: ["Gastroenterology", "Hepatology", "Endoscopy"],
        address: {
          "@type": "PostalAddress",
          streetAddress: `${site.addressLine1}, ${site.addressLine2}`,
          addressLocality: site.city,
          addressRegion: site.region,
          postalCode: site.postalCode,
          addressCountry: site.country
        },
        areaServed: page.nearbyAreas,
        parentOrganization: {
          "@type": "Hospital",
          name: site.name,
          url: site.url
        },
        hasMap: site.directionsUrl
      },
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
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
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
        <SectionHead eyebrow="Local SEO Care Page" title={`${page.shortTitle} near you`}>
          <p>{page.description}</p>
        </SectionHead>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
            <BrandIconTile className="mb-5 h-14 w-14" />
            <h2 className="text-3xl font-black leading-tight text-ink">Why patients choose this care</h2>
            <p className="mt-4 text-lg leading-8 text-muted">{page.localFocus}</p>
            <div className="mt-6 grid gap-3">
              {[
                "Specialist gastroenterology and liver care under one hospital setting.",
                "Procedure planning support for endoscopy, colonoscopy, ERCP and FibroScan-related care.",
                "Clear guidance for fasting, medicines, previous reports and urgent warning symptoms."
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded border border-line bg-soft/55 p-4 text-muted">
                  <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={19} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Hospital Location</p>
            <h2 className="mt-3 text-2xl font-black text-ink">Shaheed Nagar, Agra</h2>
            <p className="mt-3 leading-7 text-muted">{fullAddress}</p>
            <div className="mt-5 flex items-start gap-3 rounded border border-line bg-soft/55 p-4 text-muted">
              <MapPin className="mt-1 shrink-0 text-brand" size={20} />
              <span>Call reception before visiting for urgent symptoms such as vomiting blood, black stools, severe pain, fever with jaundice or breathing difficulty.</span>
            </div>
          </aside>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Related Care" title="Services and guides linked to this search">
          <p>These pages help patients understand the related care pathway before booking a visit.</p>
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

      <Section muted>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Book / Call / Directions</p>
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
