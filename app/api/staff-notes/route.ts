import { NextResponse } from "next/server";
import { getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { canViewStaffNoteDepartment, departmentForRole } from "@/lib/staff-notes-types";
import { createStaffNote, deleteStaffNote, listStaffNotes, updateStaffNoteStatus } from "@/lib/staff-notes-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { staffNoteCreateSchema, staffNoteDeleteSchema, staffNoteStatusUpdateSchema } from "@/lib/validation/staff-notes";

/**
 * Cross-department staff notes are visible to any role that can already view
 * the target department's resource (see staff-notes-types.ts), plus the
 * author's own role so a sent note stays visible in their own history even
 * if they can't otherwise view that department's resource.
 */
async function requireStaff(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") return null;
  return context;
}

export async function GET(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const all = await listStaffNotes();
  const visible = all.filter(
    (note) => note.authorRole === context.activeRole || canViewStaffNoteDepartment(context.activeRole, note.toDepartment)
  );
  return NextResponse.json({ ok: true, notes: visible });
}

export async function POST(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const parsed = staffNoteCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const note = await createStaffNote({
    ...parsed.data,
    fromDepartment: departmentForRole(context.activeRole),
    authorRole: context.activeRole,
    authorName: context.userName
  });

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "staff_note.created",
    entityType: "staff_note",
    entityId: note.id,
    metadata: { toDepartment: note.toDepartment, category: note.category, priority: note.priority },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, note });
}

export async function PATCH(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const parsed = staffNoteStatusUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const existing = (await listStaffNotes()).find((item) => item.id === parsed.data.id);
  if (!existing || !(existing.authorRole === context.activeRole || canViewStaffNoteDepartment(context.activeRole, existing.toDepartment))) {
    // 404, not 403: don't confirm a note's existence to a role that can't view it.
    return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
  }

  const note = await updateStaffNoteStatus(parsed.data.id, parsed.data.status, context.userName);

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "staff_note.status_updated",
    entityType: "staff_note",
    entityId: parsed.data.id,
    metadata: { status: parsed.data.status },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, note });
}

export async function DELETE(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const parsed = staffNoteDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Note id is required." }, { status: 400 });

  const existing = (await listStaffNotes()).find((item) => item.id === parsed.data.id);
  if (!existing || !(existing.authorRole === context.activeRole || canViewStaffNoteDepartment(context.activeRole, existing.toDepartment))) {
    // 404, not 403: don't confirm a note's existence to a role that can't view it.
    return NextResponse.json({ ok: false, error: "Note not found." }, { status: 404 });
  }
  // No dedicated "staff-notes" RBAC resource exists — visibility is derived
  // from the target department's resource instead (see canViewStaffNoteDepartment),
  // so there's nothing to authorize() a delete against. Reserved to
  // admin/super-admin directly, same as automation tasks.
  if (context.activeRole !== "admin" && context.activeRole !== "super-admin") {
    return NextResponse.json({ ok: false, error: "Only an admin can delete staff notes." }, { status: 403 });
  }

  const result = await deleteStaffNote(parsed.data.id);
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "staff_note.deleted",
    entityType: "staff_note",
    entityId: parsed.data.id,
    severity: "warning",
    before: result.note,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
