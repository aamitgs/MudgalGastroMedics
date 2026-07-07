import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Award, CalendarCheck, CheckCircle2, ClipboardList, FileText, GraduationCap, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ButtonLink } from "@/components/ButtonLink";
import { GalleryGrid } from "@/components/GalleryGrid";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, Eyebrow } from "@/components/Section";
import { Stats } from "@/components/Stats";
import { getPublicGalleryItems, getPublicProcedures } from "@/lib/cms-public";
import { doctor, equipment, patientFacilities, site, whyChoose } from "@/lib/site-data";

export default async function Home() {
  const procedures = await getPublicProcedures();
  const galleryItems = await getPublicGalleryItems();
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
  const procedureBadges = ["Diagnostic", "Therapeutic", "Liver Care", "Screening", "Access", "Support"];
  const trustReasons = [
    {
      title: "Specialist-led decisions",
      text: "Consultation and procedure planning are guided by gastroenterology and hepatology expertise.",
      icon: Stethoscope
    },
    {
      title: "Advanced endoscopy focus",
      text: "Upper GI, colonoscopy, ERCP and therapeutic endoscopy care are handled through a focused workflow.",
      icon: Activity
    },
    {
      title: "Clear patient pathway",
      text: "Preparation, procedure expectations, reports and follow-up steps are explained before discharge.",
      icon: FileText
    },
    {
      title: "Accessible hospital setup",
      text: "Lift, wheelchair access, pharmacy and waiting support help patients and attendants move comfortably.",
      icon: HeartPulse
    }
  ];
  const patientJourney = [
    {
      title: "Consultation",
      text: "Symptoms, history and prior reports are reviewed before advising tests or procedures.",
      icon: Stethoscope
    },
    {
      title: "Preparation",
      text: "Fasting, medicines, attendant needs and recovery guidance are explained clearly.",
      icon: ClipboardList
    },
    {
      title: "Follow-up",
      text: "Reports, biopsy guidance and treatment planning are discussed after the procedure.",
      icon: FileText
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
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/82" data-hi lang="hi">
              आगरा में एंडोस्कोपी, लिवर केयर, ईआरसीपी, कोलोनोस्कोपी और उन्नत गैस्ट्रो उपचार के लिए सुपरस्पेशियलिटी सेंटर।
            </p>
            <div className="mt-8 flex max-w-[620px] flex-wrap gap-3">
              <ButtonLink href="/contact#appointment" className="min-h-14 px-7 text-lg">Book Appointment</ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-h-14 px-7 text-lg">WhatsApp</ButtonLink>
              <ButtonLink href={site.directionsUrl} variant="ghost" className="min-h-14 border-white/25 bg-white/95 px-7 text-lg text-ink">Get Directions</ButtonLink>
            </div>
          </MotionReveal>
        </div>
      </section>

      <Section className="relative z-10 pt-12 md:pt-14">
        <MotionReveal>
          <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Consultation Camp</span>
              </div>
              <h2 className="max-w-4xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
                Stomach, Intestine & Liver Consultation and Check-Up Camp
              </h2>
              <p className="mt-4 max-w-3xl text-2xl font-bold leading-tight text-brand md:text-4xl" lang="hi">
                पेट, आंत और लिवर परामर्श एवं जांच शिविर
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} className="min-h-12 px-6">
                Call Now
              </ButtonLink>
              <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="min-h-12 px-6">
                WhatsApp
              </ButtonLink>
              <ButtonLink href="/blog/stomach-intestine-liver-consultation-check-up-camp" variant="ghost" className="min-h-12 px-6">
                Read Blog Post
              </ButtonLink>
            </div>
          </div>
          <div className="overflow-hidden rounded border border-line/80 bg-white p-2 shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
            <Image
              src="/images/hospital/campbanner.jpeg"
              alt="Mudgal Gastromedics stomach, intestine and liver consultation and check-up camp banner"
              width={1600}
              height={810}
              sizes="(min-width: 1180px) 1180px, calc(100vw - 32px)"
              className="h-auto w-full rounded object-cover"
              priority
            />
          </div>
        </MotionReveal>
      </Section>

      <Section className="relative z-10 pt-12 md:pt-14">
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
                  <div className="absolute right-5 top-5 hidden w-36 overflow-hidden rounded-xl border border-white/55 bg-white p-1 shadow-[0_22px_60px_rgba(2,22,29,0.32)] sm:block lg:w-40">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-soft">
                      <Image
                        src="/images/hospital/dr-deepak-kumar-sharma.jpg"
                        alt="Dr. Deepak Kumar Sharma"
                        fill
                        sizes="160px"
                        className="object-cover object-[52%_18%]"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div className="max-w-xl rounded border border-white/20 bg-white/94 p-5 text-ink shadow-[0_24px_70px_rgba(2,22,29,0.28)] backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-soft shadow-[0_14px_32px_rgba(8,64,84,0.18)] sm:hidden">
                          <Image
                            src="/images/hospital/dr-deepak-kumar-sharma.jpg"
                            alt="Dr. Deepak Kumar Sharma"
                            fill
                            sizes="80px"
                            className="object-cover object-[52%_18%]"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Lead Gastroenterologist</p>
                          <h2 className="mt-2 text-3xl font-bold leading-tight">{doctor.name}</h2>
                          <p className="mt-2 text-base leading-relaxed text-muted">{doctor.designation}</p>
                        </div>
                      </div>
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

      <Section id="procedures" className="overflow-hidden">
        <div className="relative">
          <div aria-hidden="true" className="absolute -right-24 -top-16 hidden h-64 w-64 rounded-full border border-line/70 bg-soft/50 lg:block" />
          <div className="relative mb-10 grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Treatments</span>
              </div>
              <h2 className="max-w-3xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
                Advanced procedures, organized around clear care decisions.
              </h2>
            </div>
            <div className="grid gap-4">
              <p className="max-w-2xl text-lg leading-relaxed text-muted">
                Focused gastroenterology, hepatology and therapeutic endoscopy services with dedicated patient information and appointment pathways.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  [CalendarCheck, "Planned consult"],
                  [Stethoscope, "Specialist procedure"],
                  [FileText, "Report guidance"]
                ].map(([Icon, label]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-full border border-line bg-white/85 px-4 py-3 text-sm font-semibold text-teal-dark shadow-sm">
                    <Icon className="text-brand" size={18} />
                    <span>{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {procedures.slice(0, 9).map((procedure, index) => (
              <MotionReveal key={procedure.slug} className="h-full" delay={Math.min(index * 0.03, 0.18)}>
                <Link
                  href={`/procedures/${procedure.slug}`}
                  className="group relative isolate flex h-full min-h-[285px] flex-col overflow-hidden rounded border border-line/80 bg-white p-6 shadow-[0_18px_55px_rgba(8,64,84,0.08)] transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_28px_80px_rgba(8,64,84,0.14)]"
                >
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-teal opacity-75" />
                  <div aria-hidden="true" className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-soft transition duration-300 group-hover:scale-125" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded border border-line bg-soft text-brand shadow-sm transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                      <Stethoscope size={21} />
                    </span>
                    <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {procedureBadges[index % procedureBadges.length]}
                    </span>
                  </div>
                  <div className="relative mt-8 flex flex-1 flex-col">
                    <span className="mb-4 text-sm font-semibold text-brand">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="inline-lang text-2xl font-bold leading-tight text-ink">
                      <span data-en>{procedure.title}</span>
                      <span data-hi lang="hi">{procedure.hiTitle}</span>
                    </h3>
                    <p className="mt-4 leading-relaxed text-muted" data-en>{procedure.summary}</p>
                    <p className="mt-4 leading-relaxed text-muted" data-hi lang="hi">{procedure.hiSummary}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-brand">
                      View patient guide <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </MotionReveal>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {treatmentGroups.map((group) => (
              <div key={group.title} className="rounded border border-line/80 bg-[linear-gradient(180deg,#ffffff,#f7fbfb)] p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">{group.title}</h3>
                <div className="mt-4 grid gap-2">
                  {group.links.map((procedure) => (
                    <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="group flex items-center justify-between rounded border border-transparent px-3 py-2 text-sm font-medium text-muted transition hover:border-line hover:bg-white hover:text-brand">
                      <span>{procedure.title}</span>
                      <ArrowRight size={14} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section muted className="overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <MotionReveal>
            <div className="relative h-full overflow-hidden rounded border border-line/80 bg-[linear-gradient(135deg,#0b3a46,#0f766e)] p-7 text-white shadow-[0_28px_80px_rgba(8,64,84,0.18)] md:p-8">
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/15" />
              <div aria-hidden="true" className="absolute -bottom-20 right-12 h-56 w-56 rounded-full bg-cyan-200/10" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
                  <ShieldCheck size={15} /> Why Choose MGM
                </div>
                <h2 className="max-w-xl text-4xl font-bold leading-[1.07] md:text-5xl">
                  Patient-first gastro and liver care with specialist attention.
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78">
                  A focused centre for digestive, liver, pancreatic and biliary conditions, built around explanation, procedure readiness and practical follow-up.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {["Consultation", "Preparation", "Procedure", "Follow-up"].map((step, index) => (
                    <div key={step} className="rounded border border-white/16 bg-white/10 p-4 backdrop-blur">
                      <span className="text-sm font-semibold text-cyan-100">{String(index + 1).padStart(2, "0")}</span>
                      <p className="mt-2 font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MotionReveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustReasons.map(({ title, text, icon: Icon }, index) => (
              <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
                <article className="group h-full rounded border border-line/80 bg-white/90 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-soft">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded border border-line bg-soft text-teal transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                      <Icon size={21} />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-ink">{title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{text}</p>
                </article>
              </MotionReveal>
            ))}
            <MotionReveal className="sm:col-span-2" delay={0.18}>
              <div className="flex flex-wrap gap-2 rounded border border-line/80 bg-white/80 p-4 shadow-sm">
                {whyChoose.slice(0, 8).map((item) => (
                  <span key={item} className="rounded-full border border-line bg-soft/70 px-3 py-2 text-sm font-semibold text-teal-dark">
                    {item}
                  </span>
                ))}
              </div>
            </MotionReveal>
          </div>
        </div>
      </Section>

      <Section className="overflow-hidden">
        <div className="mb-9 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Facilities & Infrastructure</span>
            </div>
            <h2 className="max-w-4xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
              A clean, accessible hospital environment for focused clinical care.
            </h2>
          </div>
          <div className="max-w-xl lg:text-right">
            <p className="mb-5 text-lg leading-relaxed text-muted">
              Preview the entrance, reception, waiting areas and patient support spaces before your visit.
            </p>
            <ButtonLink href="/gallery" variant="ghost">View Gallery</ButtonLink>
          </div>
        </div>
        <GalleryGrid items={galleryItems.slice(0, 6)} />
        <div className="mt-7 rounded border border-line/80 bg-[linear-gradient(135deg,#ffffff,#f7fbfb)] p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Patient Comfort Supports</h3>
            <span className="text-sm font-medium text-muted">Designed for patients and attendants</span>
          </div>
          <div className="flex flex-wrap gap-2">
          {patientFacilities.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-teal-dark shadow-sm">
              <CheckCircle2 className="text-teal" size={16} />
              {item}
            </span>
          ))}
          </div>
        </div>
      </Section>

      <Section muted className="overflow-hidden">
        <div className="mb-9 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Technology</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
              Equipment selected for advanced endoscopy and liver care.
            </h2>
          </div>
          <div className="rounded border border-line/80 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-lg leading-relaxed text-muted">
              Clinical systems support diagnostic visualization, therapeutic endoscopy, fluoroscopy-guided care and non-invasive liver assessment.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Endoscopy", "Fluoroscopy", "Liver Assessment"].map((item) => (
                <span key={item} className="rounded-full border border-line bg-soft/70 px-3 py-2 text-center text-sm font-semibold text-teal-dark">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <MotionReveal className="h-full">
            <article className="relative isolate flex h-full min-h-[520px] flex-col overflow-hidden rounded border border-line/80 bg-white shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
              <div className="relative flex-1 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.2),transparent_30%),linear-gradient(135deg,#ffffff,#e9fbfb)] p-7">
                <div className="absolute right-5 top-5 z-10 rounded-full border border-brand/15 bg-white/90 px-3 py-1 text-xs font-semibold text-brand shadow-sm">Featured</div>
                <div className="relative h-full min-h-[330px]">
                  <Image
                    src={equipment[3]?.src ?? equipment[0].src}
                    alt={`${equipment[3]?.name ?? equipment[0].name} at Mudgal Gastromedics Hospital`}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain p-4"
                  />
                </div>
              </div>
              <div className="border-t border-line bg-white p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Procedure Support System</p>
                <h3 className="mt-3 text-3xl font-bold leading-tight text-ink">{equipment[3]?.name ?? equipment[0].name}</h3>
                <p className="mt-3 leading-relaxed text-muted">{equipment[3]?.benefits ?? equipment[0].benefits}</p>
              </div>
            </article>
          </MotionReveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {equipment.map((item, index) => (
              <MotionReveal key={item.name} className="h-full" delay={Math.min(index * 0.03, 0.18)}>
                <article className="group flex h-full flex-col rounded border border-line/80 bg-white/90 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-soft">
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded border border-line bg-[linear-gradient(135deg,#ffffff,#ecfeff)]">
                    <Image
                      src={item.src}
                      alt={`${item.name} at Mudgal Gastromedics Hospital`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute right-3 top-3 rounded-full border border-line bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-ink">{item.name}</h3>
                  <div className="mt-4 grid gap-3 text-sm text-muted">
                    <p><span className="font-semibold text-ink">Use:</span> {item.uses}</p>
                    <p><span className="font-semibold text-ink">Benefit:</span> {item.benefits}</p>
                  </div>
                </article>
              </MotionReveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Care Pathway</span>
            </div>
            <h2 className="max-w-2xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
              A clear journey from consult to recovery.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Every visit is organized around explanation, preparation and follow-up so patients know what to expect at each stage.
            </p>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-brand via-line to-teal md:block" />
            <div className="grid gap-4">
              {patientJourney.map(({ title, text, icon: Icon }, index) => (
                <MotionReveal key={title} delay={Math.min(index * 0.04, 0.12)}>
                  <article className="relative grid gap-4 rounded border border-line/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-brand hover:shadow-soft md:grid-cols-[auto_1fr] md:items-start md:pl-4">
                    <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-line bg-soft text-brand shadow-sm">
                      <Icon size={21} />
                    </span>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Step {String(index + 1).padStart(2, "0")}</span>
                        <span className="h-px w-10 bg-line" />
                      </div>
                      <h3 className="text-2xl font-bold leading-tight text-ink">{title}</h3>
                      <p className="mt-2 leading-relaxed text-muted">{text}</p>
                    </div>
                  </article>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section muted className="overflow-hidden">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Appointment Request</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
              Book a visit or reach reception directly.
            </h2>
          </div>
          <div className="rounded border border-line/80 bg-white/85 p-4 text-muted shadow-sm">
            <p className="font-semibold text-ink">Mon-Sat, 10 AM-6 PM</p>
            <p className="mt-1 text-sm">Shaheed Nagar, Agra</p>
          </div>
        </div>
        <div>
          <div id="appointment" className="overflow-hidden rounded border border-line/80 bg-white shadow-[0_28px_80px_rgba(8,64,84,0.12)]">
            <div className="border-b border-line bg-[linear-gradient(135deg,#ffffff,#ecfeff)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Appointment Request</p>
              <h3 className="mt-2 text-3xl font-bold text-ink">Share patient details</h3>
            </div>
            <div className="p-6">
              <AppointmentForm />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
