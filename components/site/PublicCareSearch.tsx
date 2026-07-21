"use client";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

type SearchItem = {
  label: string;
  href: string;
  group: string;
  terms: string[];
};

const searchItems: SearchItem[] = [
  { label: "Acidity / GERD", href: "/procedures/acidity-gerd", group: "Symptom", terms: ["acid reflux", "heartburn", "burning", "gerd"] },
  { label: "Fatty liver", href: "/procedures/fatty-liver", group: "Liver", terms: ["high sgpt", "sgot", "lft", "ultrasound"] },
  { label: "Jaundice", href: "/procedures/obstructive-jaundice", group: "Warning sign", terms: ["yellow eyes", "yellow urine", "fever jaundice"] },
  { label: "Blood in stool", href: "/procedures/gastrointestinal-bleeding-management", group: "Warning sign", terms: ["bleeding", "red stool", "rectal bleeding"] },
  { label: "Vomiting blood", href: "/procedures/gastrointestinal-bleeding-management", group: "Urgent", terms: ["blood vomit", "hematemesis"] },
  { label: "Black stools", href: "/procedures/gastrointestinal-bleeding-management", group: "Urgent", terms: ["melena", "black stool"] },
  { label: "Endoscopy", href: "/procedures/endoscopy", group: "Procedure", terms: ["upper gi", "stomach endoscopy", "biopsy"] },
  { label: "Colonoscopy", href: "/procedures/colonoscopy", group: "Procedure", terms: ["colon", "bowel prep", "polyps"] },
  { label: "ERCP", href: "/procedures/ercp", group: "Procedure", terms: ["cbd stone", "bile duct", "stent", "jaundice"] },
  { label: "FibroScan", href: "/procedures/fibroscan", group: "Liver test", terms: ["liver stiffness", "fatty liver test", "fibrosis"] },
  { label: "IBS", href: "/procedures/ibs", group: "Bowel", terms: ["gas", "bloating", "constipation", "diarrhea"] },
  { label: "Gastroenterologist in Agra", href: "/areas/gastroenterologist-in-agra", group: "Local care", terms: ["gastro doctor", "stomach specialist"] },
  { label: "Liver Specialist in Agra", href: "/areas/liver-specialist-in-agra", group: "Local care", terms: ["hepatologist", "liver doctor"] },
  { label: "Book appointment", href: "/portal#appointment", group: "Action", terms: ["booking", "appointment", "opd"] },
  { label: "OPD timings", href: "/faqs#contact-opd-timing-and-location", group: "Visit info", terms: ["time", "hours", "open", "closed"] }
];

const defaultItems = searchItems.slice(0, 8);
const browseItems = searchItems.slice(7);

type PublicCareSearchProps = {
  placement?: "fixed" | "inline";
  className?: string;
};

export function PublicCareSearch({ placement = "fixed", className = "" }: PublicCareSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return defaultItems;
    return searchItems
      .filter((item) => {
        const haystack = [item.label, item.group, ...item.terms].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [normalizedQuery]);

  return (
    <div
      style={placement === "fixed" ? { top: "calc(var(--site-header-bottom, 6.35rem) + 0.5rem)" } : undefined}
      className={
        placement === "fixed"
          ? `fixed right-2 z-[80] w-[min(216px,calc(100vw-1.5rem))] sm:right-4 lg:right-5 ${className}`
          : `relative z-20 w-full max-w-[216px] ${className}`
      }
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex min-h-9 w-full items-center gap-2 rounded-full border border-cyan-200/32 bg-[rgba(18,49,59,0.58)] px-3 text-left text-white shadow-[0_12px_28px_rgba(8,64,84,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition hover:border-cyan-200/50 hover:bg-[rgba(8,64,84,0.72)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={15} className="shrink-0 text-cyan-100/90" />
        <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-white/78">Search symptoms</span>
        <ArrowRight size={14} className="shrink-0 text-gold transition group-hover:translate-x-0.5" />
      </button>

      <div
        className={`fixed inset-0 z-[90] transition ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          aria-label="Close search"
          onClick={() => setOpen(false)}
          className="absolute inset-0 cursor-default bg-[rgba(18,49,59,0.72)] backdrop-blur-[7px]"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search symptoms and procedures"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className={`absolute left-1/2 top-1/2 flex max-h-[min(820px,calc(100vh-2rem))] w-[min(940px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-cyan-100/18 bg-[linear-gradient(135deg,rgba(18,49,59,0.98),rgba(8,64,84,0.96)_52%,rgba(5,150,105,0.9))] text-white shadow-[0_34px_120px_rgba(8,64,84,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition duration-300 sm:max-h-[min(820px,calc(100vh-3rem))] sm:w-[min(940px,calc(100vw-3rem))] ${
            open ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="border-b border-cyan-100/16 p-4 sm:p-5">
            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-cyan-200/55 bg-white/10 px-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-cyan-100 focus-within:ring-1 focus-within:ring-cyan-100/50">
              <Search size={18} className="shrink-0 text-cyan-100/72" />
              <span className="sr-only">Search symptoms and procedures</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search symptoms, procedures, blogs..."
                className="min-w-0 flex-1 bg-transparent text-lg font-black text-white placeholder:text-cyan-50/42 focus:outline-none sm:text-xl"
                autoFocus={open}
              />
              <kbd className="hidden rounded-lg border border-cyan-100/20 bg-white/10 px-3 py-2 text-xs font-black text-cyan-50/62 sm:inline-flex">
                ⌘ K
              </kbd>
            </label>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-5 sm:py-7">
            {normalizedQuery ? (
              <section>
                <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/58">Search results</p>
                {results.length ? (
                  <div className="flex flex-wrap gap-3">
                    {results.map((item) => (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-cyan-100/16 bg-white/10 px-5 text-sm font-black text-cyan-50/78 transition hover:-translate-y-0.5 hover:border-cyan-100/45 hover:bg-white/16 hover:text-white"
                      >
                        <ArrowRight size={16} className="-rotate-45 text-gold/72 transition group-hover:text-gold" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-cyan-100/14 bg-white/10 px-5 py-4 text-sm font-bold text-cyan-50/70">
                    No match. Try acidity, fatty liver, jaundice, endoscopy, colonoscopy, ERCP or FibroScan.
                  </div>
                )}
              </section>
            ) : (
              <div className="grid gap-10">
                <section>
                  <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/58">Popular searches</p>
                  <div className="flex flex-wrap gap-3">
                    {defaultItems.map((item) => (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-cyan-100/16 bg-white/10 px-5 text-sm font-black text-cyan-50/78 transition hover:-translate-y-0.5 hover:border-cyan-100/45 hover:bg-white/16 hover:text-white"
                      >
                        <ArrowRight size={16} className="-rotate-45 text-gold/72 transition group-hover:text-gold" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/58">Browse care guides</p>
                  <div className="flex flex-wrap gap-3">
                    {browseItems.map((item) => (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-cyan-100/16 bg-white/10 px-5 text-sm font-black text-cyan-50/78 transition hover:-translate-y-0.5 hover:border-cyan-100/45 hover:bg-white/16 hover:text-white"
                      >
                        <ArrowRight size={16} className="-rotate-45 text-gold/72 transition group-hover:text-gold" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-cyan-100/16 px-4 py-3 text-sm font-bold text-cyan-50/44 sm:px-5">
            <span className="inline-flex items-center gap-2">
              <kbd className="rounded-md border border-cyan-100/18 bg-white/10 px-2 py-1 text-xs text-cyan-50/64">↑↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-2">
              <kbd className="rounded-md border border-cyan-100/18 bg-white/10 px-2 py-1 text-xs text-cyan-50/64">↵</kbd>
              open
            </span>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 transition hover:text-cyan-50/80">
              <kbd className="rounded-md border border-cyan-100/18 bg-white/10 px-2 py-1 text-xs text-cyan-50/64">Esc</kbd>
              close
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto grid size-9 place-items-center rounded-lg border border-cyan-100/16 bg-white/10 text-cyan-50/58 transition hover:text-white"
              aria-label="Close search panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
