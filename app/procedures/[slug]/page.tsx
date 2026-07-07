import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarCheck, ClipboardList, FileText, HeartPulse, MessageCircle, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";
import { getPublicProcedure, getPublicProcedures } from "@/lib/cms-public";
import { site } from "@/lib/site-data";

type ProcedurePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return (await getPublicProcedures()).map((procedure) => ({ slug: procedure.slug }));
}

export async function generateMetadata({ params }: ProcedurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);

  if (!procedure) return {};

  return {
    title: procedure.seoTitle || `${procedure.title} in Agra`,
    description: procedure.seoDescription || `${procedure.title} at Mudgal Gastromedics Hospital, Agra. ${procedure.summary}`,
    alternates: { canonical: `/procedures/${procedure.slug}` }
  };
}

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  const { slug } = await params;
  const procedure = await getPublicProcedure(slug);
  if (!procedure) notFound();
  const isBleeding = procedure.slug === "gastrointestinal-bleeding-management";

  const heroImage = isBleeding ? "/images/hospital/cbd-stone-removal.jpg" : "/images/hospital/endoscopy-room.jpg";
  const quickFacts = [
    ["Specialty", "Gastroenterology"],
    ["Care Type", isBleeding ? "Urgent endoscopic care" : "Consultation and procedure planning"],
    ["Location", "Shaheed Nagar, Agra"],
    ["Appointment", "Call or WhatsApp reception"]
  ];
  const consultCues = isBleeding
    ? [
        "Vomiting blood or coffee-ground material",
        "Black stools, red blood in stool or unexplained anemia",
        "Dizziness, weakness or recurrent bleeding symptoms",
        "Known liver disease with suspected variceal bleeding"
      ]
    : [
        "Persistent digestive symptoms or abdominal pain",
        "Jaundice, swallowing difficulty or bowel habit changes",
        "Unexplained anemia, bleeding symptoms or abnormal reports",
        "Doctor-advised screening, biopsy or procedure follow-up"
      ];

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
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Gastroenterology Hospital in Agra</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">{procedure.title} in Agra</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-en>{procedure.summary}</p>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85" data-hi lang="hi">{procedure.hiSummary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact#appointment" className="gap-2"><CalendarCheck size={18} /> Book Appointment</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="gap-2"><MessageCircle size={18} /> WhatsApp</ButtonLink>
              <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="gap-2 border-white/25 bg-white/95 text-ink"><Phone size={18} /> Call {site.mobile}</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/20 bg-white/12 p-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Quick Information</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickFacts.map(([label, value]) => (
                <div key={label} className="rounded border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-white/55">{label}</p>
                  <p className="mt-1 font-black text-white">{value}</p>
                </div>
              ))}
            </div>
            {isBleeding ? (
              <div className="mt-4 flex gap-3 rounded border border-red-300/30 bg-red-600/20 p-4 text-sm leading-relaxed text-white/85">
                <AlertCircle className="mt-0.5 shrink-0 text-red-100" size={19} />
                <p>Severe or active bleeding symptoms need immediate medical attention. Call reception or local emergency services urgently.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <div className="grid items-start gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <MotionReveal>
          <article className="overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="relative aspect-[4/3] bg-soft">
              <Image src={heroImage} alt={`${procedure.title} facility at Mudgal Gastromedics Hospital`} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Procedure Overview</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">Specialized {procedure.title} care by a gastroenterology team</h2>
              <p className="mt-4 text-muted">
                Mudgal Gastromedics Hospital provides evaluation, counselling and procedure planning for {procedure.title.toLowerCase()} with attention to safety, comfort and follow-up care.
              </p>
            </div>
          </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
          <div className="grid gap-5">
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded bg-soft text-brand">
                <Stethoscope size={24} />
              </div>
              <h2 className="text-3xl font-black leading-tight">When to consult</h2>
              <div className="mt-5 grid gap-3">
                {consultCues.map((cue) => (
                  <div key={cue} className="flex gap-3 rounded border border-line bg-soft/60 p-3 text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                    <span>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-xl font-black">Related search terms</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Gastroenterologist in Agra", "Liver specialist in Agra", "Endoscopy centre in Agra", "ERCP specialist in Agra"].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-sm font-black text-teal-dark">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Care Pathway" title="What patients can expect" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { title: "Clinical evaluation", text: "History, examination and review of prior reports before recommending the next step.", icon: ClipboardList },
            { title: "Procedure planning", text: "Clear instructions about preparation, fasting, medicines and attendant requirements.", icon: HeartPulse },
            { title: "Follow-up support", text: "Reports, biopsy guidance if needed and a personalized treatment plan after the procedure.", icon: FileText }
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
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Need guidance?</p>
            <h2 className="mt-2 text-3xl font-black">Talk to reception before planning your visit.</h2>
            <p className="mt-2 max-w-2xl text-muted">Share symptoms, prior reports and preferred appointment timing so the hospital team can guide the next step.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact#appointment">Book Appointment <ArrowRight size={18} /></ButtonLink>
            <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
