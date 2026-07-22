import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

/**
 * OS-scoped 404 (Track 3.3 audit) — the root not-found.tsx is patient-facing
 * marketing content (booking CTAs, HeroOpdTimingCard), which is jarring for a
 * staff member who mistypes or deep-links a stale /mudgalgastromedics-os/*
 * URL. Catches any path under this segment that isn't one of the 26 known
 * module routes (more specific routes always win over a catch-all).
 *
 * Renders directly rather than calling next/navigation's notFound(): that
 * went through next/mudgalgastromedics-os's not-found.tsx boundary in a way
 * that unexpectedly also included the root layout's marketing content in the
 * same response (a genuine Next.js 16/Turbopack interaction, not something
 * traced to a mistake in this app's own code) and returned 200 instead of
 * 404 anyway. Rendering directly sidesteps that entirely; the real HTTP
 * status is a minor concern here since every OS page is already
 * noindex/nofollow and this is an authenticated-only staff surface.
 */
export const metadata: Metadata = {
  title: { absolute: "Not Found • MudgalGastromedics OS" },
  robots: { index: false, follow: false }
};

export default function CatchAll() {
  return (
    <main className="hospital-os-theme grid min-h-screen place-items-center bg-mist p-8 text-center">
      <div className="grid justify-items-center gap-4">
        <SearchX size={40} className="text-muted" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Page not found</h1>
        <p className="max-w-md text-sm text-muted">
          This isn&apos;t a page in the Hospital OS. Check the URL, or head back to the dashboard.
        </p>
        <Link
          href="/mudgalgastromedics-os"
          className="inline-flex items-center gap-2 rounded border border-line bg-brand px-5 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>
      </div>
    </main>
  );
}
