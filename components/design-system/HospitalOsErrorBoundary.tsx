"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for /mudgalgastromedics-os/* routes. The sidebar/top bar
 * (HospitalOsShell) is rendered inside each page's own component tree, not a
 * parent layout, so a page-level error unmounts it too — unlike the Doctor
 * Portal (/mudgalgastromedics-os/doctor-portal), where StaffChrome sits in
 * its own layout.tsx above the route segment and survives errors
 * automatically. This gives OS routes an OS-styled fallback with an explicit
 * way back to the dashboard, instead of falling through to the root
 * error.tsx (site tokens, no nav) and stranding the user.
 *
 * Same reporting/logging contract as the root boundary (Track 4.5): logs the
 * digest, reports to Sentry when configured, never shows the raw error.
 */
export function HospitalOsErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled render error", { message: error.message, digest: error.digest });
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="hospital-os-theme grid min-h-screen place-items-center bg-mist p-8 text-center">
      <div className="grid justify-items-center gap-4">
        <AlertTriangle size={40} className="text-coral" aria-hidden="true" />
        <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted">
          This page hit an unexpected error. Your data is safe — try again, or head back to the dashboard.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded border border-line bg-brand px-5 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
          <Link
            href="/mudgalgastromedics-os"
            className="inline-flex items-center gap-2 rounded border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink"
          >
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
