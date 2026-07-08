"use client";

import { AlertTriangle, ClipboardCheck, Download, Eye, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { AuditEvent, AuditSeverity } from "@/lib/audit-types";
import { auditSeverities } from "@/lib/audit-types";
import type { AuditLogSortField } from "@/lib/audit-log-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";

const auditExportHeaders = ["Created", "Actor Role", "Actor ID", "Action", "Entity Type", "Entity ID", "Severity"];

function auditExportRow(event: AuditEvent) {
  return [event.createdAt, event.actorRole, event.actorId ?? "", event.action, event.entityType, event.entityId, event.severity];
}

type AuditResponse = {
  ok: boolean;
  events?: AuditEvent[];
  pageCount?: number;
  error?: string;
};

const severityTone: Record<AuditSeverity, string> = {
  info: "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300",
  warning: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
  critical: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300"
};

const pageSize = 25;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAuditValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Structured change-set and device context render on their own; keep the
// residual metadata summary free of them (and of internal keys).
const summaryHiddenKeys = ["userAgent", "changes", "device", "severity"];

function metadataSummary(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).filter(([key]) => !summaryHiddenKeys.includes(key));
  if (!entries.length) return null;

  return entries
    .slice(0, 8)
    .map(([key, value]) => `${key}: ${formatAuditValue(value)}`)
    .join(" | ");
}

export function AdminAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingEvent, setViewingEvent] = useState<AuditEvent | null>(null);

  const sortField = (sorting[0]?.id as AuditLogSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadEvents() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (severityFilter) params.set("severity", severityFilter);

    const response = await fetch(`/api/audit?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as AuditResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load audit log.");
      setLoading(false);
      return;
    }
    setEvents(data.events ?? []);
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
    setViewingEvent((current) => {
      if (!current) return current;
      return data.events?.find((event) => event.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvents(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, severityFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateSeverityFilter(value: AuditSeverity | "") {
    setSeverityFilter(value);
    setPageIndex(0);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { label: "Audit Events", value: events.length, icon: ClipboardCheck },
      { label: "Warnings", value: events.filter((event) => event.severity === "warning").length, icon: AlertTriangle },
      { label: "Critical", value: events.filter((event) => event.severity === "critical").length, icon: ShieldCheck },
      { label: "Today", value: events.filter((event) => event.createdAt.startsWith(today)).length, icon: ClipboardCheck }
    ];
  }, [events]);

  const columns = useMemo<ColumnDef<AuditEvent, unknown>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Time",
        size: 160,
        cell: ({ row }) => <span className="text-muted">{formatTime(row.original.createdAt)}</span>
      },
      { accessorKey: "actorRole", header: "Actor", size: 130, cell: ({ row }) => <span>{row.original.actorRole}{row.original.actorId ? ` (${row.original.actorId})` : ""}</span> },
      { accessorKey: "action", header: "Action", size: 220, cell: ({ row }) => <span className="font-bold text-ink">{row.original.action}</span> },
      { accessorKey: "entityType", header: "Entity", size: 150, cell: ({ row }) => <span>{row.original.entityType} | {row.original.entityId}</span> },
      {
        accessorKey: "severity",
        header: "Severity",
        size: 110,
        cell: ({ row }) => <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${severityTone[row.original.severity]}`}>{row.original.severity}</span>
      },
      {
        id: "actions",
        header: "",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => setViewingEvent((current) => (current?.id === row.original.id ? null : row.original))} aria-expanded={viewingEvent?.id === row.original.id}>
            <Eye size={13} /> Details
          </ActionButton>
        )
      }
    ],
    [viewingEvent]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Audit Log</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Sensitive action history</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Tracks session, appointment, AI, automation and platform changes for operational review. Secrets and uploaded report contents are not stored here.
          </p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="p-4">
        <DataTable
          columns={columns}
          data={events}
          getRowId={(event) => event.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search actor, action, entity"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadEvents()}
          emptyState={{
            icon: ShieldCheck,
            title: globalFilter || severityFilter ? "No events match your filters" : "No audit events yet",
            description:
              globalFilter || severityFilter
                ? "Try a different search term, or clear the severity filter."
                : "Every privileged action — logins, record changes, approvals — is recorded here for compliance. The trail starts as staff begin working.",
            action: globalFilter || severityFilter ? "Clear filters" : undefined,
            onAction:
              globalFilter || severityFilter
                ? () => {
                    setGlobalFilter("");
                    setSeverityFilter("");
                  }
                : undefined
          }}
          export={{ headers: auditExportHeaders, row: auditExportRow, filename: "audit-log.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(event) => updateSeverityFilter(event.target.value as AuditSeverity | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All severities</option>
              {auditSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(auditExportHeaders, selected.map(auditExportRow), "selected-audit-log.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />

        {viewingEvent ? (
          <div className="mt-4 rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">
                  {viewingEvent.actorRole} | {viewingEvent.entityType}
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink">{viewingEvent.action}</h3>
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => setViewingEvent(null)}>
                Close
              </ActionButton>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-[1fr_1fr]">
              <p>
                <span className="font-bold text-ink">Entity:</span> {viewingEvent.entityId}
              </p>
              <p>
                <span className="font-bold text-ink">Time:</span> {formatTime(viewingEvent.createdAt)}
              </p>
            </div>

            {viewingEvent.changes && Object.keys(viewingEvent.changes).length ? (
              <div className="mt-3 overflow-hidden rounded border border-line bg-surface">
                <p className="border-b border-line px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted">Field changes</p>
                <ul className="divide-y divide-line">
                  {Object.entries(viewingEvent.changes).map(([field, change]) => (
                    <li key={field} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                      <span className="font-bold text-ink">{field}</span>
                      <span className="rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-700 line-through decoration-red-400 dark:bg-red-950 dark:text-red-300">{formatAuditValue(change.before)}</span>
                      <span className="text-muted" aria-hidden="true">
                        →
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{formatAuditValue(change.after)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {metadataSummary(viewingEvent.metadata) ? <p className="mt-3 rounded border border-line bg-surface p-3 text-xs font-semibold text-muted">{metadataSummary(viewingEvent.metadata)}</p> : null}

            {viewingEvent.device ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted">
                <span>
                  <span className="text-ink">IP</span> {viewingEvent.device.ip || "—"}
                </span>
                {viewingEvent.device.method || viewingEvent.device.path ? (
                  <span>
                    <span className="text-ink">Route</span> {viewingEvent.device.method} {viewingEvent.device.path}
                  </span>
                ) : null}
                {viewingEvent.device.userAgent ? (
                  <span className="max-w-full truncate" title={viewingEvent.device.userAgent}>
                    <span className="text-ink">Agent</span> {viewingEvent.device.userAgent}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
