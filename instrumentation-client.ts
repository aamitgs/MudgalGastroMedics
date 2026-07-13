import * as Sentry from "@sentry/nextjs";

/**
 * Browser Sentry init (Track 4.5). NEXT_PUBLIC_-prefixed so Next.js inlines
 * it into the client bundle; deliberately inactive with no DSN set, same
 * no-op-until-configured behavior as instrumentation.ts's server side.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  sendDefaultPii: false
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
