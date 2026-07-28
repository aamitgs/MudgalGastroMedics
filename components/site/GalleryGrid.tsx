"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type GalleryItem = {
  category: string;
  title: string;
  src: string;
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const reducedMotion = useReducedMotion();
  const visible = filter === "All" ? items : items.filter((item) => item.category === filter);

  useEffect(() => {
    if (!active) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [active]);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-2" aria-label="Filter gallery by category">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={`rounded-full border px-4 py-2 text-sm font-bold tracking-[0.01em] transition duration-300 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 ${filter === category ? "border-cyan-300/20 bg-[image:var(--site-brand-gradient)] text-white shadow-[0_14px_34px_rgba(8,145,178,0.3),inset_0_1px_0_rgba(255,255,255,0.22)]" : "border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-sm hover:-translate-y-0.5 hover:border-cyan-200 hover:text-brand-dark hover:shadow-soft"}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <motion.button
            key={`${item.category}-${item.title}`}
            type="button"
            onClick={() => setActive(item)}
            className="group flex h-full flex-col overflow-hidden rounded border border-line/80 bg-white text-left shadow-[0_18px_55px_rgba(8,64,84,0.08)] transition duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lift"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.18) }}
          >
            <span className="relative isolate block border-b border-line bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.18),transparent_32%),linear-gradient(135deg,#f7ffff,#e8fbfb)] p-5">
              <span className="absolute right-4 top-4 z-10 rounded-full border border-brand/15 bg-white/90 px-3 py-1 text-xs font-semibold text-brand-dark shadow-sm backdrop-blur">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="relative block aspect-[4/3] overflow-hidden rounded border border-cyan-100 bg-white shadow-[inset_0_0_0_1px_rgba(165,243,252,0.55)]">
                <Image
                  src={item.src}
                  alt={`${item.title} at Mudgal Gastromedics Hospital`}
                  fill
                  priority={index === 0 && filter === "All"}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </span>
            </span>
            <span className="flex flex-1 flex-col p-6">
              <span className="mb-3 w-fit rounded-full bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-dark">
                {item.category}
              </span>
              <b className="block text-2xl font-bold leading-tight text-ink">{item.title}</b>
              <span className="mt-3 block leading-relaxed text-muted">Preview this hospital area before your visit.</span>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-brand-dark">
                View image <Maximize2 size={15} className="transition group-hover:scale-110" />
              </span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} image preview`}
          onClick={() => setActive(null)}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
        >
          <button type="button" onClick={() => setActive(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded border border-white/30 bg-white/12 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white/50" aria-label="Close image">
            <X size={22} />
          </button>
          <motion.div
            className="w-[min(1100px,100%)]"
            onClick={(event) => event.stopPropagation()}
            initial={reducedMotion ? false : { scale: 0.98 }}
            animate={reducedMotion ? undefined : { scale: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.98 }}
          >
            <div className="relative h-[min(76vh,800px)] w-full overflow-hidden rounded bg-ink">
              <Image src={active.src} alt={`${active.title} at Mudgal Gastromedics Hospital`} fill sizes="100vw" className="object-contain" />
            </div>
            <p className="mt-3 text-center font-extrabold text-white">{active.title}</p>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
