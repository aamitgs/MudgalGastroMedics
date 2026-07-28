import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { formatPaise } from "@/lib/billing-calc";
import { getInvoiceById } from "@/lib/billing-store";
import type { Invoice } from "@/lib/billing-types";
import { createCommunicationLog } from "@/lib/communication-store";
import { isEmailDeliveryConfigured, sendEmail } from "@/lib/email";
import { renderItemisedInvoicePdf } from "@/lib/pdf/render";
import { recordIssue } from "@/lib/reprint-store";
import { firstZodIssueMessage } from "@/lib/validation/http";

const sendSchema = z.object({
  invoiceId: z.string({ error: "Invoice id is required." }).trim().min(1, "Invoice id is required."),
  channel: z.enum(["Email", "WhatsApp"], { error: "Choose email or WhatsApp." }),
  /** Defaults to the address/number on the invoice. */
  to: z.string().trim().optional()
});

/** The message body both channels share, so a patient gets the same figures either way. */
function messageFor(invoice: Invoice) {
  const settled = invoice.balancePaise <= 0;
  const lines = [
    `Dear ${invoice.patientName},`,
    "",
    settled
      ? `Thank you. Your payment of ${formatPaise(invoice.paidPaise)} against ${invoice.invoiceNo} has been received in full.`
      : `Your bill ${invoice.invoiceNo} totals ${formatPaise(invoice.totalPaise)}, of which ${formatPaise(invoice.balancePaise)} is outstanding.`,
    "",
    "Mudgal Gastromedics"
  ];
  return lines.join("\n");
}

/**
 * Sends an invoice or receipt to the patient (Track 5.8, §14).
 *
 * **Email** delivers the PDF as a real attachment over SMTP (`lib/email.ts`),
 * which degrades to a logged warning when SMTP is unconfigured rather than
 * pretending to have sent.
 *
 * **WhatsApp** returns a prefilled `wa.me` link for the staff member to send
 * from the hospital's own account. There is no WhatsApp gateway in this
 * project, and stubbing one would mean a button that silently sends nothing —
 * the link is what a hospital this size actually uses, and it is honest about
 * needing a human to press send.
 *
 * Either way the send is written to the communication log, so patient contact
 * stays in one place regardless of channel.
 */
export async function POST(request: Request) {
  const auth = await authorize(request, "billing", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = sendSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });

  const invoice = await getInvoiceById(parsed.data.invoiceId);
  if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });
  if (invoice.status === "Draft") {
    return NextResponse.json({ ok: false, error: "Issue this invoice before sending it to the patient." }, { status: 400 });
  }

  const actor = auth.context.userName || auth.context.activeRole;
  const message = messageFor(invoice);

  if (parsed.data.channel === "WhatsApp") {
    const number = (parsed.data.to || invoice.phone).replace(/\D/g, "");
    const waNumber = number.length === 10 ? `91${number}` : number;
    const link = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    await createCommunicationLog({
      channel: "WhatsApp",
      patientName: invoice.patientName,
      phone: invoice.phone,
      subject: `${invoice.invoiceNo} sent to patient`,
      message,
      handledBy: actor
    });

    await recordAuditEvent({
      actorRole: auth.context.activeRole,
      actorId: auth.context.userId,
      action: "billing.invoice.sent",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: { channel: "WhatsApp", invoiceNo: invoice.invoiceNo, to: waNumber },
      device: auditRequestMetadata(request)
    });

    return NextResponse.json({
      ok: true,
      channel: "WhatsApp",
      link,
      // Said plainly so the caller doesn't report "sent" for something a human still has to send.
      note: "Opens WhatsApp with the message ready — you still press send."
    });
  }

  const to = (parsed.data.to || "").trim();
  if (!to) return NextResponse.json({ ok: false, error: "No email address on record for this patient. Enter one to send." }, { status: 400 });

  // Emailing a copy is issuing a copy, so it counts toward duplicate tracking
  // exactly as printing does.
  const issue = await recordIssue({ kind: "invoice", entityId: invoice.id, by: actor, role: auth.context.activeRole, reason: "Emailed to patient" });
  const pdf = await renderItemisedInvoicePdf(invoice, issue.copyNumber);
  if (!pdf.ok) return NextResponse.json({ ok: false, error: pdf.error }, { status: pdf.status });

  const settled = invoice.balancePaise <= 0;
  const delivery = await sendEmail({
    to,
    subject: `${settled ? "Receipt" : "Invoice"} ${invoice.invoiceNo} — Mudgal Gastromedics`,
    text: message,
    attachments: [{ filename: pdf.filename, content: pdf.buffer, contentType: "application/pdf" }]
  });

  await createCommunicationLog({
    channel: "Email",
    patientName: invoice.patientName,
    phone: invoice.phone,
    subject: `${invoice.invoiceNo} emailed to ${to}`,
    message,
    handledBy: actor
  });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "billing.invoice.sent",
    entityType: "invoice",
    entityId: invoice.id,
    severity: delivery.ok ? "info" : "warning",
    metadata: { channel: "Email", invoiceNo: invoice.invoiceNo, to, delivered: delivery.channel === "email", copyNumber: issue.copyNumber },
    device: auditRequestMetadata(request)
  });

  if (!delivery.ok) return NextResponse.json({ ok: false, error: delivery.error || "Email send failed." }, { status: 502 });

  return NextResponse.json({
    ok: true,
    channel: "Email",
    // `log` means SMTP isn't configured; the caller must not claim it was delivered.
    delivered: delivery.channel === "email",
    note: isEmailDeliveryConfigured() ? undefined : "SMTP is not configured, so the email was recorded but not delivered."
  });
}
