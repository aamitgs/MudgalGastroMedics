import { NextResponse } from "next/server";
import { getAccessUserById } from "@/lib/access/user-store";
import { getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { sendEmail } from "@/lib/email";
import { renderTablePdf } from "@/lib/pdf/render";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { tableExportSchema } from "@/lib/validation/reports";

/**
 * Email a copy of the current table PDF export to the requesting staff
 * member's own account address (Track 3.4). Self-send only, and the
 * recipient is looked up server-side from the authenticated user's own
 * record — it is never taken from the request body — so this can't become a
 * path for sending patient data to an arbitrary external address.
 */
export async function POST(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") {
    return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });
  }

  const user = await getAccessUserById(context.userId);
  if (!user?.email) {
    return NextResponse.json(
      { ok: false, error: "No email address on file for your account. Ask an administrator to add one." },
      { status: 400 }
    );
  }

  const parsed = tableExportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { title, headers, rows } = parsed.data;
  const { buffer, filename } = await renderTablePdf({ title, headers, rows });

  const result = await sendEmail({
    to: user.email,
    subject: `Export: ${title}`,
    text: `Attached is the "${title}" export you requested (${rows.length} row${rows.length === 1 ? "" : "s"}).`,
    attachments: [{ filename, content: buffer, contentType: "application/pdf" }]
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Unable to send email. Please try again." }, { status: 502 });
  }

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "pdf.table.emailed",
    entityType: "table_export",
    entityId: filename,
    severity: "info",
    metadata: { title, rowCount: rows.length, recipient: user.email },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, sentTo: user.email });
}
