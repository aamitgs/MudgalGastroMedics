"use client";

import { Bot, CalendarClock, Download, RefreshCw, WandSparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AutomationTask, AutomationTaskPriority, AutomationTaskStatus } from "@/lib/automation-types";
import { automationTaskPriorities, automationTaskStatuses, automationTaskTypes } from "@/lib/automation-types";
import { downloadCsv } from "@/lib/table-export";

const automationExportHeaders = ["Title", "Type", "Priority", "Status", "Patient", "Due At", "Created"];

function automationExportRow(task: AutomationTask) {
  return [task.title, task.type, task.priority, task.status, task.patientName ?? "", task.dueAt, task.createdAt];
}

type AutomationResponse = {
  ok: boolean;
  tasks?: AutomationTask[];
  task?: AutomationTask;
  generated?: AutomationTask[];
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function priorityClass(priority: AutomationTaskPriority) {
  if (priority === "Urgent") return "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300";
  if (priority === "High") return "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  if (priority === "Low") return "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300";
  return "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-brand";
}

export function AdminAutomation() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<AutomationTaskStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAutomation() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/automation", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load automation tasks.");
      setLoading(false);
      return;
    }
    setTasks(data.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialAutomation() {
      const response = await fetch("/api/automation", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as AutomationResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load automation tasks.");
        setLoading(false);
        return;
      }
      setTasks(data.tasks ?? []);
      setLoading(false);
    }
    void loadInitialAutomation();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    return [
      { label: "Open", value: tasks.filter((task) => task.status === "Open").length },
      { label: "Queued", value: tasks.filter((task) => task.status === "Queued").length },
      { label: "Escalated", value: tasks.filter((task) => task.status === "Escalated").length },
      { label: "Done", value: tasks.filter((task) => task.status === "Done").length }
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((left, right) => left.dueAt.localeCompare(right.dueAt) || right.updatedAt.localeCompare(left.updatedAt));
    return statusFilter === "All" ? sorted : sorted.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  async function generateTasks() {
    const response = await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" })
    });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to generate automation tasks.");
      return;
    }
    setTasks(data.tasks ?? []);
    setError("");
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
      setError(data.error || "Unable to create automation task.");
      return;
    }
    setTasks((items) => [data.task as AutomationTask, ...items]);
    form.reset();
    setError("");
  }

  async function updateTask(id: string, updates: Partial<Pick<AutomationTask, "status" | "priority" | "dueAt" | "owner" | "notes">>) {
    const response = await fetch("/api/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as AutomationResponse;
    if (!response.ok || !data.ok || !data.task) {
      setError(data.error || "Unable to update automation task.");
      return;
    }
    setTasks((items) => items.map((item) => (item.id === id ? data.task as AutomationTask : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Automation</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Task and reminder queue</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Generate operational tasks from appointments, OPD follow-ups, procedures, payments, lab reports, stock alerts and AI reviews.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void generateTasks()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(8,145,178,0.24)]">
            <WandSparkles size={17} /> Generate Tasks
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(automationExportHeaders, tasks.map(automationExportRow), "automation-tasks.csv")}
            disabled={tasks.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button type="button" onClick={() => void loadAutomation()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <RefreshCw size={17} /> Refresh
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.72fr_1.28fr]">
        <form onSubmit={createTask} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Bot size={19} /> Add manual task</p>
          <div className="grid gap-3">
            <input name="title" className={fieldClass} placeholder="Task title" required />
            <div className="grid gap-3 md:grid-cols-2">
              <select name="type" className={fieldClass} defaultValue="Appointment Follow-up">{automationTaskTypes.map((type) => <option key={type}>{type}</option>)}</select>
              <select name="priority" className={fieldClass} defaultValue="Normal">{automationTaskPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="dueAt" className={fieldClass} type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <input name="owner" className={fieldClass} placeholder="Owner" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="patientName" className={fieldClass} placeholder="Patient name" />
              <input name="phone" className={fieldClass} placeholder="Phone" />
            </div>
            <textarea name="description" className={`${fieldClass} min-h-24 py-3`} placeholder="Task description" />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Internal notes" />
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)]">Save Task</button>
          </div>
        </form>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/60 p-3">
            <p className="flex items-center gap-2 font-bold text-ink"><CalendarClock size={18} /> Queue</p>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AutomationTaskStatus | "All")} className="min-h-10 rounded border border-line bg-surface px-3 text-sm font-bold text-ink">
              <option value="All">All Status</option>
              {automationTaskStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          {loading ? <p className="rounded border border-line bg-soft/60 p-4 font-semibold text-muted">Loading automation tasks...</p> : null}
          {!loading && filteredTasks.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-8 text-center font-semibold text-muted">No automation tasks in this view.</p> : null}
          {filteredTasks.map((task) => (
            <article key={task.id} className="rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{task.type}{task.uhid ? ` | ${task.uhid}` : ""}</p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{task.title}</h3>
                  <p className="mt-1 text-sm text-muted">{task.description}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${priorityClass(task.priority)}`}>{task.priority}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-muted">Status</span>
                  <select value={task.status} onChange={(event) => void updateTask(task.id, { status: event.target.value as AutomationTaskStatus })} className={fieldClass}>
                    {automationTaskStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-muted">Priority</span>
                  <select value={task.priority} onChange={(event) => void updateTask(task.id, { priority: event.target.value as AutomationTaskPriority })} className={fieldClass}>
                    {automationTaskPriorities.map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-muted">Due</span>
                  <input type="date" value={task.dueAt} onChange={(event) => void updateTask(task.id, { dueAt: event.target.value })} className={fieldClass} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-muted">Owner</span>
                  <input defaultValue={task.owner} onBlur={(event) => void updateTask(task.id, { owner: event.target.value })} className={fieldClass} placeholder="Owner" />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {task.patientName ? <span className="rounded border border-line bg-soft px-3 py-2 text-muted">{task.patientName}</span> : null}
                {task.phone ? <a href={`tel:${task.phone}`} className="rounded border border-line bg-soft px-3 py-2 font-bold text-ink transition hover:border-brand hover:text-brand">{task.phone}</a> : null}
                {task.actionUrl ? <a href={task.actionUrl} className="rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-2 font-bold text-brand">Open Source</a> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
