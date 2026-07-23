"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Moon, Search, Stethoscope, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ProfilePhotoButton } from "@/components/design-system/ProfilePhotoButton";
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
  { href: "/mudgalgastromedics-os/doctor-portal", label: "Doctor", icon: Stethoscope }
];

/**
 * Slim chrome for authenticated staff surfaces. Deliberately free of marketing
 * components (per product separation): no booking CTAs, no promotional
 * banners, no site navigation — staff are already inside the platform.
 * Dark mode comes from the shared theme store (stores/theme-store.ts), so the
 * preference follows staff across the Doctor Portal and rest of the Hospital
 * OS, not just this chrome (/admin and /login now just redirect into
 * /mudgalgastromedics-os before this chrome ever renders anything).
 * No OfflineBanner of its own (unlike hospital-os/HospitalOsShell, which
 * needs one) — this chrome now only ever renders under
 * /mudgalgastromedics-os/*, whose own layout.tsx already provides one.
 */
export function StaffChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { dark, toggleDark } = useThemeStore();
  const openPalette = useCommandPaletteStore((state) => state.setOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const mountedRef = useRef(true);

  function loadSession() {
    return fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!mountedRef.current) return;
        setIsAuthenticated(Boolean(data?.ok && data?.authenticated));
        setHasPhoto(Boolean(data?.user?.hasPhoto));
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setIsAuthenticated(false);
        setHasPhoto(false);
      });
  }

  // This chrome renders on the Doctor Portal before login too (DoctorLogin's
  // own passcode form is just this component's `children`) — without this
  // check "Sign out" showed on the pre-login screen, which is misleading
  // since there's nothing to sign out of yet.
  useEffect(() => {
    mountedRef.current = true;
    void loadSession();
    return () => {
      mountedRef.current = false;
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
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-[min(1560px,calc(100%-32px))] items-center gap-4">
          <Link href="/mudgalgastromedics-os" className="flex min-w-0 items-center gap-2.5" aria-label="MudgalGastromedics OS home">
            <Image src="/mgm-logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded bg-white object-contain p-0.5" />
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
                  // Exact match, not startsWith: the Doctor Portal now lives at
                  // /mudgalgastromedics-os/doctor-portal, a sub-path of the
                  // Hospital OS tile's own href, so a prefix check would light
                  // up both tabs at once while on the Doctor Portal.
                  pathname === href ? "bg-soft text-brand" : "text-muted hover:bg-soft hover:text-ink"
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
              size="lg"
              className="gap-2 text-sm font-semibold"
            >
              <Search size={18} />
              <span className="hidden items-center gap-2 md:inline-flex">
                Search
                <kbd className="rounded border border-line bg-soft px-2 py-1 font-mono text-xs font-semibold text-ink">⌘K</kbd>
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
              <ProfilePhotoButton hasPhoto={hasPhoto} onPhotoUpdated={() => void loadSession()} avatarClassName="h-9 w-9 border border-line" />
            ) : null}
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
