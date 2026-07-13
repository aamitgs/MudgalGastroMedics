import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { answerVisitQuestion } from "@/lib/ai-visit-assistant";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { visitAssistantQuestionSchema } from "@/lib/validation/clinical";

export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = visitAssistantQuestionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { visitId, question, history } = parsed.data;
  if (!visitId) {
    return NextResponse.json({ ok: false, error: "A visit id is required." }, { status: 400 });
  }

  const result = await answerVisitQuestion(visitId, question, history);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "ai.visit_assistant.asked",
    entityType: "opd_visit",
    entityId: visitId,
    severity: result.ok ? "info" : "warning",
    metadata: { ok: result.ok, question },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, answer: result.answer, safetyNote: result.safetyNote });
}
