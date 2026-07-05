"use client";

import { AlertTriangle, ClipboardCheck, Download, RefreshCw, ShieldCheck } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { useEffect, useMemo, useState } from "react";
import type { AuditEvent, AuditSeverity } from "@/lib/audit-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const auditExportHeaders = ["Created", "Actor Role", "Actor ID", "Action", "Entity Type", "Entity ID", "Severity"];

function auditExportRow(event: AuditEvent) {
  return [event.createdAt, event.actorRole, event.actorId ?? "", event.action, event.entityType, event.entityId, event.severity];
}

type AuditResponse = {
  ok: boolean;
  events?: AuditEvent[];
  error?: string;
};

const severityTone: Record<AuditSeverity, string> = {
  info: "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300",
  warning: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
  critical: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300"
};

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
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${formatAuditValue(value)}`)
    .join(" | ");
}

export function AdminAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/audit?limit=120", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as AuditResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load audit log.");
      setLoading(false);
      return;
    }
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialEvents() {
      const response = await fetch("/api/audit?limit=120", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as AuditResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load audit log.");
        setLoading(false);
        return;
      }
      setEvents(data.events ?? []);
      setLoading(false);
    }

    void loadInitialEvents();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { label: "Audit Events", value: events.length, icon: ClipboardCheck },
      { label: "Warnings", value: events.filter((event) => event.severity === "warning").length, icon: AlertTriangle },
      { label: "Critical", value: events.filter((event) => event.severity === "critical").length, icon: ShieldCheck },
      { label: "Today", value: events.filter((event) => event.createdAt.startsWith(today)).length, icon: RefreshCw }
    ];
  }, [events]);

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
        <div className="flex flex-wrap gap-3">
          <ActionButton
            onClick={() => downloadCsv(auditExportHeaders, events.map(auditExportRow), "audit-log.csv")}
            disabled={events.length === 0}
          >
            <Download size={17} /> Export CSV
          </ActionButton>
          <ActionButton onClick={() => void loadEvents()}>
            <RefreshCw size={17} /> Refresh Log
          </ActionButton>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

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

      <div className="grid max-h-[560px] gap-3 overflow-auto p-4">
        {loading ? <ModuleSkeleton /> : null}
        {!loading && events.length === 0 ? (
          <ModuleEmptyState
            icon={ShieldCheck}
            title="No audit events yet"
            description="Every privileged action — logins, record changes, approvals — is recorded here for compliance. The trail starts as staff begin working."
          />
        ) : null}
        {events.map((event) => (
          <article key={event.id} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{event.actorRole} | {event.entityType}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{event.action}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityTone[event.severity]}`}>{event.severity}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-[1fr_1fr]">
              <p><span className="font-bold text-ink">Entity:</span> {event.entityId}</p>
              <p><span className="font-bold text-ink">Time:</span> {formatTime(event.createdAt)}</p>
            </div>

            {event.changes && Object.keys(event.changes).length ? (
              <div className="mt-3 overflow-hidden rounded border border-line bg-surface">
                <p className="border-b border-line px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted">Field changes</p>
                <ul className="divide-y divide-line">
                  {Object.entries(event.changes).map(([field, change]) => (
                    <li key={field} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                      <span className="font-bold text-ink">{field}</span>
                      <span className="rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-700 line-through decoration-red-400 dark:bg-red-950 dark:text-red-300">{formatAuditValue(change.before)}</span>
                      <span className="text-muted" aria-hidden="true">→</span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{formatAuditValue(change.after)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {metadataSummary(event.metadata) ? (
              <p className="mt-3 rounded border border-line bg-surface p-3 text-xs font-semibold text-muted">{metadataSummary(event.metadata)}</p>
            ) : null}

            {event.device ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted">
                <span><span className="text-ink">IP</span> {event.device.ip || "—"}</span>
                {event.device.method || event.device.path ? (
                  <span><span className="text-ink">Route</span> {event.device.method} {event.device.path}</span>
                ) : null}
                {event.device.userAgent ? (
                  <span className="max-w-full truncate" title={event.device.userAgent}><span className="text-ink">Agent</span> {event.device.userAgent}</span>
                ) : null}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
