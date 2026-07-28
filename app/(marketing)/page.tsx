import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Award, CalendarCheck, ClipboardList, FileText, GraduationCap, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BrandIconTile } from "@/components/site/BrandIconTile";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { MotionReveal } from "@/components/site/MotionReveal";
import { Section } from "@/components/site/Section";
import { Stats } from "@/components/site/Stats";
import { getPublicProcedures } from "@/lib/cms-public";
import { doctor, site, whyChoose } from "@/lib/site-data";

// Title/description/openGraph/keywords/icons are inherited from the root
// layout's metadata (this is the homepage, so they're already correct here);
// this only adds what the layout can't provide — a canonical URL for this
// specific route, matching every other page's explicit `alternates.canonical`.
export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default async function Home() {
  const procedures = await getPublicProcedures();
  const treatmentGroups = [
    {
      title: "Diagnostic Endoscopy",
      titleHi: "डायग्नोस्टिक एंडोस्कोपी",
      links: procedures.filter((procedure) => ["endoscopy", "colonoscopy", "enteroscopy", "fibroscan", "endoscopic-biopsy"].includes(procedure.slug))
    },
    {
      title: "Therapeutic Procedures",
      titleHi: "चिकित्सीय प्रक्रियाएं",
      links: procedures.filter((procedure) => [
        "polypectomy",
        "colon-polyp-removal",
        "stricture-dilation",
        "esophageal-dilation",
        "gi-stenting",
        "foreign-body-removal",
        "endoscopic-hemostasis",
        "argon-plasma-coagulation"
      ].includes(procedure.slug))
    },
    {
      title: "Pancreatic & Biliary Care",
      titleHi: "अग्न्याशय और पित्त संबंधी देखभाल",
      links: procedures.filter((procedure) => ["ercp", "cbd-stone-removal", "bile-duct-stenting", "pancreatic-duct-stone-removal"].includes(procedure.slug))
    },
    {
      title: "Liver, Bowel & Support",
      titleHi: "लिवर, आंत और सहायता",
      links: procedures.filter((procedure) => [
        "gastrointestinal-bleeding-management",
        "variceal-banding",
        "sclerotherapy",
        "ascitic-fluid-tapping",
        "ibs",
        "chronic-constipation",
        "chronic-diarrhea",
        "ryles-tube-placement",
        "nasojejunal-tube-placement",
        "peg-tube-placement",
        "intragastric-balloon-placement"
      ].includes(procedure.slug))
    }
  ];
  const procedureBadges = ["Diagnostic", "Therapeutic", "Liver Care", "Screening", "Access", "Support"];
  const trustReasons = [
    {
      title: "Specialist-led decisions",
      titleHi: "विशेषज्ञ-नेतृत्व वाले निर्णय",
      text: "Consultation and procedure planning are guided by gastroenterology and hepatology expertise.",
      textHi: "परामर्श और प्रक्रिया की योजना गैस्ट्रोएंटरोलॉजी और हेपेटोलॉजी विशेषज्ञता द्वारा निर्देशित होती है।",
      icon: Stethoscope
    },
    {
      title: "Advanced endoscopy focus",
      titleHi: "उन्नत एंडोस्कोपी फोकस",
      text: "Upper GI, colonoscopy, ERCP and therapeutic endoscopy care are handled through a focused workflow.",
      textHi: "अपर जीआई, कोलोनोस्कोपी, ईआरसीपी और चिकित्सीय एंडोस्कोपी देखभाल एक केंद्रित वर्कफ़्लो के माध्यम से संभाली जाती है।",
      icon: Activity
    },
    {
      title: "Clear patient pathway",
      titleHi: "स्पष्ट मरीज़ पथ",
      text: "Preparation, procedure expectations, reports and follow-up steps are explained before discharge.",
      textHi: "तैयारी, प्रक्रिया की अपेक्षाएं, रिपोर्ट और फॉलो-अप चरण डिस्चार्ज से पहले समझाए जाते हैं।",
      icon: FileText
    },
    {
      title: "Accessible hospital setup",
      titleHi: "सुलभ अस्पताल व्यवस्था",
      text: "Lift, wheelchair access, pharmacy and waiting support help patients and attendants move comfortably.",
      textHi: "लिफ्ट, व्हीलचेयर पहुंच, फार्मेसी और प्रतीक्षा सहायता मरीज़ों और परिजनों को आराम से आवागमन में मदद करती है।",
      icon: HeartPulse
    }
  ];
  const patientJourney = [
    {
      title: "Consultation",
      titleHi: "परामर्श",
      text: "Symptoms, history and prior reports are reviewed before advising tests or procedures.",
      textHi: "जांच या प्रक्रिया की सलाह देने से पहले लक्षण, इतिहास और पिछली रिपोर्ट की समीक्षा की जाती है।",
      icon: Stethoscope
    },
    {
      title: "Preparation",
      titleHi: "तैयारी",
      text: "Fasting, medicines, attendant needs and recovery guidance are explained clearly.",
      textHi: "उपवास, दवाएं, परिजन की आवश्यकताएं और रिकवरी मार्गदर्शन स्पष्ट रूप से समझाया जाता है।",
      icon: ClipboardList
    },
    {
      title: "Follow-up",
      titleHi: "फॉलो-अप",
      text: "Reports, biopsy guidance and treatment planning are discussed after the procedure.",
      textHi: "प्रक्रिया के बाद रिपोर्ट, बायोप्सी मार्गदर्शन और उपचार योजना पर चर्चा की जाती है।",
      icon: FileText
    }
  ];

  return (
    <main>
      <section className="hero-bg overflow-hidden text-white">
        <div aria-hidden="true" className="pointer-events-none absolute right-8 top-24 hidden w-64 2xl:block">
          <div className="relative rounded border border-white/25 bg-white/12 px-5 py-5 shadow-[0_24px_70px_rgba(2,22,29,0.22)] backdrop-blur-md">
            <div className="absolute -left-8 top-6 h-40 w-px bg-gradient-to-b from-transparent via-cyan-200/60 to-transparent" />
            <BrandIconTile className="mb-4 h-10 w-10 rounded-full border border-cyan-200/35 bg-cyan-100/15" />
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
          <MotionReveal className="max-w-[560px] rounded-lg border border-white/25 bg-[rgba(3,31,38,0.84)] p-5 shadow-[0_34px_100px_rgba(2,22,29,0.52),inset_0_1px_0_rgba(255,255,255,0.16)] ring-1 ring-cyan-100/10 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/40 bg-[rgba(255,255,255,0.12)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur">
              <ShieldCheck size={16} /> {site.secondaryTagline}
              </div>
              <span className="h-px min-w-16 flex-1 bg-gradient-to-r from-gold/90 via-cyan-200/60 to-transparent" />
            </div>
            <h1 className="max-w-[11ch] text-4xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_5px_18px_rgba(0,0,0,0.34)] sm:text-6xl">
              Mudgal Gastromedics Hospital
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-1.5 w-20 rounded-full bg-gold" />
              <span className="h-1.5 w-10 rounded-full bg-cyan-300" />
              <span className="h-1.5 w-6 rounded-full bg-teal" />
            </div>
            <p className="mt-6 max-w-xl text-2xl font-black leading-tight text-cyan-50 drop-shadow-[0_3px_14px_rgba(0,0,0,0.24)] sm:text-3xl">Advanced Gastro, Liver & Endoscopy Care in Agra</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/86" data-en>
              Mudgal Gastromedics Hospital provides focused care for digestive, liver, pancreatic and biliary diseases with modern endoscopy and patient-centered treatment planning.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/86" data-hi lang="hi">
              आगरा में एंडोस्कोपी, लिवर केयर, ईआरसीपी, कोलोनोस्कोपी और उन्नत गैस्ट्रो उपचार के लिए सुपरस्पेशियलिटी सेंटर।
            </p>
            <AppointmentCtaPanel className="mt-8" />
          </MotionReveal>
        </div>
      </section>

      <Section className="relative z-10 !bg-white pt-8 md:pt-10">
        <MotionReveal className="w-full">
          <HeroOpdTimingCard />
        </MotionReveal>
      </Section>

      <Section className="relative z-10 pt-8 md:pt-10">
        <Stats />
      </Section>

      <Section id="doctor" muted className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] xl:gap-14">
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
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-dark">Lead Gastroenterologist</p>
                          <h2 className="mt-2 text-3xl font-bold leading-tight">{doctor.name}</h2>
                          <p className="mt-2 text-base leading-relaxed text-muted">{doctor.designation}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                        <span className="rounded-full border border-line bg-soft/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-teal-dark">{doctor.registration}</span>
                        <span className="rounded-full border border-line bg-soft/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-teal-dark">MGM 2019-Present</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
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
                <span className="inline-lang text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">
                  <span data-en>Doctor Profile</span>
                  <span data-hi lang="hi">डॉक्टर प्रोफ़ाइल</span>
                </span>
              </div>
              <h2 className="inline-lang max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-5xl">
                <span data-en>Focused care for digestive, liver and pancreato-biliary diseases.</span>
                <span data-hi lang="hi">पाचन, लिवर और पैंक्रियाटो-बिलियरी रोगों के लिए केंद्रित देखभाल।</span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted" data-en>
                Specialist consultation for complex gastro, liver, pancreatic and biliary concerns with clear procedure planning and follow-up guidance.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted" data-hi lang="hi">
                स्पष्ट प्रक्रिया योजना और फॉलो-अप मार्गदर्शन के साथ जटिल गैस्ट्रो, लिवर, अग्न्याशय और पित्त संबंधी चिंताओं के लिए विशेषज्ञ परामर्श।
              </p>
              <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                {doctor.interests.map((interest) => (
                  <div key={interest} className="group flex items-center gap-3 rounded-full border border-line/90 bg-white/75 px-4 py-3 shadow-sm backdrop-blur transition hover:border-brand hover:bg-white">
                    <BrandIconTile className="h-8 w-8 shrink-0 rounded-full transition group-hover:bg-white" />
                    <span className="font-semibold text-teal-dark">{interest}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-3 border-l-2 border-brand/30 pl-5 text-muted">
                {doctor.education.slice(0, 2).map((item) => (
                  <div key={item} className="flex gap-3">
                    <GraduationCap className="mt-1 shrink-0 text-brand-dark" size={18} />
                    <p className="font-medium leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex gap-3">
                  <Award className="mt-1 shrink-0 text-teal" size={18} />
                  <p className="font-medium leading-relaxed">{doctor.experience.join(" | ")}</p>
                </div>
              </div>
              <div className="mt-8">
                <ButtonLink href="/dr-deepak-kumar-sharma-gastroenterologist-agra" variant="ghost">Read Doctor Profile <ArrowRight size={18} /></ButtonLink>
                <AppointmentCtaPanel className="mt-4" />
              </div>
            </div>
          </MotionReveal>
        </div>
      </Section>

      <Section id="procedures" className="overflow-hidden">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-16 hidden h-64 w-64 place-items-center rounded-full border border-line/70 bg-soft/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_70px_rgba(8,64,84,0.06)] lg:grid"
          >
            <div className="grid h-28 w-28 place-items-center rounded-full border border-cyan-100/80 bg-white/90 shadow-[0_20px_55px_rgba(8,64,84,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]">
              <Image
                src="/mgm-icon.png"
                alt=""
                width={112}
                height={112}
                className="h-20 w-20 object-contain"
              />
            </div>
          </div>
          <div className="relative mb-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-gold" />
                <span className="inline-lang text-xs font-semibold uppercase tracking-[0.18em] text-brand-dark">
                  <span data-en>Treatments</span>
                  <span data-hi lang="hi">उपचार</span>
                </span>
              </div>
              <h2 className="inline-lang max-w-3xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
                <span data-en>Advanced procedures, organized around clear care decisions.</span>
                <span data-hi lang="hi">स्पष्ट देखभाल निर्णयों के आधार पर व्यवस्थित उन्नत प्रक्रियाएं।</span>
              </h2>
            </div>
            <div className="grid gap-4">
              <p className="max-w-2xl text-lg leading-relaxed text-muted" data-en>
                Focused gastroenterology, hepatology and therapeutic endoscopy services with dedicated patient information and appointment pathways.
              </p>
              <p className="max-w-2xl text-lg leading-relaxed text-muted" data-hi lang="hi">
                समर्पित मरीज़ जानकारी और अपॉइंटमेंट प्रक्रियाओं के साथ केंद्रित गैस्ट्रोएंटरोलॉजी, हेपेटोलॉजी और चिकित्सीय एंडोस्कोपी सेवाएं।
              </p>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                {[
                  [CalendarCheck, "Planned consult", "नियोजित परामर्श"],
                  [Stethoscope, "Specialist procedure", "विशेषज्ञ प्रक्रिया"],
                  [FileText, "Report guidance", "रिपोर्ट मार्गदर्शन"]
                ].map(([Icon, label, labelHi]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-full border border-line bg-white/85 px-4 py-3 text-sm font-semibold text-teal-dark shadow-sm">
                    <Icon className="text-brand-dark" size={18} />
                    <span className="inline-lang">
                      <span data-en>{label as string}</span>
                      <span data-hi lang="hi">{labelHi as string}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
            {procedures.slice(0, 9).map((procedure, index) => (
              <MotionReveal key={procedure.slug} className="h-full" delay={Math.min(index * 0.03, 0.18)}>
                <Link
                  href={`/procedures/${procedure.slug}`}
                  className="group relative isolate flex h-full min-h-[285px] flex-col overflow-hidden rounded border border-line/80 bg-white p-6 shadow-[0_18px_55px_rgba(8,64,84,0.08)] transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[0_28px_80px_rgba(8,64,84,0.14)]"
                >
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-gold to-teal opacity-75" />
                  <div aria-hidden="true" className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-soft transition duration-300 group-hover:scale-125" />
                  <div className="relative flex items-start justify-between gap-4">
                    <BrandIconTile className="h-12 w-12 border border-line shadow-sm transition group-hover:border-brand group-hover:bg-white" />
                    <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {procedureBadges[index % procedureBadges.length]}
                    </span>
                  </div>
                  <div className="relative mt-8 flex flex-1 flex-col">
                    <h3 className="inline-lang text-2xl font-bold leading-tight text-ink">
                      <span data-en>{procedure.title}</span>
                      <span data-hi lang="hi">{procedure.hiTitle}</span>
                    </h3>
                    <p className="mt-4 leading-relaxed text-muted" data-en>{procedure.summary}</p>
                    <p className="mt-4 leading-relaxed text-muted" data-hi lang="hi">{procedure.hiSummary}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-brand-dark">
                      View patient guide <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </MotionReveal>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-4">
            {treatmentGroups.map((group) => (
              <div key={group.title} className="rounded border border-line/80 bg-[linear-gradient(180deg,#ffffff,#f7fbfb)] p-5 shadow-sm">
                <h3 className="inline-lang text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                  <span data-en>{group.title}</span>
                  <span data-hi lang="hi">{group.titleHi}</span>
                </h3>
                <div className="mt-4 grid gap-2">
                  {group.links.slice(0, 4).map((procedure) => (
                    <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="group flex items-center justify-between rounded border border-transparent px-3 py-2 text-sm font-medium text-muted transition hover:border-line hover:bg-white hover:text-brand-dark">
                      <span>{procedure.title}</span>
                      <ArrowRight size={14} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  ))}
                  {group.links.length > 4 ? (
                    <details className="group/details">
                      <summary className="mt-1 flex cursor-pointer list-none items-center justify-between rounded border border-line bg-white px-3 py-2 text-sm font-bold text-brand-dark transition hover:border-brand">
                        <span className="group-open/details:hidden">Show more</span>
                        <span className="hidden group-open/details:inline">Show less</span>
                        <ArrowRight size={14} className="transition group-open/details:rotate-90" />
                      </summary>
                      <div className="mt-2 grid gap-2">
                        {group.links.slice(4).map((procedure) => (
                          <Link key={procedure.slug} href={`/procedures/${procedure.slug}`} className="group flex items-center justify-between rounded border border-transparent px-3 py-2 text-sm font-medium text-muted transition hover:border-line hover:bg-white hover:text-brand-dark">
                            <span>{procedure.title}</span>
                            <ArrowRight size={14} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section muted className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
          <MotionReveal>
            <div className="relative h-full overflow-hidden rounded border border-line/80 bg-[linear-gradient(135deg,#0b3a46,#0f766e)] p-7 text-white shadow-[0_28px_80px_rgba(8,64,84,0.18)] md:p-8">
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/15" />
              <div aria-hidden="true" className="absolute -bottom-20 right-12 h-56 w-56 rounded-full bg-cyan-200/10" />
              <div className="relative">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
                  <ShieldCheck size={15} />
                  <span className="inline-lang">
                    <span data-en>Why Choose MGM</span>
                    <span data-hi lang="hi">एमजीएम को क्यों चुनें</span>
                  </span>
                </div>
                <h2 className="inline-lang max-w-xl text-4xl font-bold leading-[1.07] md:text-5xl">
                  <span data-en>Patient-first gastro and liver care with specialist attention.</span>
                  <span data-hi lang="hi">विशेषज्ञ ध्यान के साथ मरीज़-प्रथम गैस्ट्रो और लिवर देखभाल।</span>
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78" data-en>
                  A focused centre for digestive, liver, pancreatic and biliary conditions, built around explanation, procedure readiness and practical follow-up.
                </p>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/78" data-hi lang="hi">
                  पाचन, लिवर, अग्न्याशय और पित्त संबंधी स्थितियों के लिए एक केंद्रित केंद्र, जो स्पष्टीकरण, प्रक्रिया की तैयारी और व्यावहारिक फॉलो-अप पर आधारित है।
                </p>
                <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                  {[
                    ["Consultation", "परामर्श"],
                    ["Preparation", "तैयारी"],
                    ["Procedure", "प्रक्रिया"],
                    ["Follow-up", "फॉलो-अप"]
                  ].map(([step, stepHi]) => (
                    <div key={step} className="rounded border border-white/16 bg-white/10 p-4 backdrop-blur">
                      <p className="inline-lang font-semibold">
                        <span data-en>{step}</span>
                        <span data-hi lang="hi">{stepHi}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MotionReveal>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            {trustReasons.map(({ title, titleHi, text, textHi }, index) => (
              <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
                <article className="group h-full rounded border border-line/80 bg-white/90 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand hover:bg-white hover:shadow-soft">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <BrandIconTile className="h-12 w-12 border border-line transition group-hover:border-brand group-hover:bg-white" />
                  </div>
                  <h3 className="inline-lang text-xl font-bold leading-tight text-ink">
                    <span data-en>{title}</span>
                    <span data-hi lang="hi">{titleHi}</span>
                  </h3>
                  <p className="mt-3 inline-lang leading-relaxed text-muted">
                    <span data-en>{text}</span>
                    <span data-hi lang="hi">{textHi}</span>
                  </p>
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="inline-lang text-xs font-semibold uppercase tracking-[0.18em] text-brand-dark">
                <span data-en>Care Pathway</span>
                <span data-hi lang="hi">देखभाल पथ</span>
              </span>
            </div>
            <h2 className="inline-lang max-w-2xl text-4xl font-bold leading-[1.06] text-ink md:text-6xl">
              <span data-en>A clear journey from consult to recovery.</span>
              <span data-hi lang="hi">परामर्श से रिकवरी तक की एक स्पष्ट यात्रा।</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted" data-en>
              Every visit is organized around explanation, preparation and follow-up so patients know what to expect at each stage.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted" data-hi lang="hi">
              हर विज़िट स्पष्टीकरण, तैयारी और फॉलो-अप के आधार पर व्यवस्थित की जाती है ताकि मरीज़ों को हर चरण में पता हो कि क्या उम्मीद करनी है।
            </p>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-brand via-line to-teal md:block" />
            <div className="grid gap-4">
              {patientJourney.map(({ title, titleHi, text, textHi }, index) => (
                <MotionReveal key={title} delay={Math.min(index * 0.04, 0.12)}>
                  <article className="relative grid grid-cols-[minmax(0,1fr)] gap-4 rounded border border-line/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-brand hover:shadow-soft md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:pl-4">
                    <BrandIconTile className="relative z-10 h-12 w-12 rounded-full border border-line shadow-sm" />
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="inline-lang text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">
                          <span data-en>Care step</span>
                          <span data-hi lang="hi">देखभाल चरण</span>
                        </span>
                        <span className="h-px w-10 bg-line" />
                      </div>
                      <h3 className="inline-lang text-2xl font-bold leading-tight text-ink">
                        <span data-en>{title}</span>
                        <span data-hi lang="hi">{titleHi}</span>
                      </h3>
                      <p className="mt-2 inline-lang leading-relaxed text-muted">
                        <span data-en>{text}</span>
                        <span data-hi lang="hi">{textHi}</span>
                      </p>
                    </div>
                  </article>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

    </main>
  );
}
