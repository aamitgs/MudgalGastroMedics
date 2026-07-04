"use client";

import { Download, MessageCircle, Phone, RefreshCw, Send, UsersRound } from "lucide-react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CommunicationChannel, CommunicationLog, CommunicationStatus, CommunicationTemplateKey } from "@/lib/communication-types";
import { communicationChannels, communicationStatuses } from "@/lib/communication-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

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
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function whatsAppUrl(phone: string, message: string) {
  const target = cleanPhone(phone);
  return `https://wa.me/${target.startsWith("91") ? target : `91${target}`}?text=${encodeURIComponent(message)}`;
}

export function AdminCommunication() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<CommunicationTemplateKey>("Appointment Confirmation");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCommunication() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/communication", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as CommunicationResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load communication records.");
      setLoading(false);
      return;
    }
    setLogs(data.logs ?? []);
    setRecipients(data.recipients ?? []);
    setTemplates(data.templates ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialCommunication() {
      const response = await fetch("/api/communication", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as CommunicationResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load communication records.");
        setLoading(false);
        return;
      }
      setLogs(data.logs ?? []);
      setRecipients(data.recipients ?? []);
      setTemplates(data.templates ?? []);
      setLoading(false);
    }
    void loadInitialCommunication();
    return () => {
      active = false;
    };
  }, []);

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
      setError(data.error || "Unable to create communication log.");
      return;
    }
    setLogs((items) => [data.log as CommunicationLog, ...items]);
    setSelectedPatientId("");
    setCustomMessage("");
    form.reset();
    setError("");
  }

  async function updateStatus(id: string, status: CommunicationStatus) {
    const response = await fetch("/api/communication", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as CommunicationResponse;
    if (!response.ok || !data.ok || !data.log) {
      setError(data.error || "Unable to update communication.");
      return;
    }
    setLogs((items) => items.map((item) => (item.id === id ? data.log as CommunicationLog : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Communication</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Patient messages and follow-up log</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Prepare WhatsApp/SMS/call scripts, open patient handoffs and track delivery status for reception.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(communicationExportHeaders, logs.map(communicationExportRow), "communication-log.csv")}
            disabled={logs.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button type="button" onClick={() => void loadCommunication()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <RefreshCw size={17} /> Refresh Communication
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

      <div className="grid gap-5 p-4 xl:grid-cols-[1fr_0.85fr]">
        <form onSubmit={createLog} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Send size={19} /> Prepare patient message</p>
          <div className="grid gap-3">
            <select aria-label="Patient" name="patientId" value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} className={fieldClass}>
              <option value="">Select patient from UHID list</option>
              {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.uhid} | {recipient.name} | {recipient.phone}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="patientName" className={fieldClass} placeholder="Patient name" defaultValue={selectedRecipient?.name ?? ""} key={selectedRecipient?.id ?? "patientName"} required={!selectedRecipient} />
              <input name="phone" className={fieldClass} placeholder="Phone" defaultValue={selectedRecipient?.phone ?? ""} key={`${selectedRecipient?.id ?? "phone"}-phone`} required={!selectedRecipient} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Channel" name="channel" className={fieldClass} defaultValue="WhatsApp">{communicationChannels.map((channel) => <option key={channel}>{channel}</option>)}</select>
              <select aria-label="Template" name="template" value={selectedTemplateKey} onChange={(event) => setSelectedTemplateKey(event.target.value as CommunicationTemplateKey)} className={fieldClass}>
                {templates.map((template) => <option key={template.key}>{template.key}</option>)}
              </select>
              <select aria-label="Status" name="status" className={fieldClass} defaultValue="Draft">{communicationStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Scheduled for" name="scheduledFor" className={fieldClass} type="datetime-local" />
              <input name="owner" className={fieldClass} placeholder="Owner / staff" />
            </div>
            <input name="subject" className={fieldClass} placeholder="Subject" defaultValue={selectedTemplate?.subject ?? ""} key={`${selectedTemplate?.key ?? "subject"}-subject`} />
            <textarea name="message" value={customMessage || selectedTemplate?.message || ""} onChange={(event) => setCustomMessage(event.target.value)} className={`${fieldClass} min-h-28 py-3`} placeholder="Message text" />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Internal notes for reception" />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">Save Log</button>
              {selectedRecipient ? (
                <a href={whatsAppUrl(selectedRecipient.phone, messagePreview)} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)]">
                  <MessageCircle size={17} /> Open WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </form>

        <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><UsersRound size={19} /> Templates</p>
          <div className="grid gap-3">
            {templates.map((template) => (
              <button key={template.key} type="button" onClick={() => setSelectedTemplateKey(template.key)} className={`rounded border p-4 text-left transition ${selectedTemplateKey === template.key ? "border-brand bg-cyan-50 dark:bg-cyan-950" : "border-line bg-surface hover:border-brand/60"}`}>
                <p className="font-bold text-ink">{template.key}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{template.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Recent communication logs</p>
        {loading ? <ModuleSkeleton /> : null}
        {!loading && logs.length === 0 ? (
          <ModuleEmptyState
            icon={MessageCircle}
            title="No communication logs yet"
            description="Calls, SMS and follow-up messages sent to patients are logged here. Send a message above to start the trail."
          />
        ) : null}
        {logs.slice(0, 14).map((log) => (
          <article key={log.id} className="rounded border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{log.channel} | {log.template}{log.uhid ? ` | ${log.uhid}` : ""}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{log.patientName}</h3>
                <p className="mt-1 text-sm text-muted">{log.subject}</p>
              </div>
              <select aria-label="Status" value={log.status} onChange={(event) => void updateStatus(log.id, event.target.value as CommunicationStatus)} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                {communicationStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <p className="mt-3 rounded border border-line bg-soft/60 p-3 text-sm leading-relaxed text-muted">{log.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${log.phone}`} className="inline-flex items-center gap-2 rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"><Phone size={15} /> Call</a>
              <a href={whatsAppUrl(log.phone, log.message)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950"><MessageCircle size={15} /> WhatsApp</a>
              {log.scheduledFor ? <span className="rounded border border-line bg-soft px-3 py-2 text-sm text-muted">Scheduled: {new Date(log.scheduledFor).toLocaleString("en-IN")}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
