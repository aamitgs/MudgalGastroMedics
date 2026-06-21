import type { MetadataRoute } from "next";
import { procedures, site } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/gallery", "/life-at-mgm", "/duty-doctor", "/contact", "/privacy", "/terms"];
  const procedureRoutes = procedures.map((procedure) => `/procedures/${procedure.slug}`);

  return [...staticRoutes, ...procedureRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date()
  }));
}
