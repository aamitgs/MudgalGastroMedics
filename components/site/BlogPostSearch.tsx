"use client";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export type BlogSearchPost = {
  slug: string;
  title: string;
  category: string;
  description: string;
  readTime: string;
};

export function BlogPostSearch({ posts }: { posts: BlogSearchPost[] }) {
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const firstResult = normalizedQuery
    ? posts.find((post) => {
        const haystack = [post.title, post.category, post.description].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : undefined;

  return (
    <div className="grid gap-2">
      <form
        className={`flex min-h-14 items-center gap-3 rounded-xl border bg-[linear-gradient(180deg,#ffffff,#f3fbfc)] px-4 text-ink shadow-[0_18px_42px_rgba(8,64,84,0.11),inset_0_1px_0_rgba(255,255,255,0.95)] transition focus-within:bg-white focus-within:ring-4 ${
          status ? "border-coral/35 focus-within:ring-coral/10" : "border-line focus-within:border-brand focus-within:ring-brand/10"
        }`}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (!normalizedQuery) return;
          if (firstResult) {
            router.push(`/blog/${firstResult.slug}`);
            return;
          }
          setStatus("No matching article found");
        }}
      >
        <Search size={22} className="shrink-0 text-brand" />
        <label htmlFor={inputId} className="sr-only">Search blog posts</label>
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (status) setStatus("");
          }}
          placeholder="Search care guides, articles..."
          className="min-w-0 flex-1 bg-transparent text-sm font-black text-ink placeholder:text-muted/70 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatus("");
            }}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        ) : null}
        <button
          type="submit"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[image:var(--site-brand-gradient)] text-white shadow-[0_10px_22px_rgba(8,145,178,0.26)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!normalizedQuery}
          aria-label="Search articles"
        >
          <ArrowRight size={15} />
        </button>
      </form>
      {status ? <p className="px-1 text-xs font-bold text-coral">{status}</p> : null}
      {firstResult ? <Link href={`/blog/${firstResult.slug}`} className="sr-only">Open first matching article</Link> : null}
    </div>
  );
}
