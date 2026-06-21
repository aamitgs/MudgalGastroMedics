import type { Metadata } from "next";
import { CakeSlice, PartyPopper, Sparkles, Users } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { Section, SectionHead } from "@/components/Section";

export const metadata: Metadata = {
  title: "Life@MGM",
  description: "Staff celebrations, birthdays, festivals, team events and workplace moments at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/life-at-mgm" }
};

const celebrationCategories = [
  { title: "Birthdays", description: "Birthday celebrations with the MGM team.", icon: CakeSlice },
  { title: "Festivals", description: "Festival celebrations and cultural moments.", icon: Sparkles },
  { title: "Team Events", description: "Staff activities, gatherings and team events.", icon: Users },
  { title: "Milestones", description: "Hospital achievements and special occasions.", icon: PartyPopper }
];

export default function LifeAtMgmPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">Life@MGM</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Staff celebrations and team moments</h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            A gallery for birthdays, festivals, team events, milestones and memorable moments shared by the MGM team.
          </p>
        </div>
      </section>

      <Section>
        <SectionHead eyebrow="Celebration Gallery" title="Life beyond clinical care">
          <p>Real staff celebration photos will appear here as they are added.</p>
        </SectionHead>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {celebrationCategories.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded border border-line bg-white p-6 shadow-[0_8px_20px_rgba(18,52,61,0.06)]">
              <Icon className="mb-4 text-teal" size={30} />
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded border border-dashed border-line bg-soft px-6 py-12 text-center">
          <PartyPopper className="mx-auto text-teal" size={36} />
          <h2 className="mt-4 text-2xl font-black">Celebration photos coming soon</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">Add approved staff photographs to publish them in this gallery.</p>
        </div>
      </Section>

      <CtaBand />
    </main>
  );
}
