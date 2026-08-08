import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { fullAddress, site } from "@/lib/site-data";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Privacy Policy", url: "/privacy" }
  ])
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
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
                  <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
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

            {/*
              Contact details come from lib/site-data so this page cannot drift
              from the rest of the site — a privacy policy listing a number the
              hospital no longer answers is worse than one listing none, since
              this is the channel a patient must use to exercise a legal right.
            */}
            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">13. Contact Us</h2>
              <p className="mt-4 leading-relaxed text-muted">
                If you have any questions regarding this Privacy Policy, the collection or processing of your personal information, or wish to exercise your rights under applicable data protection laws, please contact us:
              </p>
              <div className="mt-5 rounded border border-line bg-soft/60 p-5">
                <p className="font-black text-ink">{site.name}</p>
                <p className="mt-2 text-muted">{fullAddress}, {site.country}</p>
                <p className="mt-2 text-muted">
                  Phone: <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="font-semibold text-brand-dark hover:text-brand-dark">{site.mobile}</a>
                  {" · "}
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-dark hover:text-brand-dark">{site.phone}</a>
                </p>
                {/*
                  `overflow-wrap: anywhere`, not `break-words`. The email is a
                  28-character token with nowhere to wrap, and these sections
                  are grid items — which default to `min-width: auto` and so
                  refuse to shrink below their content's min-content width.
                  `break-word` permits a mid-word break when laying out but
                  does not reduce that min-content contribution, so the grid
                  stayed 303px wide inside a 286px article and pushed the page
                  into horizontal scroll at 320px (WCAG 2.1 SC 1.4.10 Reflow).
                  `anywhere` is the value that counts for intrinsic sizing.
                */}
                <p className="mt-2 [overflow-wrap:anywhere] text-muted">
                  Email: <a href={`mailto:${site.email}`} className="font-semibold text-brand-dark hover:text-brand-dark">{site.email}</a>
                </p>
              </div>
              <p className="mt-4 leading-relaxed text-muted">
                Our team will make reasonable efforts to respond to your enquiries and resolve your concerns promptly in accordance with applicable laws and hospital policies.
              </p>
            </section>

            {/*
              Required by the Digital Personal Data Protection Act, 2023 §13: a
              Data Fiduciary must publish a contact point able to answer a data
              principal's questions about the processing of her personal data,
              and provide a readily available means of grievance redressal.
              Section 8 above already lists the rights; without a published
              channel and a response commitment, those rights have no route.
            */}
            <section className="border-t border-line pt-8">
              <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">14. Grievance Redressal</h2>
              <p className="mt-4 leading-relaxed text-muted">
                If you wish to exercise any of the rights described in Section 8, or you believe your personal or medical information has been handled in a way that does not follow this Privacy Policy, you may raise a grievance with our Grievance Officer. You do not need to give a reason for making a request.
              </p>
              <div className="mt-5 rounded border border-line bg-soft/60 p-5">
                <p className="font-black text-ink">Grievance Officer</p>
                <p className="mt-1 text-muted">{site.name}</p>
                <p className="mt-2 text-muted">{fullAddress}, {site.country}</p>
                {/*
                  `overflow-wrap: anywhere`, not `break-words`. The email is a
                  28-character token with nowhere to wrap, and these sections
                  are grid items — which default to `min-width: auto` and so
                  refuse to shrink below their content's min-content width.
                  `break-word` permits a mid-word break when laying out but
                  does not reduce that min-content contribution, so the grid
                  stayed 303px wide inside a 286px article and pushed the page
                  into horizontal scroll at 320px (WCAG 2.1 SC 1.4.10 Reflow).
                  `anywhere` is the value that counts for intrinsic sizing.
                */}
                <p className="mt-2 [overflow-wrap:anywhere] text-muted">
                  Email: <a href={`mailto:${site.email}`} className="font-semibold text-brand-dark hover:text-brand-dark">{site.email}</a>
                </p>
                <p className="mt-2 text-muted">
                  Phone: <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="font-semibold text-brand-dark hover:text-brand-dark">{site.mobile}</a>
                </p>
              </div>
              <PolicyList
                items={[
                  "We acknowledge every grievance within 72 hours of receipt.",
                  "We aim to resolve grievances within 30 days, and will tell you if a matter needs longer and why.",
                  "Please include your full name, registered mobile number and, where relevant, your UHID so we can locate your records accurately.",
                  "If you are dissatisfied with our response, you may escalate the matter to the Data Protection Board of India under the Digital Personal Data Protection Act, 2023."
                ]}
              />
              <p className="mt-4 leading-relaxed text-muted">
                Please note that certain medical records must be retained for periods fixed by healthcare regulations. Where a deletion request covers records we are legally required to keep, we will explain what we are retaining and why, and delete the remainder.
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
