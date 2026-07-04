"use client";

import { CalendarClock, ClipboardCheck, Download, RefreshCw, Search } from "lucide-react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import type { ProcedureChecklist, ProcedureSchedule, ProcedureScheduleStatus } from "@/lib/procedure-types";
import { procedureRooms, procedureScheduleStatuses } from "@/lib/procedure-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const procedureExportHeaders = ["Patient", "Phone", "Procedure", "Scheduled Date", "Scheduled Time", "Room", "Doctor", "Priority", "Status"];

function procedureExportRow(schedule: ProcedureSchedule) {
  return [
    schedule.patientName,
    schedule.phone,
    schedule.procedureTitle,
    schedule.scheduledDate,
    schedule.scheduledTime,
    schedule.room,
    schedule.doctor,
    schedule.priority,
    schedule.status
  ];
}

type ProcedureOption = {
  slug: string;
  title: string;
  summary: string;
};

type ProcedureResponse = {
  ok: boolean;
  schedules?: ProcedureSchedule[];
  schedule?: ProcedureSchedule;
  visits?: OpdVisit[];
  procedures?: ProcedureOption[];
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const checklistLabels: Array<{ key: keyof ProcedureChecklist; label: string }> = [
  { key: "consent", label: "Consent" },
  { key: "fastingConfirmed", label: "Fasting" },
  { key: "vitalsChecked", label: "Vitals" },
  { key: "allergiesReviewed", label: "Allergies" },
  { key: "reportsReviewed", label: "Reports" },
  { key: "attendantAvailable", label: "Attendant" },
  { key: "equipmentReady", label: "Equipment" },
  { key: "recoveryInstructions", label: "Recovery advice" }
];

function checklistProgress(schedule: ProcedureSchedule) {
  const values = Object.values(schedule.checklist);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

export function AdminProcedures() {
  const [schedules, setSchedules] = useState<ProcedureSchedule[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<ProcedureOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProcedures() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/procedures/schedule", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load procedure schedules.");
      setLoading(false);
      return;
    }
    setSchedules(data.schedules ?? []);
    setVisits(data.visits ?? []);
    setProcedureOptions(data.procedures ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialProcedures() {
      const response = await fetch("/api/procedures/schedule", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load procedure schedules.");
        setLoading(false);
        return;
      }
      setSchedules(data.schedules ?? []);
      setVisits(data.visits ?? []);
      setProcedureOptions(data.procedures ?? []);
      setLoading(false);
    }

    void loadInitialProcedures();

    return () => {
      active = false;
    };
  }, []);

  const filteredSchedules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return schedules;
    return schedules.filter((schedule) =>
      [schedule.id, schedule.token, schedule.uhid, schedule.patientName, schedule.procedureTitle, schedule.room, schedule.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [schedules, query]);

  const stats = useMemo(() => {
    return [
      { label: "Scheduled", value: schedules.length },
      { label: "Today", value: schedules.filter((schedule) => schedule.scheduledDate === new Date().toISOString().slice(0, 10)).length },
      { label: "In Procedure", value: schedules.filter((schedule) => schedule.status === "In Procedure").length },
      { label: "Completed", value: schedules.filter((schedule) => schedule.status === "Completed").length }
    ];
  }, [schedules]);

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/procedures/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
    if (!response.ok || !data.ok || !data.schedule) {
      setError(data.error || "Unable to create procedure schedule.");
      return;
    }
    setSchedules((items) => [data.schedule as ProcedureSchedule, ...items]);
    event.currentTarget.reset();
    setError("");
  }

  async function updateSchedule(id: string, updates: Partial<Pick<ProcedureSchedule, "status" | "findings" | "complications" | "notes" | "scheduledDate" | "scheduledTime" | "room" | "doctor" | "anesthesiaPlan">> & { checklist?: Partial<ProcedureChecklist> }) {
    const response = await fetch("/api/procedures/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as ProcedureResponse;
    if (!response.ok || !data.ok || !data.schedule) {
      setError(data.error || "Unable to update procedure schedule.");
      return;
    }
    setSchedules((items) => items.map((item) => (item.id === id ? data.schedule as ProcedureSchedule : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Procedure Scheduling</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Endoscopy, ERCP and therapeutic checklist</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Schedule procedures from OPD visits, manage prep and safety checks, then record findings and recovery instructions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(procedureExportHeaders, filteredSchedules.map(procedureExportRow), "procedures.csv")}
            disabled={filteredSchedules.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button type="button" onClick={() => void loadProcedures()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <RefreshCw size={17} /> Refresh Procedures
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

      <div className="grid gap-5 p-4 xl:grid-cols-[0.84fr_1.16fr]">
        <form onSubmit={createSchedule} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><CalendarClock size={19} /> Schedule procedure</p>
          <div className="grid gap-3">
            <select aria-label="OPD visit" name="visitId" className={fieldClass} required>
              <option value="">Select OPD visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>{visit.token} | {visit.patientName}{visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}</option>
              ))}
            </select>
            <select aria-label="Procedure" name="procedureSlug" className={fieldClass} required>
              <option value="">Select procedure</option>
              {procedureOptions.map((procedure) => <option key={procedure.slug} value={procedure.slug}>{procedure.title}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Scheduled date" name="scheduledDate" className={fieldClass} type="date" required />
              <input aria-label="Scheduled time" name="scheduledTime" className={fieldClass} type="time" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select aria-label="Room" name="room" className={fieldClass} defaultValue="Endoscopy Room">
                {procedureRooms.map((room) => <option key={room}>{room}</option>)}
              </select>
              <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Routine"><option>Routine</option><option>Urgent</option></select>
            </div>
            <input name="doctor" className={fieldClass} placeholder="Doctor" defaultValue="Dr. Deepak Kumar Sharma" />
            <input name="anesthesiaPlan" className={fieldClass} placeholder="Sedation / anesthesia plan" />
            <textarea name="notes" className={`${fieldClass} min-h-24 py-3`} placeholder="Preparation notes, consent remarks, special risks" />
            <button type="submit" className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">
              <ClipboardCheck size={17} /> Save Procedure Schedule
            </button>
          </div>
        </form>

        <div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search procedure, UHID, patient, room" className="min-h-10 w-full rounded border border-line bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </label>
          <div className="mt-4 grid max-h-[820px] gap-3 overflow-auto pr-1">
            {loading ? <ModuleSkeleton /> : null}
            {!loading && filteredSchedules.length === 0 ? (
              <ModuleEmptyState
                icon={CalendarClock}
                title="No procedures scheduled"
                description="Endoscopies, colonoscopies and other procedures you schedule appear here. Add one above, or adjust your search if you expected results."
              />
            ) : null}
            {filteredSchedules.map((schedule) => (
              <article key={schedule.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{schedule.id} | {schedule.token}{schedule.uhid ? ` | ${schedule.uhid}` : ""}</p>
                    <h3 className="mt-1 text-lg font-bold text-ink">{schedule.procedureTitle}</h3>
                    <p className="mt-1 text-sm text-muted">{schedule.patientName} | {schedule.scheduledDate} {schedule.scheduledTime} | {schedule.room}</p>
                  </div>
                  <select aria-label="Status" value={schedule.status} onChange={(event) => void updateSchedule(schedule.id, { status: event.target.value as ProcedureScheduleStatus })} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                    {procedureScheduleStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>

                <div className="mt-4 rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-cyan-900 dark:text-cyan-300">Checklist progress</p>
                    <p className="text-sm font-black text-brand">{checklistProgress(schedule)}%</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {checklistLabels.map((item) => (
                      <label key={item.key} className="flex items-center gap-2 rounded border border-cyan-100 dark:border-cyan-900 bg-surface px-3 py-2 text-xs font-bold text-ink">
                        <input
                          type="checkbox"
                          checked={schedule.checklist[item.key]}
                          onChange={(event) => void updateSchedule(schedule.id, { checklist: { [item.key]: event.target.checked } })}
                          className="h-4 w-4 accent-cyan-600"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input defaultValue={schedule.doctor} onBlur={(event) => void updateSchedule(schedule.id, { doctor: event.target.value })} className={fieldClass} placeholder="Doctor" />
                  <input defaultValue={schedule.anesthesiaPlan} onBlur={(event) => void updateSchedule(schedule.id, { anesthesiaPlan: event.target.value })} className={fieldClass} placeholder="Sedation / anesthesia" />
                </div>
                <textarea defaultValue={schedule.findings} onBlur={(event) => void updateSchedule(schedule.id, { findings: event.target.value })} className={`${fieldClass} mt-3 min-h-20 py-3`} placeholder="Procedure findings" />
                <textarea defaultValue={schedule.complications} onBlur={(event) => void updateSchedule(schedule.id, { complications: event.target.value })} className={`${fieldClass} mt-3 min-h-16 py-3`} placeholder="Complications / none" />
                <textarea defaultValue={schedule.notes} onBlur={(event) => void updateSchedule(schedule.id, { notes: event.target.value })} className={`${fieldClass} mt-3 min-h-16 py-3`} placeholder="Preparation / recovery notes" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
