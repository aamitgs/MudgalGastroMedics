import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Refund & Cancellation Policy", url: "/refund-cancellation-policy" }
  ])
};

const refundSections = [
  {
    title: "Appointment Cancellation",
    paragraphs: ["Patients may request cancellation or rescheduling of appointments by contacting the hospital as early as possible."]
  },
  {
    title: "Consultation Fees",
    paragraphs: ["Consultation fees may be refundable or adjustable based on the hospital's cancellation policy and the circumstances of the appointment."]
  },
  {
    title: "Diagnostic Tests & Procedures",
    paragraphs: ["Fees paid for diagnostic tests, endoscopy, colonoscopy, or other procedures may not be refundable once preparations have begun or services have been provided."]
  },
  {
    title: "Online Payments",
    paragraphs: [
      "Refunds for eligible online payments will be processed through the original payment method whenever possible.",
      "Processing times may vary depending on the payment provider or bank."
    ]
  },
  {
    title: "Refund Approval",
    paragraphs: ["Refund requests are subject to verification and approval by the hospital administration."]
  },
  {
    title: "Non-Refundable Services",
    body: "The following may not be eligible for refunds:",
    items: ["Completed consultations", "Completed diagnostic tests", "Medical procedures already performed", "Medicines and pharmacy purchases", "Consumable medical supplies"]
  }
];

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund & Cancellation Policy for appointments, consultation fees, diagnostic tests, procedures, and online payments at Mudgal Gastromedics Hospital.",
  alternates: { canonical: "/refund-cancellation-policy" }
};

export default function RefundCancellationPolicyPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Refund & Cancellation Policy</p>
          <h1 className="text-5xl font-black md:text-7xl">Refund & Cancellation Policy</h1>
          <p className="mt-5 max-w-3xl text-white/85">Effective Date: July 8, 2026</p>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <p className="max-w-4xl text-lg leading-relaxed text-muted">
            Mudgal Gastromedics Hospital aims to provide a transparent and fair appointment and payment process.
          </p>

          <div className="mt-10 grid gap-8">
            {refundSections.map((section) => (
              <section key={section.title} className="border-t border-line pt-8">
                <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">{section.title}</h2>
                {"body" in section && section.body ? <p className="mt-4 leading-relaxed text-muted">{section.body}</p> : null}
                {"paragraphs" in section && section.paragraphs ? (
                  <div className="mt-4 grid gap-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="leading-relaxed text-muted">{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                {"items" in section && section.items ? <PolicyList items={section.items} /> : null}
              </section>
            ))}

            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">Contact</h2>
              <p className="mt-4 leading-relaxed text-muted">For cancellation or refund requests, please contact:</p>
              <div className="mt-5 rounded border border-line bg-soft/60 p-5">
                <p className="font-black text-ink">Mudgal Gastromedics Hospital</p>
                <p className="mt-2 text-muted">16, H.I.G., Behind Police Chowki, Shaheed Nagar, Agra, Uttar Pradesh, India</p>
                <p className="mt-2 text-muted">Phone: <a href="tel:+919828912257" className="font-semibold text-brand-dark hover:text-brand-dark">+91-9828912257</a></p>
              </div>
            </section>
          </div>
        </article>
      </Section>
    </main>
  );
}

function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2 leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
