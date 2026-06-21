/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep `next build` from invalidating assets served by a running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
