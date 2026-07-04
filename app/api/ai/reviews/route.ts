import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { generateAiReview, getAiSources, listAiReviews, seedMissingAiReviews, updateAiReview } from "@/lib/ai-review-store";
import { aiReviewStatuses } from "@/lib/ai-types";
import type { AiCaseSource, AiReviewStatus } from "@/lib/ai-types";

export async function GET(request: Request) {
  const auth = await authorize(request, "cms", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    reviews: (await listAiReviews()),
    sources: await getAiSources()
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "generate";

  if (action === "seed") {
    const created = (await seedMissingAiReviews());
    await recordAuditEvent({
      actorRole: "admin",
      action: "ai.reviews.seeded",
      entityType: "ai_case_review",
      entityId: "seeded-batch",
      metadata: { created, ...auditRequestMetadata(request) }
    });
    return NextResponse.json({ ok: true, created, reviews: (await listAiReviews()) });
  }

  const source = body.source === "OPD" ? "OPD" : "Appointment";
  const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
  if (!sourceId) return NextResponse.json({ ok: false, error: "Source record is required." }, { status: 400 });

  const result = (await generateAiReview(source as AiCaseSource, sourceId));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  await recordAuditEvent({
    actorRole: "admin",
    action: "ai.review.generated",
    entityType: "ai_case_review",
    entityId: result.review.id,
    metadata: { source: result.review.source, sourceId: result.review.sourceId, status: result.review.status, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, review: result.review });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "cms", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" && aiReviewStatuses.includes(body.status as AiReviewStatus) ? body.status as AiReviewStatus : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "AI review id is required." }, { status: 400 });

  const review = (await updateAiReview({
    id,
    status,
    doctorReviewNote: typeof body.doctorReviewNote === "string" ? body.doctorReviewNote : undefined,
    reviewedBy: typeof body.reviewedBy === "string" ? body.reviewedBy : undefined
  }));

  if (!review) return NextResponse.json({ ok: false, error: "AI review not found." }, { status: 404 });
  await recordAuditEvent({
    actorRole: "admin",
    action: "ai.review.updated",
    entityType: "ai_case_review",
    entityId: review.id,
    metadata: { source: review.source, sourceId: review.sourceId, status: review.status, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, review });
}
