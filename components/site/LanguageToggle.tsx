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
      className={`${compact ? "h-12 min-w-[5.25rem] rounded px-4 text-sm" : "h-10 rounded px-4 text-sm"} relative inline-flex items-center justify-center whitespace-nowrap border border-transparent bg-[linear-gradient(180deg,#ffffff_0%,#fbfeff_48%,#eef7f9_100%)] font-black text-ink shadow-[0_12px_28px_rgba(8,64,84,0.15),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-4px_10px_rgba(8,64,84,0.055)] transition duration-300 hover:-translate-y-0.5 hover:text-brand-dark hover:shadow-[0_16px_34px_rgba(8,64,84,0.18),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-4px_10px_rgba(8,145,178,0.08)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/70 ${className}`}
      aria-label="Switch language"
    >
      {compact ? (lang === "hi" ? "English" : "हिन्दी") : lang === "hi" ? "English" : "हिन्दी"}
    </button>
  );
}
