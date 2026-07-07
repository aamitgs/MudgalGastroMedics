"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Copy, FileDown, FileText, Printer, RefreshCw, Search, ShieldCheck, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { detectMedicationOverlap } from "@/lib/clinical/medication-overlap";
import { site } from "@/lib/site-data";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { notify } from "@/lib/notify";

type AiSummaryResponse = {
  ok: boolean;
  summary?: string;
  safetyNote?: string;
  error?: string;
};

function AiPatientSummaryPanel({ phone }: { phone: string }) {
  const [summary, setSummary] = useState("");
  const [safetyNote, setSafetyNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/patient-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = (await response.json().catch(() => ({}))) as AiSummaryResponse;
    setLoading(false);
    if (!response.ok || !data.ok || !data.summary) {
      setError(data.error || "Unable to generate AI summary.");
      setSummary("");
      return;
    }
    setSummary(data.summary);
    setSafetyNote(data.safetyNote || "");
  }

  return (
    <div className="rounded border border-cyan-200 bg-cyan-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand"><Sparkles size={15} /> AI Clinical Brief</p>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="inline-flex min-h-9 items-center gap-2 rounded border border-cyan-300 bg-white px-3 text-xs font-bold text-brand transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={13} /> {loading ? "Generating..." : summary ? "Regenerate" : "Generate summary"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
      {summary ? (
        <div className="mt-3 rounded border border-cyan-200 bg-white p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{summary}</p>
          {safetyNote ? <p className="mt-2 text-xs font-semibold text-muted">{safetyNote}</p> : null}
        </div>
      ) : !error && !loading ? (
        <p className="mt-2 text-xs text-muted">Summarizes this patient&apos;s appointments, OPD visits and admissions into a short review brief.</p>
      ) : null}
    </div>
  );
}

/**
 * Active allergy alert at prescribe time (Clinical Safety, Track 0.1). Renders
 * only when the patient has a recorded allergy. Non-blocking — the prescription
 * still autosaves — but the clinician must actively acknowledge review, which
 * is audit-logged along with an optional clinical reason (e.g. "prescribed
 * anyway — patient no longer reacts", "switched to alternative drug"). The
 * reason is optional, not required, to keep acknowledgement itself
 * non-obstructive; the audit trail records "Not specified" when omitted.
 * Resets per visit (keyed on visit id at the call site).
 */
function AllergyGuard({ visitId, allergies }: { visitId: string; allergies?: string }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const recorded = allergies?.trim();
  if (!recorded) return null;

  async function acknowledge() {
    setSaving(true);
    try {
      const response = await fetch("/api/clinical/allergy-acknowledged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, allergies: recorded, reason: reason.trim() })
      });
      if (!response.ok) {
        notify.error("Could not record acknowledgement. Try again.");
        return;
      }
      setAcknowledged(true);
      notify.success("Allergies reviewed", { id: "allergy-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Allergies reviewed before prescribing: {recorded}
        {reason.trim() ? <span className="font-normal text-emerald-700"> — {reason.trim()}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-red-300 bg-red-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.1em] text-red-700">Allergy alert</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-red-900">
            Allergies on record: {recorded}. Confirm the prescription accounts for these before finalizing.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional: note how this was addressed (e.g. switched drug, patient no longer reacts)"
          className="min-h-10 flex-1 rounded border border-red-300 bg-white px-3 text-sm text-ink placeholder:text-red-900/40 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
        />
        <button
          type="button"
          onClick={() => void acknowledge()}
          disabled={saving}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded border border-red-600 bg-red-600 px-4 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          <CheckCircle2 size={16} /> {saving ? "Recording..." : "Acknowledge — reviewed"}
        </button>
      </div>
    </div>
  );
}

/**
 * Prescription entry with live duplicate-medication detection (Clinical Safety,
 * Track 0.4). Advisory only — the overlap check is a free-text heuristic, so it
 * warns "may duplicate, verify" and never blocks. Saving is unchanged (onBlur).
 */
function PrescriptionField({
  visit,
  currentMedicines,
  onSave
}: {
  visit: OpdVisit;
  currentMedicines?: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(visit.prescription ?? "");
  const overlap = useMemo(
    () => detectMedicationOverlap(draft, currentMedicines ?? ""),
    [draft, currentMedicines]
  );

  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-ink">Prescription</span>
      <textarea
        defaultValue={visit.prescription}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => onSave(event.target.value)}
        className={textareaClass}
        placeholder="Medicine, dose, frequency, duration, instructions"
      />
      {overlap.length ? (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
            May duplicate current medication: <span className="uppercase">{overlap.join(", ")}</span>. Verify before prescribing.
          </p>
        </div>
      ) : null}
    </label>
  );
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  visit?: OpdVisit;
  error?: string;
};

type PatientResponse = {
  ok: boolean;
  patients?: PatientRecord[];
  error?: string;
};

type PrintableDoctorSummary = {
  visit: OpdVisit;
  patient?: PatientRecord;
};

const textareaClass = "min-h-28 w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const inputClass = "min-h-9 w-full rounded border border-line bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function DoctorPortalWorkspace() {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printable, setPrintable] = useState<PrintableDoctorSummary | null>(null);

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    const [opdResponse, patientResponse] = await Promise.all([
      fetch("/api/opd", { cache: "no-store" }),
      fetch("/api/patients", { cache: "no-store" })
    ]);
    const opdData = (await opdResponse.json().catch(() => ({}))) as OpdResponse;
    const patientData = (await patientResponse.json().catch(() => ({}))) as PatientResponse;

    if (!opdResponse.ok || !opdData.ok) {
      setError(opdData.error || "Unable to load doctor queue.");
      setLoading(false);
      return;
    }

    if (!patientResponse.ok || !patientData.ok) {
      setError(patientData.error || "Unable to load patient records.");
      setLoading(false);
      return;
    }

    setVisits(opdData.visits ?? []);
    setPatients(patientData.patients ?? []);
    setSelectedVisitId((current) => current || opdData.visits?.find((visit) => visit.status !== "Completed" && visit.status !== "Cancelled")?.id || opdData.visits?.[0]?.id || "");
    setLoading(false);
  }

  async function updateVisit(id: string, updates: Partial<Pick<OpdVisit, "status" | "clinicalNote" | "prescription" | "advice" | "followUpDate">>) {
    const response = await fetch("/api/opd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok || !data.visit) {
      setError(data.error || "Unable to save consultation.");
      return;
    }
    setVisits((items) => items.map((item) => (item.id === id ? data.visit as OpdVisit : item)));
    notify.saved("Saved", { id: "doctor-autosave" });
  }

  useEffect(() => {
    let active = true;

    async function loadInitialWorkspace() {
      const [opdResponse, patientResponse] = await Promise.all([
        fetch("/api/opd", { cache: "no-store" }),
        fetch("/api/patients", { cache: "no-store" })
      ]);
      const opdData = (await opdResponse.json().catch(() => ({}))) as OpdResponse;
      const patientData = (await patientResponse.json().catch(() => ({}))) as PatientResponse;
      if (!active) return;

      if (!opdResponse.ok || !opdData.ok) {
        setError(opdData.error || "Unable to load doctor queue.");
        setLoading(false);
        return;
      }
      if (!patientResponse.ok || !patientData.ok) {
        setError(patientData.error || "Unable to load patient records.");
        setLoading(false);
        return;
      }

      setVisits(opdData.visits ?? []);
      setPatients(patientData.patients ?? []);
      setSelectedVisitId(opdData.visits?.find((visit) => visit.status !== "Completed" && visit.status !== "Cancelled")?.id || opdData.visits?.[0]?.id || "");
      setLoading(false);
    }

    void loadInitialWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const filteredVisits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const activeVisits = visits.filter((visit) => visit.status !== "Cancelled");
    if (!normalizedQuery) return activeVisits;
    return activeVisits.filter((visit) =>
      [visit.token, visit.uhid, visit.patientName, visit.phone, visit.service, visit.status, visit.symptoms.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [visits, query]);

  const selectedVisit = visits.find((visit) => visit.id === selectedVisitId) ?? filteredVisits[0];
  const selectedPatient = selectedVisit ? findPatientForVisit(selectedVisit, patients) : undefined;
  const followUps = visits
    .filter((visit) => visit.followUpDate && visit.status !== "Cancelled")
    .sort((left, right) => String(left.followUpDate).localeCompare(String(right.followUpDate)))
    .slice(0, 8);

  const stats = useMemo(() => {
    return [
      { label: "Waiting", value: visits.filter((visit) => visit.status === "Waiting").length, icon: CalendarClock },
      { label: "In Consultation", value: visits.filter((visit) => visit.status === "In Consultation").length, icon: Stethoscope },
      { label: "Completed", value: visits.filter((visit) => visit.status === "Completed").length, icon: CheckCircle2 },
      { label: "Follow-ups", value: visits.filter((visit) => Boolean(visit.followUpDate)).length, icon: FileText }
    ];
  }, [visits]);

  async function copySummary(visit: OpdVisit, patient?: PatientRecord) {
    await navigator.clipboard.writeText(createDoctorSummaryText(visit, patient));
  }

  function printSummary(visit: OpdVisit, patient?: PatientRecord) {
    setPrintable({ visit, patient });
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded border border-line/80 bg-white p-4 shadow-sm">
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

        <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded border border-line/80 bg-white shadow-sm">
            <div className="border-b border-line p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Doctor Queue</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">Consultations</h2>
                </div>
                <button type="button" onClick={() => void loadWorkspace()} className="grid h-11 w-11 place-items-center rounded border border-line bg-soft text-ink transition hover:border-brand hover:text-brand" aria-label="Refresh doctor queue">
                  <RefreshCw size={17} />
                </button>
              </div>
              <label className="relative mt-4 block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search token, UHID, patient"
                  className="min-h-9 w-full rounded border border-line bg-white pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </label>
            </div>
            {error ? <p className="border-b border-line bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
            <div className="grid max-h-[780px] gap-3 overflow-auto p-4">
              {loading ? <ModuleSkeleton /> : null}
              {!loading && filteredVisits.length === 0 ? (
                <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
                  <Stethoscope className="mx-auto text-brand" size={34} />
                  <p className="mt-4 text-xl font-bold text-ink">No consultation queue.</p>
                </div>
              ) : null}
              {filteredVisits.map((visit) => (
                <button
                  key={visit.id}
                  type="button"
                  onClick={() => setSelectedVisitId(visit.id)}
                  className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:border-brand ${selectedVisit?.id === visit.id ? "border-brand bg-cyan-50 shadow-sm" : "border-line bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{visit.token}{visit.uhid ? ` | ${visit.uhid}` : ""}</p>
                      <h3 className="mt-1 text-lg font-bold text-ink">{visit.patientName}</h3>
                    </div>
                    <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-muted">{visit.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{visit.service}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="grid gap-4">
            {selectedVisit ? (
              <DoctorConsultationCard
                visit={selectedVisit}
                patient={selectedPatient}
                updateVisit={updateVisit}
                copySummary={copySummary}
                printSummary={printSummary}
              />
            ) : (
              <div className="rounded border border-dashed border-line bg-white p-10 text-center shadow-sm">
                <UserRound className="mx-auto text-brand" size={38} />
                <p className="mt-4 text-2xl font-bold text-ink">Select a patient from the queue.</p>
              </div>
            )}

            <div className="rounded border border-line/80 bg-white shadow-sm">
              <div className="border-b border-line p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Follow-up List</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Upcoming review patients</h2>
              </div>
              <div className="grid gap-3 p-4">
                {followUps.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-4 text-sm font-semibold text-muted">No follow-up dates added yet.</p> : null}
                {followUps.map((visit) => (
                  <button key={visit.id} type="button" onClick={() => setSelectedVisitId(visit.id)} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-white p-4 text-left transition hover:border-brand hover:bg-cyan-50">
                    <span>
                      <span className="block font-bold text-ink">{visit.patientName}</span>
                      <span className="block text-sm text-muted">{visit.service}{visit.uhid ? ` | ${visit.uhid}` : ""}</span>
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-brand">{visit.followUpDate}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {printable ? <DoctorPrintableSummary visit={printable.visit} patient={printable.patient} /> : null}
    </>
  );
}

function DoctorConsultationCard({
  visit,
  patient,
  updateVisit,
  copySummary,
  printSummary
}: {
  visit: OpdVisit;
  patient?: PatientRecord;
  updateVisit: (id: string, updates: Partial<Pick<OpdVisit, "status" | "clinicalNote" | "prescription" | "advice" | "followUpDate">>) => Promise<void>;
  copySummary: (visit: OpdVisit, patient?: PatientRecord) => Promise<void>;
  printSummary: (visit: OpdVisit, patient?: PatientRecord) => void;
}) {
  return (
    <article className="rounded border border-line/80 bg-white shadow-sm">
      <div className="border-b border-line bg-[linear-gradient(135deg,#ffffff,#ecfeff)] p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{visit.token} | {visit.status}</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight text-ink">{visit.patientName}</h2>
            <p className="mt-2 text-sm font-semibold text-muted">{visit.service} | {visit.phone}{visit.uhid ? ` | ${visit.uhid}` : ""}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:min-w-[440px]">
            <button type="button" onClick={() => void updateVisit(visit.id, { status: "In Consultation" })} className="rounded border border-cyan-300/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 py-2 font-bold text-white shadow-[0_14px_30px_rgba(8,145,178,0.24)]">Start</button>
            <button type="button" onClick={() => void updateVisit(visit.id, { status: "Completed" })} className="rounded border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 py-2 font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.22)]">Complete</button>
            <select aria-label="Visit status"
              value={visit.status}
              onChange={(event) => void updateVisit(visit.id, { status: event.target.value as OpdVisitStatus })}
              className="rounded border border-line bg-white px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              {["Waiting", "In Consultation", "Completed", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Patient Context</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <p><span className="font-bold text-ink">Age/Gender:</span> {[patient?.age, patient?.gender].filter(Boolean).join(" / ") || "-"}</p>
              <p><span className="font-bold text-ink">Blood:</span> {patient?.bloodGroup || "-"}</p>
              <p><span className="font-bold text-ink">Emergency:</span> {patient?.emergencyContact || "-"}</p>
            </div>
          </div>
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">Allergies</p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-red-800">{patient?.allergies || "No allergy note recorded."}</p>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">History / Medicines</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{patient?.chronicConditions || patient?.currentMedicines || "No chronic history or medicine note recorded."}</p>
          </div>
        </div>

        {visit.symptoms.length ? (
          <div className="flex flex-wrap gap-2">
            {visit.symptoms.map((symptom) => (
              <span key={symptom} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-teal-dark">{symptom}</span>
            ))}
          </div>
        ) : null}

        <AiPatientSummaryPanel phone={visit.phone} />

        <AllergyGuard key={visit.id} visitId={visit.id} allergies={patient?.allergies} />

        <div className="grid gap-4 lg:grid-cols-2">
          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><FileText size={16} /> Clinical Note</span>
            <textarea
              defaultValue={visit.clinicalNote}
              onBlur={(event) => void updateVisit(visit.id, { clinicalNote: event.target.value })}
              className={textareaClass}
              placeholder="History, examination, impression, procedure note"
            />
          </label>
          <PrescriptionField
            key={visit.id}
            visit={visit}
            currentMedicines={patient?.currentMedicines}
            onSave={(value) => void updateVisit(visit.id, { prescription: value })}
          />
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Advice / Procedure Instructions</span>
            <textarea
              defaultValue={visit.advice}
              onBlur={(event) => void updateVisit(visit.id, { advice: event.target.value })}
              className={textareaClass}
              placeholder="Diet, warning signs, preparation, reports to bring"
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
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => void copySummary(visit, patient)} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-white px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
                <Copy size={16} /> Copy Summary
              </button>
              <button type="button" onClick={() => printSummary(visit, patient)} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-cyan-300/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(8,145,178,0.24)]">
                <Printer size={16} /> Print
              </button>
              <a href={`/api/pdf/prescription?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.22)]">
                <FileDown size={16} /> Download PDF
              </a>
            </div>
          </label>
        </div>
      </div>
    </article>
  );
}

function findPatientForVisit(visit: OpdVisit, patients: PatientRecord[]) {
  return patients.find((patient) => patient.id === visit.patientId || patient.uhid === visit.uhid || patient.phone.replace(/\D/g, "").endsWith(visit.phone.replace(/\D/g, "")));
}

function createDoctorSummaryText(visit: OpdVisit, patient?: PatientRecord) {
  return [
    site.name,
    `Patient: ${visit.patientName}`,
    visit.uhid ? `UHID: ${visit.uhid}` : "",
    `Token: ${visit.token}`,
    `Service: ${visit.service}`,
    patient?.allergies ? `Allergies: ${patient.allergies}` : "",
    visit.clinicalNote ? `Clinical note: ${visit.clinicalNote}` : "",
    visit.prescription ? `Prescription: ${visit.prescription}` : "",
    visit.advice ? `Advice: ${visit.advice}` : "",
    visit.followUpDate ? `Follow-up: ${visit.followUpDate}` : ""
  ].filter(Boolean).join("\n");
}

function DoctorPrintableSummary({ visit, patient }: { visit: OpdVisit; patient?: PatientRecord }) {
  return (
    <section className="patient-print">
      <div className="print-sheet">
        <header className="print-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mgm-logo.png" alt="Mudgal Gastro Medics logo" />
          <div>
            <h1>{site.name}</h1>
            <p>{site.tagline}</p>
            <p>{site.addressLine1}, {site.addressLine2}, {site.city}, {site.region} {site.postalCode}</p>
            <p>Phone: {site.phone} | WhatsApp: {site.mobile}</p>
          </div>
        </header>
        <div className="print-title">
          <div>
            <p>Doctor Consultation Summary</p>
            <h2>{visit.patientName}</h2>
          </div>
          <div>
            <p>Token</p>
            <strong>{visit.token}</strong>
          </div>
        </div>
        <dl className="print-grid">
          {visit.uhid ? <div><dt>UHID</dt><dd>{visit.uhid}</dd></div> : null}
          <div><dt>Service</dt><dd>{visit.service}</dd></div>
          <div><dt>Phone</dt><dd>{visit.phone}</dd></div>
          <div><dt>Age / Gender</dt><dd>{[patient?.age, patient?.gender].filter(Boolean).join(" / ") || "-"}</dd></div>
          <div><dt>Status</dt><dd>{visit.status}</dd></div>
          <div><dt>Follow-up</dt><dd>{visit.followUpDate || "-"}</dd></div>
        </dl>
        {patient?.allergies ? <section className="print-block"><h3>Allergies</h3><p>{patient.allergies}</p></section> : null}
        {visit.symptoms.length ? <section className="print-block"><h3>Symptoms</h3><p>{visit.symptoms.join(", ")}</p></section> : null}
        {visit.clinicalNote ? <section className="print-block"><h3>Clinical Note</h3><p>{visit.clinicalNote}</p></section> : null}
        {visit.prescription ? <section className="print-block"><h3>Prescription</h3><p>{visit.prescription}</p></section> : null}
        {visit.advice ? <section className="print-block"><h3>Advice</h3><p>{visit.advice}</p></section> : null}
        <footer className="print-footer">
          <p>Generated from doctor portal. Final instructions should be clinician-reviewed before sharing.</p>
          <p>Printed on {new Date().toLocaleDateString("en-IN")}</p>
        </footer>
      </div>
    </section>
  );
}
