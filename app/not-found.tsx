import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { HeroOpdTimingCard } from "@/components/HeroOpdTimingCard";
import { Section } from "@/components/Section";

export default function NotFound() {
  return (
    <main>
      <section className="page-hero-bg overflow-hidden py-20 text-white md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-100/35 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              Page Not Found
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.98] md:text-7xl">
              This page is not available.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/82 md:text-xl">
              The link may have changed, but consultation, procedure and contact options are still available.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/" className="min-h-12 gap-2 px-5">
                <Home size={18} />
                Go Home
              </ButtonLink>
              <ButtonLink href="/blog" variant="ghost" className="min-h-12 gap-2 px-5">
                <Search size={18} />
                Browse Guides
              </ButtonLink>
            </div>
          </div>
          <div className="rounded border border-white/20 bg-white/12 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Useful Links</p>
            <div className="mt-5 grid gap-3">
              {[
                ["Book Appointment", "/portal#appointment"],
                ["Contact Hospital", "/contact"],
                ["Gastroenterology Services", "/services/gastroenterology"],
                ["Doctor Profile", "/dr-deepak-kumar-sharma-gastroenterologist-agra"]
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between gap-4 rounded border border-white/14 bg-white/10 p-4 text-sm font-black text-white/88 transition hover:bg-white/16"
                >
                  <span>{label}</span>
                  <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Section className="overflow-hidden">
        <HeroOpdTimingCard />
      </Section>
    </main>
  );
}
