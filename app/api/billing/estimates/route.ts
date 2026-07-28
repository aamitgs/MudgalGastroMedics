import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { computeAuditChanges } from "@/lib/audit-diff";
import { rupeesToPaise } from "@/lib/billing-calc";
import { effectiveStatus } from "@/lib/estimate-calc";
import {
  acceptEstimate,
  convertEstimateToInvoice,
  createEstimate,
  declineEstimate,
  getEstimateById,
  listEstimates,
  listPatientEstimates,
  shareEstimate
} from "@/lib/estimate-store";
import type { Estimate } from "@/lib/estimate-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { estimateActionSchema, estimateCreateSchema } from "@/lib/validation/packages";

/** Expiry is derived on read, so a stale quote never reads as still open. */
function withEffectiveStatus(estimate: Estimate) {
  return { ...estimate, effectiveStatus: effectiveStatus(estimate) };
}

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;

  const id = params.get("id");
  if (id !== null) {
    const estimate = await getEstimateById(id);
    if (!estimate) return NextResponse.json({ ok: false, error: "Estimate not found." }, { status: 404 });
    return NextResponse.json({ ok: true, estimate: withEffectiveStatus(estimate) });
  }

  const phone = params.get("phone");
  const estimates = phone ? await listPatientEstimates(phone) : await listEstimates();
  return NextResponse.json({ ok: true, estimates: estimates.map(withEffectiveStatus) });
}

/** Quoting is ordinary counter work — reception quotes procedures every day. */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = estimateCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const result = await createEstimate({
    ...parsed.data,
    lineItems: parsed.data.lineItems.map((line) => ({
      source: line.source ?? "Manual",
      description: line.description,
      category: line.category,
      quantity: line.quantity,
      unitPricePaise: rupeesToPaise(line.unitPrice),
      discountPaise: rupeesToPaise(line.discount ?? 0),
      taxPaise: rupeesToPaise(line.tax ?? 0)
    })),
    discountPaise: rupeesToPaise(parsed.data.discount ?? 0),
    actingStaffName: auth.context.userName || auth.context.activeRole
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.estimate.created",
    entityType: "estimate",
    entityId: result.estimate.id,
    after: result.estimate,
    metadata: { estimateNo: result.estimate.estimateNo, totalPaise: result.estimate.totalPaise },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, estimate: withEffectiveStatus(result.estimate) });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = estimateActionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;
  const actingStaffName = auth.context.userName || auth.context.activeRole;

  if (body.action === "convert") {
    const result = await convertEstimateToInvoice({ id: body.id, actingStaffName });
    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Estimate not found." ? 404 : 400 });
    }

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.estimate.converted",
      entityType: "estimate",
      entityId: result.estimate.id,
      metadata: {
        estimateNo: result.estimate.estimateNo,
        invoiceNo: result.invoice.invoiceNo,
        totalPaise: result.estimate.totalPaise
      },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({ ok: true, estimate: withEffectiveStatus(result.estimate), invoice: result.invoice });
  }

  const result =
    body.action === "share"
      ? await shareEstimate(body.id)
      : body.action === "accept"
        ? await acceptEstimate({ id: body.id, patientSignatureName: body.patientSignatureName, method: body.method, actingStaffName })
        : await declineEstimate(body.id, body.reason);

  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Estimate not found." ? 404 : 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: `billing.estimate.${body.action}d`,
    entityType: "estimate",
    entityId: result.estimate.id,
    changes: computeAuditChanges(result.before, result.estimate),
    metadata: {
      estimateNo: result.estimate.estimateNo,
      // The acceptance record itself is the point of an estimate, so it is
      // captured in the audit trail rather than only on the document.
      patientSignatureName: result.estimate.patientSignatureName,
      acceptanceMethod: result.estimate.acceptanceMethod
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, estimate: withEffectiveStatus(result.estimate) });
}
