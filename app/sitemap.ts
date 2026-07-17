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
    "/patient-rights-responsibilities",
    "/portal",
    "/privacy",
    "/refund-cancellation-policy",
    "/terms",
    "/operations",
    "/platform",
    "/ai-planning"
  ];
  const staticEntries = staticRoutes.map((route) => ({ route, lastModified: new Date() }));
  const serviceEntries = servicePages.map((page) => ({ route: `/services/${page.slug}`, lastModified: new Date() }));
  const procedures = await getPublicProcedures();
  const procedureEntries = procedures.map((procedure) => ({ route: `/procedures/${procedure.slug}`, lastModified: new Date() }));
  const blogEntries = seoBlogPosts.map((post) => ({ route: `/blog/${post.slug}`, lastModified: new Date(post.date) }));
  const localEntries = localSeoPages.map((page) => ({ route: `/areas/${page.slug}`, lastModified: new Date() }));

  const entriesByRoute = new Map(
    [...staticEntries, ...serviceEntries, ...procedureEntries, ...blogEntries, ...localEntries].map((entry) => [entry.route, entry])
  );

  return Array.from(entriesByRoute.values()).map(({ route, lastModified }) => ({
    url: `${site.url}${route}`,
    lastModified
  }));
}
