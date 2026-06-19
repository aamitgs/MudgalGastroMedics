import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy template for Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" />;
}

function LegalPage({ title }: { title: string }) {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-gold">{title}</p>
          <h1 className="text-5xl font-black md:text-7xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-white/85">Template content. Review with the hospital team and legal advisor before production launch.</p>
        </div>
      </section>
      <Section>
        <div className="rounded border border-line bg-white p-6">
          <h2 className="text-3xl font-black">{title}</h2>
          <p className="mt-4 text-muted">This page contains dummy privacy policy content. It should be customized with final appointment, data handling, cancellation, medical disclaimer, cookie and patient communication policies before publishing.</p>
          <p className="mt-4 text-muted">Website forms are intended for appointment requests only and should not be used for emergencies. For urgent medical assistance, call the hospital directly.</p>
        </div>
      </Section>
    </main>
  );
}
