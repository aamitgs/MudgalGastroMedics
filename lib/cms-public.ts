import "server-only";

import { listCmsContent } from "@/lib/cms-store";
import { galleryItems, procedures } from "@/lib/site-data";

type SiteProcedure = (typeof procedures)[number];
type SiteGalleryItem = (typeof galleryItems)[number];

export type PublicProcedure = SiteProcedure & {
  seoTitle?: string;
  seoDescription?: string;
};

export type PublicGalleryItem = SiteGalleryItem & {
  summary?: string;
};

function cleanPathSlug(value: string, prefix: string) {
  return value.replace(prefix, "").replace(/^#/, "").replace(/^\//, "").trim();
}

async function publishedContent() {
  return (await listCmsContent()).filter((item) => item.status === "Published");
}

export async function getPublicProcedures(): Promise<PublicProcedure[]> {
  const publishedProcedures = (await publishedContent()).filter((item) => item.type === "Procedure");
  const overrides = new Map(publishedProcedures.map((item) => [cleanPathSlug(item.slug, "/procedures/"), item]));

  const merged = procedures.map((procedure) => {
    const override = overrides.get(procedure.slug);
    if (!override) return procedure;

    return {
      ...procedure,
      title: override.title || procedure.title,
      summary: override.summary || procedure.summary,
      seoTitle: override.seoTitle,
      seoDescription: override.seoDescription
    };
  });

  const siteSlugs = new Set(procedures.map((procedure) => procedure.slug));
  const cmsOnly = publishedProcedures.flatMap((item): PublicProcedure[] => {
      const slug = cleanPathSlug(item.slug, "/procedures/");
      if (!slug || siteSlugs.has(slug)) return [];
      return [{
        slug,
        title: item.title,
        hiTitle: item.title,
        summary: item.summary,
        hiSummary: item.summary,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription
      }];
    });

  return [...merged, ...cmsOnly];
}

export async function getPublicProcedure(slug: string) {
  return (await getPublicProcedures()).find((procedure) => procedure.slug === slug) ?? null;
}

export async function getPublicGalleryItems(): Promise<PublicGalleryItem[]> {
  const publishedGallery = (await publishedContent()).filter((item) => item.type === "Gallery");
  const overrides = new Map(publishedGallery.map((item) => [cleanPathSlug(item.slug, "/gallery"), item]));

  const merged = galleryItems.map((item) => {
    const override = overrides.get(item.slug);
    if (!override) return item;

    return {
      ...item,
      title: override.title || item.title,
      src: override.mediaUrl || item.src,
      summary: override.summary
    };
  });

  const siteSlugs = new Set(galleryItems.map((item) => item.slug));
  const cmsOnly = publishedGallery.flatMap((item): PublicGalleryItem[] => {
      const slug = cleanPathSlug(item.slug, "/gallery");
      if (!slug || siteSlugs.has(slug) || !item.mediaUrl) return [];
      return [{
        category: "CMS Media",
        title: item.title,
        slug,
        src: item.mediaUrl,
        summary: item.summary
      }];
    });

  return [...merged, ...cmsOnly];
}
