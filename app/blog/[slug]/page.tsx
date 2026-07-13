import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText, CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BlogArticleActions } from "@/components/site/BlogArticleActions";
import { BlogConsultationForm } from "@/components/site/BlogConsultationForm";
import { ButtonLink } from "@/components/site/ButtonLink";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { LocalCareLinks } from "@/components/site/LocalCareLinks";
import { Section, SectionHead } from "@/components/site/Section";
import { getSeoBlogPost, seoBlogPosts } from "@/lib/blog-posts";
import { breadcrumbSchema } from "@/lib/seo-schema";
import { agraLocalAreas, doctor, nearbyServiceCities, site } from "@/lib/site-data";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

const opdTimingBlogSlugs = new Set([
  "vomiting-blood-causes-emergency-warning-signs-treatment",
  "black-stool-causes-emergency",
  "blood-in-stool-causes-when-to-consult",
  "jaundice-with-fever-urgent-warning-signs",
  "persistent-vomiting-gastro-causes-warning-signs",
  "pancreatitis-symptoms-causes-treatment-agra",
  "chronic-pancreatitis-pain-diabetes-digestion-problems"
]);

export function generateStaticParams() {
  return seoBlogPosts.map((post) => ({ slug: post.slug }));
}

function getBlogCoverImage(post: { slug: string }) {
  return `/images/blog/generated/${post.slug}-cover.svg`;
}

function sectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getArticleCta(post: { title: string; category: string; relatedLabel: string }) {
  const text = `${post.title} ${post.category} ${post.relatedLabel}`.toLowerCase();
  if (text.includes("blood") || text.includes("black stool") || text.includes("vomiting blood") || text.includes("bleeding")) {
    return {
      title: "Call before visiting for bleeding symptoms",
      description: "Share urgent symptoms with reception so the team can guide timing, preparation and emergency next steps.",
      buttonLabel: "Request Urgent Guidance"
    };
  }
  if (text.includes("liver") || text.includes("fatty") || text.includes("fibroscan") || text.includes("jaundice") || text.includes("sgpt")) {
    return {
      title: "Book liver care guidance",
      description: "Share liver reports, symptoms or FibroScan questions and reception will guide the right consultation pathway.",
      buttonLabel: "Book Liver Consultation"
    };
  }
  if (text.includes("endoscopy") || text.includes("colonoscopy") || text.includes("ercp") || text.includes("biopsy") || text.includes("stent")) {
    return {
      title: "Plan this procedure safely",
      description: "Share your procedure question, reports and preferred visit time so reception can guide preparation.",
      buttonLabel: "Plan Procedure Visit"
    };
  }
  if (text.includes("gerd") || text.includes("acidity") || text.includes("gastritis") || text.includes("ulcer")) {
    return {
      title: "Consult for persistent acidity",
      description: "Share symptoms, medicines already taken and warning signs so reception can guide a gastroenterology visit.",
      buttonLabel: "Book Gastro Consultation"
    };
  }
  return {
    title: "Ask reception about these symptoms",
    description: "Share your details and the team will guide the right next step for consultation or tests.",
    buttonLabel: "Request Guidance"
  };
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
  const showOpdTimingCard = opdTimingBlogSlugs.has(post.slug);
  const coverImage = getBlogCoverImage(post);
  const articleUrl = `${site.url}/blog/${post.slug}`;
  const articleCta = getArticleCta(post);
  const relatedPosts = seoBlogPosts
    .filter((item) => item.slug !== post.slug)
    .map((item) => {
      const categoryScore = item.category === post.category ? 4 : 0;
      const keywordScore = item.keywords.filter((keyword) => post.keywords.includes(keyword)).length;
      return { item, score: categoryScore + keywordScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);

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
      },
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: post.title, url: `/blog/${post.slug}` }
      ])
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

      <Section className="relative z-10">
        <div className="mb-5 overflow-hidden rounded-lg border border-line/80 bg-white p-2 shadow-[0_24px_70px_rgba(8,64,84,0.14)]">
          <img
            src={coverImage}
            alt={`${post.title} cover image`}
            width={1600}
            height={757}
            sizes="(min-width: 1180px) 1180px, calc(100vw - 32px)"
            className="aspect-[2.1/1] w-full rounded object-cover"
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
        <div className="mt-5 rounded-xl border border-line bg-white p-5 shadow-[0_20px_55px_rgba(8,64,84,0.09)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-brand/15 bg-soft text-brand shadow-sm">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Medical Review</p>
                <h2 className="mt-1 text-2xl font-black text-ink">Reviewed for patient education by {doctor.name}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                  This guide is written for general awareness and does not replace consultation, diagnosis or treatment advice from a qualified doctor.
                </p>
              </div>
            </div>
            <Link href="/dr-deepak-kumar-sharma-gastroenterologist-agra" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-black text-brand shadow-sm transition hover:border-brand hover:bg-soft">
              Doctor Profile <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Section>

      {showOpdTimingCard ? (
        <Section className="overflow-hidden">
          <HeroOpdTimingCard />
        </Section>
      ) : null}

      <Section id="article">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="self-start rounded border border-line bg-white p-6 shadow-soft md:p-8">
            <div className="mb-8 rounded-xl border border-line bg-soft/35 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">In this guide</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <span className="rounded border border-line bg-white px-4 py-3 text-sm font-black text-muted shadow-sm">{post.readTime}</span>
                <span className="rounded border border-line bg-white px-4 py-3 text-sm font-black text-muted shadow-sm">{post.category}</span>
              </div>
              <nav className="mt-5 grid gap-3">
                {post.sections.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#${sectionId(section.title)}`}
                    className="flex min-h-14 items-center gap-4 rounded-lg border border-line bg-white px-4 py-3 text-base font-black text-muted shadow-sm transition hover:border-brand hover:text-brand"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-brand shadow-md">{index + 1}</span>
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
            <p className="text-xl leading-relaxed text-muted">{post.intro}</p>
            <div className="mt-8 grid gap-7">
              {post.sections.map((section) => (
                <section key={section.title} id={sectionId(section.title)} className="scroll-mt-32">
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
            <div className="rounded-xl border border-red-100 bg-[linear-gradient(135deg,#fff7f5,#ffffff)] p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-red-600">Warning signs</p>
              <h2 className="mt-2 text-xl font-black leading-tight text-ink">Call reception before visiting</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                For vomiting blood, black stools, severe pain, fever with jaundice, breathing difficulty or persistent vomiting, call reception first.
              </p>
              <a href={`tel:${site.mobile.replace(/\s/g, "")}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-4 text-sm font-black text-white transition hover:-translate-y-0.5">
                Call Reception
              </a>
            </div>
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
              <AppointmentCtaPanel className="mt-4" layout="stacked" />
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
          </aside>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6">
          <BlogArticleActions title={post.title} description={post.description} url={articleUrl} />
          <BlogConsultationForm
            articleTitle={post.title}
            relatedLabel={post.relatedLabel}
            category={post.category}
            title={articleCta.title}
            description={articleCta.description}
            buttonLabel={articleCta.buttonLabel}
          />
        </div>
      </Section>

      <Section>
        <SectionHead eyebrow="Related Reading" title="Continue with connected patient guides">
          <p>These articles connect with the same symptom, procedure or disease pathway.</p>
        </SectionHead>
        <div className="grid gap-5 md:grid-cols-3">
          {relatedPosts.map((related) => (
            <Link key={related.slug} href={`/blog/${related.slug}`} className="group rounded-xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand">{related.category}</p>
              <h2 className="mt-3 text-xl font-black leading-tight text-ink transition group-hover:text-brand">{related.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{related.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand">
                Read guide <ArrowRight size={16} />
              </div>
            </Link>
          ))}
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
        <div className="rounded-2xl border border-line bg-white p-6 shadow-lift md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Local Care Areas</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-ink md:text-4xl">Gastroenterology care for Agra and nearby cities</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Patients looking for a gastroenterologist, liver specialist, endoscopy or colonoscopy care in Agra commonly visit from these local areas and nearby cities.
              </p>
            </div>
            <div className="grid gap-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink">Agra local areas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agraLocalAreas.slice(0, 12).map((area) => (
                    <span key={area} className="rounded-full border border-[#bfe5ea] bg-[#eefbfb] px-4 py-2 text-sm font-black text-teal-dark">
                      {area}
                    </span>
                  ))}
                </div>
                {agraLocalAreas.length > 12 ? (
                  <details className="group mt-3">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line bg-white px-5 text-sm font-black text-brand shadow-sm transition hover:border-brand hover:bg-soft [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Show more areas</span>
                      <span className="hidden group-open:inline">Show fewer areas</span>
                    </summary>
                    <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                      {agraLocalAreas.slice(12).map((area) => (
                        <span key={area} className="rounded-full border border-line bg-soft px-4 py-2 text-sm font-bold text-muted">
                          {area}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink">Nearby cities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nearbyServiceCities.slice(0, 10).map((city) => (
                    <span key={city} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-black text-muted shadow-sm">
                      {city}
                    </span>
                  ))}
                </div>
                {nearbyServiceCities.length > 10 ? (
                  <details className="group mt-3">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line bg-white px-5 text-sm font-black text-brand shadow-sm transition hover:border-brand hover:bg-soft [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Show more cities</span>
                      <span className="hidden group-open:inline">Show fewer cities</span>
                    </summary>
                    <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                      {nearbyServiceCities.slice(10).map((city) => (
                        <span key={city} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted shadow-sm">
                          {city}
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <LocalCareLinks />
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
          <AppointmentCtaPanel className="lg:min-w-[520px]" />
        </div>
      </Section>
    </main>
  );
}
