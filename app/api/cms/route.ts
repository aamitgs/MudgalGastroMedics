import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";
import type { CmsContentStatus, CmsContentType } from "@/lib/cms-types";
import { listCmsContent, listCmsRevisions, updateCmsStatus, upsertCmsContent } from "@/lib/cms-store";
import { queryCmsContent, type CmsContentSortField, type SortDirection } from "@/lib/cms-content-query";
import { getAdminAuthContext, requirePermission } from "@/lib/rbac";

const sortFields: CmsContentSortField[] = ["title", "type", "status", "owner", "createdAt"];

export async function GET(request: Request) {
  const context = await getAdminAuthContext(request);
  const allowed = requirePermission(context, "cms:read");
  if (!allowed.ok) return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status });

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
      currentUser: context.staff
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
    currentUser: context.staff
  });
}

export async function POST(request: Request) {
  const context = await getAdminAuthContext(request);
  const writeAllowed = requirePermission(context, "cms:write");
  if (!writeAllowed.ok) return NextResponse.json({ ok: false, error: writeAllowed.error }, { status: writeAllowed.status });

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" && cmsContentTypes.includes(body.type as CmsContentType) ? body.type as CmsContentType : "Page";
  const status = typeof body.status === "string" && cmsContentStatuses.includes(body.status as CmsContentStatus) ? body.status as CmsContentStatus : "Draft";

  if (status === "Published" || status === "Archived") {
    const publishAllowed = requirePermission(context, "cms:publish");
    if (!publishAllowed.ok) return NextResponse.json({ ok: false, error: "CMS publish permission required." }, { status: 403 });
  }

  const item = (await upsertCmsContent({ ...body, type, status }));

  if (!item) return NextResponse.json({ ok: false, error: "Title and slug are required." }, { status: 400 });

  await recordAuditEvent({
    actorRole: "admin",
    actorId: context.staff?.id,
    action: "cms.content.saved",
    entityType: "cms_content",
    entityId: item.id,
    metadata: { type: item.type, status: item.status, slug: item.slug, staffName: context.staff?.name, role: context.staff?.role, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const context = await getAdminAuthContext(request);
  const writeAllowed = requirePermission(context, "cms:write");
  if (!writeAllowed.ok) return NextResponse.json({ ok: false, error: writeAllowed.error }, { status: writeAllowed.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" && cmsContentStatuses.includes(body.status as CmsContentStatus) ? body.status as CmsContentStatus : undefined;

  if (!id || !status) return NextResponse.json({ ok: false, error: "Valid id and status are required." }, { status: 400 });

  if (status === "Published" || status === "Archived") {
    const publishAllowed = requirePermission(context, "cms:publish");
    if (!publishAllowed.ok) return NextResponse.json({ ok: false, error: "CMS publish permission required." }, { status: 403 });
  }

  const item = (await updateCmsStatus(id, status));
  if (!item) return NextResponse.json({ ok: false, error: "CMS item not found." }, { status: 404 });

  await recordAuditEvent({
    actorRole: "admin",
    actorId: context.staff?.id,
    action: "cms.content.status.updated",
    entityType: "cms_content",
    entityId: item.id,
    metadata: { type: item.type, status: item.status, slug: item.slug, staffName: context.staff?.name, role: context.staff?.role, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, item });
}
