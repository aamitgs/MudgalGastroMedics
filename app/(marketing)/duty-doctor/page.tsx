import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck, Clock3, Languages, Moon, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section, SectionHead } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { fullAddress, site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Dr. Dushyant Nagayach | Duty Doctor",
  description: "Profile, qualifications, registration, experience and duty timing for Dr. Dushyant Nagayach at Mudgal Gastromedics Hospital in Agra.",
  alternates: { canonical: "/duty-doctor" }
};

const dutyDoctorSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Physician",
      name: "Dr. Dushyant Nagayach",
      jobTitle: "Duty Medical Officer",
      medicalSpecialty: ["General Medicine", "Gastroenterology"],
      identifier: "H041809",
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
      url: `${site.url}/duty-doctor`
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Duty Doctor", url: "/duty-doctor" }
    ])
  ]
};

const dutyDoctorSupport = [
  { title: "Clinical support", description: "Initial assessment, inpatient coordination and escalation to the treating consultant when required.", icon: Stethoscope },
  { title: "Overnight availability", description: "Scheduled from 8:00 PM to 9:00 AM. Contact reception to confirm availability before visiting.", icon: Clock3 },
  { title: "Patient communication", description: "Guidance for patients and attendants regarding the next appropriate clinical step.", icon: Languages },
  { title: "Safe escalation", description: "Urgent or complex concerns are escalated according to the hospital's clinical process.", icon: ShieldCheck }
];

export default function DutyDoctorPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dutyDoctorSchema) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Medical Team</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Dr. Dushyant Nagayach</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">
              Duty Medical Officer supporting general medicine, gastroenterology care coordination and inpatient clinical needs.
            </p>
            <AppointmentCtaPanel className="mt-8 max-w-3xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Role", "Duty Medical Officer", UserRound],
              ["Duty Timing", "8 PM-9 AM", Moon],
              ["Experience", "4-5 years", CalendarCheck],
              ["Languages", "Hindi, English", Languages]
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="rounded border border-white/20 bg-white/12 p-4 shadow-[0_18px_45px_rgba(2,22,29,0.18)] backdrop-blur">
                <Icon className="mb-3 text-cyan-100" size={22} />
                <p className="text-xs font-black uppercase tracking-wider text-white/55">{label as string}</p>
                <p className="mt-1 font-black text-white">{value as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <div className="grid items-start gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <MotionReveal>
          <article className="overflow-hidden rounded border border-line bg-white shadow-lift">
            <div className="relative bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,#ecfeff,#ffffff)] p-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded bg-white shadow-[inset_0_0_0_1px_rgba(165,243,252,0.65)]">
                <Image
                  src="/images/hospital/dr-dushyant-nagayach.jpg"
                  alt="Dr. Dushyant Nagayach, Duty Medical Officer at Mudgal Gastromedics Hospital"
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="border-t border-line p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Duty Medical Officer</p>
                  <h2 className="mt-2 text-3xl font-black">Dr. Dushyant Nagayach</h2>
                  <p className="mt-2 font-bold text-teal-dark">BHMS (RAU)</p>
                  <p className="mt-1 text-sm text-muted">Registration No. H041809</p>
                </div>
                <span className="rounded-full border border-teal/20 bg-soft px-3 py-1 text-xs font-black uppercase tracking-wider text-teal-dark">Night Duty</span>
              </div>
            </div>
          </article>
          </MotionReveal>

          <MotionReveal delay={0.08}>
          <div className="rounded border border-line bg-white p-6 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Profile</p>
            <h2 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Duty doctor profile</h2>
            <p className="mt-5 text-muted">
              Dr. Dushyant Nagayach provides overnight duty doctor support and coordinates with the consultant gastroenterology team according to clinical need.
            </p>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded border border-line bg-soft/70 p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Experience</dt>
                <dd className="mt-2 text-lg font-black">4–5 years</dd>
              </div>
              <div className="rounded border border-line bg-soft/70 p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Duty Timing</dt>
                <dd className="mt-2 text-lg font-black">8:00 PM–9:00 AM</dd>
              </div>
              <div className="rounded border border-line bg-soft/70 p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Specialties</dt>
                <dd className="mt-2 text-lg font-black">General Medicine &amp; Gastroenterology</dd>
              </div>
              <div className="rounded border border-line bg-soft/70 p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Languages</dt>
                <dd className="mt-2 text-lg font-black">Hindi, English</dd>
              </div>
            </dl>
          </div>
          </MotionReveal>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Duty Support" title="How the duty doctor supports patients">
          <p>Clear initial assessment, overnight coordination and escalation to the consultant team when clinically needed.</p>
        </SectionHead>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dutyDoctorSupport.map(({ title, description, icon: Icon }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
            <article className="group h-full rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded bg-soft text-brand-dark transition group-hover:bg-brand group-hover:text-white">
                <Icon size={25} />
              </span>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-dark">Need assistance?</p>
            <h2 className="mt-2 text-3xl font-black">Call reception before visiting for duty availability.</h2>
            <p className="mt-2 max-w-2xl text-muted">Duty timing and immediate care needs should be confirmed with reception, especially for urgent symptoms or after-hours visits.</p>
          </div>
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>

    </main>
  );
}
