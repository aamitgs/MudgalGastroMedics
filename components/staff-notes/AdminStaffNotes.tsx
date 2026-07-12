"use client";

import { MessagesSquare, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { StaffNote, StaffNoteCategory, StaffNoteDepartment, StaffNotePriority, StaffNoteStatus } from "@/lib/staff-notes-types";
import { staffNoteCategories, staffNoteDepartments, staffNotePriorities } from "@/lib/staff-notes-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";

type StaffNotesResponse = { ok: boolean; notes?: StaffNote[]; note?: StaffNote; error?: string };

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function priorityClass(priority: StaffNotePriority) {
  if (priority === "Critical") return "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300";
  if (priority === "High") return "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  return "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-brand";
}

function statusClass(status: StaffNoteStatus) {
  if (status === "Open") return "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-brand";
  if (status === "Acknowledged") return "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  return "border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300";
}

const pageSize = 25;

export function AdminStaffNotes() {
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [category, setCategory] = useState<StaffNoteCategory>("Note");
  const [toDepartment, setToDepartment] = useState<StaffNoteDepartment>("Pharmacy");
  const [priority, setPriority] = useState<StaffNotePriority>("Normal");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  async function load() {
    const response = await fetch("/api/staff-notes", { cache: "no-store" }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as StaffNotesResponse;
    setLoading(false);
    if (!response?.ok || !data.ok || !data.notes) {
      notify.error(data.error || "Unable to load staff notes.");
      return;
    }
    setNotes(data.notes);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    const response = await fetch("/api/staff-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, toDepartment, priority, message })
    });
    const data = (await response.json().catch(() => ({}))) as StaffNotesResponse;
    setPosting(false);
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to send note.");
      return;
    }
    notify.success(category === "Handover" ? "Handover note sent" : "Note sent");
    setMessage("");
    setComposing(false);
    void load();
  }

  const setStatus = useCallback(async (id: string, status: StaffNoteStatus) => {
    const response = await fetch("/api/staff-notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as StaffNotesResponse;
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to update note.");
      return;
    }
    void load();
  }, []);

  const sortField = sorting[0]?.id as keyof StaffNote | undefined;
  const sortDir = sorting[0]?.desc ? -1 : 1;

  const filtered = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    const rows = query
      ? notes.filter((note) =>
          [note.message, note.authorName, note.fromDepartment, note.toDepartment, note.patientName ?? ""].some((field) =>
            field.toLowerCase().includes(query)
          )
        )
      : notes;
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      const left = String(a[sortField] ?? "");
      const right = String(b[sortField] ?? "");
      return left.localeCompare(right) * sortDir;
    });
  }, [notes, globalFilter, sortField, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  const columns = useMemo<ColumnDef<StaffNote, unknown>[]>(
    () => [
      {
        accessorKey: "category",
        header: "Type",
        size: 90,
        cell: ({ row }) => (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${row.original.category === "Handover" ? "border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-300" : "border-line bg-surface text-muted"}`}>
            {row.original.category}
          </span>
        )
      },
      { accessorKey: "fromDepartment", header: "From", size: 110 },
      { accessorKey: "toDepartment", header: "To", size: 110 },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 90,
        cell: ({ row }) => <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${priorityClass(row.original.priority)}`}>{row.original.priority}</span>
      },
      { accessorKey: "message", header: "Message", size: 320 },
      { accessorKey: "authorName", header: "From (staff)", size: 140 },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: ({ row }) => <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${statusClass(row.original.status)}`}>{row.original.status}</span>
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            {row.original.status === "Open" ? (
              <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(row.original.id, "Acknowledged")}>
                Acknowledge
              </ActionButton>
            ) : null}
            {row.original.status !== "Resolved" ? (
              <ActionButton variant="secondary" size="sm" onClick={() => void setStatus(row.original.id, "Resolved")}>
                Resolve
              </ActionButton>
            ) : null}
          </div>
        )
      }
    ],
    [setStatus]
  );

  return (
    <section id="module-staff-notes" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <MessagesSquare size={18} className="text-brand" /> Staff Notes
          </h2>
          <p className="text-sm text-muted">Cross-department notes and shift handover — visible to whichever department a note is addressed to.</p>
        </div>
        <ActionButton variant="primary" size="sm" onClick={() => setComposing((current) => !current)}>
          {composing ? "Cancel" : "New note"}
        </ActionButton>
      </div>

      {composing ? (
        <form onSubmit={submitNote} className="grid gap-3 rounded border border-line bg-soft/60 p-4 md:grid-cols-4">
          <label className="md:col-span-1">
            <span className="mb-1 block text-xs font-bold text-muted">Type</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as StaffNoteCategory)} className={fieldClass}>
              {staffNoteCategories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-1">
            <span className="mb-1 block text-xs font-bold text-muted">To department</span>
            <select value={toDepartment} onChange={(event) => setToDepartment(event.target.value as StaffNoteDepartment)} className={fieldClass}>
              {staffNoteDepartments.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-1">
            <span className="mb-1 block text-xs font-bold text-muted">Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as StaffNotePriority)} className={fieldClass}>
              {staffNotePriorities.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end md:col-span-1">
            <ActionButton type="submit" variant="primary" size="sm" disabled={posting || !message.trim()} className="w-full">
              <Send size={14} /> {posting ? "Sending…" : "Send"}
            </ActionButton>
          </div>
          <label className="md:col-span-4">
            <span className="mb-1 block text-xs font-bold text-muted">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              className="min-h-20 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              placeholder={category === "Handover" ? "Pending tasks, critical patients, escalations for the next shift…" : "What does the target department need to know?"}
            />
          </label>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        data={pageRows}
        getRowId={(note) => note.id}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={updateGlobalFilter}
        searchPlaceholder="Search notes…"
        loading={loading}
        emptyState={{
          icon: MessagesSquare,
          title: globalFilter ? "No notes match your search" : "No staff notes yet",
          description: globalFilter
            ? "Try a different search term."
            : "Cross-department notes and shift handover summaries will appear here once someone sends one.",
          action: globalFilter ? "Clear search" : "New note",
          onAction: () => (globalFilter ? updateGlobalFilter("") : setComposing(true))
        }}
      />
    </section>
  );
}
