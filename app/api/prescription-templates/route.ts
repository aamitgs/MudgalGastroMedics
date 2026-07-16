import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import {
  createPrescriptionTemplate,
  deletePrescriptionTemplate,
  listPrescriptionTemplates,
  updatePrescriptionTemplate
} from "@/lib/prescription-template-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import {
  prescriptionTemplateCreateSchema,
  prescriptionTemplateDeleteSchema,
  prescriptionTemplateUpdateSchema
} from "@/lib/validation/prescription-templates";

// Gated by the same "prescriptions" resource the diagnosis/prescription/advice
// fields already use (lib/opd-store.ts) — whichever roles can write a
// prescription can also curate the shared template library; there is no
// per-doctor private library since this is a single-doctor practice today.

export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, templates: await listPrescriptionTemplates() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = prescriptionTemplateCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const template = await createPrescriptionTemplate({
    ...parsed.data,
    createdBy: auth.context.userName,
    createdByRole: auth.context.activeRole
  });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "prescription_template.created",
    entityType: "prescription_template",
    entityId: template.id,
    metadata: { name: template.name, tag: template.tag },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, template });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = prescriptionTemplateUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const template = await updatePrescriptionTemplate(id, updates);
  if (!template) {
    return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "prescription_template.updated",
    entityType: "prescription_template",
    entityId: template.id,
    metadata: updates,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, template });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = prescriptionTemplateDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const removed = await deletePrescriptionTemplate(parsed.data.id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "prescription_template.deleted",
    entityType: "prescription_template",
    entityId: parsed.data.id,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
