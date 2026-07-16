import "server-only";

import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { galleryItems, procedures } from "@/lib/site-data";
import type { CmsContentItem, CmsContentRevision, CmsContentStatus, CmsContentType } from "@/lib/cms-types";

type CmsStore = {
  items: CmsContentItem[];
  revisions: CmsContentRevision[];
};

type CmsInput = {
  id?: string;
  type?: CmsContentType;
  status?: CmsContentStatus;
  title?: string;
  slug?: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  mediaUrl?: string;
  owner?: string;
  notes?: string;
};



function now() {
  return new Date().toISOString();
}

function makeId() {
  return generateId("CMS", 4);
}

function makeRevisionId() {
  return generateId("CMSREV", 4);
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createSeedItems(): CmsContentItem[] {
  const createdAt = now();
  const procedureItems = procedures.slice(0, 8).map((procedure): CmsContentItem => ({
    id: `CMS-PROC-${procedure.slug.toUpperCase()}`,
    type: "Procedure",
    status: "Published",
    title: procedure.title,
    slug: `/procedures/${procedure.slug}`,
    summary: procedure.summary,
    seoTitle: `${procedure.title} in Agra`,
    seoDescription: procedure.summary,
    owner: "Clinical Content",
    notes: "Seeded from public procedure content. Edit here before future publish workflow.",
    publishedAt: createdAt,
    createdAt,
    updatedAt: createdAt
  }));

  const galleryDrafts = galleryItems.slice(0, 4).map((item): CmsContentItem => ({
    id: `CMS-GAL-${item.slug.toUpperCase()}`,
    type: "Gallery",
    status: "In Review",
    title: item.title,
    slug: `/gallery#${item.slug}`,
    summary: `${item.category} image for website gallery review.`,
    mediaUrl: item.src,
    owner: "Media Desk",
    notes: "Check image crop, alt text and final approval before publishing.",
    createdAt,
    updatedAt: createdAt
  }));

  return [
    {
      id: "CMS-HOME",
      type: "Page",
      status: "Published",
      title: "Homepage",
      slug: "/",
      summary: "Patient-facing homepage content, appointment CTA and hospital positioning.",
      seoTitle: "Mudgal Gastromedics Hospital Agra",
      seoDescription: "Advanced gastro, liver and endoscopy care in Agra.",
      owner: "Admin",
      publishedAt: createdAt,
      createdAt,
      updatedAt: createdAt
    },
    ...procedureItems,
    ...galleryDrafts
  ];
}




const docStore = createDocumentStore<CmsStore>("cms-content", (parsed) => {
  const doc = parsed as Partial<CmsStore> | undefined;
  return {
    items: Array.isArray(doc?.items) ? (doc.items as CmsStore["items"]) : createSeedItems(),
    revisions: Array.isArray(doc?.revisions) ? (doc.revisions as CmsStore["revisions"]) : []
  };
});

export async function listCmsContent(type?: string) {
  const items = (await docStore.load()).items;
  return type ? items.filter((item) => item.type === type) : items;
}

export async function listCmsRevisions(itemId?: string, limit = 80) {
  const revisions = (await docStore.load()).revisions;
  return (itemId ? revisions.filter((revision) => revision.itemId === itemId) : revisions).slice(0, limit);
}

function recordRevision(store: CmsStore, item: CmsContentItem, action: CmsContentRevision["action"]) {
  const version = store.revisions.filter((revision) => revision.itemId === item.id).length + 1;
  const revision: CmsContentRevision = {
    id: makeRevisionId(),
    itemId: item.id,
    version,
    action,
    status: item.status,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    mediaUrl: item.mediaUrl,
    owner: item.owner,
    notes: item.notes,
    createdAt: now()
  };

  store.revisions = [revision, ...store.revisions].slice(0, 1500);
  return revision;
}

export async function upsertCmsContent(input: CmsInput) {
  const store = await docStore.load();
  const existing = input.id ? store.items.find((item) => item.id === input.id) : undefined;
  const updatedAt = now();
  const status = input.status ?? existing?.status ?? "Draft";
  const title = normalize(input.title ?? existing?.title);
  const slug = normalize(input.slug ?? existing?.slug);

  if (!title || !slug) return null;

  const item: CmsContentItem = {
    id: existing?.id ?? makeId(),
    type: input.type ?? existing?.type ?? "Page",
    status,
    title,
    slug,
    summary: normalize(input.summary ?? existing?.summary),
    seoTitle: normalize(input.seoTitle ?? existing?.seoTitle),
    seoDescription: normalize(input.seoDescription ?? existing?.seoDescription),
    mediaUrl: normalize(input.mediaUrl ?? existing?.mediaUrl),
    owner: normalize(input.owner ?? existing?.owner) || "Admin",
    notes: normalize(input.notes ?? existing?.notes),
    publishedAt: status === "Published" ? existing?.publishedAt ?? updatedAt : existing?.publishedAt,
    createdAt: existing?.createdAt ?? updatedAt,
    updatedAt
  };

  store.items = [item, ...store.items.filter((entry) => entry.id !== item.id)];
  recordRevision(store, item, existing ? "Updated" : "Created");
  await docStore.save(store);
  return item;
}

export async function updateCmsStatus(id: string, status: CmsContentStatus) {
  const store = await docStore.load();
  const item = store.items.find((entry) => entry.id === id);
  if (!item) return null;

  item.status = status;
  item.updatedAt = now();
  if (status === "Published") item.publishedAt = item.publishedAt ?? item.updatedAt;
  recordRevision(store, item, "Status Changed");
  await docStore.save(store);
  return item;
}
