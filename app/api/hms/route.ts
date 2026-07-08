import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { hmsModules } from "@/lib/hms-modules";
import { createHmsRecord, listHmsRecords, updateHmsRecord } from "@/lib/hms-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { hmsRecordCreateSchema, hmsRecordUpdateSchema } from "@/lib/validation/hms";

export async function GET(request: Request) {
  const auth = await authorize(request, "system-settings", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const moduleId = url.searchParams.get("moduleId") || undefined;

  return NextResponse.json({
    ok: true,
    modules: hmsModules,
    records: (await listHmsRecords(moduleId))
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = hmsRecordCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const record = (await createHmsRecord(parsed.data));

  if (!record) {
    return NextResponse.json({ ok: false, error: "Invalid HMS module." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "hms.record.created",
    entityType: "hms_record",
    entityId: record.id,
    metadata: { moduleId: record.moduleId, status: record.status, priority: record.priority },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, record });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = hmsRecordUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const record = (await updateHmsRecord(parsed.data));

  if (!record) {
    return NextResponse.json({ ok: false, error: "HMS record not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: auth.context.activeRole,
    actorId: auth.context.userId,
    action: "hms.record.updated",
    entityType: "hms_record",
    entityId: record.id,
    metadata: { moduleId: record.moduleId, status: record.status, priority: record.priority },
    device: auditRequestMetadata(request)
  });

  return NextResponse.json({ ok: true, record });
}
