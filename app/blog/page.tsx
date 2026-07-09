import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Section } from "@/components/Section";
import { seoBlogPosts } from "@/lib/blog-posts";
import { site } from "@/lib/site-data";

const campPost = {
  href: "/blog/stomach-intestine-liver-consultation-check-up-camp",
  title: "Stomach, Intestine & Liver Consultation and Check-Up Camp",
  hiTitle: "पेट, आंत और लिवर परामर्श एवं जांच शिविर",
  date: "July 11, 2026",
  summary:
    "Consultation camp at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra, with gastro and liver specialist care guidance."
};

export const metadata: Metadata = {
  title: "Gastroenterology Blog | Mudgal Gastromedics Hospital Agra",
  description: "Patient guides on endoscopy, colonoscopy, fatty liver, jaundice, blood in stool and digestive health from Mudgal Gastromedics Hospital, Agra.",
  alternates: { canonical: "/blog" }
};

export default function BlogPage() {
  return (
    <main>
      <section className="page-hero-bg py-20 text-white md:py-28">
        <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">MGM Updates</p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Hospital Blog</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/82">
            Patient guides, hospital updates and digestive health information from {site.name}.
          </p>
        </div>
      </section>

      <Section className="-mt-10 relative z-10 pt-0">
        <Link
          href={campPost.href}
          className="group grid overflow-hidden rounded border border-line/80 bg-white shadow-[0_28px_80px_rgba(8,64,84,0.14)] transition duration-300 hover:-translate-y-1 hover:border-brand lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="grid min-h-72 place-items-center bg-soft p-2 lg:min-h-full">
            <Image
              src="/images/hospital/campbanner.jpeg"
              alt="Mudgal Gastromedics consultation and check-up camp banner"
              width={1600}
              height={810}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-auto w-full rounded object-contain"
            />
          </div>
          <article className="p-6 md:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-soft/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              <span className="h-2 w-2 rounded-full bg-gold" />
              Consultation Camp
            </div>
            <h2 className="text-3xl font-bold leading-tight text-ink md:text-5xl">{campPost.title}</h2>
            <p className="mt-4 text-2xl font-bold leading-tight text-brand" lang="hi">{campPost.hiTitle}</p>
            <p className="mt-5 leading-relaxed text-muted">{campPost.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-muted">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={17} className="text-brand" />
                {campPost.date}
              </span>
              <span className="inline-flex items-center gap-2 text-brand">
                Read post <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        </Link>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={`tel:${site.mobile.replace(/\s/g, "")}`}>Call Now</ButtonLink>
          <ButtonLink href={`https://wa.me/${site.whatsapp}`} variant="secondary">WhatsApp</ButtonLink>
        </div>
      </Section>

      <Section muted>
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Patient Education</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-ink md:text-5xl">Gastro, liver and endoscopy guides</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Practical articles for Indian patients covering preparation, safety, warning signs and when to consult a gastroenterologist in Agra.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {seoBlogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex min-h-full flex-col rounded border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: post.accent }} />
                  {post.category}
                </span>
                <span className="text-xs font-bold text-muted">{post.readTime}</span>
              </div>
              <h3 className="text-2xl font-black leading-tight text-ink">{post.title}</h3>
              <p className="mt-4 grow leading-relaxed text-muted">{post.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-muted">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand" />
                  {post.date}
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                <span className="text-sm font-black text-teal-dark">{post.relatedLabel}</span>
                <span className="inline-flex items-center gap-2 text-sm font-black text-brand">
                  Read guide <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}
