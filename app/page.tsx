import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Award, CheckCircle2, GraduationCap, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { GalleryGrid } from "@/components/GalleryGrid";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead, Eyebrow } from "@/components/Section";
import { Stats } from "@/components/Stats";
import { doctor, equipment, fullAddress, galleryItems, patientFacilities, procedures, site, whyChoose } from "@/lib/site-data";

export default function Home() {
  const treatmentGroups = [
    {
      title: "Diagnostic Endoscopy",
      links: procedures.filter((procedure) => ["endoscopy", "colonoscopy", "enteroscopy", "fibroscan"].includes(procedure.slug))
    },
    {
      title: "Therapeutic Procedures",
      links: procedures.filter((procedure) => ["ercp", "cbd-stone-removal", "gi-stenting", "polypectomy", "stricture-dilation"].includes(procedure.slug))
    },
    {
      title: "Bleeding & Liver Care",
      links: procedures.filter((procedure) => ["gastrointestinal-bleeding-management", "variceal-banding", "sclerotherapy", "ascitic-fluid-tapping"].includes(procedure.slug))
    },
    {
      title: "Nutrition & Support",
      links: procedures.filter((procedure) => ["ryles-tube-placement", "nasojejunal-tube-placement", "peg-tube-placement", "intragastric-balloon-placement"].includes(procedure.slug))
    }
  ];

  return (
    <main>
      <section className="hero-bg overflow-hidden text-white">
        <div aria-hidden="true" className="pointer-events-none absolute right-8 top-24 hidden w-64 2xl:block">
          <div className="relative rounded border border-white/25 bg-white/12 px-5 py-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <div className="absolute -left-8 top-6 h-40 w-px bg-gradient-to-b from-transparent via-cyan-200/60 to-transparent" />
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-cyan-200/35 bg-cyan-100/15 text-cyan-100">
              <Activity size={20} />
            </div>
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/90">Specialist Care</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.1em] text-cyan-50/90">
              {["Liver Diseases", "Therapeutic Endoscopy", "Colonoscopy", "ERCP", "GI Cancer Screening", "Obesity Endoscopy", "Pancreatic Disorders"].map((item) => (
                <span key={item} className="border-l border-cyan-200/45 pl-3">{item}</span>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              <span className="h-1.5 w-10 rounded-full bg-cyan-200/70" />
              <span className="h-1.5 w-16 rounded-full bg-white/35" />
              <span className="h-1.5 w-8 rounded-full bg-teal/70" />
            </div>
          </div>
        </div>
        <div className="mx-auto grid min-h-[720px] w-[min(1280px,calc(100%-32px))] items-center gap-10 py-16 md:py-24">
          <MotionReveal className="max-w-[620px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 backdrop-blur">
              <ShieldCheck size={16} /> {site.secondaryTagline}
            </div>
            <h1 className="max-w-[11ch] text-5xl font-black leading-[0.94] tracking-tight sm:text-7xl">
              Mudgal Gastromedics Hospital
            </h1>
            <p className="mt-5 max-w-2xl text-2xl font-black leading-tight text-cyan-50 sm:text-4xl">Advanced Gastro, Liver & Endoscopy Care in Agra</p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/82" data-en>
              Mudgal Gastromedics Hospital provides focused care for digestive, liver, pancreatic and biliary diseases with modern endoscopy and patient-centered treatment planning.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/82" data-hi>
              आगरा में एंडोस्कोपी, लिवर केयर, ईआरसीपी, कोलोनोस्कोपी और उन्नत गैस्ट्रो उपचार के लिए सुपरस्पेशियलिटी सेंटर।
            </p>
            <div className="mt-8 flex max-w-[620px] flex-wrap gap-3">
              <ButtonLink href="/contact#appointment" className="min-h-14 px-7 text-lg">Book Appointment</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-h-14 px-7 text-lg">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost" className="min-h-14 border-white/25 bg-white/95 px-7 text-lg text-ink">Get Directions</ButtonLink>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Gastroenterology", "Hepatology", "Therapeutic Endoscopy"].map((item) => (
                <div key={item} className="rounded border border-white/20 bg-white/12 px-4 py-3 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </MotionReveal>
        </div>
      </section>

      <Section className="-mt-8 relative z-10 pt-0">
        <Stats />
      </Section>

      <Section id="doctor" muted className="overflow-hidden">
        <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] xl:gap-14">
          <MotionReveal>
            <article className="relative isolate overflow-hidden rounded border border-line/80 bg-white shadow-[0_30px_90px_rgba(8,47,73,0.14)]">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.18),transparent_24rem),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,254,255,0.86))]" />
              <div className="relative p-4 sm:p-6">
                <div className="relative isolate min-h-[470px] overflow-hidden rounded border border-white bg-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
                  <Image
                    src="/images/hospital/doctor-chamber.jpg"
                    alt="Consultation chamber at Mudgal Gastromedics Hospital"
                    fill
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,22,29,0.05)_0%,rgba(2,22,29,0.08)_42%,rgba(2,22,29,0.78)_100%)]" />
                  <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/25 bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                    <Award size={15} /> Consultant
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div className="max-w-xl rounded border border-white/20 bg-white/94 p-5 text-ink shadow-[0_24px_70px_rgba(2,22,29,0.28)] backdrop-blur-md">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Lead Gastroenterologist</p>
                      <h2 className="mt-2 text-3xl font-bold leading-tight">{doctor.name}</h2>
                      <p className="mt-2 text-base leading-relaxed text-muted">{doctor.designation}</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <span className="rounded-full border border-line bg-soft/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-teal-dark">{doctor.registration}</span>
                        <span className="rounded-full border border-line bg-soft/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-teal-dark">MGM 2019-Present</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["DM", "Gastroenterology"],
                    ["MD", "Medicine"],
                    ["16+", "Years clinical training"]
                  ].map(([value, label]) => (
                    <div key={label} className="rounded border border-line/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                      <p className="text-2xl font-bold leading-none text-ink">{value}</p>
                      <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="relative">
              <div aria-hidden="true" className="absolute -left-8 top-8 hidden h-32 w-1 rounded-full bg-gradient-to-b from-gold via-brand to-teal lg:block" />
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Doctor Profile</span>
              </div>
              <h2 className="max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-5xl">
                Focused care for digestive, liver and pancreato-biliary diseases.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                Specialist consultation for complex gastro, liver, pancreatic and biliary concerns with clear procedure planning and follow-up guidance.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {doctor.interests.map((interest) => (
                  <div key={interest} className="group flex items-center gap-3 rounded-full border border-line/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition hover:border-brand hover:bg-white">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-teal transition group-hover:bg-brand group-hover:text-white">
                      <ShieldCheck size={16} />
                    </span>
                    <span className="font-semibold text-teal-dark">{interest}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-3 border-l-2 border-brand/30 pl-5 text-muted">
                {doctor.education.slice(0, 2).map((item) => (
                  <div key={item} className="flex gap-3">
                    <GraduationCap className="mt-1 shrink-0 text-brand" size={18} />
                    <p className="font-medium leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex gap-3">
                  <Award className="mt-1 shrink-0 text-teal" size={18} />
                  <p className="font-medium leading-relaxed">{doctor.experience.join(" | ")}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
                <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              </div>
            </div>
          </MotionReveal>
        </div>
      </Section>

      <Section id="procedures">
        <SectionHead eyebrow="Treatments" title="Advanced procedures & treatments">
          <p>Major gastroenterology and liver procedures are organized for quick scanning, with dedicated pages for patient information and appointment flow.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {procedures.slice(0, 9).map((procedure, index) => (
            <MotionReveal key={procedure.slug} className="h-full" delay={Math.min(index * 0.03, 0.18)}>
            <Link href={`/procedures/${procedure.slug}`} className="group block h-full rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded bg-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                <Stethoscope size={20} />
              </span>
              <h3 className="inline-lang text-xl font-black">
                <span data-en>{procedure.title}</span>
                <span data-hi>{procedure.hiTitle}</span>
              </h3>
              <p className="mt-2 text-muted" data-en>{procedure.summary}</p>
              <p className="mt-2 text-muted" data-hi>{procedure.hiSummary}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand">Read more <ArrowRight size={16} /></span>
            </Link>
            </MotionReveal>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {treatmentGroups.map((group) => (
            <div key={group.title} className="rounded border border-line bg-soft/70 p-5">
              <h3 className="font-black text-ink">{group.title}</h3>
              <div className="mt-4 grid gap-2">
                {group.links.map((procedure) => (
                  <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="rounded bg-white px-3 py-2 text-sm font-black text-muted transition hover:text-brand">
                    {procedure.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Why Choose MGM" title="Patient-centered gastro and liver care" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.slice(0, 8).map((item, index) => (
            <MotionReveal key={item} className="h-full" delay={Math.min(index * 0.025, 0.16)}>
            <div className="h-full rounded border border-line bg-white p-6 shadow-soft">
              <ShieldCheck className="mb-3 text-teal" />
              <h3 className="text-lg font-black">{item}</h3>
              <p className="mt-2 text-muted">Premium, clean and clinically focused care pathway for patients and families.</p>
            </div>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Facilities & Infrastructure" title="Built for comfortable clinical care">
          <ButtonLink href="/gallery" variant="ghost">View Gallery</ButtonLink>
        </SectionHead>
        <GalleryGrid items={galleryItems.slice(0, 6)} />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {patientFacilities.map((item) => (
            <div key={item} className="rounded border border-line bg-white p-5 shadow-soft">
              <CheckCircle2 className="mb-3 text-teal" size={20} />
              <h3 className="font-black">{item}</h3>
              <p className="mt-2 text-sm text-muted">Designed to support safer, easier movement and waiting comfort for patients and attendants.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Technology" title="Modern medical equipment">
          <p>Clinical systems selected for advanced endoscopy, liver assessment, fluoroscopy support and therapeutic procedure safety.</p>
        </SectionHead>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {equipment.map((item, index) => (
            <MotionReveal key={item.name} className="h-full" delay={Math.min(index * 0.035, 0.18)}>
            <article className="group flex h-full flex-col overflow-hidden rounded border border-line/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <div className="relative isolate border-b border-line bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_32%),linear-gradient(135deg,#f7ffff,#e8fbfb)] p-5">
                <div className="absolute right-4 top-4 z-10 rounded-full border border-brand/15 bg-white/85 px-3 py-1 text-xs font-black text-brand shadow-sm backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="relative aspect-[4/3] rounded bg-white/85 shadow-[inset_0_0_0_1px_rgba(165,243,252,0.65)]">
                  <Image
                    src={item.src}
                    alt={`${item.name} at Mudgal Gastromedics Hospital`}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="mb-3 w-fit rounded-full bg-soft px-3 py-1 text-xs font-black uppercase tracking-wider text-teal-dark">Medical Technology</span>
                <h3 className="text-2xl font-black leading-tight text-ink">{item.name}</h3>
                <div className="mt-5 grid gap-4 text-muted">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-ink/55">Clinical Uses</p>
                    <p className="mt-1 leading-relaxed">{item.uses}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-ink/55">Patient Benefit</p>
                    <p className="mt-1 leading-relaxed">{item.benefits}</p>
                  </div>
                </div>
              </div>
            </article>
            </MotionReveal>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Care Pathway" title="A clear patient journey">
          <p>From consultation to follow-up, the care flow is built around explanation, preparation and comfort.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Consultation", "Symptoms, history and prior reports are reviewed before advising tests or procedures."],
            ["Procedure Preparation", "Fasting, medicines, attendant needs and recovery guidance are explained clearly."],
            ["Follow-up", "Reports, biopsy guidance and treatment planning are discussed after the procedure."]
          ].map(([title, text]) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded bg-soft text-brand">
                <CheckCircle2 size={20} />
              </span>
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="appointment" className="rounded border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-5 text-3xl font-black">Book your appointment</h2>
            <AppointmentForm />
          </div>
          <div className="rounded border border-line bg-white p-6 shadow-soft">
            <h2 className="text-3xl font-black">Visit MGM</h2>
            <p className="mt-2 text-muted">{fullAddress}</p>
            <div className="mt-4 flex items-start gap-3 text-muted"><MapPin className="text-brand" /> Landmark: Behind Shaheed Nagar Police Chowki</div>
            <iframe className="mt-5 h-80 w-full rounded border-0" src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mudgal Gastromedics Hospital map" />
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href={`tel:${site.phone}`}>Call</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost">Directions</ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
