import type { Metadata } from "next";
import { BarChart3, ClipboardList, CreditCard, PackageCheck, Pill, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PlatformFeatureCard } from "@/components/site/PlatformFeatureCard";
import { Section } from "@/components/site/Section";
import { operationsFeatures } from "@/lib/platform-data";
import { breadcrumbSchema } from "@/lib/seo-schema";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Enterprise Healthcare Platform", url: "/operations" }
  ])
};

export const metadata: Metadata = {
  title: "Enterprise Healthcare Platform",
  description: "Enterprise healthcare platform plan for reception, OPD, billing, pharmacy, inventory and reporting at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/operations" }
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
    tag: "Operations",
    icon: PackageCheck
  },
  {
    title: "Reports",
    text: "Daily revenue, appointments, procedure counts and communication logs for admins.",
    tag: "Analytics",
    icon: BarChart3
  }
];

export default function OperationsPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)] w-[min(1180px,calc(100%-32px))] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="inline-lang mb-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              <span data-en>Enterprise Healthcare Platform</span>
              <span data-hi lang="hi">एंटरप्राइज़ हेल्थकेयर प्लेटफॉर्म</span>
            </p>
            <h1 className="inline-lang max-w-4xl text-5xl font-black leading-[1.02] md:text-7xl">
              <span data-en>Operations dashboard for reception and hospital teams.</span>
              <span data-hi lang="hi">रिसेप्शन और अस्पताल टीमों के लिए ऑपरेशन्स डैशबोर्ड।</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82" data-en>
              Connect appointments, patients, doctors, billing, pharmacy, inventory and reports into one role-based workspace.
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/82" data-hi lang="hi">
              अपॉइंटमेंट, मरीज़, डॉक्टर, बिलिंग, फार्मेसी, इन्वेंटरी और रिपोर्ट को एक भूमिका-आधारित वर्कस्पेस में जोड़ें।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/admin" className="min-h-13 px-6">Open Admin Preview</ButtonLink>
              <ButtonLink href="/portal" variant="ghost" className="min-h-13 px-6">Patient Portal</ButtonLink>
              <ButtonLink href="/platform" variant="secondary" className="min-h-13 px-6">Platform Plan</ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/16 bg-white/10 p-5 shadow-[0_28px_80px_rgba(2,22,29,0.25)] backdrop-blur-md">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
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
        <div className="mb-10 grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end">
          <div>
            <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand-dark">
              <span data-en>Core Modules</span>
              <span data-hi lang="hi">मुख्य मॉड्यूल</span>
            </p>
            <h2 className="inline-lang max-w-3xl text-4xl font-bold leading-[1.08] text-ink md:text-6xl">
              <span data-en>A practical operations platform for daily hospital work.</span>
              <span data-hi lang="hi">रोज़मर्रा के अस्पताल कार्य के लिए एक व्यावहारिक ऑपरेशन्स प्लेटफॉर्म।</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted" data-en>
            The first internal release should focus on reception, doctor review, billing and report uploads before adding deeper operations automation.
          </p>
          <p className="text-lg leading-relaxed text-muted" data-hi lang="hi">
            गहरे ऑपरेशन्स ऑटोमेशन जोड़ने से पहले, पहले आंतरिक रिलीज़ में रिसेप्शन, डॉक्टर समीक्षा, बिलिंग और रिपोर्ट अपलोड पर ध्यान देना चाहिए।
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
          {coreModules.map((module) => (
            <PlatformFeatureCard key={module.title} {...module} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="rounded border border-line/80 bg-white p-6 shadow-[0_24px_70px_rgba(8,64,84,0.1)] md:p-8">
          <p className="inline-lang mb-3 text-xs font-black uppercase tracking-[0.16em] text-brand-dark">
            <span data-en>Operations Checklist</span>
            <span data-hi lang="hi">ऑपरेशन्स चेकलिस्ट</span>
          </p>
          <h2 className="inline-lang text-4xl font-bold leading-tight text-ink">
            <span data-en>Modules to activate as the workflow matures.</span>
            <span data-hi lang="hi">वर्कफ़्लो विकसित होने पर सक्रिय किए जाने वाले मॉड्यूल।</span>
          </h2>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {operationsFeatures.map((feature) => (
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
