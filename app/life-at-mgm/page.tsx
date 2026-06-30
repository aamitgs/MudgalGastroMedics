import type { Metadata } from "next";
import { CakeSlice, Camera, HeartHandshake, PartyPopper, Sparkles, Trophy, Users } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { Section, SectionHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "Life@MGM",
  description: "Staff celebrations, birthdays, festivals, team events and workplace moments at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/life-at-mgm" }
};

const celebrationCategories = [
  { title: "Birthdays", description: "Warm team celebrations that recognize people beyond their roles.", icon: CakeSlice },
  { title: "Festivals", description: "Shared cultural moments that keep the workplace connected.", icon: Sparkles },
  { title: "Team Events", description: "Staff gatherings, learning moments and everyday teamwork.", icon: Users },
  { title: "Milestones", description: "Hospital achievements, anniversaries and special occasions.", icon: Trophy }
];

const cultureValues = [
  ["Care", "A respectful environment for patients, attendants and team members."],
  ["Teamwork", "Clinical and support teams working together through busy hospital days."],
  ["Learning", "Continuous improvement around patient communication, safety and service."],
  ["Celebration", "Recognizing the people who make the hospital experience warmer."]
];

export default function LifeAtMgmPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Life@MGM</p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">The people, moments and culture behind MGM</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">
              A curated space for staff celebrations, festivals, birthdays, milestones and everyday team moments at Mudgal Gastromedics Hospital.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Team Moments", "Birthdays, festivals and gatherings"],
              ["Hospital Culture", "Care, respect and collaboration"],
              ["Photo Archive", "Approved photos ready to publish"]
            ].map(([title, text]) => (
              <div key={title} className="rounded border border-white/20 bg-white/12 p-4 shadow-[0_18px_45px_rgba(2,22,29,0.18)] backdrop-blur">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <SectionHead eyebrow="Celebration Gallery" title="Life beyond clinical care">
          <p>Designed as a premium gallery surface for approved staff photographs as they are added.</p>
        </SectionHead>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {celebrationCategories.map(({ title, description, icon: Icon }, index) => (
            <MotionReveal key={title} className="h-full" delay={Math.min(index * 0.04, 0.16)}>
            <article className="group h-full rounded border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded bg-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon size={24} />
              </span>
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </article>
            </MotionReveal>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded border border-line bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_30%),linear-gradient(135deg,#ecfeff,#ffffff)] p-6 shadow-soft">
            <div className="absolute inset-6 grid grid-cols-3 gap-3 opacity-80">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className={`rounded border border-white/80 bg-white/65 shadow-sm ${index === 1 || index === 5 ? "translate-y-8" : ""} ${index === 3 ? "col-span-2" : ""}`} />
              ))}
            </div>
            <div className="relative z-10 flex min-h-[360px] flex-col justify-end">
              <span className="mb-5 grid h-14 w-14 place-items-center rounded bg-brand text-white shadow-soft">
                <Camera size={26} />
              </span>
              <h2 className="max-w-xl text-4xl font-black leading-tight">Approved celebration photos can live here beautifully.</h2>
              <p className="mt-3 max-w-lg text-muted">Upload staff photographs later and this space can become a polished gallery for MGM culture, events and team milestones.</p>
            </div>
          </div>
          <div className="grid gap-5">
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <PartyPopper className="mb-4 text-teal" size={32} />
              <h2 className="text-2xl font-black">Photos coming soon</h2>
              <p className="mt-2 text-muted">Add approved staff photographs to publish them in this gallery.</p>
            </div>
            <div className="rounded border border-line bg-white p-6 shadow-soft">
              <HeartHandshake className="mb-4 text-brand" size={32} />
              <h2 className="text-2xl font-black">Human side of care</h2>
              <p className="mt-2 text-muted">This page helps patients and visitors see the team culture behind the hospital.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="Culture" title="What Life@MGM should communicate">
          <p>Warmth and professionalism can sit together. This page is designed to show that balance.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cultureValues.map(([title, text]) => (
            <div key={title} className="rounded border border-line bg-white p-6 shadow-soft">
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Section>

    </main>
  );
}
