import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { approvalStageRoles } from "@/lib/access/matrix";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { attentionItems, planBackfill } from "@/lib/billing-backfill";
import { createInvoice, issueInvoice, listInvoices, recordInvoicePayment } from "@/lib/billing-store";
import { listOpdVisits } from "@/lib/opd-store";
import { firstZodIssueMessage } from "@/lib/validation/http";

/**
 * Converts pre-invoice OPD billing history into invoices, so the legacy
 * revenue-summary surface can eventually be retired.
 *
 * GET is a dry run and the only thing anyone should need most of the time: it
 * returns exactly what would be created and what it refuses to decide. POST
 * writes, and demands an explicit confirmation token — a backfill that can be
 * triggered by a stray click is a way to duplicate a hospital's revenue.
 *
 * Restricted to the roles that hold final financial sign-off. This creates
 * financial records in bulk; it is not counter work.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const [visits, invoices] = await Promise.all([listOpdVisits(), listInvoices()]);
  const plan = planBackfill(visits, invoices);

  return NextResponse.json({
    ok: true,
    dryRun: true,
    summary: {
      convert: plan.convert.length,
      skip: plan.skip.length,
      needsAttention: attentionItems(plan).length,
      totalPaise: plan.totalPaise
    },
    convert: plan.convert,
    needsAttention: attentionItems(plan)
  });
}

const runSchema = z.object({
  // Deliberately awkward to send by accident.
  confirm: z.literal("backfill-legacy-billing", { error: 'Send confirm: "backfill-legacy-billing" to write invoices.' })
});

export async function POST(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!approvalStageRoles.Admin.includes(auth.context.activeRole)) {
    return NextResponse.json({ ok: false, error: "Only an administrator can run the billing backfill." }, { status: 403 });
  }

  const parsed = runSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const actingStaffName = auth.context.userName || auth.context.activeRole;
  const [visits, invoices] = await Promise.all([listOpdVisits(), listInvoices()]);
  const plan = planBackfill(visits, invoices);

  const created: string[] = [];
  const failed: Array<{ visitId: string; error: string }> = [];

  for (const action of plan.convert) {
    const invoice = await createInvoice({
      visitId: action.visitId,
      lineItems: [
        {
          source: "OPD",
          // Keyed to the visit so a re-run can never add the same line twice.
          sourceRef: `backfill:${action.visitId}`,
          description: action.description,
          category: "Consultation",
          quantity: 1,
          unitPricePaise: action.amountPaise
        }
      ],
      notes: `Backfilled from legacy OPD billing${action.receiptId ? ` · receipt ${action.receiptId}` : ""}`,
      actingStaffName
    });
    if ("error" in invoice) {
      failed.push({ visitId: action.visitId, error: invoice.error });
      continue;
    }

    const issued = await issueInvoice(invoice.invoice.id, actingStaffName);
    if ("error" in issued) {
      failed.push({ visitId: action.visitId, error: issued.error });
      continue;
    }

    if (action.paid) {
      const payment = await recordInvoicePayment(invoice.invoice.id, {
        method: action.method ?? "Other",
        amountPaise: action.amountPaise,
        reference: action.receiptId,
        note: "Backfilled from legacy OPD billing",
        actingStaffName
      });
      if ("error" in payment) {
        failed.push({ visitId: action.visitId, error: payment.error });
        continue;
      }
    }

    created.push(invoice.invoice.invoiceNo);
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.backfill.run",
    entityType: "billing-backfill",
    entityId: new Date().toISOString(),
    severity: "warning",
    metadata: { created: created.length, failed: failed.length, skipped: plan.skip.length, totalPaise: plan.totalPaise },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, created, failed, needsAttention: attentionItems(plan) });
}
