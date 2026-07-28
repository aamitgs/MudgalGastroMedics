import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { computeAuditChanges } from "@/lib/audit-diff";
import { rupeesToPaise } from "@/lib/billing-calc";
import { tenderVariances } from "@/lib/cash-closing-calc";
import { approveCashClosing, cashClosingPreview, listCashClosings, submitCashClosing } from "@/lib/cash-closing-store";
import { closingTenders } from "@/lib/cash-closing-types";
import { firstZodIssueMessage } from "@/lib/validation/http";

const todayIso = () => new Date().toISOString().slice(0, 10);

const submitSchema = z.object({
  action: z.literal("submit"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  openingCash: z.coerce.number().min(0, "Opening cash can't be negative.").finite(),
  counted: z.record(z.enum(closingTenders), z.coerce.number().min(0, "A counted amount can't be negative.").finite()),
  notes: z.string().trim().optional()
});

const approveSchema = z.object({
  action: z.literal("approve"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  note: z.string().trim().optional()
});

const closingSchema = z.discriminatedUnion("action", [submitSchema, approveSchema]);

/** Reading the day's position is reporting work, so it rides on the `reports` view grant Accounts already holds. */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  if (params.get("history") === "true") {
    return NextResponse.json({ ok: true, closings: await listCashClosings() });
  }

  const preview = await cashClosingPreview(params.get("date")?.trim() || todayIso());
  return NextResponse.json({ ok: true, ...preview });
}

/**
 * Closing a day and approving a discrepancy are different powers, so they
 * check different resources: closing is counter work; signing off money that
 * does not reconcile is a financial control.
 */
export async function POST(request: Request) {
  const parsed = closingSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  const auth =
    body.action === "approve" ? await authorize(request, "billing-adjustments", "edit") : await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const actingStaffName = auth.context.userName || auth.context.activeRole;

  if (body.action === "approve") {
    const result = await approveCashClosing({ date: body.date, note: body.note, actingStaffName });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.closing.approved",
      entityType: "cash-closing",
      entityId: result.closing.id,
      severity: "warning",
      changes: computeAuditChanges(result.before, result.closing),
      metadata: { date: result.closing.date, differencePaise: result.closing.differencePaise, note: body.note },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, closing: result.closing });
  }

  const counted = Object.fromEntries(Object.entries(body.counted).map(([method, amount]) => [method, rupeesToPaise(amount)]));
  const result = await submitCashClosing({
    date: body.date,
    openingCashPaise: rupeesToPaise(body.openingCash),
    counted,
    notes: body.notes,
    actingStaffName
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  const variances = tenderVariances(result.closing.tenders);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.closing.submitted",
    entityType: "cash-closing",
    entityId: result.closing.id,
    // A day that doesn't reconcile is the thing an auditor looks for.
    severity: result.closing.differencePaise === 0 ? "info" : "warning",
    changes: computeAuditChanges(result.before, result.closing),
    metadata: {
      date: result.closing.date,
      differencePaise: result.closing.differencePaise,
      status: result.closing.status,
      variances
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, closing: result.closing, variances });
}
