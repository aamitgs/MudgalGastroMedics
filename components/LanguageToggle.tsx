"use client";

import { useEffect, useState } from "react";

export function LanguageToggle() {
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
      className="h-10 whitespace-nowrap rounded border border-line bg-white px-3 text-sm font-black text-ink"
      aria-label="Switch language"
    >
      {lang === "hi" ? "English" : "हिन्दी"}
    </button>
  );
}
