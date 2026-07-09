import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Section, SectionHead } from "@/components/Section";
import { getSeoBlogPost, seoBlogPosts } from "@/lib/blog-posts";
import { localServiceAreas, site } from "@/lib/site-data";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return seoBlogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getSeoBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | ${site.name}`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${site.url}/blog/${post.slug}`,
      siteName: site.name,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      images: [{ url: `/blog/${post.slug}/opengraph-image`, width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`/blog/${post.slug}/opengraph-image`]
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getSeoBlogPost(slug);
  if (!post) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: new Date(post.date).toISOString(),
        dateModified: new Date(post.date).toISOString(),
        mainEntityOfPage: `${site.url}/blog/${post.slug}`,
        image: `${site.url}/blog/${post.slug}/opengraph-image`,
        author: {
          "@type": "Organization",
          name: site.name,
          url: site.url
        },
        publisher: {
          "@type": "Organization",
          name: site.name,
          url: site.url
        },
        keywords: post.keywords.join(", ")
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }
    ]
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-end gap-10 lg:grid-cols-[1fr_0.78fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: post.accent }} />
              {post.category}
            </p>
            <h1 className="max-w-5xl text-5xl font-black leading-tight md:text-7xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/85">{post.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-white/78">
              <span className="inline-flex items-center gap-2"><CalendarDays size={17} /> Published {post.date}</span>
              <span className="inline-flex items-center gap-2"><Clock size={17} /> {post.readTime}</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded border border-white/18 bg-white/10 p-6 shadow-[0_28px_90px_rgba(2,22,29,0.34)] backdrop-blur-md">
            <div aria-hidden="true" className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 18% 10%, ${post.accent}55, transparent 18rem), linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))` }} />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Patient Guide</p>
              <h2 className="mt-4 text-3xl font-black leading-tight">{post.relatedLabel}</h2>
              <div className="mt-7 grid gap-3">
                {["Indian patient preparation", "Medicine and fasting guidance", "Safety and recovery notes", "Available in Shaheed Nagar, Agra"].map((item) => (
                  <div key={item} className="flex gap-3 rounded border border-white/15 bg-white/10 p-3 text-sm font-semibold text-white/86">
                    <ShieldCheck className="mt-0.5 shrink-0 text-cyan-100" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={post.relatedHref} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-100">
                View related service <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <div className="overflow-hidden rounded border border-line bg-white shadow-[0_28px_80px_rgba(8,64,84,0.14)]">
          <div className="relative min-h-[360px] p-7 text-white md:p-10">
            <div aria-hidden="true" className="absolute inset-0 bg-ink" />
            <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(circle at 16% 12%, ${post.accent}66, transparent 24rem), radial-gradient(circle at 90% 40%, rgba(16,185,129,0.3), transparent 25rem), linear-gradient(135deg, rgba(2,22,29,0.98), rgba(8,64,84,0.9))` }} />
            <div aria-hidden="true" className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08))]" />
            <div className="relative flex min-h-[300px] flex-col justify-between">
              <div>
                <p className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">{post.category}</p>
                <h2 className="mt-7 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{post.title}</h2>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-2xl text-lg leading-relaxed text-white/78">
                  {site.name}, {site.addressLine1}, {site.city}. Call {site.mobile} for appointment guidance.
                </p>
                <div className="rounded border border-white/15 bg-white/10 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-cyan-100">
                  {post.relatedLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="rounded border border-line bg-white p-6 shadow-soft md:p-8">
            <p className="text-xl leading-relaxed text-muted">{post.intro}</p>
            <div className="mt-8 grid gap-7">
              {post.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-3xl font-black leading-tight text-ink">{section.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{section.body}</p>
                  {section.items?.length ? (
                    <ul className="mt-4 grid gap-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3 rounded border border-line bg-soft/55 p-3 text-muted">
                          <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={18} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <aside className="grid gap-5 self-start lg:sticky lg:top-28">
            <div className="rounded border border-line bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Related Service</p>
              <h2 className="mt-2 text-2xl font-black">{post.relatedLabel}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Learn about symptoms, preparation, safety and treatment planning at {site.name}.
              </p>
              <Link href={post.relatedHref} className="mt-5 inline-flex items-center gap-2 font-black text-brand">
                Open service page <ArrowRight size={17} />
              </Link>
            </div>
            <div className="rounded border border-line bg-ink p-5 text-white shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">Book / Call</p>
              <div className="mt-4 grid gap-3">
                <ButtonLink href="/contact#appointment" className="w-full">Book Appointment</ButtonLink>
                <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost" className="w-full"><Phone size={18} /> Call Reception</ButtonLink>
                <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary" className="w-full"><MessageCircle size={18} /> WhatsApp</ButtonLink>
              </div>
            </div>
            <div className="rounded border border-line bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Topics</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-xs font-black text-teal-dark">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded border border-line bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Local Care Areas</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Patients commonly visit from Shaheed Nagar, Tajganj, Fatehabad Road and nearby cities.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {localServiceAreas.slice(0, 8).map((area) => (
                  <span key={area} className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold text-muted">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <Section muted>
        <SectionHead eyebrow="FAQs" title="Common patient questions" />
        <div className="grid gap-4 lg:grid-cols-2">
          {post.faqs.map((faq) => (
            <details key={faq.question} className="group rounded border border-line bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-lg font-black text-ink">{faq.question}</summary>
              <p className="mt-3 leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 rounded border border-line bg-white p-6 shadow-lift lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Need medical guidance?</p>
            <h2 className="mt-2 text-3xl font-black">Call reception before planning your visit.</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Share symptoms, current medicines and previous reports so the hospital team can guide appointment planning.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/contact#appointment">Book Appointment</ButtonLink>
            <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost">Call Reception</ButtonLink>
            <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
