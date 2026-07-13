import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Clickjacking defence for browsers that ignore X-Frame-Options.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : [])
];

const nextConfig = {
  // Keep `next build` from invalidating assets served by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async redirects() {
    return [
      // The old "patient portal plan" page; /portal is the real portal.
      { source: "/patient-portal", destination: "/portal", permanent: true },
      // Product rename: the OS lives at its branded path now.
      { source: "/hospital-os", destination: "/mudgalgastromedics-os", permanent: true },
      // Positioning cleanup: retired "HMS/ERP" language (Track 1.11), same content at /operations.
      { source: "/hms-erp", destination: "/operations", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

// Uploads source maps to Sentry at build time when SENTRY_AUTH_TOKEN/ORG/PROJECT
// are set (Track 4.5); silently skips the upload step otherwise (documented
// SDK behavior), so this stays a no-op build wrapper until that account exists.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true
  }
});
