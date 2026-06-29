"use client";

import Image from "next/image";
import { X } from "lucide-react";
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
      <div className="mb-7 flex flex-wrap gap-2" aria-label="Filter gallery by category">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={`rounded-full border px-4 py-2 font-extrabold transition ${filter === category ? "border-brand bg-brand text-white shadow-soft" : "border-line bg-white text-ink hover:border-brand hover:text-brand"}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <motion.button
            key={`${item.category}-${item.title}`}
            type="button"
            onClick={() => setActive(item)}
            className="group overflow-hidden rounded border border-line bg-white text-left shadow-soft transition hover:-translate-y-1 hover:border-brand hover:shadow-lift"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.18) }}
          >
            <span className="relative block aspect-[4/3] overflow-hidden bg-soft">
              <Image
                src={item.src}
                alt={`${item.title} at Mudgal Gastromedics Hospital`}
                fill
                priority={index === 0 && filter === "All"}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </span>
            <span className="block p-4">
              <b className="block">{item.title}</b>
              <span className="text-sm text-muted">{item.category}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} image preview`}
          onClick={() => setActive(null)}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
        >
          <button type="button" onClick={() => setActive(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded border border-white/30 bg-white/10 text-white" aria-label="Close image">
            <X size={22} />
          </button>
          <motion.div
            className="w-[min(1100px,100%)]"
            onClick={(event) => event.stopPropagation()}
            initial={reducedMotion ? false : { scale: 0.98 }}
            animate={reducedMotion ? undefined : { scale: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.98 }}
          >
            <div className="relative h-[min(76vh,800px)] w-full overflow-hidden rounded bg-black">
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
