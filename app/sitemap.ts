import type { MetadataRoute } from "next";
import { getPublicProcedures } from "@/lib/cms-public";
import { site } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/gallery", "/life-at-mgm", "/duty-doctor", "/contact", "/portal", "/privacy", "/terms"];
  const procedures = getPublicProcedures();
  const procedureRoutes = procedures.map((procedure) => `/procedures/${procedure.slug}`);

  return [...staticRoutes, ...procedureRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date()
  }));
}
