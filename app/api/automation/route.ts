import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { automationTaskPriorities, automationTaskStatuses, automationTaskTypes } from "@/lib/automation-types";
import type { AutomationTaskPriority, AutomationTaskStatus, AutomationTaskType } from "@/lib/automation-types";
import { createAutomationTask, generateAutomationTasks, listAutomationTasks, updateAutomationTask } from "@/lib/automation-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "system-settings", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({ ok: true, tasks: listAutomationTasks() });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "create";

  if (action === "generate") {
    const generated = generateAutomationTasks();
    await recordAuditEvent({
      actorRole: "admin",
      action: "automation.tasks.generated",
      entityType: "automation_task",
      entityId: "generated-batch",
      metadata: { generated: generated.length, ...auditRequestMetadata(request) }
    });
    return NextResponse.json({ ok: true, generated, tasks: listAutomationTasks() });
  }

  const type = typeof body.type === "string" && automationTaskTypes.includes(body.type as AutomationTaskType) ? body.type : "Appointment Follow-up";
  const priority = typeof body.priority === "string" && automationTaskPriorities.includes(body.priority as AutomationTaskPriority) ? body.priority : "Normal";
  const result = createAutomationTask({ ...body, type, priority });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  await recordAuditEvent({
    actorRole: "admin",
    action: "automation.task.created",
    entityType: "automation_task",
    entityId: result.task.id,
    metadata: { type: result.task.type, priority: result.task.priority, status: result.task.status, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, task: result.task });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "system-settings", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" && automationTaskStatuses.includes(body.status as AutomationTaskStatus) ? body.status as AutomationTaskStatus : undefined;
  const priority = typeof body.priority === "string" && automationTaskPriorities.includes(body.priority as AutomationTaskPriority) ? body.priority as AutomationTaskPriority : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "Automation task id is required." }, { status: 400 });

  const task = updateAutomationTask({
    id,
    status,
    priority,
    dueAt: typeof body.dueAt === "string" ? body.dueAt : undefined,
    owner: typeof body.owner === "string" ? body.owner : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined
  });

  if (!task) return NextResponse.json({ ok: false, error: "Automation task not found." }, { status: 404 });
  await recordAuditEvent({
    actorRole: "admin",
    action: "automation.task.updated",
    entityType: "automation_task",
    entityId: task.id,
    metadata: { type: task.type, priority: task.priority, status: task.status, ...auditRequestMetadata(request) }
  });
  return NextResponse.json({ ok: true, task });
}
