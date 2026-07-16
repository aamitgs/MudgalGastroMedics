import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { listDocuments, uploadDocument } from "@/lib/patient-file-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { allowedDocumentMimeTypes, documentListQuerySchema, documentUploadFieldsSchema, maxDocumentSizeBytes } from "@/lib/validation/documents";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = documentListQuerySchema.safeParse({
    entityType: url.searchParams.get("entityType") ?? "",
    entityId: url.searchParams.get("entityId") ?? ""
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const documents = await listDocuments(parsed.data.entityType, parsed.data.entityId);
  return NextResponse.json({ ok: true, documents });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "patients", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const parsedFields = documentUploadFieldsSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    groupId: formData.get("groupId") || undefined
  });
  if (!parsedFields.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsedFields.error) }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "A file is required." }, { status: 400 });
  }
  if (!(allowedDocumentMimeTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Only PDF, JPEG, PNG, or WEBP files are accepted." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "File is empty." }, { status: 400 });
  }
  if (file.size > maxDocumentSizeBytes) {
    return NextResponse.json({ ok: false, error: `File must be under ${maxDocumentSizeBytes / (1024 * 1024)}MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await uploadDocument({
    entityType: parsedFields.data.entityType,
    entityId: parsedFields.data.entityId,
    filename: file.name || "document",
    mimeType: file.type,
    buffer,
    uploadedBy: auth.context.userId,
    uploadedByRole: auth.context.activeRole,
    groupId: parsedFields.data.groupId
  });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: parsedFields.data.groupId ? "document.version.uploaded" : "document.uploaded",
    entityType: parsedFields.data.entityType,
    entityId: parsedFields.data.entityId,
    metadata: { documentId: metadata.id, groupId: metadata.groupId, version: metadata.version, filename: metadata.filename, sizeBytes: metadata.sizeBytes },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, document: metadata });
}
