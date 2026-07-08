import type { Metadata } from "next";
import { AlertTriangle, BrainCircuit, ClipboardCheck, FileText, MessageSquareText, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PlatformFeatureCard } from "@/components/PlatformFeatureCard";
import { Section } from "@/components/Section";
import { aiPlanningFeatures } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "AI Planning",
  description: "AI-assisted planning layer for appointment routing, report summaries, preparation checklists and reception workflows at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/ai-planning" }
};

const aiModules = [
  {
    title: "Appointment Routing",
    text: "Use symptoms and service selection to suggest the right appointment category for reception review.",
    tag: "Reception",
    icon: SearchCheck
  },
  {
    title: "Report Summary",
    text: "Summarize uploaded reports into a structured note for doctor review, with source files retained.",
    tag: "Doctor review",
    icon: FileText
  },
  {
    title: "Preparation Checklist",
    text: "Generate fasting, medicine, attendant and report checklist drafts for procedures.",
    tag: "Patient guide",
    icon: ClipboardCheck
  },
  {
    title: "Response Drafts",
    text: "Prepare WhatsApp and reception reply drafts for confirmations, reminders and follow-up.",
    tag: "Communication",
    icon: MessageSquareText
  }
];

export default function AiPlanningPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">AI Planning Layer</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">AI assistance for faster, clearer patient coordination.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82">
              AI can support reception, report review, preparation instructions and follow-up planning while keeping medical decisions with the doctor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/admin" className="min-h-13 px-6">Open Admin AI Preview</ButtonLink>
              <ButtonLink href="/platform" variant="secondary" className="min-h-13 px-6">Digital Platform</ButtonLink>
              <ButtonLink href="/operations" variant="ghost" className="min-h-13 px-6">Operations Platform</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="rounded border border-amber-200/25 bg-amber-100/10 p-5">
              <div className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-300/20 text-amber-100">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">Clinical safety rule</h2>
                  <p className="mt-2 leading-relaxed text-white/76">
                    AI should not diagnose, prescribe or replace doctor judgment. It should draft, summarize, route and remind for human review.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Human review", "Consent-led uploads", "Urgent flags", "Audit trail"].map((item) => (
                <div key={item} className="rounded border border-white/12 bg-white/10 p-4 font-bold">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-10 grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">AI Modules</p>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">Useful support without unsafe automation.</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted">
            The right AI layer reduces repetitive work and improves patient clarity, while every clinical output remains reviewable.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {aiModules.map((module) => (
            <PlatformFeatureCard key={module.title} {...module} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded border border-line/80 bg-white p-7 shadow-[0_24px_70px_rgba(8,64,84,0.1)]">
            <span className="grid h-14 w-14 place-items-center rounded bg-soft text-brand"><BrainCircuit size={25} /></span>
            <h2 className="mt-6 text-4xl font-bold leading-tight text-ink">AI planning scope</h2>
            <p className="mt-4 leading-relaxed text-muted">
              These are the safe first-use cases before deeper integration with hospital operations records and doctor workflows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aiPlanningFeatures.map((feature) => (
              <div key={feature} className="flex gap-3 rounded border border-line/80 bg-white p-4 shadow-sm">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-soft text-brand">
                  {feature.startsWith("No ") ? <ShieldCheck size={15} /> : <Sparkles size={15} />}
                </span>
                <span className="font-semibold leading-relaxed text-ink">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
