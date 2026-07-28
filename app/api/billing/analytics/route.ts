import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import {
  collectionTotals,
  dailyTrend,
  discountReport,
  doctorEarnings,
  forecastMonth,
  outstandingTotals,
  refundReport,
  revenueByCategory,
  revenueByDepartment,
  revenueByDoctor,
  topServices
} from "@/lib/billing-analytics";
import { listInvoices } from "@/lib/billing-store";
import { doctorIncentivePercents, setDoctorIncentivePercent } from "@/lib/cash-closing-store";
import { listInsuranceClaims } from "@/lib/finance-store";
import { firstZodIssueMessage } from "@/lib/validation/http";

const isoDate = (value: Date) => value.toISOString().slice(0, 10);

function defaultRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from: isoDate(from), to: isoDate(now) };
}

/**
 * The financial dashboard (Track 5.10, §25/§30).
 *
 * Every figure is derived from the invoice ledger on each request rather than
 * cached: a revenue number that can drift from its source is worse than a slow
 * one, and this aggregates one hospital's bills, not a warehouse.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "reports", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const fallback = defaultRange();
  const range = {
    from: params.get("from")?.trim() || fallback.from,
    to: params.get("to")?.trim() || fallback.to
  };
  if (range.from > range.to) return NextResponse.json({ ok: false, error: "The start date must be on or before the end date." }, { status: 400 });

  const [invoices, incentives, claims] = await Promise.all([listInvoices(), doctorIncentivePercents(), listInsuranceClaims()]);
  const today = isoDate(new Date());

  return NextResponse.json({
    ok: true,
    range,
    today: collectionTotals(invoices, { from: today, to: today }),
    period: collectionTotals(invoices, range),
    outstanding: outstandingTotals(invoices),
    byDoctor: revenueByDoctor(invoices, range),
    byDepartment: revenueByDepartment(invoices, range),
    byCategory: revenueByCategory(invoices, range),
    topServices: topServices(invoices, range),
    trend: dailyTrend(invoices, range),
    discounts: discountReport(invoices, range),
    refunds: refundReport(invoices, range),
    doctorEarnings: doctorEarnings(invoices, incentives, range),
    forecast: forecastMonth(invoices),
    // Insurance is reported from the existing claim entity; linking claims to
    // individual invoices is Track 5.11.
    insurance: {
      claimCount: claims.length,
      requestedPaise: claims.reduce((sum, claim) => sum + Math.round(claim.requestedAmount * 100), 0),
      approvedPaise: claims.reduce((sum, claim) => sum + Math.round(claim.approvedAmount * 100), 0),
      settledPaise: claims.reduce((sum, claim) => sum + Math.round(claim.settledAmount * 100), 0),
      pendingCount: claims.filter((claim) => claim.status !== "Settled" && claim.status !== "Rejected").length
    }
  });
}

const incentiveSchema = z.object({
  doctor: z.string({ error: "A doctor name is required." }).trim().min(1, "A doctor name is required."),
  percent: z.coerce.number().min(0, "Percentage can't be negative.").max(100, "Percentage can't exceed 100.")
});

/** Setting an incentive rate decides what the hospital pays out, so it checks the adjustments resource. */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing-adjustments", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = incentiveSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const result = await setDoctorIncentivePercent(parsed.data.doctor, parsed.data.percent);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.incentive.set",
    entityType: "doctor-incentive",
    entityId: parsed.data.doctor,
    severity: "warning",
    metadata: { doctor: parsed.data.doctor, percent: parsed.data.percent },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, doctorIncentivePercents: result.doctorIncentivePercents });
}
