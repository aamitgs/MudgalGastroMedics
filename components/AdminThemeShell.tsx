"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useAdminThemeStore } from "@/stores/admin-theme-store";

const themeStorageKey = "mgm-admin-theme";

export function AdminThemeShell({ children }: { children: React.ReactNode }) {
  const { dark, setDark, toggleDark } = useAdminThemeStore();

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "dark") setDark(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className={dark ? "dark" : undefined}>
      {children}
      <button
        type="button"
        onClick={toggleDark}
        aria-label="Toggle dark mode"
        className="fixed bottom-6 right-6 z-50 inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-bold text-ink shadow-[0_18px_42px_rgba(8,64,84,0.24)] transition hover:border-brand hover:text-brand"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
        {dark ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );
}
