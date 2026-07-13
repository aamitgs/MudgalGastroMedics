import type { Metadata } from "next";
import { Section } from "@/components/site/Section";

const disclaimerParagraphs = [
  "The information provided on the Mudgal Gastromedics Hospital website is intended solely for general informational and educational purposes.",
  "While we strive to keep all information accurate and up to date, we make no guarantees regarding the completeness, accuracy, reliability, or availability of the content.",
  "Nothing on this website constitutes medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare professional regarding any medical concern.",
  "Mudgal Gastromedics Hospital shall not be responsible for any loss or damage resulting from reliance on information published on this website.",
  "The inclusion of external links does not imply endorsement of third-party websites, products, or services.",
  "Medical outcomes may vary depending on individual patient conditions. No treatment outcome or recovery can be guaranteed.",
  "In case of a medical emergency, immediately contact your nearest emergency medical service or visit the nearest hospital."
];

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Website and medical information disclaimer for Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/disclaimer" }
};

export default function DisclaimerPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Disclaimer</p>
          <h1 className="text-5xl font-black md:text-7xl">Disclaimer</h1>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <div className="grid gap-4">
            {disclaimerParagraphs.map((paragraph, index) => (
              <p key={paragraph} className={`leading-relaxed ${index === 6 ? "rounded border border-coral/20 bg-red-50 p-4 font-semibold text-coral" : "text-muted"}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </Section>
    </main>
  );
}
