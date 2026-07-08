"use client";

import { Bot, Download, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { AutomationTask, AutomationTaskPriority, AutomationTaskStatus } from "@/lib/automation-types";
import { automationTaskPriorities, automationTaskStatuses, automationTaskTypes } from "@/lib/automation-types";
import type { AutomationTaskSortField } from "@/lib/automation-task-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const automationExportHeaders = ["Title", "Type", "Priority", "Status", "Patient", "Due At", "Created"];

function automationExportRow(task: AutomationTask) {
  return [task.title, task.type, task.priority, task.status, task.patientName ?? "", task.dueAt, task.createdAt];
}

type AutomationResponse = {
  ok: boolean;
  tasks?: AutomationTask[];
  task?: AutomationTask;
  generated?: AutomationTask[];
  pageCount?: number;
  stats?: { open: number; queued: number; escalated: number; done: number };
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

function priorityClass(priority: AutomationTaskPriority) {
  if (priority === "Urgent") return "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300";
  if (priority === "High") return "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  if (priority === "Low") return "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300";
  return "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-brand";
}

export function AdminAutomation() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [stats, setStats] = useState({ open: 0, queued: 0, escalated: 0, done: 0 });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AutomationTaskStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "dueAt", desc: false }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortField = (sorting[0]?.id as AutomationTaskSortField | undefined) ?? "dueAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadAutomation() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/automation?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as AutomationResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load automation tasks.");
      setLoading(false);
      return;
    }
    setTasks(data.tasks ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAutomation(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: AutomationTaskStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  async function generateTasks() {
    const response = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" })
    });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to generate automation tasks.");
      return;
    }
    notify.success(data.generated?.length ? `Generated ${data.generated.length} task(s)` : "No new tasks to generate");
    void loadAutomation();
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok || !data.task) {
      notify.error(data.error || "Unable to create automation task.");
      return;
    }
    form.reset();
    void loadAutomation();
  }

  async function updateTask(id: string, updates: Partial<Pick<AutomationTask, "status" | "priority" | "dueAt" | "owner" | "notes">>) {
    const response = await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok || !data.task) {
      notify.error(data.error || "Unable to update automation task.");
      return;
    }
    const updated = data.task as AutomationTask;
    setTasks((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  const columns = useMemo<ColumnDef<AutomationTask, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Task",
        size: 220,
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-ink">{row.original.title}</p>
            <p className="line-clamp-1 text-xs text-muted" title={row.original.description}>
              {row.original.type}
              {row.original.description ? ` — ${row.original.description}` : ""}
            </p>
          </div>
        )
      },
      {
        id: "patient",
        header: "Patient",
        size: 150,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.patientName ? (
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone ?? "", row.original.patientName ?? "")}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.patientName}
            </button>
          ) : (
            <span className="text-muted">—</span>
          )
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 130,
        cell: ({ row }) => (
          <select
            aria-label="Task priority"
            value={row.original.priority}
            onChange={(event) => void updateTask(row.original.id, { priority: event.target.value as AutomationTaskPriority })}
            className={`rounded border px-2 py-1 text-xs font-bold ${priorityClass(row.original.priority)}`}
          >
            {automationTaskPriorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <select
            aria-label="Task status"
            value={row.original.status}
            onChange={(event) => void updateTask(row.original.id, { status: event.target.value as AutomationTaskStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {automationTaskStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        accessorKey: "dueAt",
        header: "Due",
        size: 140,
        cell: ({ row }) => <input type="date" aria-label="Due date" value={row.original.dueAt} onChange={(event) => void updateTask(row.original.id, { dueAt: event.target.value })} className={`${fieldClass} min-h-8 text-xs`} />
      },
      {
        id: "owner",
        header: "Owner",
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            defaultValue={row.original.owner}
            onBlur={(event) => void updateTask(row.original.id, { owner: event.target.value })}
            className={`${fieldClass} min-h-8 text-xs`}
            placeholder="Owner"
          />
        )
      },
      {
        id: "actions",
        header: "",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.actionUrl ? (
            <a href={row.original.actionUrl} className="inline-flex min-h-8 items-center justify-center rounded border border-cyan-200 bg-cyan-50 px-2 text-xs font-bold text-brand dark:border-cyan-900 dark:bg-cyan-950">
              Open
            </a>
          ) : null
      }
    ],
    [openDrawer]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Automation</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Task and reminder queue</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Generate operational tasks from appointments, OPD follow-ups, procedures, payments, lab reports, stock alerts and AI reviews.</p>
        </div>
        <ActionButton variant="primary" onClick={() => void generateTasks()}>
          <WandSparkles size={17} /> Generate Tasks
        </ActionButton>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {[
          { label: "Open", value: stats.open },
          { label: "Queued", value: stats.queued },
          { label: "Escalated", value: stats.escalated },
          { label: "Done", value: stats.done }
        ].map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.35fr_1.65fr]">
        <form onSubmit={createTask} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <Bot size={19} /> Add manual task
          </p>
          <div className="grid gap-3">
            <input name="title" className={fieldClass} placeholder="Task title" required />
            <select aria-label="Type" name="type" className={fieldClass} defaultValue="Appointment Follow-up">
              {automationTaskTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Normal">
              {automationTaskPriorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
            <input aria-label="Due at" name="dueAt" className={fieldClass} type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <input name="owner" className={fieldClass} placeholder="Owner" />
            <input name="patientName" className={fieldClass} placeholder="Patient name" />
            <input name="phone" className={fieldClass} placeholder="Phone" />
            <textarea name="description" className={`${fieldClass} min-h-24 py-3`} placeholder="Task description" />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Internal notes" />
            <ActionButton type="submit" variant="success">
              Save Task
            </ActionButton>
          </div>
        </form>

        <DataTable
          columns={columns}
          data={tasks}
          getRowId={(task) => task.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search title, description, patient, owner"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadAutomation()}
          emptyState={{
            icon: WandSparkles,
            title: globalFilter || statusFilter ? "No tasks match your filters" : "No automation tasks in this view",
            description:
              globalFilter || statusFilter
                ? "Try a different search term, or clear the status filter."
                : "Tasks are generated from live hospital activity — overdue follow-ups, unpaid dispenses and pending reports become actionable items here.",
            action: globalFilter || statusFilter ? "Clear filters" : "Generate Tasks",
            onAction:
              globalFilter || statusFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                  }
                : () => void generateTasks()
          }}
          export={{ headers: automationExportHeaders, row: automationExportRow, filename: "automation-tasks.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => updateStatusFilter(event.target.value as AutomationTaskStatus | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {automationTaskStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(automationExportHeaders, selected.map(automationExportRow), "selected-automation-tasks.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />
      </div>
    </div>
  );
}
