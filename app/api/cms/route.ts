import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";
import type { CmsContentStatus, CmsContentType } from "@/lib/cms-types";
import { deleteCmsContent, listCmsContent, listCmsRevisions, updateCmsStatus, upsertCmsContent } from "@/lib/cms-store";
import { queryCmsContent, type CmsContentSortField, type SortDirection } from "@/lib/cms-content-query";
import { authorize } from "@/lib/access/guard";
import { cmsDeleteSchema, cmsStatusUpdateSchema, cmsUpsertSchema } from "@/lib/validation/operations";

const sortFields: CmsContentSortField[] = ["title", "type", "status", "owner", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "cms", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const currentUser = { name: auth.context.userName, role: auth.context.activeRole };

  const params = new URL(request.url).searchParams;
  const itemId = params.get("itemId") || undefined;
  const pageParam = params.get("page");
  const allItems = await listCmsContent();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({
      ok: true,
      items: allItems,
      revisions: (await listCmsRevisions(itemId)),
      currentUser
    });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const type = params.get("type");

  const result = queryCmsContent(allItems, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as CmsContentSortField) ? (sortBy as CmsContentSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && cmsContentStatuses.includes(status as CmsContentStatus) ? (status as CmsContentStatus) : undefined,
    type: type && cmsContentTypes.includes(type as CmsContentType) ? (type as CmsContentType) : undefined
  });

  return NextResponse.json({
    ok: true,
    ...result,
    revisions: (await listCmsRevisions(itemId)),
    currentUser
  });
}

export async function POST(request: Request) {
  // Publishing/archiving needs no separate check: under the current RBAC
  // matrix only "admin" (and the super-admin bypass) hold any "cms" grant at
  // all, so a single "edit" check already covers publish — unlike the
  // retired legacy bridge, no role here has edit-without-publish.
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = cmsUpsertSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};
  const type = body.type && cmsContentTypes.includes(body.type as CmsContentType) ? (body.type as CmsContentType) : "Page";
  const status = body.status && cmsContentStatuses.includes(body.status as CmsContentStatus) ? (body.status as CmsContentStatus) : "Draft";

  const item = (await upsertCmsContent({ ...body, type, status }));

  if (!item) return NextResponse.json({ ok: false, error: "Title and slug are required." }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "cms.content.saved",
    entityType: "cms_content",
    entityId: item.id,
    metadata: { type: item.type, status: item.status, slug: item.slug, staffName: auth.context.userName },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = cmsStatusUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const { id, status: rawStatus } = parsed.success ? parsed.data : { id: "", status: undefined };
  const status = rawStatus && cmsContentStatuses.includes(rawStatus as CmsContentStatus) ? (rawStatus as CmsContentStatus) : undefined;

  if (!id || !status) return NextResponse.json({ ok: false, error: "Valid id and status are required." }, { status: 400 });

  const item = (await updateCmsStatus(id, status));
  if (!item) return NextResponse.json({ ok: false, error: "CMS item not found." }, { status: 404 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "cms.content.status.updated",
    entityType: "cms_content",
    entityId: item.id,
    metadata: { type: item.type, status: item.status, slug: item.slug, staffName: auth.context.userName },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "cms", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = cmsDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Content id is required." }, { status: 400 });

  const result = await deleteCmsContent(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "cms.content.deleted",
    entityType: "cms_content",
    entityId: parsed.data.id,
    severity: "warning",
    before: result.item,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
