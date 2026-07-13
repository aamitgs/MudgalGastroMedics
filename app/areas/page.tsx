import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { LocalProminencePanel } from "@/components/site/LocalProminencePanel";
import { Section, SectionHead } from "@/components/site/Section";
import { localSeoPages } from "@/lib/local-seo-pages";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { fullAddress, hospitalEntityId, site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Local Gastroenterology Care Areas | ${site.name}`,
  description:
    "Find local gastroenterology, liver care, endoscopy, colonoscopy, ERCP and FibroScan guidance pages for Agra, Shaheed Nagar, Fatehabad Road, Tajganj, Agra Cantt and nearby areas.",
  alternates: { canonical: "/areas" },
  openGraph: {
    title: `Local Gastroenterology Care Areas | ${site.name}`,
    description:
      "Browse local care guides for gastroenterology, liver care, endoscopy, colonoscopy, ERCP and FibroScan services around Agra.",
    url: `${site.url}/areas`,
    siteName: site.name,
    type: "website",
    images: [{ url: "/mgm-logo.png", width: 1200, height: 630, alt: site.name }]
  }
};

export default function AreasHubPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Local Gastroenterology Care Areas",
        url: `${site.url}/areas`,
        description: metadata.description,
        about: ["Gastroenterology", "Hepatology", "Endoscopy", "Local medical care in Agra"],
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
          }
        },
        hasPart: localSeoPages.map((page) => ({
          "@type": "MedicalWebPage",
          name: page.title,
          url: `${site.url}/areas/${page.slug}`,
          description: page.description
        }))
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Local Care Areas", url: "/areas" }
      ])
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1fr_0.82fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              Local Care Areas
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">
              Gastro, liver and endoscopy care around Agra.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/82 md:text-xl">
              Browse local guides for common searches around Shaheed Nagar, Fatehabad Road, Tajganj, Agra Cantt and nearby care areas.
            </p>
            <AppointmentCtaPanel className="mt-8 max-w-3xl" />
          </div>

          <div className="rounded border border-white/20 bg-white/12 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
            <BrandIconTile className="mb-5 h-14 w-14 bg-cyan-100/15" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Hospital Location</p>
            <h2 className="mt-3 text-2xl font-black">{site.name}</h2>
            <p className="mt-3 leading-7 text-white/78">{fullAddress}</p>
            <div className="mt-5 flex items-start gap-3 rounded border border-white/14 bg-white/10 p-4 text-sm font-bold text-white/88">
              <MapPin className="mt-0.5 shrink-0 text-cyan-100" size={18} />
              <span>Call reception before visiting for vomiting blood, black stools, severe pain, fever with jaundice or persistent vomiting.</span>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHead eyebrow="Browse Local Guides" title="Choose the care page closest to your search">
          <p>Each guide explains the relevant symptoms, reports to bring, preparation notes and related care options.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {localSeoPages.map((page) => (
            <Link
              key={page.slug}
              href={`/areas/${page.slug}`}
              className="group flex h-full flex-col rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <BrandIconTile className="h-11 w-11" />
                <span className="rounded-full border border-line bg-soft px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-brand">
                  {page.primaryService}
                </span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-ink transition group-hover:text-brand">{page.title}</h2>
              <p className="mt-3 grow leading-relaxed text-muted">{page.description}</p>
              <div className="mt-5 grid gap-2">
                {page.patientIntent.slice(0, 3).map((item) => (
                  <span key={item} className="flex gap-2 text-sm font-semibold text-muted">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-teal" size={16} />
                    {item}
                  </span>
                ))}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 font-black text-brand">
                Open local guide <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section muted>
        <LocalProminencePanel />
      </Section>

      <Section muted>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Need Help Choosing?</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Share symptoms and reports with reception.</h2>
            <p className="mt-3 max-w-3xl text-muted">
              The team can guide whether to book a gastroenterology consultation, liver review, endoscopy, colonoscopy, ERCP or FibroScan-related visit.
            </p>
          </div>
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>
    </main>
  );
}
