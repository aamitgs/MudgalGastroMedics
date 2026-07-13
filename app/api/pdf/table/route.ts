import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { registerPdfFonts } from "@/lib/pdf/branding";
import { TableDocument } from "@/lib/pdf/table-document";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { tableExportSchema } from "@/lib/validation/reports";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export";
}

/**
 * Generic "PDF of the current table view" (Track 3.4). Not resource-scoped
 * like the other PDF routes: the rows are already-visible data the client
 * fetched via its own authorized GET (same source as the existing
 * client-side CSV export) — this route only reformats it, so it doesn't read
 * any new data. Staff-only auth (matching the notifications route's
 * requireStaff shape) is still required since, unlike CSV/print, this is a
 * real server round trip.
 */
export async function POST(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") {
    return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });
  }

  const parsed = tableExportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }
  const { title, headers, rows } = parsed.data;

  registerPdfFonts();
  const buffer = await renderToBuffer(TableDocument({ title, headers, rows }));
  const filename = `${slugify(title)}.pdf`;

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "pdf.table.exported",
    entityType: "table_export",
    entityId: slugify(title),
    severity: "info",
    metadata: { title, rowCount: rows.length },
    device: auditRequestMetadata(request)
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
