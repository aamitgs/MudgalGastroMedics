import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { queryExternalReferrals, type ExternalReferralSortField, type SortDirection } from "@/lib/external-referral-query";
import { createExternalReferral, listExternalReferrals, updateExternalReferral } from "@/lib/external-referral-store";
import { externalReferralStatuses, externalReferralTypes, type ExternalReferralStatus, type ExternalReferralType } from "@/lib/external-referral-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { externalReferralCreateSchema, externalReferralUpdateSchema } from "@/lib/validation/external-referrals";
import { listOpdVisits } from "@/lib/opd-store";

const sortFields: ExternalReferralSortField[] = ["patientName", "token", "status", "priority", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "lab-orders", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allReferrals = await listExternalReferrals();
  const visits = await listOpdVisits();

  if (pageParam === null) {
    return NextResponse.json({ ok: true, referrals: allReferrals, visits });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const type = params.get("type");

  const result = queryExternalReferrals(allReferrals, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as ExternalReferralSortField) ? (sortBy as ExternalReferralSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && externalReferralStatuses.includes(status as ExternalReferralStatus) ? (status as ExternalReferralStatus) : undefined,
    type: type && externalReferralTypes.includes(type as ExternalReferralType) ? (type as ExternalReferralType) : undefined,
    criticalOnly: params.get("criticalOnly") === "true"
  });

  const stats = {
    total: allReferrals.length,
    awaitingResult: allReferrals.filter((referral) => referral.status === "Sent").length,
    resultReceived: allReferrals.filter((referral) => referral.status === "Result Received").length,
    criticalUnacked: allReferrals.filter((referral) => referral.criticalFlag && !referral.criticalAcknowledgedAt && referral.status !== "Cancelled").length,
    paidAmount: allReferrals.filter((referral) => referral.paymentStatus === "Paid").reduce((sum, referral) => sum + Number(referral.amount || 0), 0)
  };

  return NextResponse.json({ ok: true, ...result, visits, stats });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "lab-orders", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = externalReferralCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const result = await createExternalReferral(parsed.data);
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "external_referral.created",
    entityType: "external_referral",
    entityId: result.referral.id,
    metadata: { type: result.referral.type, testName: result.referral.testName },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, referral: result.referral });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "lab-orders", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = externalReferralUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const acknowledgeCritical = parsed.data.acknowledgeCritical === true;

  const referral = await updateExternalReferral({
    id: parsed.data.id,
    status: parsed.data.status,
    facilityName: parsed.data.facilityName,
    resultSummary: parsed.data.resultSummary,
    paymentStatus: parsed.data.paymentStatus,
    amount: parsed.data.amount,
    notes: parsed.data.notes,
    criticalManual: parsed.data.criticalManual,
    acknowledgeCriticalBy: acknowledgeCritical ? auth.context.userName || auth.context.activeRole : undefined
  });

  if (!referral) {
    return NextResponse.json({ ok: false, error: "Referral not found." }, { status: 404 });
  }

  // Critical-result state changes are clinically significant: audit them explicitly.
  if (acknowledgeCritical || typeof parsed.data.criticalManual === "boolean") {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: acknowledgeCritical ? "external_referral.critical.acknowledged" : parsed.data.criticalManual ? "external_referral.critical.marked" : "external_referral.critical.unmarked",
      entityType: "external_referral",
      entityId: referral.id,
      metadata: { reasons: referral.criticalReasons },
      device: auditRequestMetadata(request)
    });
  }

  return NextResponse.json({ ok: true, referral });
}
