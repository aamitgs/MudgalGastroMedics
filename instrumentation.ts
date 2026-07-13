import * as Sentry from "@sentry/nextjs";

/**
 * Server/edge Sentry init (Track 4.5). Deliberately inactive with no
 * SENTRY_DSN set — Sentry.init with an empty dsn is a documented no-op, so
 * this stays safe to ship before the hosting account exists, matching
 * lib/error-logger.ts's existing "seam, not a requirement" groundwork.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
