import type { MetadataRoute } from "next";
import { getPublicProcedures } from "@/lib/cms-public";
import { servicePages } from "@/lib/service-pages";
import { site } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/blog",
    "/blog/stomach-intestine-liver-consultation-check-up-camp",
    "/gallery",
    "/life-at-mgm",
    "/duty-doctor",
    "/contact",
    "/cookie-policy",
    "/disclaimer",
    "/patient-rights-responsibilities",
    "/portal",
    "/privacy",
    "/refund-cancellation-policy",
    "/terms"
  ];
  const serviceRoutes = servicePages.map((page) => `/services/${page.slug}`);
  const procedures = await getPublicProcedures();
  const procedureRoutes = procedures.map((procedure) => `/procedures/${procedure.slug}`);

  return [...staticRoutes, ...serviceRoutes, ...procedureRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date()
  }));
}
