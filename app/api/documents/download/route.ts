import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { getDocumentContent } from "@/lib/patient-file-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { documentDownloadQuerySchema } from "@/lib/validation/documents";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = documentDownloadQuerySchema.safeParse({ id: url.searchParams.get("id") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const result = await getDocumentContent(parsed.data.id);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  // "Preview" (?mode=inline) is the same download, just without forcing a
  // Save dialog — the browser natively renders images/PDFs given inline
  // disposition, so no separate viewer component/dependency is needed.
  const inline = url.searchParams.get("mode") === "inline";

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: inline ? "document.previewed" : "document.downloaded",
    entityType: result.metadata.entityType,
    entityId: result.metadata.entityId,
    metadata: { documentId: result.metadata.id, filename: result.metadata.filename },
    device: auditRequestMetadata(request)
  });

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.metadata.mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${result.metadata.filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
