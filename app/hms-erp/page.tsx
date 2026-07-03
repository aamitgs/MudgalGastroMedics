import type { Metadata } from "next";
import { BarChart3, ClipboardList, CreditCard, PackageCheck, Pill, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { PlatformFeatureCard } from "@/components/PlatformFeatureCard";
import { Section } from "@/components/Section";
import { hmsFeatures } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "HMS + Hospital ERP",
  description: "Hospital management system and ERP plan for reception, OPD, billing, pharmacy, inventory and reporting at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/hms-erp" }
};

const coreModules = [
  {
    title: "Reception + OPD",
    text: "Register patients, manage queue flow, record callbacks and confirm appointment status.",
    tag: "Front desk",
    icon: UsersRound
  },
  {
    title: "Doctor Workflow",
    text: "View patient history, reports, procedure notes, instructions and follow-up plans.",
    tag: "Clinical",
    icon: ClipboardList
  },
  {
    title: "Billing",
    text: "Generate consultation, procedure, pharmacy and package receipts with daily summaries.",
    tag: "Finance",
    icon: CreditCard
  },
  {
    title: "Pharmacy",
    text: "Track medicine stock, dispensing, reorder alerts and pharmacy billing links.",
    tag: "Stock",
    icon: Pill
  },
  {
    title: "Inventory",
    text: "Monitor procedure consumables, equipment supplies and low-stock alerts.",
    tag: "ERP",
    icon: PackageCheck
  },
  {
    title: "Reports",
    text: "Daily revenue, appointments, procedure counts and communication logs for admins.",
    tag: "Analytics",
    icon: BarChart3
  }
];

export default function HmsErpPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">HMS + Hospital ERP</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">Operations dashboard for reception and hospital teams.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82">
              Connect appointments, patients, doctors, billing, pharmacy, inventory and reports into one role-based workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/admin" className="min-h-13 px-6">Open Admin Preview</ButtonLink>
              <ButtonLink href="/portal" variant="ghost" className="min-h-13 px-6">Patient Portal</ButtonLink>
              <ButtonLink href="/platform" variant="secondary" className="min-h-13 px-6">Platform Plan</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="grid gap-3 sm:grid-cols-2">
              {["Appointments", "OPD Queue", "Billing", "Pharmacy", "Inventory", "Reports"].map((item, index) => (
                <div key={item} className="rounded border border-white/12 bg-white/10 p-4">
                  <span className="text-sm font-black text-cyan-100">{String(index + 1).padStart(2, "0")}</span>
                  <p className="mt-2 text-xl font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="mb-10 grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">Core Modules</p>
            <h2 className="max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">A practical HMS for daily hospital work.</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted">
            The first internal release should focus on reception, doctor review, billing and report uploads before adding deeper ERP automation.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {coreModules.map((module) => (
            <PlatformFeatureCard key={module.title} {...module} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="rounded border border-line/80 bg-white p-6 shadow-[0_24px_70px_rgba(8,64,84,0.1)] md:p-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand">ERP Checklist</p>
          <h2 className="text-4xl font-bold leading-tight text-ink">Modules to activate as the workflow matures.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {hmsFeatures.map((feature) => (
              <div key={feature} className="rounded border border-line bg-soft/60 p-4 font-semibold text-ink">
                {feature}
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
