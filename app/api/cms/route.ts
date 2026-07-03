import { NextResponse } from "next/server";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { cmsContentStatuses, cmsContentTypes } from "@/lib/cms-types";
import type { CmsContentStatus, CmsContentType } from "@/lib/cms-types";
import { listCmsContent, listCmsRevisions, updateCmsStatus, upsertCmsContent } from "@/lib/cms-store";
import { getAdminAuthContext, requirePermission } from "@/lib/rbac";

export async function GET(request: Request) {
  const context = getAdminAuthContext(request);
  const allowed = requirePermission(context, "cms:read");
  if (!allowed.ok) return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status });

  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId") || undefined;
  return NextResponse.json({
    ok: true,
    items: listCmsContent(url.searchParams.get("type") || undefined),
    revisions: listCmsRevisions(itemId),
    currentUser: context.staff
  });
}

export async function POST(request: Request) {
  const context = getAdminAuthContext(request);
  const writeAllowed = requirePermission(context, "cms:write");
  if (!writeAllowed.ok) return NextResponse.json({ ok: false, error: writeAllowed.error }, { status: writeAllowed.status });

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" && cmsContentTypes.includes(body.type as CmsContentType) ? body.type as CmsContentType : "Page";
  const status = typeof body.status === "string" && cmsContentStatuses.includes(body.status as CmsContentStatus) ? body.status as CmsContentStatus : "Draft";

  if (status === "Published" || status === "Archived") {
    const publishAllowed = requirePermission(context, "cms:publish");
    if (!publishAllowed.ok) return NextResponse.json({ ok: false, error: "CMS publish permission required." }, { status: 403 });
  }

  const item = upsertCmsContent({ ...body, type, status });

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
  const context = getAdminAuthContext(request);
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

  const item = updateCmsStatus(id, status);
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
