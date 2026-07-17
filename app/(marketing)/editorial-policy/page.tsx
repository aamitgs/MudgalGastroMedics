import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/site/Section";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { doctor, site } from "@/lib/site-data";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Editorial Policy", url: "/editorial-policy" }
  ])
};

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "How patient guides and health information on the Mudgal Gastromedics Hospital website are prepared, medically reviewed and kept up to date.",
  alternates: { canonical: "/editorial-policy" }
};

const editorialSections = [
  {
    title: "How our content is prepared",
    body: `Patient guides, disease and procedure pages published on this website are prepared by the ${site.name} team for general patient education about gastroenterology, liver care and related digestive health topics.`
  },
  {
    title: "Medical review",
    body: `Patient education content is reviewed by ${doctor.name}, ${doctor.designation} and Principal Consultant at ${site.name}. Each blog post carries a "Reviewed for patient education by" byline identifying the reviewing physician, and links to the doctor's profile page.`
  },
  {
    title: "Publication and updates",
    body: "Every patient guide displays its publication date. Content may be revised over time as needed for clarity or accuracy; this website does not currently display a separate last-updated date distinct from the original publication date."
  },
  {
    title: "What this content is, and is not",
    body: "This content is written for general awareness and does not replace individualized consultation, diagnosis or treatment advice from a qualified doctor. It should not be used to self-diagnose or self-treat a medical condition. See our Disclaimer for full terms."
  },
  {
    title: "Reporting an inaccuracy",
    body: "If you notice information that appears outdated or incorrect, please contact the hospital and we will review it."
  }
];

export default function EditorialPolicyPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="page-hero-bg py-24 text-white">
        <div className="mx-auto w-[min(1160px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Editorial Policy</p>
          <h1 className="text-5xl font-black md:text-7xl">How we prepare patient guides</h1>
        </div>
      </section>

      <Section>
        <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
          <div className="grid gap-6">
            {editorialSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-black text-ink">{section.title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{section.body}</p>
              </div>
            ))}
            <p className="leading-relaxed text-muted">
              Read more in our{" "}
              <Link href="/disclaimer" className="font-semibold text-brand-dark hover:underline">
                Disclaimer
              </Link>
              , or{" "}
              <Link href="/contact" className="font-semibold text-brand-dark hover:underline">
                contact the hospital
              </Link>{" "}
              with questions about this policy.
            </p>
          </div>
        </article>
      </Section>
    </main>
  );
}
