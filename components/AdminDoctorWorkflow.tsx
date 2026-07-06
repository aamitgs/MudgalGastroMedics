"use client";

import { Copy, Download, FileText, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const doctorWorkflowExportHeaders = ["Token", "Patient", "Phone", "Service", "Status", "Clinical Note", "Prescription", "Follow-up Date"];

function doctorWorkflowExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.status, visit.clinicalNote ?? "", visit.prescription ?? "", visit.followUpDate ?? ""];
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  visit?: OpdVisit;
  error?: string;
};

const textareaClass = "min-h-24 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const inputClass = "min-h-10 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function AdminDoctorWorkflow() {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVisits() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/opd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load doctor workflow.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setLoading(false);
  }

  async function updateVisit(id: string, updates: Partial<Pick<OpdVisit, "clinicalNote" | "prescription" | "advice" | "followUpDate">>) {
    const response = await fetch("/api/opd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok || !data.visit) {
      setError(data.error || "Unable to save doctor workflow.");
      return;
    }
    setVisits((items) => items.map((item) => (item.id === id ? data.visit as OpdVisit : item)));
  }

  useEffect(() => {
    let active = true;

    async function loadInitialVisits() {
      const response = await fetch("/api/opd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as OpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load doctor workflow.");
        setLoading(false);
        return;
      }
      setVisits(data.visits ?? []);
      setLoading(false);
    }

    void loadInitialVisits();

    return () => {
      active = false;
    };
  }, []);

  const activeVisits = useMemo(() => {
    return visits.filter((visit) => visit.status !== "Cancelled").slice(0, 10);
  }, [visits]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Doctor Workflow</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Clinical notes and follow-up</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            variant="secondary"
            onClick={() => downloadCsv(doctorWorkflowExportHeaders, visits.map(doctorWorkflowExportRow), "doctor-workflow.csv")}
            disabled={visits.length === 0}
          >
            <Download size={17} /> Export CSV
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void loadVisits()}
          >
            <RefreshCw size={17} /> Refresh Visits
          </ActionButton>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 p-4">
        {loading ? <ModuleSkeleton /> : null}
        {!loading && activeVisits.length === 0 ? (
          <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
            <Stethoscope className="mx-auto text-brand" size={34} />
            <p className="mt-4 text-xl font-bold text-ink">No OPD visits available.</p>
            <p className="mt-2 text-muted">Create OPD tokens from appointment requests to start clinical workflow.</p>
          </div>
        ) : null}
        {activeVisits.map((visit) => (
          <DoctorVisitCard key={visit.id} visit={visit} updateVisit={updateVisit} />
        ))}
      </div>
    </div>
  );
}

function DoctorVisitCard({ visit, updateVisit }: { visit: OpdVisit; updateVisit: (id: string, updates: Partial<Pick<OpdVisit, "clinicalNote" | "prescription" | "advice" | "followUpDate">>) => Promise<void> }) {
  const patientSummary = [
    `Patient: ${visit.patientName}`,
    visit.uhid ? `UHID: ${visit.uhid}` : "",
    `Service: ${visit.service}`,
    `Token: ${visit.token}`,
    visit.clinicalNote ? `Clinical note: ${visit.clinicalNote}` : "",
    visit.prescription ? `Prescription: ${visit.prescription}` : "",
    visit.advice ? `Advice: ${visit.advice}` : "",
    visit.followUpDate ? `Follow-up: ${visit.followUpDate}` : ""
  ].filter(Boolean).join("\n");

  async function copySummary() {
    await navigator.clipboard.writeText(patientSummary);
  }

  return (
    <article className="rounded border border-line/80 bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{visit.token} | {visit.status}</p>
          <h3 className="mt-1 text-2xl font-bold text-ink">{visit.patientName}</h3>
          <p className="mt-2 text-sm text-muted">{visit.service} | {visit.phone}{visit.uhid ? ` | ${visit.uhid}` : ""}</p>
          {visit.symptoms.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {visit.symptoms.map((symptom) => (
                <span key={symptom} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-teal-dark">{symptom}</span>
              ))}
            </div>
          ) : null}
        </div>
        <ActionButton variant="secondary" onClick={() => void copySummary()} className="min-h-10 bg-surface">
          <Copy size={16} /> Copy Summary
        </ActionButton>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label>
          <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><FileText size={16} /> Clinical Note</span>
          <textarea
            defaultValue={visit.clinicalNote}
            onBlur={(event) => void updateVisit(visit.id, { clinicalNote: event.target.value })}
            className={textareaClass}
            placeholder="Doctor review notes, exam findings, procedure note, or clinical summary"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold text-ink">Prescription</span>
          <textarea
            defaultValue={visit.prescription}
            onBlur={(event) => void updateVisit(visit.id, { prescription: event.target.value })}
            className={textareaClass}
            placeholder="Medicine name, dose, duration, instructions"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold text-ink">Advice / Instructions</span>
          <textarea
            defaultValue={visit.advice}
            onBlur={(event) => void updateVisit(visit.id, { advice: event.target.value })}
            className={textareaClass}
            placeholder="Diet advice, procedure preparation, warning signs, report instructions"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold text-ink">Follow-up Date</span>
          <input
            type="date"
            defaultValue={visit.followUpDate}
            onBlur={(event) => void updateVisit(visit.id, { followUpDate: event.target.value })}
            className={inputClass}
          />
          <p className="mt-3 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-300">
            Doctor workflow notes are internal platform records. Final medical instructions should be reviewed by the clinician before sharing with patients.
          </p>
        </label>
      </div>
    </article>
  );
}
