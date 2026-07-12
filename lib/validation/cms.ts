import { z } from "zod";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";

// The { error } option on the base z.string() call (not just a chained
// .min() message) is what covers an entirely-absent key — .min() alone
// only fires once the type check already passed, so an absent required
// field would otherwise surface a raw "expected string, received
// undefined" instead of this friendly message.
export const cmsContentCreateSchema = z.object({
  type: z.enum(cmsContentTypes, { error: "Invalid content type." }),
  status: z.enum(cmsContentStatuses, { error: "Invalid content status." }),
  title: z.string({ error: "Content title is required." }).trim().min(1, "Content title is required."),
  slug: z.string({ error: "Slug is required." }).trim().min(1, "Slug is required."),
  summary: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  mediaUrl: z.string().trim().optional(),
  owner: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

export type CmsContentCreateInput = z.infer<typeof cmsContentCreateSchema>;
