import "server-only";
import * as Sentry from "@sentry/nextjs";

/**
 * Structured error logging (Track 4.5) — every host (Vercel included)
 * captures and indexes stdout/stderr, so the JSON line below is always a
 * real, permanent record regardless of whether Sentry is configured.
 *
 * `extra` is deliberately NOT forwarded to Sentry, only to the console JSON:
 * call sites pass things like a recipient email address or a query fragment
 * (see lib/email.ts, lib/database.ts) that stay inside this hospital's own
 * log stream today — forwarding them to a third-party service by default
 * would be a real PHI/PII exposure, not a logging nicety. Sentry gets the
 * exception (message/stack) and a non-identifying `context` tag only.
 */
export function logServerError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const payload = {
    level: "error",
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...extra
  };
  console.error(JSON.stringify(payload));

  Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
    tags: { context }
  });
}
