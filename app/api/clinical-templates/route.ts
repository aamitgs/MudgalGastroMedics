import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { createClinicalTemplate, deleteClinicalTemplate, listClinicalTemplates } from "@/lib/clinical-template-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { clinicalTemplateCreateSchema, clinicalTemplateDeleteSchema } from "@/lib/validation/clinical-templates";

// Gated by "prescriptions" — the same resource every field a template can
// fill (diagnosis/history/examination/advice/clinical note) already requires
// to write (app/api/opd/route.ts's touchesClinical branch), so whoever can
// document a visit can also curate the shared template library.

export async function GET(request: Request) {
  const auth = await authorize(request, "prescriptions", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, templates: await listClinicalTemplates() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = clinicalTemplateCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const template = await createClinicalTemplate({
    ...parsed.data,
    createdBy: auth.context.userName,
    createdByRole: auth.context.activeRole
  });

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical_template.created",
    entityType: "clinical_template",
    entityId: template.id,
    metadata: { name: template.name, tag: template.tag },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, template });
}

export async function DELETE(request: Request) {
  const auth = await authorize(request, "prescriptions", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = clinicalTemplateDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const removed = await deleteClinicalTemplate(parsed.data.id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "clinical_template.deleted",
    entityType: "clinical_template",
    entityId: parsed.data.id,
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true });
}
