"use client";

import { Download, MessageCircle, Phone, Send, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { CommunicationChannel, CommunicationLog, CommunicationStatus, CommunicationTemplateKey } from "@/lib/communication-types";
import { communicationChannels, communicationStatuses } from "@/lib/communication-types";
import type { CommunicationLogSortField } from "@/lib/communication-log-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const communicationExportHeaders = ["Patient", "Phone", "Channel", "Subject", "Status", "Scheduled For", "Sent At", "Owner"];

function communicationExportRow(log: CommunicationLog) {
  return [log.patientName, log.phone, log.channel, log.subject, log.status, log.scheduledFor ?? "", log.sentAt ?? "", log.owner ?? ""];
}

type Recipient = {
  id: string;
  uhid: string;
  name: string;
  phone: string;
};

type Template = {
  key: CommunicationTemplateKey;
  subject: string;
  message: string;
};

type CommunicationResponse = {
  ok: boolean;
  logs?: CommunicationLog[];
  log?: CommunicationLog;
  recipients?: Recipient[];
  templates?: Template[];
  pageCount?: number;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const pageSize = 25;

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function whatsAppUrl(phone: string, message: string) {
  const target = cleanPhone(phone);
  return `https://wa.me/${target.startsWith("91") ? target : `91${target}`}?text=${encodeURIComponent(message)}`;
}

const statusTone: Record<CommunicationStatus, string> = {
  Draft: "border-line bg-soft text-muted",
  Queued: "border-cyan-200 bg-cyan-50 text-brand dark:border-cyan-900 dark:bg-cyan-950",
  Sent: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Failed: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  "Follow-up Needed": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
};

export function AdminCommunication() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<CommunicationTemplateKey>("Appointment Confirmation");
  const [customMessage, setCustomMessage] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommunicationStatus | "">("");
  const [channelFilter, setChannelFilter] = useState<CommunicationChannel | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortField = (sorting[0]?.id as CommunicationLogSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadCommunication() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (channelFilter) params.set("channel", channelFilter);

    const response = await fetch(`/api/communication?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as CommunicationResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load communication records.");
      setLoading(false);
      return;
    }
    setLogs(data.logs ?? []);
    setRecipients(data.recipients ?? []);
    setTemplates(data.templates ?? []);
    setPageCount(data.pageCount ?? 1);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCommunication(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, channelFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: CommunicationStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function updateChannelFilter(value: CommunicationChannel | "") {
    setChannelFilter(value);
    setPageIndex(0);
  }

  const selectedTemplate = useMemo(() => templates.find((template) => template.key === selectedTemplateKey) ?? templates[0], [selectedTemplateKey, templates]);
  const selectedRecipient = useMemo(() => recipients.find((recipient) => recipient.id === selectedPatientId), [recipients, selectedPatientId]);
  const messagePreview = customMessage || selectedTemplate?.message || "";

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { label: "Logs", value: logs.length },
      { label: "Sent Today", value: logs.filter((log) => log.sentAt?.slice(0, 10) === today || (log.status === "Sent" && log.updatedAt.slice(0, 10) === today)).length },
      { label: "Follow-up", value: logs.filter((log) => log.status === "Follow-up Needed").length },
      { label: "Queued", value: logs.filter((log) => log.status === "Queued").length }
    ];
  }, [logs]);

  async function createLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as CommunicationResponse;
    if (!response.ok || !data.ok || !data.log) {
      notify.error(data.error || "Unable to create communication log.");
      return;
    }
    setSelectedPatientId("");
    setCustomMessage("");
    form.reset();
    void loadCommunication();
  }

  async function updateStatus(id: string, status: CommunicationStatus) {
    const response = await fetch("/api/communication", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as CommunicationResponse;
    if (!response.ok || !data.ok || !data.log) {
      notify.error(data.error || "Unable to update communication.");
      return;
    }
    const updated = data.log as CommunicationLog;
    setLogs((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  const columns = useMemo<ColumnDef<CommunicationLog, unknown>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 170,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.patientName)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.patientName}
            </button>
            {row.original.uhid ? <span className="mt-0.5 block text-[10px] text-muted">{row.original.uhid}</span> : null}
          </div>
        )
      },
      { accessorKey: "channel", header: "Channel", size: 100 },
      { accessorKey: "subject", header: "Subject", size: 170 },
      {
        id: "message",
        header: "Message",
        size: 220,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 text-muted" title={row.original.message}>
            {row.original.message}
          </span>
        )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 160,
        cell: ({ row }) => (
          <select
            aria-label="Communication status"
            value={row.original.status}
            onChange={(event) => void updateStatus(row.original.id, event.target.value as CommunicationStatus)}
            className={`rounded border px-2 py-1 text-xs font-bold ${statusTone[row.original.status]}`}
          >
            {communicationStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "actions",
        header: "",
        size: 130,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${row.original.phone}`}
              title="Call patient"
              className="inline-flex items-center gap-1 rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <Phone size={12} /> Call
            </a>
            <a
              href={whatsAppUrl(row.original.phone, row.original.message)}
              target="_blank"
              rel="noreferrer"
              title="Open WhatsApp"
              className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <MessageCircle size={12} /> WA
            </a>
          </div>
        )
      }
    ],
    [openDrawer]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Communication</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Patient messages and follow-up log</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Prepare WhatsApp/SMS/call scripts, open patient handoffs and track delivery status for reception.</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[1fr_0.85fr]">
        <form onSubmit={createLog} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <Send size={19} /> Prepare patient message
          </p>
          <div className="grid gap-3">
            <select aria-label="Patient" name="patientId" value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} className={fieldClass}>
              <option value="">Select patient from UHID list</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.uhid} | {recipient.name} | {recipient.phone}
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="patientName"
                className={fieldClass}
                placeholder="Patient name"
                defaultValue={selectedRecipient?.name ?? ""}
                key={selectedRecipient?.id ?? "patientName"}
                required={!selectedRecipient}
              />
              <input
                name="phone"
                className={fieldClass}
                placeholder="Phone"
                defaultValue={selectedRecipient?.phone ?? ""}
                key={`${selectedRecipient?.id ?? "phone"}-phone`}
                required={!selectedRecipient}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Channel" name="channel" className={fieldClass} defaultValue="WhatsApp">
                {communicationChannels.map((channel) => (
                  <option key={channel}>{channel}</option>
                ))}
              </select>
              <select
                aria-label="Template"
                name="template"
                value={selectedTemplateKey}
                onChange={(event) => setSelectedTemplateKey(event.target.value as CommunicationTemplateKey)}
                className={fieldClass}
              >
                {templates.map((template) => (
                  <option key={template.key}>{template.key}</option>
                ))}
              </select>
              <select aria-label="Status" name="status" className={fieldClass} defaultValue="Draft">
                {communicationStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Scheduled for" name="scheduledFor" className={fieldClass} type="datetime-local" />
              <input name="owner" className={fieldClass} placeholder="Owner / staff" />
            </div>
            <input name="subject" className={fieldClass} placeholder="Subject" defaultValue={selectedTemplate?.subject ?? ""} key={`${selectedTemplate?.key ?? "subject"}-subject`} />
            <textarea
              name="message"
              value={customMessage || selectedTemplate?.message || ""}
              onChange={(event) => setCustomMessage(event.target.value)}
              className={`${fieldClass} min-h-28 py-3`}
              placeholder="Message text"
            />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Internal notes for reception" />
            <div className="flex flex-wrap gap-3">
              <ActionButton type="submit" variant="primary">
                Save Log
              </ActionButton>
              {selectedRecipient ? (
                <a
                  href={whatsAppUrl(selectedRecipient.phone, messagePreview)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)]"
                >
                  <MessageCircle size={17} /> Open WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </form>

        <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <UsersRound size={19} /> Templates
          </p>
          <div className="grid gap-3">
            {templates.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => setSelectedTemplateKey(template.key)}
                aria-pressed={selectedTemplateKey === template.key}
                className={`rounded border p-4 text-left transition ${selectedTemplateKey === template.key ? "border-brand bg-cyan-50 dark:bg-cyan-950" : "border-line bg-surface hover:border-brand/60"}`}
              >
                <p className="font-bold text-ink">{template.key}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{template.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Communication log</p>
        <DataTable
          columns={columns}
          data={logs}
          getRowId={(log) => log.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search patient, phone, subject, message"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadCommunication()}
          emptyState={{
            icon: MessageCircle,
            title: globalFilter || statusFilter || channelFilter ? "No logs match your filters" : "No communication logs yet",
            description:
              globalFilter || statusFilter || channelFilter
                ? "Try a different search term, or clear the status/channel filters."
                : "Calls, SMS and follow-up messages sent to patients are logged here. Send a message above to start the trail.",
            action: globalFilter || statusFilter || channelFilter ? "Clear filters" : undefined,
            onAction:
              globalFilter || statusFilter || channelFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                    setChannelFilter("");
                  }
                : undefined
          }}
          export={{ headers: communicationExportHeaders, row: communicationExportRow, filename: "communication-log.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as CommunicationStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {communicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by channel"
                value={channelFilter}
                onChange={(event) => updateChannelFilter(event.target.value as CommunicationChannel | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All channels</option>
                {communicationChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(communicationExportHeaders, selected.map(communicationExportRow), "selected-communication-log.csv");
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
