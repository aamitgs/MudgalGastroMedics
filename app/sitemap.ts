import type { MetadataRoute } from "next";
import { getPublicProcedures } from "@/lib/cms-public";
import { site } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/blog",
    "/blog/stomach-intestine-liver-consultation-check-up-camp",
    "/gallery",
    "/life-at-mgm",
    "/duty-doctor",
    "/contact",
    "/portal",
    "/privacy",
    "/terms"
  ];
  const procedures = await getPublicProcedures();
  const procedureRoutes = procedures.map((procedure) => `/procedures/${procedure.slug}`);

  return [...staticRoutes, ...procedureRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date()
  }));
}
