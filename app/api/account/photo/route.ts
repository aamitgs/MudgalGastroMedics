import { NextResponse } from "next/server";
import { getRequestAccessContext, getSessionAndUser } from "@/lib/access/guard";
import type { AccessRole } from "@/lib/access/matrix";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { updateAccessUser } from "@/lib/access/user-store";
import { getStaffById, updateStaffPhoto } from "@/lib/hr-store";
import { allowedAccountPhotoMimeTypes, maxAccountPhotoSizeBytes } from "@/lib/validation/auth";
import { getDocumentContent, uploadDocument } from "@/lib/patient-file-store";

// Self-service only (no admin-assign path): every check here is "is there a
// valid session", never an authorize() resource/action grant — the same
// shape as /api/auth/password. A staff member can only ever read or replace
// their OWN photo; there is no endpoint for viewing anyone else's.
//
// Two identity systems can be logged in here (lib/access/guard.ts): a real
// RBAC AccessUser session, or the legacy admin/doctor passcode session (no
// AccessUser record at all — it maps to lib/hr-store.ts's StaffMember
// instead, or for the doctor passcode, no persisted record whatsoever). The
// legacy-admin case gets photo support here too, keyed on the StaffMember
// record, since "Trouble signing in?" is a real, user-facing login path
// (WorkspaceLauncher), not just an internal fallback — the original
// AccessUser-only version silently 401'd for anyone using it.

type PhotoIdentity = {
  entityType: "access-user" | "staff-member";
  entityId: string;
  activeRole: AccessRole;
  photoDocumentId?: string;
};

async function resolvePhotoIdentity(request: Request): Promise<PhotoIdentity | null> {
  const rbac = await getSessionAndUser(request);
  if (rbac) {
    return { entityType: "access-user", entityId: rbac.user.id, activeRole: rbac.session.activeRole, photoDocumentId: rbac.user.photoDocumentId };
  }

  const legacy = await getRequestAccessContext(request);
  if (legacy.authenticated && legacy.legacy) {
    const staff = await getStaffById(legacy.userId);
    if (staff) {
      return { entityType: "staff-member", entityId: staff.id, activeRole: legacy.activeRole, photoDocumentId: staff.photoDocumentId };
    }
  }

  return null;
}

async function persistPhoto(identity: PhotoIdentity, documentId: string) {
  if (identity.entityType === "access-user") {
    await updateAccessUser(identity.entityId, { photoDocumentId: documentId });
  } else {
    await updateStaffPhoto(identity.entityId, documentId);
  }
}

export async function GET(request: Request) {
  const identity = await resolvePhotoIdentity(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }

  if (!identity.photoDocumentId) {
    return NextResponse.json({ ok: false, error: "No photo set." }, { status: 404 });
  }

  const result = await getDocumentContent(identity.photoDocumentId);
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
  const identity = await resolvePhotoIdentity(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
  }

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
    entityType: identity.entityType,
    entityId: identity.entityId,
    filename: file.name || "photo",
    mimeType: file.type,
    buffer,
    uploadedBy: identity.entityId,
    uploadedByRole: identity.activeRole
  });

  await persistPhoto(identity, metadata.id);

  await recordAuditEvent({
    actorRole: identity.activeRole,
    actorId: identity.entityId,
    action: "account.photo.updated",
    entityType: identity.entityType === "access-user" ? "access_user" : "staff_member",
    entityId: identity.entityId,
    metadata: { documentId: metadata.id, filename: metadata.filename, sizeBytes: metadata.sizeBytes },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
