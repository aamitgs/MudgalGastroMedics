import { NextResponse } from "next/server";
import { getRequestAccessContext } from "@/lib/access/guard";
import { auditRequestMetadata, recordAuditEvent } from "@/lib/audit-store";
import { automationTaskPriorities, automationTaskStatuses, automationTaskTypes, canEditAutomationTask, canViewAutomationTask } from "@/lib/automation-types";
import type { AutomationTaskPriority, AutomationTaskStatus, AutomationTaskType } from "@/lib/automation-types";
import { createAutomationTask, generateAutomationTasks, listAutomationTasks, updateAutomationTask } from "@/lib/automation-store";
import { queryAutomationTasks, type AutomationTaskSortField, type SortDirection } from "@/lib/automation-task-query";
import { listStaff } from "@/lib/hr-store";
import { automationActionSchema, automationUpdateSchema } from "@/lib/validation/operations";

const sortFields: AutomationTaskSortField[] = ["title", "type", "priority", "status", "dueAt", "createdAt"];

/**
 * The task queue spans many domains (reception, billing, lab, IPD...), so
 * — like the notification inbox (Track 2.4) — it's open to every
 * authenticated staff role, with each task's TYPE gating its own
 * visibility via canViewAutomationTask (Track 4.7). Previously this
 * required system-settings:view (admin-only), so tasks nominally owned by
 * e.g. Reception were invisible to Reception.
 */
async function requireStaff(request: Request) {
  const context = await getRequestAccessContext(request);
  if (!context.authenticated || context.activeRole === "patient") return null;
  return context;
}

export async function GET(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allTasks = (await listAutomationTasks()).filter((task) => canViewAutomationTask(context.activeRole, task.type));
  const staff = await listStaff();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, tasks: allTasks, staff });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");

  const result = queryAutomationTasks(allTasks, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as AutomationTaskSortField) ? (sortBy as AutomationTaskSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && automationTaskStatuses.includes(status as AutomationTaskStatus) ? (status as AutomationTaskStatus) : undefined
  });

  const stats = {
    open: allTasks.filter((task) => task.status === "Open").length,
    queued: allTasks.filter((task) => task.status === "Queued").length,
    escalated: allTasks.filter((task) => task.status === "Escalated").length,
    done: allTasks.filter((task) => task.status === "Done").length
  };

  return NextResponse.json({ ok: true, ...result, staff, stats });
}

export async function POST(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const parsed = automationActionSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { action: "create", type: undefined, priority: undefined };
  const action = body.action;

  if (action === "generate") {
    if (!canEditAutomationTask(context.activeRole, "Appointment Follow-up") && context.activeRole !== "super-admin") {
      return NextResponse.json({ ok: false, error: "Your role does not permit this action." }, { status: 403 });
    }
    const generated = (await generateAutomationTasks());
    await recordAuditEvent({
      actorRole: context.activeRole,
      actorId: context.userId,
      action: "automation.tasks.generated",
      entityType: "automation_task",
      entityId: "generated-batch",
      metadata: { generated: generated.length },
      device: auditRequestMetadata(request)
    });
    return NextResponse.json({ ok: true, generated, tasks: (await listAutomationTasks()) });
  }

  const type = typeof body.type === "string" && automationTaskTypes.includes(body.type as AutomationTaskType) ? body.type : "Appointment Follow-up";
  if (!canEditAutomationTask(context.activeRole, type as AutomationTaskType)) {
    return NextResponse.json({ ok: false, error: "Your role does not permit this action." }, { status: 403 });
  }
  const priority = typeof body.priority === "string" && automationTaskPriorities.includes(body.priority as AutomationTaskPriority) ? body.priority : "Normal";
  const result = (await createAutomationTask({ ...body, type, priority }));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "automation.task.created",
    entityType: "automation_task",
    entityId: result.task.id,
    metadata: { type: result.task.type, priority: result.task.priority, status: result.task.status },
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, task: result.task });
}

export async function PATCH(request: Request) {
  const context = await requireStaff(request);
  if (!context) return NextResponse.json({ ok: false, error: "Staff login required." }, { status: 401 });

  const parsed = automationUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { id: "", status: undefined, priority: undefined, dueAt: undefined, owner: undefined, ownerStaffId: undefined, notes: undefined };
  const { id } = body;
  const status = body.status && automationTaskStatuses.includes(body.status as AutomationTaskStatus) ? (body.status as AutomationTaskStatus) : undefined;
  const priority = body.priority && automationTaskPriorities.includes(body.priority as AutomationTaskPriority) ? (body.priority as AutomationTaskPriority) : undefined;
  if (!id) return NextResponse.json({ ok: false, error: "Automation task id is required." }, { status: 400 });

  const existing = (await listAutomationTasks()).find((item) => item.id === id);
  if (!existing || !canViewAutomationTask(context.activeRole, existing.type)) {
    return NextResponse.json({ ok: false, error: "Automation task not found." }, { status: 404 });
  }
  if (!canEditAutomationTask(context.activeRole, existing.type)) {
    return NextResponse.json({ ok: false, error: "Your role does not permit this action." }, { status: 403 });
  }

  const result = (await updateAutomationTask({
    id,
    status,
    priority,
    dueAt: body.dueAt,
    owner: body.owner,
    ownerStaffId: body.ownerStaffId,
    notes: body.notes
  }));

  if (!result) return NextResponse.json({ ok: false, error: "Automation task not found." }, { status: 404 });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  await recordAuditEvent({
    actorRole: context.activeRole,
    actorId: context.userId,
    action: "automation.task.updated",
    entityType: "automation_task",
    entityId: result.id,
    metadata: { type: result.type, priority: result.priority, status: result.status, ownerStaffId: result.ownerStaffId },
    device: auditRequestMetadata(request)
  });
  return NextResponse.json({ ok: true, task: result });
}
