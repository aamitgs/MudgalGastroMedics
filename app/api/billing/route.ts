import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { approvalStageRoles } from "@/lib/access/matrix";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { computeAuditChanges } from "@/lib/audit-diff";
import { rupeesToPaise } from "@/lib/billing-calc";
import {
  addInvoiceLineItems,
  cancelInvoice,
  createInvoice,
  getInvoiceById,
  issueInvoice,
  listInvoices,
  listInvoicesForVisit,
  listPatientInvoices,
  recordInvoicePayment,
  removeInvoiceLineItem,
  setInvoiceDiscount,
  syncAdmissionCharges,
  syncInvoiceCharges
} from "@/lib/billing-store";
import type { Invoice, InvoiceLineDraft, InvoiceStatus } from "@/lib/billing-types";
import { invoiceStatuses } from "@/lib/billing-types";
import { invoiceStats, queryInvoices, type InvoiceSortField, type SortDirection } from "@/lib/invoice-query";
import { resolveServicePrice } from "@/lib/pricing-calc";
import { getServicePriceByCode } from "@/lib/pricing-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { invoiceCreateSchema, invoiceUpdateSchema, type InvoiceLineItemInput } from "@/lib/validation/billing";

const invoiceSortFields: InvoiceSortField[] = ["invoiceNo", "patientName", "status", "totalPaise", "balancePaise", "createdAt"];

/**
 * Turns wire charges into store charges. Rupees cross the wire (what staff
 * type); paise is the storage unit.
 *
 * A `priceCode` charge is priced from the master list (Track 5.1) — that is
 * the path that keeps the same service costing the same thing at every desk.
 * A fully spelled-out charge stays supported for genuine one-offs a price
 * list will never carry.
 *
 * `doctorName` only enables doctor-specific rates when it is already known;
 * an OPD visit has no doctor attributed until one writes a clinical field, so
 * a bill raised at registration resolves at the standard/tier rate.
 */
async function resolveLineInputs(
  lines: InvoiceLineItemInput[],
  doctorName?: string
): Promise<{ lines: InvoiceLineDraft[] } | { error: string }> {
  const resolved: InvoiceLineDraft[] = [];

  for (const line of lines) {
    if (line.priceCode) {
      const service = await getServicePriceByCode(line.priceCode);
      if (!service) return { error: `No service found for price code ${line.priceCode}.` };
      if (!service.active) return { error: `${service.name} (${service.code}) is no longer offered and can't be billed.` };

      const price = resolveServicePrice(service, { tier: line.tier, doctorName });
      resolved.push({
        source: line.source,
        sourceRef: line.sourceRef,
        description: line.description || service.name,
        category: line.category || service.category,
        quantity: line.quantity,
        unitPricePaise: price.pricePaise,
        discountPaise: rupeesToPaise(line.discount ?? 0),
        // resolveServicePrice reports tax for a single unit; the line stores the whole line's tax.
        taxPaise: price.taxPaise * line.quantity
      });
      continue;
    }

    if (!line.description || !line.category || line.unitPrice === undefined) {
      return { error: "A charge needs either a price code, or a description, category and price." };
    }

    resolved.push({
      source: line.source,
      sourceRef: line.sourceRef,
      description: line.description,
      category: line.category,
      quantity: line.quantity,
      unitPricePaise: rupeesToPaise(line.unitPrice),
      discountPaise: rupeesToPaise(line.discount ?? 0),
      taxPaise: rupeesToPaise(line.tax ?? 0)
    });
  }

  return { lines: resolved };
}

export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;

  const id = params.get("id");
  if (id !== null) {
    const invoice = await getInvoiceById(id);
    if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });
    return NextResponse.json({ ok: true, invoice });
  }

  // Per-patient and per-visit lookups narrow server-side so the billing
  // workspace never ships the whole hospital's ledger to one patient's screen.
  const phone = params.get("phone");
  if (phone !== null) return NextResponse.json({ ok: true, invoices: await listPatientInvoices(phone) });

  const visitId = params.get("visitId");
  if (visitId !== null) return NextResponse.json({ ok: true, invoices: await listInvoicesForVisit(visitId) });

  const allInvoices = await listInvoices();

  // Backward compatible: callers that pass no pagination params keep getting
  // the full flat list they always got (same contract as the lab route).
  const pageParam = params.get("page");
  if (pageParam === null) return NextResponse.json({ ok: true, invoices: allInvoices });

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const result = queryInvoices(allInvoices, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && invoiceSortFields.includes(sortBy as InvoiceSortField) ? (sortBy as InvoiceSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && invoiceStatuses.includes(status as InvoiceStatus) ? (status as InvoiceStatus) : undefined,
    outstandingOnly: params.get("outstandingOnly") === "true"
  });

  return NextResponse.json({ ok: true, ...result, stats: invoiceStats(allInvoices) });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = invoiceCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const actingStaffName = auth.context.userName || auth.context.activeRole;
  const lines = await resolveLineInputs(parsed.data.lineItems ?? [], parsed.data.doctorName);
  if ("error" in lines) return NextResponse.json({ ok: false, error: lines.error }, { status: 400 });

  const result = await createInvoice({ ...parsed.data, lineItems: lines.lines, actingStaffName });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.invoice.created",
    entityType: "invoice",
    entityId: result.invoice.id,
    after: result.invoice,
    metadata: { invoiceNo: result.invoice.invoiceNo, visitId: result.invoice.visitId },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, invoice: result.invoice });
}

type InvoiceMutation = { invoice: Invoice; before: Invoice } | { error: string };

export async function PATCH(request: Request) {
  const parsed = invoiceUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  const body = parsed.data;

  // Writing money off is a different power from raising and collecting a bill,
  // so discounts and cancellations check the separate billing-adjustments
  // resource that reception is deliberately not granted.
  const adjusting = body.action === "set-discount" || body.action === "cancel";
  const auth = adjusting ? await authorize(request, "billing-adjustments", "edit") : await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  // Track 5.6: acting on a discount or cancellation directly is reserved for
  // the roles that hold final sign-off anyway — making an Admin raise a
  // request only to approve it themselves would be theatre. Everyone else
  // routes through the approval chain, which is the governance §10/§22/§23
  // asks for and the gap this permission alone previously left open.
  if (adjusting && !approvalStageRoles.Admin.includes(auth.context.activeRole)) {
    return NextResponse.json(
      {
        ok: false,
        error: `A ${body.action === "cancel" ? "cancellation" : "discount"} needs approval. Raise a request and it will go to Accounts for sign-off.`
      },
      { status: 403 }
    );
  }

  const actingStaffName = auth.context.userName || auth.context.activeRole;
  let result: InvoiceMutation;
  let action: string;

  switch (body.action) {
    case "add-items": {
      // Doctor-specific rates resolve against whoever this invoice is already
      // attributed to, not whoever happens to be adding the charge.
      const target = await getInvoiceById(body.id);
      if (!target) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });

      const lines = await resolveLineInputs(body.lineItems, target.doctorName);
      if ("error" in lines) return NextResponse.json({ ok: false, error: lines.error }, { status: 400 });

      result = await addInvoiceLineItems(body.id, lines.lines, actingStaffName);
      action = "billing.invoice.items_added";
      break;
    }
    case "remove-item":
      result = await removeInvoiceLineItem(body.id, body.lineItemId);
      action = "billing.invoice.item_removed";
      break;
    case "issue":
      result = await issueInvoice(body.id, actingStaffName);
      action = "billing.invoice.issued";
      break;
    case "sync-ipd-charges": {
      const accrued = await syncAdmissionCharges(body.id, actingStaffName, { tier: body.tier });
      if ("error" in accrued) {
        return NextResponse.json({ ok: false, error: accrued.error }, { status: accrued.error === "Invoice not found." ? 404 : 400 });
      }

      await recordAuditEvent({
        actorRole: auth.context.activeRole,
        actorId: auth.context.userId,
        action: "billing.invoice.ipd_accrued",
        entityType: "invoice",
        entityId: accrued.invoice.id,
        changes: computeAuditChanges(accrued.before, accrued.invoice),
        metadata: {
          invoiceNo: accrued.invoice.invoiceNo,
          added: accrued.added,
          daysCharged: accrued.daysCharged,
          alreadyBilled: accrued.alreadyBilled,
          skipped: accrued.skipped
        },
        device: auditRequestMetadata(request)
      });

      return NextResponse.json({
        ok: true,
        invoice: accrued.invoice,
        added: accrued.added,
        daysCharged: accrued.daysCharged,
        alreadyBilled: accrued.alreadyBilled,
        skipped: accrued.skipped
      });
    }
    case "sync-charges": {
      const synced = await syncInvoiceCharges(body.id, actingStaffName, { tier: body.tier });
      if ("error" in synced) {
        return NextResponse.json({ ok: false, error: synced.error }, { status: synced.error === "Invoice not found." ? 404 : 400 });
      }

      await recordAuditEvent({
        actorRole: auth.context.activeRole,
        actorId: auth.context.userId,
        action: "billing.invoice.charges_synced",
        entityType: "invoice",
        entityId: synced.invoice.id,
        changes: computeAuditChanges(synced.before, synced.invoice),
        metadata: {
          invoiceNo: synced.invoice.invoiceNo,
          added: synced.added,
          alreadyBilled: synced.alreadyBilled,
          // What was deliberately not billed is part of the record: an
          // unexplained missing charge is revenue leakage nobody notices.
          skipped: synced.skipped
        },
        device: auditRequestMetadata(request)
      });

      return NextResponse.json({ ok: true, invoice: synced.invoice, added: synced.added, alreadyBilled: synced.alreadyBilled, skipped: synced.skipped });
    }
    case "record-payment":
      result = await recordInvoicePayment(body.id, {
        method: body.method,
        amountPaise: rupeesToPaise(body.amount),
        reference: body.reference,
        note: body.note,
        actingStaffName
      });
      action = "billing.payment.recorded";
      break;
    case "set-discount":
      result = await setInvoiceDiscount(body.id, rupeesToPaise(body.discount), body.reason ?? "");
      action = "billing.invoice.discounted";
      break;
    case "cancel":
      result = await cancelInvoice(body.id, body.reason, actingStaffName);
      action = "billing.invoice.cancelled";
      break;
  }

  if ("error" in result) {
    const status = result.error === "Invoice not found." ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action,
    entityType: "invoice",
    entityId: result.invoice.id,
    severity: adjusting ? "warning" : "info",
    changes: computeAuditChanges(result.before, result.invoice),
    metadata: {
      invoiceNo: result.invoice.invoiceNo,
      reason: body.action === "cancel" ? body.reason : body.action === "set-discount" ? body.reason : undefined
    },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, invoice: result.invoice });
}
