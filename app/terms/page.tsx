import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";

const termsSections = [
  {
    title: "1. Website Purpose",
    body: "This website is intended to provide information about:",
    items: ["Hospital services", "Doctors and specialists", "Medical procedures", "Health information", "Appointment booking", "Patient support services"],
    footer: "The information provided is for general informational purposes only and should not be considered medical advice."
  },
  {
    title: "2. Medical Advice",
    paragraphs: [
      "The content on this website does not replace professional medical consultation, diagnosis, or treatment.",
      "Always consult a qualified healthcare professional regarding any medical condition. Never ignore medical advice because of information found on this website."
    ]
  },
  {
    title: "3. Appointment Booking",
    paragraphs: [
      "Appointment requests submitted through the website are subject to confirmation by the hospital.",
      "The hospital reserves the right to reschedule, postpone, or cancel appointments due to emergencies, doctor availability, or operational requirements."
    ]
  },
  {
    title: "4. Patient Responsibilities",
    body: "Patients agree to:",
    items: [
      "Provide accurate personal and medical information.",
      "Arrive on time for appointments.",
      "Follow medical advice and treatment instructions.",
      "Respect hospital staff, doctors, and other patients.",
      "Comply with hospital policies during visits."
    ]
  },
  {
    title: "5. Intellectual Property",
    paragraphs: [
      "All website content, including text, images, graphics, logos, videos, and design elements, is the property of Mudgal Gastromedics Hospital unless otherwise stated. Unauthorized reproduction or distribution is prohibited."
    ]
  },
  {
    title: "6. Website Availability",
    paragraphs: [
      "We strive to keep our website operational but do not guarantee uninterrupted or error-free access. We may modify, suspend, or discontinue any part of the website without prior notice."
    ]
  },
  {
    title: "7. Limitation of Liability",
    paragraphs: [
      "Mudgal Gastromedics Hospital shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this website or reliance on its content."
    ]
  },
  {
    title: "8. Third-Party Links",
    paragraphs: [
      "This website may contain links to third-party websites. We are not responsible for the content, privacy practices, or availability of those websites."
    ]
  },
  {
    title: "9. Privacy",
    custom: (
      <p className="mt-4 leading-relaxed text-muted">
        Your use of this website is also governed by our{" "}
        <Link href="/privacy" className="font-semibold text-brand hover:text-brand-dark">
          Privacy Policy
        </Link>
        .
      </p>
    )
  },
  {
    title: "10. Governing Law",
    paragraphs: [
      "These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of the competent courts in Agra, Uttar Pradesh."
    ]
  }
];

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms & Conditions for using the Mudgal Gastromedics Hospital website, appointment booking, medical information, and patient support services.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Terms & Conditions</p>
          <h1 className="text-5xl font-black md:text-7xl">Terms & Conditions</h1>
          <p className="mt-5 max-w-3xl text-white/85">Effective Date: July 8, 2026</p>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <div className="max-w-4xl">
            <p className="text-lg leading-relaxed text-muted">
              Welcome to the Mudgal Gastromedics Hospital website. By accessing or using this website, booking appointments, or using any of our services, you agree to these Terms & Conditions. If you do not agree, please discontinue use of the website.
            </p>
          </div>

          <div className="mt-10 grid gap-8">
            {termsSections.map((section) => (
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
                {"items" in section && section.items ? <TermsList items={section.items} /> : null}
                {"footer" in section && section.footer ? <p className="mt-4 leading-relaxed text-muted">{section.footer}</p> : null}
                {"custom" in section ? section.custom : null}
              </section>
            ))}

            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">Contact</h2>
              <div className="mt-5 rounded border border-line bg-soft/60 p-5">
                <p className="font-black text-ink">Mudgal Gastromedics Hospital</p>
                <p className="mt-2 text-muted">16, H.I.G., Behind Police Chowki, Shaheed Nagar, Agra, Uttar Pradesh, India</p>
                <p className="mt-2 text-muted">Phone: <a href="tel:+919828912257" className="font-semibold text-brand hover:text-brand-dark">+91-9828912257</a></p>
                <p className="mt-2 text-muted">Email: <a href="mailto:admin@mudgalgastromedics.com" className="font-semibold text-brand hover:text-brand-dark">admin@mudgalgastromedics.com</a></p>
              </div>
            </section>
          </div>
        </article>
      </Section>
    </main>
  );
}

function TermsList({ items }: { items: string[] }) {
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
