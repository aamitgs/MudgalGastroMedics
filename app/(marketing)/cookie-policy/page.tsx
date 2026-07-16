import type { Metadata } from "next";
import { Section } from "@/components/site/Section";

const cookieSections = [
  {
    title: "What Are Cookies?",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. They help websites remember user preferences and improve performance."
    ]
  },
  {
    title: "Types of Cookies We Use",
    groups: [
      {
        title: "Essential Cookies",
        text: "Required for basic website functionality, security, and navigation."
      },
      {
        title: "Performance & Analytics Cookies",
        text: "Help us understand how visitors use our website so we can improve user experience."
      },
      {
        title: "Functional Cookies",
        text: "Remember your preferences such as language and previously entered information."
      }
    ]
  },
  {
    title: "Managing Cookies",
    paragraphs: [
      "You may control or disable cookies through your browser settings. Disabling cookies may affect certain website features."
    ]
  },
  {
    title: "Third-Party Cookies",
    body: "Our website may use trusted third-party services such as:",
    items: ["Google Analytics", "Google Maps", "YouTube, embedded videos"],
    footer: "These services may set their own cookies according to their respective privacy policies."
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update this Cookie Policy from time to time. Any changes will be published on this page."
    ]
  }
];

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for Mudgal Gastromedics Hospital website, including essential, analytics, functional, and third-party cookies.",
  alternates: { canonical: "/cookie-policy" }
};

export default function CookiePolicyPage() {
  return (
    <main>
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Cookie Policy</p>
          <h1 className="text-5xl font-black md:text-7xl">Cookie Policy</h1>
          <p className="mt-5 max-w-3xl text-white/85">Effective Date: July 8, 2026</p>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <p className="max-w-4xl text-lg leading-relaxed text-muted">
            Mudgal Gastromedics Hospital uses cookies and similar technologies to improve your browsing experience and enhance the functionality of our website.
          </p>
          <div className="mt-10 grid gap-8">
            {cookieSections.map((section) => (
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
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {section.groups.map((group) => (
                      <div key={group.title} className="rounded border border-line bg-soft/60 p-4">
                        <h3 className="font-black text-ink">{group.title}</h3>
                        <p className="mt-2 leading-relaxed text-muted">{group.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {"items" in section && section.items ? <PolicyList items={section.items} /> : null}
                {"footer" in section && section.footer ? <p className="mt-4 leading-relaxed text-muted">{section.footer}</p> : null}
              </section>
            ))}

            <ContactBlock />
          </div>
        </article>
      </Section>
    </main>
  );
}

function ContactBlock() {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">Contact</h2>
      <div className="mt-5 rounded border border-line bg-soft/60 p-5">
        <p className="text-muted">Phone: <a href="tel:+919828912257" className="font-semibold text-brand hover:text-brand-dark">+91-9828912257</a></p>
      </div>
    </section>
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
