import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, CalendarDays, Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
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

function getBlogCoverImage(post: { slug: string; coverImage?: string }) {
  if (post.coverImage) return post.coverImage;
  return `/blog/${post.slug}/cover-image`;
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
      images: [{ url: post.ogImage ?? `/blog/${post.slug}/opengraph-image`, width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.ogImage ?? `/blog/${post.slug}/opengraph-image`]
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getSeoBlogPost(slug);
  if (!post) notFound();
  const coverImage = getBlogCoverImage(post);

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
        image: `${site.url}${post.ogImage ?? `/blog/${post.slug}/opengraph-image`}`,
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
      <section className="relative overflow-hidden bg-mist px-4 py-8 text-white md:py-12">
        <div className="absolute inset-0 clinical-grid opacity-70" />
        <div className="relative mx-auto w-[min(1280px,calc(100%-12px))] overflow-hidden rounded-[28px] border border-cyan-100/30 bg-ink shadow-[0_30px_90px_rgba(8,64,84,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,43,52,0.98)_0%,rgba(8,64,84,0.88)_52%,rgba(8,145,178,0.34)_100%),url('/images/hospital/endoscopy-room.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] [background-size:76px_76px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_34%,rgba(34,211,238,0.24),transparent_32%),linear-gradient(90deg,rgba(2,22,29,0.58),rgba(2,22,29,0.1))]" />
          <div className="relative grid min-h-[610px] gap-10 px-6 py-12 md:px-14 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] xl:px-20 xl:py-16">
            <div className="flex min-w-0 max-w-3xl flex-col justify-center">
              <div className="mb-7 flex items-center gap-4">
                <span className="h-0.5 w-12 bg-cyan-200" />
                <span className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">Patient Guide</span>
              </div>
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/74">
                <BookOpenText size={15} />
                {post.category}
              </div>
              <h1 className="max-w-5xl text-5xl font-black leading-[0.98] tracking-normal text-white md:text-6xl 2xl:text-7xl">
                {post.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/72 md:text-xl">
                {post.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-sm font-black text-white/62">
                <span className="inline-flex items-center gap-2"><CalendarDays size={17} /> Published {post.date}</span>
                <span className="inline-flex items-center gap-2"><Clock size={17} /> {post.readTime}</span>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#article"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-7 text-base font-black text-white shadow-[0_18px_45px_rgba(8,145,178,0.34)] transition hover:-translate-y-1"
                >
                  Read Article
                  <ArrowRight size={18} />
                </Link>
                <ButtonLink href={post.relatedHref} variant="ghost" className="rounded-full">
                  Related Service
                </ButtonLink>
              </div>
            </div>
            <div className="relative hidden min-h-[470px] min-w-0 items-center justify-end xl:flex">
              <div className="absolute right-0 top-10 h-[400px] w-[min(100%,430px)] rotate-[2deg] rounded-[24px] border border-white/18 bg-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur">
                <div className="absolute left-8 right-8 top-10 rounded-full border border-cyan-100/35 px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                  {post.relatedLabel}
                </div>
                <div className="absolute left-9 right-9 top-28 text-3xl font-black leading-tight text-white/82">
                  {post.keywords.slice(0, 2).join(" & ")}
                </div>
                <div className="absolute bottom-12 left-9 right-9 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                  <span className="rounded border border-white/16 px-3 py-2">Symptoms</span>
                  <span className="rounded border border-white/16 px-3 py-2">Tests</span>
                  <span className="rounded border border-white/16 px-3 py-2">Care</span>
                </div>
              </div>
              <div className="absolute right-12 top-40 h-[280px] w-[min(100%,430px)] -rotate-[4deg] rounded-[24px] border border-white/14 bg-ink/70 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <div className="rounded-full border border-cyan-100/30 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.32em] text-cyan-100">
                  Mudgal Gastromedics Hospital
                </div>
                <div className="mt-10 text-4xl font-black leading-tight text-white/84">
                  {post.relatedLabel}
                </div>
                <p className="mt-5 text-sm font-semibold text-white/45">
                  Preparation, safety, recovery and warning signs explained for Indian patients.
                </p>
              </div>
              <div className="absolute bottom-10 right-0 rounded-full border border-cyan-100/35 bg-ink/80 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                Shaheed Nagar, Agra
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="relative z-10 pt-8">
        <div className="mb-5 overflow-hidden rounded-lg border border-line/80 bg-white p-2 shadow-[0_24px_70px_rgba(8,64,84,0.14)]">
          <Image
            src={coverImage}
            alt={`${post.title} cover image`}
            width={1600}
            height={757}
            sizes="(min-width: 1180px) 1180px, calc(100vw - 32px)"
            className="aspect-[2.1/1] w-full rounded object-cover"
            priority={Boolean(post.coverImage)}
          />
        </div>
        <div className="grid gap-3 rounded-lg border border-line bg-white p-4 shadow-[0_24px_70px_rgba(8,64,84,0.12)] md:grid-cols-3">
          {[
            { label: "Category", value: post.category },
            { label: "Published", value: post.date },
            { label: "Related Care", value: post.relatedLabel }
          ].map((item) => (
            <div key={item.label} className="rounded border border-line bg-soft/60 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{item.label}</p>
              <p className="mt-1 text-lg font-black text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="article">
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
                <ButtonLink href="/portal#appointment" className="w-full">Book Appointment</ButtonLink>
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
        <SectionHead eyebrow="Patient Decision Guide" title="When to consult and what to prepare" />
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            {
              title: "When to consult",
              text: "Book a gastroenterology consultation if symptoms are persistent, recurring, affecting meals or sleep, or not improving with basic treatment.",
              items: ["Persistent pain, acidity or bloating", "Changed bowel habits", "Jaundice or abnormal liver reports"]
            },
            {
              title: "Warning signs",
              text: "Some symptoms need early review because they may indicate bleeding, obstruction, infection, inflammation or cancer risk.",
              items: ["Blood in stool or black stools", "Vomiting blood or persistent vomiting", "Unexplained weight loss or anemia"]
            },
            {
              title: "What to bring",
              text: "Bring previous reports so the doctor can avoid repeat testing and understand the full clinical picture.",
              items: ["Prescriptions and discharge summaries", "Blood, stool and liver reports", "Ultrasound, CT, MRCP, endoscopy or colonoscopy reports"]
            },
            {
              title: "Related care",
              text: `This article is linked with ${post.relatedLabel}. Read the related page for procedure details, preparation, safety and follow-up guidance.`,
              items: ["Preparation instructions", "Risks and recovery", "FAQs and appointment guidance"],
              href: post.relatedHref
            }
          ].map((block) => (
            <article key={block.title} className="rounded border border-line bg-white p-5 shadow-soft">
              <h2 className="text-2xl font-black leading-tight text-ink">{block.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{block.text}</p>
              <ul className="mt-4 grid gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={17} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {block.href ? (
                <Link href={block.href} className="mt-5 inline-flex items-center gap-2 font-black text-brand">
                  Open related page <ArrowRight size={16} />
                </Link>
              ) : null}
            </article>
          ))}
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
            <ButtonLink href="/portal#appointment">Book Appointment</ButtonLink>
            <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`} variant="ghost">Call Reception</ButtonLink>
            <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
          </div>
        </div>
      </Section>
    </main>
  );
}
