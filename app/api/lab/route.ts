import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { recordPatientRecordAccess } from "@/lib/audit-patient-access";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { queryLabOrders, type LabSortField, type SortDirection } from "@/lib/lab-query";
import { createLabOrder, deleteLabOrder, listLabOrders, listPatientLabOrders, updateLabOrder } from "@/lib/lab-store";
import { labOrderStatuses } from "@/lib/lab-types";
import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";
import { listOpdVisits } from "@/lib/opd-store";
import { labOrderDeleteSchema, labOrderUpdateSchema } from "@/lib/validation/operations";

const sortFields: LabSortField[] = ["patientName", "token", "status", "priority", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "lab-orders", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;

  // Per-patient lookup (e.g. the Doctor Portal's recent-labs strip) — narrows
  // server-side via the store's own phone match instead of shipping every
  // patient's lab history to the browser just to filter one out client-side.
  const phoneParam = params.get("phone");
  if (phoneParam !== null) {
    // Lab results are among the most sensitive things this system holds, and
    // this is a named-patient lookup rather than a worklist, so the read is
    // audited (docs/privacy-review.md §4).
    await recordPatientRecordAccess(request, auth.context, "lab-orders", phoneParam);
    return NextResponse.json({ ok: true, orders: await listPatientLabOrders(phoneParam) });
  }

  const pageParam = params.get("page");
  const allOrders = await listLabOrders();
  const visits = await listOpdVisits();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, orders: allOrders, visits });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const result = queryLabOrders(allOrders, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as LabSortField) ? (sortBy as LabSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && labOrderStatuses.includes(status as LabOrderStatus) ? (status as LabOrderStatus) : undefined,
    criticalOnly: params.get("criticalOnly") === "true"
  });

  const stats = {
    total: allOrders.length,
    pendingSamples: allOrders.filter((order) => order.status === "Ordered").length,
    collectedSamples: allOrders.filter((order) => order.status === "Sample Collected").length,
    processing: allOrders.filter((order) => order.status === "Processing").length,
    resultReady: allOrders.filter((order) => order.status === "Result Ready").length,
    criticalUnacked: allOrders.filter((order) => order.criticalFlag && !order.criticalAcknowledgedAt && order.status !== "Cancelled").length,
    paidAmount: allOrders.filter((order) => order.paymentStatus === "Paid").reduce((sum, order) => sum + Number(order.amount || 0), 0)
  };

  return NextResponse.json({ ok: true, ...result, visits, stats });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "lab-orders", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const result = (await createLabOrder(body));
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: result.order });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "lab-orders", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = labOrderUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { id: "" };
  const id = body.id;
  const status = body.status;
  const paymentStatus = body.paymentStatus && ["Paid", "Unpaid"].includes(body.paymentStatus) ? (body.paymentStatus as LabOrder["paymentStatus"]) : undefined;
  const amount = body.amount === undefined ? undefined : Number(body.amount);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Lab order id is required." }, { status: 400 });
  }

  if (status && !labOrderStatuses.includes(status as LabOrderStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid lab order status." }, { status: 400 });
  }

  const acknowledgeCritical = body.acknowledgeCritical === true;

  const order = (await updateLabOrder({
    id,
    status: status as LabOrderStatus | undefined,
    resultSummary: body.resultSummary,
    reportReference: body.reportReference,
    paymentStatus,
    amount,
    notes: body.notes,
    criticalManual: typeof body.criticalManual === "boolean" ? body.criticalManual : undefined,
    acknowledgeCriticalBy: acknowledgeCritical ? auth.context.userName || auth.context.activeRole : undefined
  }));

  if (!order) {
    return NextResponse.json({ ok: false, error: "Lab order not found." }, { status: 404 });
  }

  // Critical-result state changes are clinically significant: audit them explicitly.
  if (acknowledgeCritical || typeof body.criticalManual === "boolean") {
    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: acknowledgeCritical ? "lab.critical.acknowledged" : body.criticalManual ? "lab.critical.marked" : "lab.critical.unmarked",
      entityType: "lab-order",
      entityId: order.id,
      metadata: { reasons: order.criticalReasons, source: order.criticalSource },
      device: auditRequestMetadata(request)
    });
  }

  return NextResponse.json({ ok: true, order });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "lab-orders", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = labOrderDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Lab order id is required." }, { status: 400 });

  const result = await deleteLabOrder(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "lab.order.deleted",
    entityType: "lab-order",
    entityId: parsed.data.id,
    severity: "warning",
    before: result.order,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
