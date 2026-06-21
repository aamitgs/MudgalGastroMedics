import type { Metadata } from "next";
import Image from "next/image";
import { Clock3, Languages, ShieldCheck, Stethoscope } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { Section } from "@/components/Section";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Dr. Dushyant Nagayach | Duty Doctor",
  description: "Profile, qualifications, registration, experience and duty timing for Dr. Dushyant Nagayach at Mudgal Gastromedics Hospital in Agra.",
  alternates: { canonical: "/duty-doctor" }
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
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Medical Team</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Dr. Dushyant Nagayach</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            Duty Medical Officer supporting general medicine, gastroenterology care coordination and inpatient clinical needs.
          </p>
        </div>
      </section>

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="overflow-hidden rounded border border-line bg-white shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
            <Image
              src="/images/hospital/dr-dushyant-nagayach.jpg"
              alt="Dr. Dushyant Nagayach, Duty Medical Officer at Mudgal Gastromedics Hospital"
              width={1600}
              height={900}
              className="h-auto w-full"
              priority
            />
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-gold">Duty Medical Officer</p>
              <h2 className="mt-2 text-3xl font-black">Dr. Dushyant Nagayach</h2>
              <p className="mt-2 font-bold text-teal-dark">BHMS (RAU)</p>
              <p className="mt-1 text-sm text-muted">Registration No. H041809</p>
            </div>
          </article>

          <div>
            <h2 className="text-4xl font-black leading-tight md:text-5xl">Duty doctor profile</h2>
            <p className="mt-5 text-muted">
              Dr. Dushyant Nagayach provides overnight duty doctor support and coordinates with the consultant gastroenterology team according to clinical need.
            </p>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded border border-line bg-white p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Experience</dt>
                <dd className="mt-2 text-lg font-black">4–5 years</dd>
              </div>
              <div className="rounded border border-line bg-white p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Duty Timing</dt>
                <dd className="mt-2 text-lg font-black">8:00 PM–9:00 AM</dd>
              </div>
              <div className="rounded border border-line bg-white p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Specialties</dt>
                <dd className="mt-2 text-lg font-black">General Medicine &amp; Gastroenterology</dd>
              </div>
              <div className="rounded border border-line bg-white p-5">
                <dt className="text-sm font-black uppercase tracking-wide text-muted">Languages</dt>
                <dd className="mt-2 text-lg font-black">Hindi, English</dd>
              </div>
            </dl>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {dutyDoctorSupport.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded border border-line bg-soft p-5">
                  <Icon className="mb-3 text-teal" size={25} />
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-2 text-sm text-muted">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`tel:${site.phone}`}>Call Reception</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              <ButtonLink href="/contact#appointment" variant="ghost">Book Appointment</ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
