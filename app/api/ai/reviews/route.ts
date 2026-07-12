import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { generateAiReview, getAiSources, listAiReviews, seedMissingAiReviews, updateAiReview } from "@/lib/ai-review-store";
import { queryAiReviews, type AiReviewSortField, type SortDirection } from "@/lib/ai-review-query";
import { aiReviewStatuses } from "@/lib/ai-types";
import type { AiCaseSource, AiReviewStatus } from "@/lib/ai-types";
import { aiReviewGenerateSchema, aiReviewUpdateSchema } from "@/lib/validation/clinical";

const sortFields: AiReviewSortField[] = ["patientName", "source", "urgency", "status", "createdAt"];
const sources: AiCaseSource[] = ["Appointment", "OPD"];

export async function GET(request: Request) {
  const auth = await authorize(request, "cms", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allReviews = await listAiReviews();
  const sourceOptions = await getAiSources();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, reviews: allReviews, sources: sourceOptions });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const source = params.get("source");

  const result = queryAiReviews(allReviews, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as AiReviewSortField) ? (sortBy as AiReviewSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && aiReviewStatuses.includes(status as AiReviewStatus) ? (status as AiReviewStatus) : undefined,
    source: source && sources.includes(source as AiCaseSource) ? (source as AiCaseSource) : undefined
  });

  return NextResponse.json({ ok: true, ...result, sources: sourceOptions });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = aiReviewGenerateSchema.safeParse(await request.json().catch(() => ({})));
  const { action, source: rawSource, sourceId } = parsed.success ? parsed.data : { action: "generate", source: "Appointment", sourceId: "" };

  if (action === "seed") {
    const created = (await seedMissingAiReviews());
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "ai.reviews.seeded",
      entityType: "ai_case_review",
      entityId: "seeded-batch",
      metadata: { created },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, created, reviews: (await listAiReviews()) });
  }

  const source = rawSource === "OPD" ? "OPD" : "Appointment";
  if (!sourceId) return NextResponse.json({ ok: false, error: "Source record is required." }, { status: 400 });

  const result = (await generateAiReview(source as AiCaseSource, sourceId));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.review.generated",
    entityType: "ai_case_review",
    entityId: result.review.id,
    metadata: { source: result.review.source, sourceId: result.review.sourceId, status: result.review.status },
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, review: result.review });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = aiReviewUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const { id, status: rawStatus, doctorReviewNote, reviewedBy } = parsed.success
    ? parsed.data
    : { id: "", status: undefined, doctorReviewNote: undefined, reviewedBy: undefined };
  const status = rawStatus && aiReviewStatuses.includes(rawStatus as AiReviewStatus) ? (rawStatus as AiReviewStatus) : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "AI review id is required." }, { status: 400 });

  const review = (await updateAiReview({ id, status, doctorReviewNote, reviewedBy }));

  if (!review) return NextResponse.json({ ok: false, error: "AI review not found." }, { status: 404 });
  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.review.updated",
    entityType: "ai_case_review",
    entityId: review.id,
    metadata: { source: review.source, sourceId: review.sourceId, status: review.status },
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, review });
}
