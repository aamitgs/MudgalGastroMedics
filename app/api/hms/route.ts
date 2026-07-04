import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { hmsModules } from "@/lib/hms-modules";
import { createHmsRecord, listHmsRecords, updateHmsRecord } from "@/lib/hms-store";
import type { HmsModuleRecord, HmsRecordStatus } from "@/lib/hms-types";

const recordStatuses: HmsRecordStatus[] = ["Active", "Pending", "Completed", "On Hold"];
const priorities: HmsModuleRecord["priority"][] = ["Low", "Normal", "High", "Urgent"];

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

  const body = await request.json().catch(() => ({}));
  const moduleId = typeof body.moduleId === "string" ? body.moduleId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const status = typeof body.status === "string" && recordStatuses.includes(body.status as HmsRecordStatus) ? body.status as HmsRecordStatus : "Pending";
  const priority = typeof body.priority === "string" && priorities.includes(body.priority as HmsModuleRecord["priority"]) ? body.priority as HmsModuleRecord["priority"] : "Normal";

  if (!moduleId || !title) {
    return NextResponse.json({ ok: false, error: "Module and title are required." }, { status: 400 });
  }

  const record = (await createHmsRecord({
    moduleId,
    title,
    status,
    priority,
    owner: typeof body.owner === "string" ? body.owner : "",
    notes: typeof body.notes === "string" ? body.notes : ""
  }));

  if (!record) {
    return NextResponse.json({ ok: false, error: "Invalid HMS module." }, { status: 400 });
  }

  await recordAuditEvent({
    actorRole: "admin",
    action: "hms.record.created",
    entityType: "hms_record",
    entityId: record.id,
    metadata: { moduleId: record.moduleId, status: record.status, priority: record.priority, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, record });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" && recordStatuses.includes(body.status as HmsRecordStatus) ? body.status as HmsRecordStatus : undefined;
  const priority = typeof body.priority === "string" && priorities.includes(body.priority as HmsModuleRecord["priority"]) ? body.priority as HmsModuleRecord["priority"] : undefined;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Record ID is required." }, { status: 400 });
  }

  const record = (await updateHmsRecord({
    id,
    status,
    priority,
    owner: typeof body.owner === "string" ? body.owner : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined
  }));

  if (!record) {
    return NextResponse.json({ ok: false, error: "HMS record not found." }, { status: 404 });
  }

  await recordAuditEvent({
    actorRole: "admin",
    action: "hms.record.updated",
    entityType: "hms_record",
    entityId: record.id,
    metadata: { moduleId: record.moduleId, status: record.status, priority: record.priority, ...auditRequestMetadata(request) }
  });

  return NextResponse.json({ ok: true, record });
}
