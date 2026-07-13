"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches an error thrown by the root layout itself (rarer, more severe
 * than app/error.tsx's route-segment errors) — Next.js requires this file
 * to render its own <html>/<body>, since it fully replaces the root layout
 * that just failed. Deliberately plain inline styles, not Tailwind/site
 * tokens: this boundary must render even if the normal CSS pipeline is
 * part of what broke.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled root layout error", { message: error.message, digest: error.digest });
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#12313b" }}>Something went wrong</h1>
        <p style={{ maxWidth: 420, margin: "1rem auto", color: "#5d7279" }}>
          The application hit an unexpected error. Your data is safe — try reloading the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ borderRadius: 6, border: "1px solid #0891b2", background: "#0891b2", color: "#fff", padding: "0.6rem 1.25rem", fontWeight: 700, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
