import type { Metadata } from "next";
import { Section } from "@/components/site/Section";

const patientRights = [
  "Receive respectful, dignified, and non-discriminatory care.",
  "Receive clear information regarding diagnosis and treatment options.",
  "Participate in decisions regarding medical care.",
  "Maintain privacy and confidentiality of medical records.",
  "Receive emergency care where applicable.",
  "Obtain copies of medical records as permitted by law.",
  "Ask questions regarding treatment and expected outcomes.",
  "Seek a second medical opinion.",
  "Know the estimated costs of treatment whenever possible."
];

const patientResponsibilities = [
  "Provide complete and accurate medical information.",
  "Inform healthcare providers of allergies, medications, and previous illnesses.",
  "Follow prescribed treatment plans.",
  "Attend scheduled appointments or provide timely notice if unable to attend.",
  "Treat hospital staff and other patients with courtesy and respect.",
  "Follow hospital safety and infection-control guidelines.",
  "Meet financial obligations for services received.",
  "Protect hospital property and facilities."
];

export const metadata: Metadata = {
  title: "Patient Rights & Responsibilities",
  description: "Patient Rights & Responsibilities at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/patient-rights-responsibilities" }
};

export default function PatientRightsResponsibilitiesPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Patient Information</p>
          <h1 className="text-5xl font-black md:text-7xl">Patient Rights & Responsibilities</h1>
          <p className="mt-5 max-w-3xl text-white/85">Mudgal Gastromedics Hospital is committed to providing safe, ethical, and compassionate healthcare.</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <PolicyCard title="Patient Rights" intro="Every patient has the right to:" items={patientRights} />
          <PolicyCard title="Patient Responsibilities" intro="Patients are expected to:" items={patientResponsibilities} />
        </div>
      </Section>
    </main>
  );
}

function PolicyCard({ title, intro, items }: { title: string; intro: string; items: string[] }) {
  return (
    <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
      <h2 className="text-3xl font-black leading-tight text-ink">{title}</h2>
      <p className="mt-4 leading-relaxed text-muted">{intro}</p>
      <ul className="mt-5 grid gap-3 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
