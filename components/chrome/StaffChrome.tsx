"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Moon, Search, Stethoscope, Sun, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { ActionButton } from "@/components/design-system/ActionButton";
import { OfflineBanner } from "@/components/design-system/OfflineBanner";
import { StaffFooter } from "@/components/chrome/StaffFooter";
import { GlobalCommandPalette } from "@/components/hospital-os/GlobalCommandPalette";
import { NotificationCenter } from "@/components/hospital-os/NotificationCenter";
import { PatientDrawer } from "@/components/hospital-os/PatientDrawer";
import { useAdminThemeStore } from "@/stores/admin-theme-store";
import { useCommandPaletteStore } from "@/stores/command-history-store";

const staffLinks = [
  { href: "/mudgalgastromedics-os", label: "Hospital OS", icon: LayoutDashboard },
  { href: "/admin", label: "Operations", icon: UsersRound },
  { href: "/doctor", label: "Doctor", icon: Stethoscope }
];

const themeStorageKey = "mgm-admin-theme";

/**
 * Slim chrome for authenticated staff surfaces. Deliberately free of marketing
 * components (per product separation): no booking CTAs, no promotional
 * banners, no site navigation — staff are already inside the platform.
 * Owns the staff dark-mode scope so the bar, page content and toasts all
 * follow one persisted preference across /admin, /doctor and /login.
 */
export function StaffChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { dark, setDark, toggleDark } = useAdminThemeStore();
  const openPalette = useCommandPaletteStore((state) => state.setOpen);

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "dark") setDark(true);
  }, [setDark]);

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, dark ? "dark" : "light");
  }, [dark]);

  async function signOut() {
    // Universal sign-out: clears RBAC and legacy sessions regardless of which
    // login path this browser used.
    await Promise.allSettled([
      fetch("/api/auth/logout", { method: "POST" }),
      fetch("/api/admin/session", { method: "DELETE" }),
      fetch("/api/doctor/session", { method: "DELETE" })
    ]);
    window.location.assign("/login");
  }

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="sticky top-0 z-50">
        <OfflineBanner />
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-[min(1560px,calc(100%-32px))] items-center gap-4">
          <Link href="/mudgalgastromedics-os" className="flex min-w-0 items-center gap-2.5" aria-label="MudgalGastromedics OS home">
            <Image src="/mgm-logo.png" alt="" width={34} height={34} className="h-8 w-8 shrink-0 rounded bg-white object-contain p-0.5" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-ink">MudgalGastromedics OS</span>
              <span className="hidden truncate text-[11px] font-semibold leading-tight text-muted sm:block">
                Connected Healthcare. Unified Operations.
              </span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1" aria-label="Staff workspaces">
            {staffLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-sm font-semibold transition ${
                  pathname?.startsWith(href) ? "bg-soft text-brand" : "text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                <Icon size={15} /> <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
            <span className="ml-1">
              <NotificationCenter />
            </span>
            <ActionButton
              onClick={() => openPalette(true)}
              aria-label="Open command palette"
              variant="outline"
              className="gap-1.5 px-3 text-sm font-semibold"
            >
              <Search size={15} />
              <span className="hidden items-center gap-1.5 md:inline-flex">
                Search
                <kbd className="rounded border border-line bg-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink">⌘K</kbd>
              </span>
            </ActionButton>
            <ActionButton
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              variant="outline"
              className="px-2.5"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </ActionButton>
            <ActionButton onClick={() => void signOut()} variant="outline" className="gap-1.5 px-3 text-sm font-semibold">
              <LogOut size={15} /> <span className="hidden md:inline">Sign out</span>
            </ActionButton>
          </nav>
        </div>
      </header>
      {children}
      <PatientDrawer />
      <GlobalCommandPalette />
      <StaffFooter />
      <Toaster richColors closeButton position="top-right" theme={dark ? "dark" : "light"} />
    </div>
  );
}
