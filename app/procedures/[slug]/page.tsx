import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { Section, SectionHead } from "@/components/Section";
import { procedures, site } from "@/lib/site-data";

type ProcedurePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return procedures.map((procedure) => ({ slug: procedure.slug }));
}

export async function generateMetadata({ params }: ProcedurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const procedure = procedures.find((item) => item.slug === slug);

  if (!procedure) return {};

  return {
    title: `${procedure.title} in Agra`,
    description: `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
    alternates: { canonical: `/procedures/${procedure.slug}` }
  };
}

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const { slug } = await params;
  const procedure = procedures.find((item) => item.slug === slug);
  if (!procedure) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: procedure.title,
    description: procedure.summary,
    procedureType: "Gastroenterology procedure",
    bodyLocation: "Gastrointestinal tract",
    provider: {
      "@type": "Hospital",
      name: site.name,
      url: site.url
    }
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Gastroenterology Hospital in Agra</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">{procedure.title} in Agra</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85" data-en>{procedure.summary}</p>
          <p className="mt-5 max-w-3xl text-lg text-white/85" data-hi>{procedure.hiSummary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
            <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
            <ButtonLink href={`tel:${site.phone}`} variant="ghost">Call {site.phone}</ButtonLink>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Procedure Overview</p>
            <h2 className="text-4xl font-black leading-tight md:text-5xl">Specialized {procedure.title} care by a gastroenterology team</h2>
            <p className="mt-5 text-muted">
              Mudgal Gastromedics Hospital provides evaluation, counselling and procedure planning for {procedure.title.toLowerCase()} with attention to safety, comfort and follow-up care.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Gastroenterologist in Agra", "Liver specialist in Agra", "Endoscopy centre in Agra", "ERCP specialist in Agra"].map((tag) => (
                <span key={tag} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-sm font-black text-teal-dark">{tag}</span>
              ))}
            </div>
          </div>
          <article className="overflow-hidden rounded border border-line bg-white shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <Image src="/placeholders/endoscopy-room.svg" alt={`${procedure.title} facility dummy photo`} width={1200} height={900} />
            <div className="p-6">
              <h3 className="text-2xl font-black">When to consult</h3>
              <p className="mt-2 text-muted">Persistent digestive symptoms, bleeding, jaundice, liver concerns, abdominal pain, swallowing difficulty, unexplained anemia or doctor-advised screening should be evaluated promptly.</p>
            </div>
          </article>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Care Pathway" title="What patients can expect" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Clinical evaluation", "History, examination and review of prior reports before recommending the next step."],
            ["Procedure planning", "Clear instructions about preparation, fasting, medicines and attendant requirements."],
            ["Follow-up support", "Reports, biopsy guidance if needed and a personalized treatment plan after the procedure."]
          ].map(([title, text]) => (
            <div key={title} className="rounded border border-line bg-white p-6">
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand />
    </main>
  );
}
