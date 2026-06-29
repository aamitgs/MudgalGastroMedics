import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms and medical disclaimer template for Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Terms</p>
          <h1 className="text-5xl font-black md:text-7xl">Terms</h1>
          <p className="mt-5 max-w-3xl text-white/85">Template content. Review with the hospital team and legal advisor before production launch.</p>
        </div>
      </section>
      <Section>
        <div className="rounded border border-line bg-white p-6 shadow-soft">
          <h2 className="text-3xl font-black">Terms</h2>
          <p className="mt-4 text-muted">This page contains dummy terms and medical disclaimer content. It should be customized with final appointment, data handling, cancellation, medical disclaimer, cookie and patient communication policies before publishing.</p>
          <p className="mt-4 text-muted">Website content is informational and does not replace an in-person medical consultation. For urgent symptoms, call the hospital directly.</p>
        </div>
      </Section>
    </main>
  );
}
