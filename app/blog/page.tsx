import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Section } from "@/components/Section";
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
  title: "Blog",
  description: "Updates and patient information from Mudgal Gastromedics Hospital, Agra.",
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
            News, camps and patient information from {site.name}.
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
    </main>
  );
}
