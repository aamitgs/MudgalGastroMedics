import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { listInvoicesForVisit } from "@/lib/billing-store";
import { renderInvoicePdf, renderInvoicePdfById } from "@/lib/pdf/render";
import { recordIssue } from "@/lib/reprint-store";

/**
 * Invoice / receipt PDF.
 *
 * Accepts `invoiceId` (Track 5.8) and still accepts the original `visitId`, so
 * every existing caller keeps working; the visit path now renders the real
 * itemised invoice when the visit has one.
 *
 * Every issue is counted (Track 5.8, §30): copy 1 is the original, anything
 * above it is stamped DUPLICATE on the document itself, because the mark has
 * to be on the paper that leaves the building.
 */
export async function GET(request: Request) {
  const auth = await authorize(request, "billing", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const invoiceId = params.get("invoiceId")?.trim();
  const visitId = params.get("visitId")?.trim();
  const reason = params.get("reason")?.trim();

  if (!invoiceId && !visitId) {
    return NextResponse.json({ ok: false, error: "invoiceId or visitId is required." }, { status: 400 });
  }

  // Count against the invoice wherever one exists, so copies stay counted
  // together no matter which parameter the caller used to ask for them.
  let reprintEntityId = invoiceId ?? "";
  if (!reprintEntityId && visitId) {
    const invoices = await listInvoicesForVisit(visitId);
    reprintEntityId = (invoices.find((invoice) => invoice.status !== "Cancelled") ?? invoices[0])?.id ?? `visit:${visitId}`;
  }

  const issue = await recordIssue({
    kind: "invoice",
    entityId: reprintEntityId,
    by: auth.context.userName || auth.context.activeRole,
    role: auth.context.activeRole,
    reason
  });

  const result = invoiceId
    ? await renderInvoicePdfById(invoiceId, issue.copyNumber)
    : await renderInvoicePdf(visitId as string, issue.copyNumber);

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: issue.isDuplicate ? "pdf.invoice.duplicate_issued" : "pdf.invoice.generated",
    entityType: invoiceId ? "invoice" : "opd_visit",
    entityId: invoiceId ?? (visitId as string),
    severity: issue.isDuplicate ? "warning" : result.ok ? "info" : "warning",
    metadata: { ok: result.ok, copyNumber: issue.copyNumber, reason },
    device: auditRequestMetadata(request)
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.filename}"`,
      "X-Copy-Number": String(issue.copyNumber),
      "Cache-Control": "no-store"
    }
  });
}
