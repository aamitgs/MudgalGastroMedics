"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

/**
 * App Router error boundary (Track 4.5) — catches any otherwise-uncaught
 * rendering error below the root layout, across every route (public site,
 * staff/admin, doctor, Hospital OS). Leaves a browser-console entry with the
 * digest Next.js also prints server-side (so the two can be cross-referenced)
 * and reports to Sentry when SENTRY_DSN is configured — a no-op otherwise.
 * Never shows the raw error/stack to the user (frozen contract: friendly,
 * actionable messages only) — offers a reset instead.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled render error", { message: error.message, digest: error.digest });
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle size={40} className="text-red-600" aria-hidden="true" />
      <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">This page hit an unexpected error. Your data is safe — try again, or go back and retry the action.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-cyan-300/20 bg-[image:var(--site-brand-gradient)] px-5 py-2.5 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
