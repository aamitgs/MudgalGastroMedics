"use client";

import { useEffect, useState } from "react";

type LanguageToggleProps = {
  compact?: boolean;
  className?: string;
};

export function LanguageToggle({ compact = false, className = "" }: LanguageToggleProps) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("mgmLang") ?? "en";
    document.body.classList.toggle("lang-hi", saved === "hi");
    queueMicrotask(() => setLang(saved));
  }, []);

  function toggle() {
    const next = lang === "hi" ? "en" : "hi";
    setLang(next);
    localStorage.setItem("mgmLang", next);
    document.body.classList.toggle("lang-hi", next === "hi");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${compact ? "h-12 min-w-16 rounded-full px-4 text-sm" : "h-10 rounded px-3 text-sm"} whitespace-nowrap border border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] font-bold text-ink shadow-[0_10px_24px_rgba(8,64,84,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:text-brand focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 ${className}`}
      aria-label="Switch language"
    >
      {compact ? (lang === "hi" ? "EN" : "हिन्दी") : lang === "hi" ? "English" : "हिन्दी"}
    </button>
  );
}
