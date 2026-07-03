export type CmsContentType = "Page" | "Procedure" | "Gallery" | "SEO" | "Announcement";

export type CmsContentStatus = "Draft" | "In Review" | "Published" | "Archived";

export type CmsContentItem = {
  id: string;
  type: CmsContentType;
  status: CmsContentStatus;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  mediaUrl?: string;
  owner: string;
  notes?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CmsContentRevision = {
  id: string;
  itemId: string;
  version: number;
  action: "Created" | "Updated" | "Status Changed";
  status: CmsContentStatus;
  title: string;
  slug: string;
  summary: string;
  seoTitle?: string;
  seoDescription?: string;
  mediaUrl?: string;
  owner: string;
  notes?: string;
  createdAt: string;
};

export const cmsContentTypes: CmsContentType[] = ["Page", "Procedure", "Gallery", "SEO", "Announcement"];
export const cmsContentStatuses: CmsContentStatus[] = ["Draft", "In Review", "Published", "Archived"];
