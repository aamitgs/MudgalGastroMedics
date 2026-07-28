import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { computeAuditChanges } from "@/lib/audit-diff";
import { rupeesToPaise } from "@/lib/billing-calc";
import { dayTypeFor, resolveConsultationFee, resolveServicePrice } from "@/lib/pricing-calc";
import {
  createConsultationFeeRule,
  createServicePrice,
  getServicePriceByCode,
  listConsultationFeeRules,
  listServicePrices,
  updateConsultationFeeRule,
  updateServicePrice
} from "@/lib/pricing-store";
import type { ConsultationDayType, ConsultationVisitType, PriceTier } from "@/lib/pricing-types";
import { consultationDayTypes, consultationVisitTypes, priceTiers } from "@/lib/pricing-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { pricingCreateSchema, pricingUpdateSchema } from "@/lib/validation/pricing";

/** Rupee amounts keyed by tier, converted at the wire boundary. */
function toTierPaise(source: Partial<Record<PriceTier, number>> | undefined) {
  if (!source) return undefined;
  const entries = Object.entries(source) as Array<[PriceTier, number]>;
  return Object.fromEntries(entries.map(([tier, value]) => [tier, rupeesToPaise(value)])) as Partial<Record<PriceTier, number>>;
}

/** Same, for the doctor-keyed overrides — every configured doctor has a value, so this map is total. */
function toDoctorPaise(source: Record<string, number> | undefined) {
  if (!source) return undefined;
  return Object.fromEntries(Object.entries(source).map(([doctor, value]) => [doctor, rupeesToPaise(value)]));
}

/**
 * Reading prices is part of raising a bill, so it rides on the `billing`
 * resource that reception already holds. Changing them is a financial-control
 * action and checks `billing-adjustments` instead (Track 5.0).
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const tierParam = params.get("tier");
  const tier = tierParam && priceTiers.includes(tierParam as PriceTier) ? (tierParam as PriceTier) : undefined;
  const doctorName = params.get("doctor") ?? undefined;

  // Price preview for one service — what the billing screen calls before
  // adding a charge, so staff see the amount and the reason for it up front.
  const code = params.get("code");
  if (code !== null) {
    const service = await getServicePriceByCode(code);
    if (!service) return NextResponse.json({ ok: false, error: `No service found for code ${code}.` }, { status: 404 });
    return NextResponse.json({ ok: true, service, resolved: resolveServicePrice(service, { tier, doctorName }) });
  }

  const visitTypeParam = params.get("visitType");
  if (visitTypeParam !== null) {
    if (!consultationVisitTypes.includes(visitTypeParam as ConsultationVisitType)) {
      return NextResponse.json({ ok: false, error: "Invalid visit type." }, { status: 400 });
    }
    const dayTypeParam = params.get("dayType");
    const dayType =
      dayTypeParam && consultationDayTypes.includes(dayTypeParam as ConsultationDayType)
        ? (dayTypeParam as ConsultationDayType)
        : dayTypeFor(new Date());

    const resolved = resolveConsultationFee(await listConsultationFeeRules(), {
      doctorName,
      visitType: visitTypeParam as ConsultationVisitType,
      dayType
    });
    if (!resolved) return NextResponse.json({ ok: false, error: "No consultation fee is configured for that combination." }, { status: 404 });
    return NextResponse.json({ ok: true, dayType, resolved });
  }

  const [services, consultationFees] = await Promise.all([listServicePrices(), listConsultationFeeRules()]);
  return NextResponse.json({ ok: true, services, consultationFees });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = pricingCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  if (body.kind === "service") {
    const result = await createServicePrice({
      code: body.code,
      name: body.name,
      category: body.category,
      basePricePaise: rupeesToPaise(body.basePrice),
      tierPricesPaise: toTierPaise(body.tierPrices),
      doctorPricesPaise: toDoctorPaise(body.doctorPrices),
      taxPercent: body.taxPercent,
      procedureSlug: body.procedureSlug,
      ipdDaily: body.ipdDaily,
      ipdAdmissionCharge: body.ipdAdmissionCharge,
      ipdWards: body.ipdWards
    });
    if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.price.created",
      entityType: "service-price",
      entityId: result.service.id,
      after: result.service,
      metadata: { code: result.service.code },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, service: result.service });
  }

  const result = await createConsultationFeeRule({
    doctorName: body.doctorName,
    visitType: body.visitType,
    dayType: body.dayType,
    feePaise: rupeesToPaise(body.fee),
    followUpWindowDays: body.followUpWindowDays
  });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.consultation_fee.created",
    entityType: "consultation-fee-rule",
    entityId: result.rule.id,
    after: result.rule,
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, rule: result.rule });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = pricingUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  if (body.kind === "service") {
    const result = await updateServicePrice({
      id: body.id,
      name: body.name,
      category: body.category,
      basePricePaise: body.basePrice === undefined ? undefined : rupeesToPaise(body.basePrice),
      tierPricesPaise: toTierPaise(body.tierPrices),
      doctorPricesPaise: toDoctorPaise(body.doctorPrices),
      taxPercent: body.taxPercent,
      procedureSlug: body.procedureSlug,
      ipdDaily: body.ipdDaily,
      ipdAdmissionCharge: body.ipdAdmissionCharge,
      ipdWards: body.ipdWards,
      active: body.active,
      reason: body.reason,
      actingStaffName: auth.context.userName || auth.context.activeRole
    });
    if ("error" in result) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Service not found." ? 404 : 400 });
    }

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.price.updated",
      entityType: "service-price",
      entityId: result.service.id,
      severity: "warning",
      changes: computeAuditChanges(result.before, result.service),
      metadata: { code: result.service.code, reason: body.reason },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, service: result.service });
  }

  const result = await updateConsultationFeeRule({
    id: body.id,
    feePaise: body.fee === undefined ? undefined : rupeesToPaise(body.fee),
    followUpWindowDays: body.followUpWindowDays,
    active: body.active
  });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "Fee rule not found." ? 404 : 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.consultation_fee.updated",
    entityType: "consultation-fee-rule",
    entityId: result.rule.id,
    severity: "warning",
    changes: computeAuditChanges(result.before, result.rule),
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, rule: result.rule });
}
