"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Moon, Search, Stethoscope, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ActionButton } from "@/components/design-system/ActionButton";
import { OfflineBanner } from "@/components/design-system/OfflineBanner";
import { StaffFooter } from "@/components/chrome/StaffFooter";
import { GlobalCommandPalette } from "@/components/hospital-os/GlobalCommandPalette";
import { NotificationCenter } from "@/components/hospital-os/NotificationCenter";
import { PatientDrawer } from "@/components/hospital-os/PatientDrawer";
import { useThemeStore } from "@/stores/theme-store";
import { useCommandPaletteStore } from "@/stores/command-history-store";

// "Operations" (formerly /admin) was retired once every module got a real
// route (Track 4.13) — /admin now just redirects here, so a separate nav
// entry pointing at the same destination would be a pure duplicate.
const staffLinks = [
  { href: "/mudgalgastromedics-os", label: "Hospital OS", icon: LayoutDashboard },
  { href: "/doctor", label: "Doctor", icon: Stethoscope }
];

/**
 * Slim chrome for authenticated staff surfaces. Deliberately free of marketing
 * components (per product separation): no booking CTAs, no promotional
 * banners, no site navigation — staff are already inside the platform.
 * Dark mode comes from the shared theme store (stores/theme-store.ts), so the
 * preference follows staff across /doctor and Hospital OS, not just this
 * chrome (/admin and /login now just redirect here before this chrome ever
 * renders anything).
 */
export function StaffChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { dark, toggleDark } = useThemeStore();
  const openPalette = useCommandPaletteStore((state) => state.setOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This chrome renders on /doctor before login too (DoctorLogin's own passcode
  // form is just this component's `children`) — without this check "Sign out"
  // showed on the pre-login screen, which is misleading since there's nothing
  // to sign out of yet.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setIsAuthenticated(Boolean(data?.ok && data?.authenticated));
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  async function signOut() {
    // Universal sign-out: clears RBAC and legacy sessions regardless of which
    // login path this browser used.
    await Promise.allSettled([
      fetch("/api/auth/logout", { method: "POST" }),
      fetch("/api/admin/session", { method: "DELETE" }),
      fetch("/api/doctor/session", { method: "DELETE" })
    ]);
    // /login is a redirect to here (retired, same reasoning as /admin) —
    // going straight there skips the hop; this page shows the same
    // WorkspaceLauncher once signed out.
    window.location.assign("/mudgalgastromedics-os");
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
            {isAuthenticated ? (
              <ActionButton onClick={() => void signOut()} variant="outline" className="gap-1.5 px-3 text-sm font-semibold">
                <LogOut size={15} /> <span className="hidden md:inline">Sign out</span>
              </ActionButton>
            ) : null}
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
