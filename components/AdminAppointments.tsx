"use client";

import { AlertTriangle, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Copy, Download, RefreshCw, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAppointmentPlanningNote } from "@/lib/ai-planning";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { appointmentStatuses } from "@/lib/appointment-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { toast } from "sonner";

const appointmentExportHeaders = ["Name", "Phone", "Service", "Date", "Time Slot", "Priority", "Status", "Created"];

function appointmentExportRow(appointment: AppointmentRecord) {
  return [
    appointment.name,
    appointment.phone,
    appointment.service,
    appointment.date ?? "",
    appointment.timeSlot ?? "",
    appointment.priority ?? "",
    appointment.status,
    appointment.createdAt
  ];
}

type ApiResponse = {
  ok: boolean;
  appointments?: AppointmentRecord[];
  error?: string;
};

const statusStyles: Record<AppointmentStatus, string> = {
  New: "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-brand",
  Contacted: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  Confirmed: "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  Completed: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
  Cancelled: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
};

export function AdminAppointments() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [openPlanId, setOpenPlanId] = useState("");

  async function loadAppointments() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/appointment", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load appointments.");
      setLoading(false);
      return;
    }
    setAppointments(data.appointments ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    const response = await fetch("/api/appointment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to update appointment.");
      return;
    }
    setAppointments((items) => items.map((item) => (item.id === id ? data.appointment : item)));
    toast.success("Appointment updated");
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.reload();
  }

  async function createOpdToken(appointmentId: string) {
    const response = await fetch("/api/opd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to create OPD token.");
      return;
    }
    setError("OPD token created. Refresh the OPD Queue section below.");
  }

  useEffect(() => {
    let active = true;

    async function loadInitialAppointments() {
      const response = await fetch("/api/appointment", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load appointments.");
        setLoading(false);
        return;
      }
      setAppointments(data.appointments ?? []);
      setLoading(false);
    }

    void loadInitialAppointments();

    return () => {
      active = false;
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return appointments;
    return appointments.filter((appointment) =>
      [appointment.name, appointment.phone, appointment.service, appointment.priority, appointment.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [appointments, query]);

  const stats = useMemo(() => {
    const urgent = appointments.filter((appointment) => appointment.priority === "Urgent symptoms").length;
    const confirmed = appointments.filter((appointment) => appointment.status === "Confirmed").length;
    return [
      { label: "Total Requests", value: appointments.length, icon: CalendarDays },
      { label: "New", value: appointments.filter((appointment) => appointment.status === "New").length, icon: Clock3 },
      { label: "Confirmed", value: confirmed, icon: CheckCircle2 },
      { label: "Urgent Symptoms", value: urgent, icon: UserRound }
    ];
  }, [appointments]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line/80 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="grid h-10 w-10 place-items-center rounded bg-soft text-brand">
                <Icon size={19} />
              </span>
              <span className="text-xl font-bold text-ink">{value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded border border-line/80 bg-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Reception Queue</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Appointment Requests</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search patient, phone, service"
                className="min-h-9 w-full rounded border border-line bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 sm:w-72"
              />
            </label>
            <button
              type="button"
              onClick={() => downloadCsv(appointmentExportHeaders, filteredAppointments.map(appointmentExportRow), "appointments.csv")}
              disabled={filteredAppointments.length === 0}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => void loadAppointments()}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <RefreshCw size={17} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-9 items-center justify-center rounded border border-line bg-surface px-4 font-bold text-muted transition hover:border-red-200 dark:border-red-900 hover:bg-red-50 dark:bg-red-950 hover:text-red-700 dark:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>

        {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

        <div className="grid gap-4 p-4">
          {loading ? <ModuleSkeleton /> : null}
          {!loading && filteredAppointments.length === 0 ? (
            <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
              <p className="text-xl font-bold text-ink">No appointment requests yet.</p>
              <p className="mt-2 text-muted">Submit the website appointment form, then refresh this dashboard.</p>
            </div>
          ) : null}
          {filteredAppointments.map((appointment) => (
            <article key={appointment.id} className="rounded border border-line/80 bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold text-ink">{appointment.name}</h3>
                    {appointment.uhid ? (
                      <span className="rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand">
                        {appointment.uhid}
                      </span>
                    ) : null}
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${statusStyles[appointment.status]}`}>
                      {appointment.status}
                    </span>
                    <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">
                      {appointment.priority || "Routine"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
                    <p><span className="font-bold text-ink">Phone:</span> {appointment.phone}</p>
                    <p><span className="font-bold text-ink">Service:</span> {appointment.service}</p>
                    <p><span className="font-bold text-ink">Date:</span> {appointment.date || "Flexible"} | {appointment.timeSlot || "Flexible"}</p>
                    <p><span className="font-bold text-ink">Age/Gender:</span> {[appointment.age, appointment.gender].filter(Boolean).join(" / ") || "-"}</p>
                    <p><span className="font-bold text-ink">Contact:</span> {appointment.contactMethod || "Phone / WhatsApp"}</p>
                    <p><span className="font-bold text-ink">Report:</span> {appointment.report || "No file noted"}</p>
                  </div>
                  {appointment.symptoms.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {appointment.symptoms.map((symptom) => (
                        <span key={symptom} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-teal-dark">{symptom}</span>
                      ))}
                    </div>
                  ) : null}
                  {appointment.message || appointment.medicines ? (
                    <div className="mt-4 rounded border border-line bg-surface p-3 text-sm text-muted">
                      {appointment.medicines ? <p><span className="font-bold text-ink">Medicines/Allergies:</span> {appointment.medicines}</p> : null}
                      {appointment.message ? <p className="mt-1"><span className="font-bold text-ink">Notes:</span> {appointment.message}</p> : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid content-start gap-2 sm:grid-cols-2 lg:w-48 lg:grid-cols-1">
                  <a href={`tel:${appointment.phone}`} className="rounded border border-line bg-surface px-4 py-2 text-center font-bold text-ink transition hover:border-brand hover:text-brand">Call</a>
                  <a href={`https://wa.me/${appointment.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-4 py-2 text-center font-bold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950">WhatsApp</a>
                  <button
                    type="button"
                    onClick={() => setOpenPlanId((value) => (value === appointment.id ? "" : appointment.id))}
                    className="inline-flex items-center justify-center gap-2 rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-4 py-2 text-center font-bold text-brand transition hover:bg-cyan-100 dark:bg-cyan-950"
                  >
                    <BrainCircuit size={16} /> AI Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => void createOpdToken(appointment.id)}
                    className="rounded border border-teal/20 bg-teal px-4 py-2 text-center font-bold text-white transition hover:bg-teal-dark"
                  >
                    Create OPD Token
                  </button>
                  <select aria-label="Appointment status"
                    value={appointment.status}
                    onChange={(event) => void updateStatus(appointment.id, event.target.value as AppointmentStatus)}
                    className="rounded border border-line bg-surface px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  >
                    {appointmentStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              {openPlanId === appointment.id ? <PlanningNote appointment={appointment} /> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanningNote({ appointment }: { appointment: AppointmentRecord }) {
  const note = createAppointmentPlanningNote(appointment);
  const scriptText = note.receptionScript;

  async function copyScript() {
    await navigator.clipboard.writeText(scriptText);
  }

  return (
    <div className="mt-5 overflow-hidden rounded border border-cyan-200 dark:border-cyan-900 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-cyan-100 dark:border-cyan-900 bg-[linear-gradient(135deg,var(--site-soft),var(--site-surface))] p-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">AI Planning Note</p>
          <h4 className="mt-1 text-2xl font-bold text-ink">{note.route}</h4>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{note.summary}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] ${
          note.urgency === "Urgent Reception Call" ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" : note.urgency === "Priority Review" ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
        }`}>
          {note.urgency === "Urgent Reception Call" ? <AlertTriangle size={15} /> : <BrainCircuit size={15} />}
          {note.urgency}
        </span>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Review flags</p>
          <div className="grid gap-2">
            {note.flags.map((flag) => (
              <span key={flag} className="rounded border border-line bg-soft/60 px-3 py-2 text-sm font-semibold text-teal-dark">{flag}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Preparation checklist</p>
          <ol className="grid gap-2">
            {note.preparation.map((item, index) => (
              <li key={item} className="flex gap-3 rounded border border-line bg-surface px-3 py-2 text-sm text-muted">
                <span className="font-bold text-brand">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Reception script</p>
            <button type="button" onClick={() => void copyScript()} className="inline-flex items-center gap-1 rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink hover:border-brand hover:text-brand">
              <Copy size={13} /> Copy
            </button>
          </div>
          <p className="rounded border border-line bg-surface p-3 text-sm leading-relaxed text-muted">{note.receptionScript}</p>
          <p className="mt-3 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-300">{note.safetyNote}</p>
        </div>
      </div>
    </div>
  );
}
