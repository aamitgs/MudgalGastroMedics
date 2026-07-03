"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Stethoscope, UsersRound } from "lucide-react";

const staffLinks = [
  { href: "/hospital-os", label: "Hospital OS", icon: LayoutDashboard },
  { href: "/admin", label: "Operations", icon: UsersRound },
  { href: "/doctor", label: "Doctor", icon: Stethoscope }
];

/**
 * Slim chrome for authenticated staff surfaces. Deliberately free of marketing
 * components (per product separation): no booking CTAs, no promotional
 * banners, no site navigation — staff are already inside the platform.
 */
export function StaffChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

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
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-[min(1560px,calc(100%-32px))] items-center gap-4">
          <Link href="/hospital-os" className="flex min-w-0 items-center gap-2.5" aria-label="MudgalGastromedics OS home">
            <Image src="/mgm-logo.png" alt="" width={34} height={34} className="h-8 w-8 shrink-0 object-contain" />
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
            <button
              type="button"
              onClick={() => void signOut()}
              className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded border border-line px-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              <LogOut size={15} /> <span className="hidden md:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
