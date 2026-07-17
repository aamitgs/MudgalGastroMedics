import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { localSeoPages } from "@/lib/local-seo-pages";

type LocalCareLinksProps = {
  limit?: number;
  className?: string;
};

export function LocalCareLinks({ limit = 6, className = "" }: LocalCareLinksProps) {
  const pages = typeof limit === "number" ? localSeoPages.slice(0, limit) : localSeoPages;

  return (
    <div className={`rounded-2xl border border-line bg-white p-6 shadow-lift md:p-8 ${className}`}>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark">Local Care Guides</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink md:text-4xl">Find specialist care by area and service</h2>
          <p className="mt-4 leading-relaxed text-muted">
            These local guides help patients searching for gastroenterology, liver care, endoscopy and colonoscopy services around Agra.
          </p>
          <Link href="/areas" className="mt-5 inline-flex items-center gap-2 font-black text-brand-dark">
            View all local care guides <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/areas/${page.slug}`}
              className="group flex min-h-16 items-center justify-between gap-4 rounded-lg border border-line bg-soft/55 px-4 py-3 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:border-brand hover:bg-white hover:text-brand-dark"
            >
              <span>{page.title}</span>
              <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={16} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
