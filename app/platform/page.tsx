import type { Metadata } from "next";
import { Activity, ArrowRight, BrainCircuit, Building2, ClipboardList, Globe2, LockKeyhole, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PlatformFeatureCard } from "@/components/PlatformFeatureCard";
import { Section } from "@/components/Section";
import { implementationPhases, platformModules } from "@/lib/platform-data";
import { site } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Digital Hospital Platform",
  description: "Connected website, patient portal, hospital operations platform and AI planning roadmap for Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/platform" }
};

const moduleIcons = [Globe2, ClipboardList, Smartphone, Building2, BrainCircuit];

export default function PlatformPage() {
  return (
    <main>
      <section className="page-hero-bg overflow-hidden py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Operations Platform + Website + Portal + AI</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">One connected digital platform for MGM.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82">
              The public website remains the patient-facing front desk, while CMS publishing, reception, doctor workflow, billing, reports, pharmacy and AI-assisted planning connect behind it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/portal" className="min-h-13 px-6">Patient Portal</ButtonLink>
              <ButtonLink href="/operations" variant="secondary" className="min-h-13 px-6">Operations Platform</ButtonLink>
              <ButtonLink href="/ai-planning" variant="ghost" className="min-h-13 px-6">AI Planning</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="grid gap-3">
              {[
                ["Appointment request", "Website captures details, reports and symptoms"],
                ["Reception workflow", "Staff verifies, schedules and confirms"],
                ["Doctor review", "Reports, history and procedure notes stay connected"],
                ["Patient follow-up", "Portal, WhatsApp and reminders close the loop"]
              ].map(([title, text], index) => (
                <div key={title} className="flex gap-4 rounded border border-white/12 bg-white/10 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan-200/15 text-cyan-100">{index + 1}</span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="mt-1 block text-sm text-white/72">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-10 grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">Connected Modules</p>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">Built as one system, released in phases.</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted">
            Each module can launch independently, but the data model should be planned together: patient, appointment, visit, billing, report, inventory and communication records.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {platformModules.map((module, index) => (
            <PlatformFeatureCard key={module.title} {...module} icon={moduleIcons[index]} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="sticky top-28 rounded border border-line/80 bg-white p-7 shadow-[0_24px_70px_rgba(8,64,84,0.1)]">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">Architecture</p>
            <h2 className="text-4xl font-bold leading-tight text-ink">Recommended system core</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Start with a shared patient record and appointment record. Add authenticated roles before adding billing, reports and AI workflows.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                [LockKeyhole, "Role-based access for reception, doctor, pharmacy and admin"],
                [ShieldCheck, "Medical data stays private with consent-led report uploads"],
                [MessageCircle, "WhatsApp and SMS updates for confirmations and follow-ups"],
                [Activity, "AI assists routing and summaries, never final diagnosis"]
              ].map(([Icon, text]) => (
                <div key={text as string} className="flex items-center gap-3 rounded border border-line bg-soft/70 p-3">
                  <Icon className="text-brand" size={19} />
                  <span className="font-semibold text-ink">{text as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            {implementationPhases.map((phase) => (
              <article key={phase.phase} className="rounded border border-line/80 bg-white p-6 shadow-sm">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-brand">{phase.phase}</span>
                <h3 className="mt-3 text-2xl font-bold text-ink">{phase.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{phase.text}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded border border-line/80 bg-[linear-gradient(135deg,#0b3a46,#0f766e)] p-8 text-white shadow-[0_28px_80px_rgba(8,64,84,0.18)] md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Phase-one action</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Start from appointments and patient uploads.</h2>
              <p className="mt-4 max-w-3xl text-white/78">
                This keeps the public website useful immediately and creates the first operational dataset for reception, portal and operations modules.
              </p>
            </div>
            <ButtonLink href="/portal#appointment" variant="ghost" className="min-h-13 px-7">
              Open Appointment Flow <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
