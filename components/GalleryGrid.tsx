"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";

type GalleryItem = {
  category: string;
  title: string;
  src: string;
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const visible = filter === "All" ? items : items.filter((item) => item.category === filter);

  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`rounded-full border px-4 py-2 font-extrabold ${filter === category ? "border-teal bg-teal text-white" : "border-line bg-white text-ink"}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="masonry">
        {visible.map((item) => (
          <button key={`${item.category}-${item.title}`} type="button" onClick={() => setActive(item)} className="w-full overflow-hidden rounded border border-line bg-white text-left shadow-[0_8px_18px_rgba(18,52,61,0.06)]">
            <Image src={item.src} alt={`${item.title} dummy photo`} width={1200} height={900} className="h-auto w-full" />
            <span className="block p-4">
              <b className="block">{item.title}</b>
              <span className="text-sm text-muted">{item.category}</span>
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-5" onClick={() => setActive(null)}>
          <button type="button" onClick={() => setActive(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded border border-white/30 bg-white/10 text-white" aria-label="Close image">
            <X size={22} />
          </button>
          <div className="w-[min(980px,100%)]" onClick={(event) => event.stopPropagation()}>
            <Image src={active.src} alt={active.title} width={1200} height={900} className="max-h-[78vh] w-full rounded bg-white object-contain" />
            <p className="mt-3 font-extrabold text-white">{active.title}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
