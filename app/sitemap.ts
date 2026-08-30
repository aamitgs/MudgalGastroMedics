import type { MetadataRoute } from "next";
import { seoBlogPosts } from "@/lib/blog-posts";
import { getPublicProcedures } from "@/lib/cms-public";
import { localSeoPages } from "@/lib/local-seo-pages";
import { servicePages } from "@/lib/service-pages";
import { site } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/areas",
    "/blog",
    "/blog/stomach-intestine-liver-consultation-check-up-camp",
    "/services",
    "/procedures",
    "/faqs",
    "/gallery",
    "/life-at-mgm",
    "/duty-doctor",
    "/dr-deepak-kumar-sharma-gastroenterologist-agra",
    "/contact",
    "/cookie-policy",
    "/disclaimer",
    "/editorial-policy",
    "/patient-rights-responsibilities",
    "/portal",
    "/privacy",
    "/refund-cancellation-policy",
    "/terms",
    "/operations",
    "/platform",
    "/ai-planning"
  ];
  // lastModified is left undefined wherever there is no real per-page edit
  // timestamp to report — Google weights this signal lightly, but stamping
  // every URL with "just now" on every deploy is actively misleading, not
  // neutral: it can never tell Google which pages actually changed recently.
  // Static routes, service pages and local-area pages (all plain TS arrays
  // with no tracked edit date) get none. Procedures and blog posts do carry
  // a real date where the underlying content is tracked — see below.
  const staticEntries = staticRoutes.map((route) => ({ route, lastModified: undefined as Date | undefined }));
  const serviceEntries = servicePages.map((page) => ({ route: `/services/${page.slug}`, lastModified: undefined as Date | undefined }));
  const procedures = await getPublicProcedures();
  const procedureEntries = procedures.map((procedure) => ({
    route: `/procedures/${procedure.slug}`,
    // Only CMS-tracked procedures (an override or a CMS-only entry) carry a
    // real updatedAt — most procedures are static site-authored content with
    // no edit timestamp at all (lib/cms-public.ts).
    lastModified: procedure.updatedAt ? new Date(procedure.updatedAt) : undefined
  }));
  const blogEntries = seoBlogPosts.map((post) => ({ route: `/blog/${post.slug}`, lastModified: new Date(post.date) }));
  const localEntries = localSeoPages.map((page) => ({ route: `/areas/${page.slug}`, lastModified: undefined as Date | undefined }));

  const entriesByRoute = new Map(
    [...staticEntries, ...serviceEntries, ...procedureEntries, ...blogEntries, ...localEntries].map((entry) => [entry.route, entry])
  );

  return Array.from(entriesByRoute.values()).map(({ route, lastModified }) => ({
    url: `${site.url}${route}`,
    lastModified
  }));
}
