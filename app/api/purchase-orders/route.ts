import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createPurchaseOrder, deletePurchaseOrder, listPurchaseOrders, updatePurchaseOrderStatus } from "@/lib/purchase-order-store";
import type { PurchaseOrderStatus } from "@/lib/purchase-order-types";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { purchaseOrderCreateSchema, purchaseOrderDeleteSchema, purchaseOrderUpdateSchema } from "@/lib/validation/purchase-orders";

export async function GET(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const orders = await listPurchaseOrders();
  return NextResponse.json({ ok: true, orders });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = purchaseOrderCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const result = await createPurchaseOrder({ ...parsed.data, createdByRole: auth.context.activeRole });
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "purchase-order.created",
    entityType: "purchase_order",
    entityId: result.record.id,
    after: result.record,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, order: result.record });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = purchaseOrderUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const order = await updatePurchaseOrderStatus(parsed.data.id, parsed.data.status as PurchaseOrderStatus);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Purchase order not found." }, { status: 404 });
  }

  // Receiving is the operationally significant transition — it actually
  // restocks inventory — so it gets its own audited action name.
  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: parsed.data.status === "Received" ? "purchase-order.received" : "purchase-order.status.updated",
    entityType: "purchase_order",
    entityId: order.id,
    metadata: { status: order.status, vendor: order.vendor },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, order });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "pharmacy-inventory", "delete");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = purchaseOrderDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Purchase order id is required." }, { status: 400 });

  const result = await deletePurchaseOrder(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "purchase-order.deleted",
    entityType: "purchase_order",
    entityId: parsed.data.id,
    severity: "warning",
    before: result.order,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
