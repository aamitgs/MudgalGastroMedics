"use client";

import { ActionButton } from "@/components/design-system/ActionButton";
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
      <ActionButton
        variant="secondary"
        onClick={toggleDark}
        aria-label="Toggle dark mode"
        className="fixed bottom-6 right-6 z-50 rounded-full bg-surface px-4 text-sm shadow-[0_18px_42px_rgba(8,64,84,0.24)]"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
        {dark ? "Light mode" : "Dark mode"}
      </ActionButton>
    </div>
  );
}
