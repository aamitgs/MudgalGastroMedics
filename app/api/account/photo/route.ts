import { NextResponse } from "next/server";
import { getSessionAndUser } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { updateAccessUser } from "@/lib/access/user-store";
import { allowedAccountPhotoMimeTypes, maxAccountPhotoSizeBytes } from "@/lib/validation/auth";
import { getDocumentContent, uploadDocument } from "@/lib/patient-file-store";

// Self-service only (no admin-assign path): every check here is "is there a
// valid session", never an authorize() resource/action grant — the same
// shape as /api/auth/password. A staff member can only ever read or replace
// their OWN photo; there is no endpoint for viewing anyone else's.

export async function GET(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }
  const { user } = resolved;

  if (!user.photoDocumentId) {
    return NextResponse.json({ ok: false, error: "No photo set." }, { status: 404 });
  }

  const result = await getDocumentContent(user.photoDocumentId);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Photo not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.metadata.mimeType,
      // Short private cache — this is fetched on effectively every page nav
      // (TopNav's avatar), unlike patient documents which stay no-store.
      "Cache-Control": "private, max-age=300"
    }
  });
}

export async function POST(request: Request) {
  const resolved = await getSessionAndUser(request);
  if (!resolved) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }
  const { session, user } = resolved;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "A photo file is required." }, { status: 400 });
  }
  if (!(allowedAccountPhotoMimeTypes as readonly string[]).includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Only JPEG, PNG, or WEBP photos are accepted." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "File is empty." }, { status: 400 });
  }
  if (file.size > maxAccountPhotoSizeBytes) {
    return NextResponse.json({ ok: false, error: `Photo must be under ${maxAccountPhotoSizeBytes / (1024 * 1024)}MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await uploadDocument({
    entityType: "access-user",
    entityId: user.id,
    filename: file.name || "photo",
    mimeType: file.type,
    buffer,
    uploadedBy: user.id,
    uploadedByRole: session.activeRole
  });

  await updateAccessUser(user.id, { photoDocumentId: metadata.id });

  await recordAuditEvent({
    actorRole: session.activeRole,
    actorId: user.id,
    action: "account.photo.updated",
    entityType: "access_user",
    entityId: user.id,
    metadata: { documentId: metadata.id, filename: metadata.filename, sizeBytes: metadata.sizeBytes },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
