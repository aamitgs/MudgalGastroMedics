import type { Metadata } from "next";
import { Section } from "@/components/Section";

const policySections = [
  {
    title: "1. Information We Collect",
    body: "We may collect personal and non-personal information depending on how you interact with our hospital and website.",
    groups: [
      {
        title: "Personal Information",
        items: ["Full name", "Mobile number", "Email address", "Residential address", "Date of birth", "Gender", "Emergency contact details"]
      },
      {
        title: "Medical Information",
        items: ["Medical history", "Current symptoms", "Previous diagnoses", "Prescriptions", "Laboratory reports", "Imaging reports", "Treatment records", "Health insurance information, where applicable"]
      },
      {
        title: "Appointment Information",
        items: ["Preferred doctor", "Appointment date and time", "Department", "Consultation type", "Follow-up information"]
      },
      {
        title: "Technical Information",
        items: ["IP address", "Browser type", "Device information", "Operating system", "Pages visited", "Website usage statistics", "Cookies and similar technologies"]
      }
    ]
  },
  {
    title: "2. How We Use Your Information",
    items: [
      "Providing medical consultation and treatment",
      "Scheduling and managing appointments",
      "Maintaining patient medical records",
      "Sending appointment confirmations and reminders",
      "Responding to enquiries",
      "Sharing medical reports when requested",
      "Processing billing and payments",
      "Improving patient care and hospital services",
      "Enhancing website functionality and user experience",
      "Meeting legal, regulatory, and compliance obligations",
      "Preventing fraud and ensuring hospital security"
    ]
  },
  {
    title: "3. Medical Confidentiality",
    paragraphs: [
      "Protecting patient confidentiality is one of our highest priorities.",
      "Your medical records and personal information are accessible only to authorized healthcare professionals and hospital staff who require the information to provide treatment, administrative support, or comply with legal obligations.",
      "All patient information is handled with strict confidentiality and appropriate safeguards."
    ]
  },
  {
    title: "4. Cookies and Website Analytics",
    body: "Our website may use cookies and similar technologies to:",
    items: ["Improve website performance", "Remember user preferences", "Analyze visitor traffic", "Enhance website functionality", "Improve user experience"],
    footer: "You may disable cookies through your browser settings. However, doing so may affect certain website features."
  },
  {
    title: "5. Sharing of Information",
    body: "We respect your privacy and do not sell, rent, or trade your personal information. We may share your information only when necessary with:",
    items: [
      "Doctors and healthcare professionals involved in your treatment",
      "Diagnostic laboratories",
      "Pharmacy services",
      "Health insurance providers, where applicable and authorized",
      "Government authorities when required by law",
      "Technology and IT service providers supporting our hospital systems under strict confidentiality agreements"
    ]
  },
  {
    title: "6. Data Security",
    body: "We implement reasonable administrative, technical, and physical safeguards to protect your personal and medical information from:",
    items: ["Unauthorized access", "Loss", "Misuse", "Alteration", "Disclosure", "Destruction"],
    footer: "While we strive to protect your information using industry-standard security measures, no internet transmission or electronic storage system can be guaranteed to be completely secure."
  },
  {
    title: "7. Data Retention",
    body: "We retain personal and medical information only for as long as necessary to:",
    items: ["Provide healthcare services", "Maintain medical records", "Comply with legal and regulatory requirements", "Resolve disputes", "Enforce hospital policies"],
    footer: "When information is no longer required, it is securely deleted or anonymized in accordance with applicable laws."
  },
  {
    title: "8. Your Rights",
    body: "Subject to applicable laws, including the Digital Personal Data Protection Act, 2023, you may have the right to:",
    items: [
      "Access your personal information",
      "Request correction of inaccurate information",
      "Update your information",
      "Withdraw consent where applicable",
      "Request deletion of personal information where legally permissible",
      "Raise concerns regarding the handling of your personal data"
    ],
    footer: "Certain medical records may be retained where required by healthcare regulations or other legal obligations."
  },
  {
    title: "9. Children's Privacy",
    paragraphs: [
      "Healthcare services provided to minors require the involvement of a parent or lawful guardian wherever applicable.",
      "We do not knowingly collect personal information from children through our website without appropriate authorization."
    ]
  },
  {
    title: "10. Third-Party Services",
    body: "Our website may integrate or link to third-party services such as:",
    items: ["Google Maps", "Google Analytics", "Online appointment systems", "Payment gateways", "Social media platforms"],
    footer: "These third-party services maintain their own privacy policies. We encourage users to review those policies before providing personal information."
  },
  {
    title: "11. Communication",
    body: "By providing your contact information, you consent to receive communications related to:",
    items: [
      "Appointment confirmations",
      "Appointment reminders",
      "Follow-up consultations",
      "Medical reports",
      "Hospital service updates",
      "Health awareness information",
      "Administrative notifications"
    ],
    footer: "You may opt out of promotional communications at any time, although important service-related communications may still be sent."
  },
  {
    title: "12. Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or privacy practices.",
      "Any updates will be posted on this page along with the revised Last Updated date. We encourage you to review this page periodically."
    ]
  }
];

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Mudgal Gastromedics Hospital, including patient information, appointment data, cookies, analytics, medical confidentiality, and data rights.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Privacy Policy</p>
          <h1 className="text-5xl font-black md:text-7xl">Privacy Policy</h1>
          <div className="mt-5 grid gap-1 text-white/85">
            <p>Effective Date: July 8, 2026</p>
            <p>Last Updated: July 8, 2026</p>
          </div>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <div className="max-w-4xl">
            <p className="text-lg leading-relaxed text-muted">
              Welcome to <strong className="text-ink">Mudgal Gastromedics Hospital</strong> (&quot;Hospital,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting the privacy and confidentiality of our patients, website visitors, and all individuals who interact with us. This Privacy Policy explains how we collect, use, store, disclose, and safeguard your personal information when you visit our website, book appointments, receive medical services, or communicate with us.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              By using our website or services, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described below.
            </p>
          </div>

          <div className="mt-10 grid gap-8">
            {policySections.map((section) => (
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
                {"groups" in section && section.groups ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {section.groups.map((group) => (
                      <div key={group.title} className="rounded border border-line bg-soft/50 p-4">
                        <h3 className="font-black text-ink">{group.title}</h3>
                        <PolicyList items={group.items} />
                      </div>
                    ))}
                  </div>
                ) : null}
                {"items" in section && section.items ? <PolicyList items={section.items} /> : null}
                {"footer" in section && section.footer ? <p className="mt-4 leading-relaxed text-muted">{section.footer}</p> : null}
              </section>
            ))}

            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">13. Contact Us</h2>
              <p className="mt-4 leading-relaxed text-muted">
                If you have any questions regarding this Privacy Policy, the collection or processing of your personal information, or wish to exercise your rights under applicable data protection laws, please contact us:
              </p>
              <div className="mt-5 rounded border border-line bg-soft/60 p-5">
                <p className="font-black text-ink">Mudgal Gastromedics Hospital</p>
                <p className="mt-2 text-muted">16, H.I.G., Behind Police Chowki, Shaheed Nagar, Agra, Uttar Pradesh, India</p>
                <p className="mt-2 text-muted">Phone: <a href="tel:+919828912257" className="font-semibold text-brand hover:text-brand-dark">+91-9828912257</a></p>
                <p className="mt-2 text-muted">Email: <a href="mailto:admin@mudgalgastromedics.com" className="font-semibold text-brand hover:text-brand-dark">admin@mudgalgastromedics.com</a></p>
              </div>
              <p className="mt-4 leading-relaxed text-muted">
                Our team will make reasonable efforts to respond to your enquiries and resolve your concerns promptly in accordance with applicable laws and hospital policies.
              </p>
            </section>

            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">Consent</h2>
              <p className="mt-4 leading-relaxed text-muted">
                By accessing our website, booking an appointment, submitting your information, or using any of our healthcare services, you acknowledge that you have read, understood, and agree to the terms of this Privacy Policy and consent to the collection, use, storage, and processing of your information as described herein.
              </p>
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
