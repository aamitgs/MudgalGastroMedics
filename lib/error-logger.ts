import "server-only";

/**
 * Zero-dependency structured error logging (Track 4.5 groundwork). Most
 * hosts (Vercel, Railway, etc.) capture stdout/stderr and make it
 * searchable, so a consistent JSON line here is a real, permanent record
 * for exactly the failure class that previously vanished into a generic
 * 500 with nothing kept anywhere. Wiring an actual error-tracking service
 * (Sentry/GlitchTip) is deferred pending the hosting decision (the
 * roadmap's own "Depends: hosting" note on this track) — this logger's
 * call shape is the seam to plug one in later without touching call
 * sites again.
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
}
