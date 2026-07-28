import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Clock3, Search } from "lucide-react";
import { AppointmentCtaPanel } from "@/components/site/AppointmentCtaPanel";
import { BlogPostSearch } from "@/components/site/BlogPostSearch";
import { HeroOpdTimingCard } from "@/components/site/HeroOpdTimingCard";
import { Section } from "@/components/site/Section";
import { seoBlogPosts } from "@/lib/blog-posts";
import { breadcrumbSchema } from "@/lib/seo-schema";

const breadcrumbLd = {
  "@context": "https://schema.org",
  ...breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" }
  ])
};

const POSTS_PER_PAGE = 12;
const campPostSlug = "stomach-intestine-liver-consultation-check-up-camp";
const campPost = {
  slug: campPostSlug,
  category: "Camp",
  title: "Stomach, Intestine & Liver Consultation and Check-Up Camp",
  description:
    "Archived consultation camp at Mudgal Gastromedics Hospital, Shaheed Nagar, Agra, with gastro and liver specialist care guidance.",
  date: "July 1, 2026",
  readTime: "2 min read",
  accent: "#d39a2b"
};

type BlogPageProps = {
  searchParams?: Promise<{
    category?: string;
    page?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Gastroenterology Blog | Mudgal Gastromedics Hospital Agra",
  description: "Patient guides on endoscopy, colonoscopy, fatty liver, jaundice, blood in stool and digestive health from Mudgal Gastromedics Hospital, Agra.",
  alternates: { canonical: "/blog" }
};

function parseDate(date: string) {
  const time = Date.parse(date);
  return Number.isNaN(time) ? 0 : time;
}

function blogHref(category?: string, page?: number) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function getBlogCoverImage(post: { slug: string }) {
  if (post.slug === campPostSlug) return "/images/hospital/campbanner.jpeg";
  return `/images/blog/generated/${post.slug}-cover.svg`;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const selectedCategory = params?.category;
  const requestedPage = Number(params?.page ?? "1");

  const sortedPosts = [campPost, ...seoBlogPosts].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  const categories = Array.from(
    sortedPosts.reduce((map, post) => {
      map.set(post.category, (map.get(post.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const filteredPosts = selectedCategory ? sortedPosts.filter((post) => post.category === selectedCategory) : sortedPosts;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(1, requestedPage), totalPages) : 1;
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const visiblePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);
  const featuredPost = filteredPosts.find((post) => post.slug !== campPostSlug) ?? filteredPosts[0] ?? sortedPosts[0];
  const listPosts = visiblePosts.filter((post) => !(currentPage === 1 && post.slug === featuredPost.slug));
  const popularPosts = sortedPosts.filter((post) => post.slug !== featuredPost.slug).slice(0, 5);
  const categoryTitle = selectedCategory ?? "All Patient Guides";

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="relative overflow-hidden bg-mist px-4 py-8 text-white md:py-12">
        <div className="relative mx-auto w-[min(1280px,calc(100%-12px))] overflow-hidden rounded-[28px] border border-cyan-100/30 bg-ink shadow-[0_30px_90px_rgba(8,64,84,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,43,52,0.97)_0%,rgba(8,64,84,0.86)_47%,rgba(8,145,178,0.36)_100%),url('/images/hospital/waitingarea-full-hero.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_34%,rgba(255,255,255,0.06)_100%)] mix-blend-soft-light" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,22,29,0.62),rgba(2,22,29,0.12)),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_42%,rgba(2,22,29,0.28))]" />
          <div className="relative grid grid-cols-[minmax(0,1fr)] min-h-[580px] gap-10 px-6 py-12 md:px-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-20 lg:py-16">
            <div className="flex max-w-2xl flex-col justify-center">
              <div className="mb-7 flex items-center gap-4">
                <span className="h-0.5 w-12 bg-cyan-200" />
                <span className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">Mudgal Gastromedics Journal</span>
              </div>
              <h1 className="max-w-4xl text-6xl font-black leading-[0.96] tracking-normal text-white md:text-8xl">
                Our Blog
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-relaxed text-white/72 md:text-2xl">
                Practical gastroenterology, liver care, endoscopy and patient-safety guides for families who need clear next steps in Agra.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="#latest-guides"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-7 text-base font-black text-white shadow-[0_18px_45px_rgba(8,145,178,0.34)] transition hover:-translate-y-1"
                >
                  Read Latest Articles
                  <ArrowRight size={18} />
                </Link>
              </div>
              <AppointmentCtaPanel className="mt-5 max-w-3xl" />
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-black text-white/58">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-200" /> {sortedPosts.length}+ patient guides</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-200" /> Agra-focused care advice</span>
              </div>
            </div>
            <div className="relative hidden min-h-[460px] items-center justify-center lg:flex">
              <div className="absolute right-2 top-10 h-[420px] w-[520px] rotate-[3deg] rounded-[28px] border border-white/18 bg-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur">
                <div className="absolute left-14 top-12 rounded-full border border-cyan-100/35 px-5 py-2 text-xs font-black uppercase tracking-[0.34em] text-cyan-100">
                  Patient Guide
                </div>
                <div className="absolute left-16 top-28 max-w-[340px] text-4xl font-black leading-tight text-white/82">
                  Endoscopy vs Colonoscopy
                </div>
                <div className="absolute bottom-14 left-16 right-16 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/72">
                  <span className="rounded border border-cyan-100/20 px-3 py-2">Prep</span>
                  <span className="rounded border border-cyan-100/20 px-3 py-2">Safety</span>
                  <span className="rounded border border-cyan-100/20 px-3 py-2">Recovery</span>
                </div>
              </div>
              <div className="absolute right-24 top-36 h-[320px] w-[560px] -rotate-[7deg] rounded-[26px] border border-white/14 bg-ink/70 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <div className="rounded-full border border-cyan-100/30 px-5 py-2 text-center text-xs font-black uppercase tracking-[0.32em] text-cyan-100">
                  Liver & Digestive Health
                </div>
                <div className="mt-14 text-5xl font-black leading-tight text-white/84">
                  Fatty Liver, GERD & GI Bleeding
                </div>
                <p className="mt-5 text-sm font-semibold text-white/45">Warning signs, report guidance, preparation and follow-up explained clearly.</p>
              </div>
              <div className="absolute bottom-10 right-10 rounded-full border border-cyan-100/35 bg-ink/80 px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-cyan-100 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                Updated Patient Articles
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>

      <Section id="latest-guides" muted className="pt-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <div className="mb-7 flex flex-col gap-4 rounded-lg border border-line bg-white p-5 shadow-soft md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Patient Education</p>
                <h2 className="mt-2 text-4xl font-black leading-tight text-ink md:text-5xl">{categoryTitle}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                  Showing {visiblePosts.length} of {filteredPosts.length} guides. Use categories to browse focused gastroenterology, liver and procedure articles.
                </p>
              </div>
              {selectedCategory || currentPage > 1 ? (
                <Link
                  href="/blog"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(8,145,178,0.28)] transition hover:-translate-y-0.5"
                >
                  Clear filters
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="rounded-full border border-line bg-soft px-5 py-2 text-sm font-black text-brand-dark">
                  {sortedPosts.length} total guides
                </div>
              )}
            </div>

            {featuredPost ? (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group mb-6 block overflow-hidden rounded-lg border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
              >
                <div className="relative aspect-[2.1/1] overflow-hidden bg-ink">
                  <Image
                    src={getBlogCoverImage(featuredPost)}
                    alt={`${featuredPost.title} article cover`}
                    fill
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <article className="p-6 md:p-7">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-bold text-muted">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} className="text-brand-dark" />
                      {featuredPost.date}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={16} className="text-brand-dark" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black leading-tight text-ink md:text-4xl">{featuredPost.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted">{featuredPost.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-brand-dark">
                    Read featured guide <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>
            ) : null}

            <div className="grid gap-5">
              {listPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-lg border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
                >
                  <div className="relative aspect-[2.1/1] overflow-hidden bg-ink">
                    <Image
                      src={getBlogCoverImage(post)}
                      alt={`${post.title} article cover`}
                      fill
                      sizes="(min-width: 1024px) 700px, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <article className="flex min-w-0 flex-col p-6 md:p-7">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm font-bold text-muted">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} className="text-brand-dark" />
                        {post.date}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={16} className="text-brand-dark" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black leading-tight text-ink md:text-3xl">{post.title}</h3>
                    <p className="mt-4 grow leading-relaxed text-muted">{post.description}</p>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#c9dddf] bg-[#eef7f7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand-dark">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: post.accent }} />
                        {post.category}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-black text-brand-dark">
                        Read guide <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <nav className="mt-9 flex flex-col gap-4 rounded-lg border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between" aria-label="Blog pagination">
              <Link
                href={currentPage > 1 ? blogHref(selectedCategory, currentPage - 1) : blogHref(selectedCategory, 1)}
                aria-disabled={currentPage <= 1}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded border px-5 text-sm font-black transition ${
                  currentPage <= 1
                    ? "pointer-events-none border-line bg-soft text-muted/55"
                    : "border-line bg-white text-ink hover:border-brand hover:text-brand-dark"
                }`}
              >
                <ArrowLeft size={16} />
                Previous
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, pages) => {
                    const prev = pages[index - 1];
                    return (
                      <span key={page} className="inline-flex items-center gap-2">
                        {prev && page - prev > 1 ? <span className="text-muted">...</span> : null}
                        <Link
                          href={blogHref(selectedCategory, page)}
                          aria-current={page === currentPage ? "page" : undefined}
                          className={`grid h-10 min-w-10 place-items-center rounded border px-3 text-sm font-black transition ${
                            page === currentPage
                              ? "border-brand bg-brand text-white"
                              : "border-line bg-white text-ink hover:border-brand hover:text-brand-dark"
                          }`}
                        >
                          {page}
                        </Link>
                      </span>
                    );
                  })}
              </div>
              <Link
                href={currentPage < totalPages ? blogHref(selectedCategory, currentPage + 1) : blogHref(selectedCategory, totalPages)}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded border px-5 text-sm font-black transition ${
                  currentPage >= totalPages
                    ? "pointer-events-none border-line bg-soft text-muted/55"
                    : "border-line bg-white text-ink hover:border-brand hover:text-brand-dark"
                }`}
              >
                Next
                <ArrowRight size={16} />
              </Link>
            </nav>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <BlogPostSearch posts={sortedPosts} />

            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded bg-soft text-brand-dark">
                  <Search size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Browse By</p>
                  <h3 className="text-2xl font-black text-ink">Categories</h3>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <CategoryLink href="/blog" label="All Guides" count={sortedPosts.length} active={!selectedCategory} />
                {categories.map(([category, count]) => (
                  <CategoryLink
                    key={category}
                    href={blogHref(category)}
                    label={category}
                    count={count}
                    active={selectedCategory === category}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-dark">Popular Guides</p>
              <div className="mt-4 divide-y divide-line">
                {popularPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group block py-4 first:pt-0 last:pb-0">
                    <p className="text-sm font-black leading-snug text-ink transition group-hover:text-brand-dark">{post.title}</p>
                    <p className="mt-2 text-xs font-bold text-muted">{post.category} · {post.readTime}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#09505c] bg-[#07343c] text-white shadow-[0_24px_70px_rgba(6,54,63,0.22)]">
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Need Help?</p>
                <h3 className="mt-2 text-2xl font-black">Talk to reception before visiting</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/74">
                  For vomiting blood, black stools, severe pain, fever with jaundice or breathing difficulty, call reception first.
                </p>
                <AppointmentCtaPanel className="mt-5" layout="stacked" />
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </main>
  );
}

function CategoryLink({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded border px-4 py-3 text-sm font-black transition ${
        active
          ? "border-brand bg-[#eaf8fa] text-brand-dark"
          : "border-transparent bg-white text-ink hover:border-line hover:bg-soft"
      }`}
    >
      <span>{label}</span>
      <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs ${active ? "bg-brand text-white" : "bg-soft text-muted"}`}>
        {count}
      </span>
      <ChevronRight size={15} className={active ? "text-brand-dark" : "text-muted"} />
    </Link>
  );
}
