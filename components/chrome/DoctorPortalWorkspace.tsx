"use client";

import { CalendarClock, CheckCircle2, ChevronsLeft, ChevronsRight, FileText, RefreshCw, Search, Stethoscope, UserPlus, UserRound } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { DoctorRecentActivity } from "@/components/chrome/DoctorRecentActivity";
import { DoctorConsultationCard } from "@/components/doctor-portal/DoctorConsultationCard";
import { DoctorPrintableSummary } from "@/components/doctor-portal/DoctorPrintableSummary";
import { createDoctorSummaryText, findPatientForVisit, topFrequent } from "@/components/doctor-portal/helpers";
import { notify } from "@/lib/notify";

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

export function DoctorPortalWorkspace({
  initialVisits,
  initialPatients
}: {
  initialVisits: OpdVisit[];
  initialPatients: PatientRecord[];
}) {
  const [visits, setVisits] = useState<OpdVisit[]>(initialVisits);
  const [patients, setPatients] = useState<PatientRecord[]>(initialPatients);
  const [selectedVisitId, setSelectedVisitId] = useState(
    () => initialVisits.find((visit) => visit.status !== "Completed" && visit.status !== "Cancelled")?.id || initialVisits[0]?.id || ""
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [printable, setPrintable] = useState<PrintableDoctorSummary | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [creatingConsultation, setCreatingConsultation] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

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

  async function updateVisit(id: string, updates: Partial<Pick<OpdVisit, "status" | "clinicalNote" | "diagnosis" | "prescription" | "advice" | "followUpDate" | "referralTo" | "referralLetter" | "certificateNote">>) {
    let response: Response;
    try {
      response = await fetch("/api/opd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      // The existing HTTP-error branch below deliberately stays on the
      // persistent setError banner (not a toast) — leave that as-is. This
      // only adds handling for the network-throw case, which previously had
      // none at all (not even the banner).
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateVisit(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok || !data.visit) {
      setError(data.error || "Unable to save consultation.");
      return;
    }
    setVisits((items) => items.map((item) => (item.id === id ? data.visit as OpdVisit : item)));
    notify.saved("Saved", { id: "doctor-autosave" });
  }

  // Takes the form element itself (captured synchronously at submit time),
  // never the synthetic event — React nulls event.currentTarget once the
  // handler's synchronous phase ends, which this function outlives via
  // multiple awaits, and the retry closure re-invokes this same function
  // much later still.
  async function submitWalkIn(form: HTMLFormElement) {
    const formData = new FormData(form);
    const patientName = String(formData.get("patientName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!patientName || !phone) {
      notify.error("Patient name and phone are required.");
      return;
    }
    setCreatingConsultation(true);
    const symptoms = String(formData.get("symptoms") || "")
      .split(",")
      .map((symptom) => symptom.trim())
      .filter(Boolean);
    const priority = formData.get("priority");
    let response: Response;
    try {
      response = await fetch("/api/opd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, phone, service: "OPD", symptoms, priority })
      });
    } catch {
      setCreatingConsultation(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitWalkIn(form));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    setCreatingConsultation(false);
    if (!response.ok || !data.ok || !data.visit) {
      notify.error(data.error || "Unable to start consultation.");
      return;
    }
    setVisits((items) => [data.visit as OpdVisit, ...items]);
    setSelectedVisitId(data.visit.id);
    setShowNewConsultation(false);
    form.reset();
    notify.success(`Consultation started for ${data.visit.patientName}.`);
  }

  function createWalkInConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitWalkIn(event.currentTarget);
  }

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

  // Favourites need real repeats, not a single past entry, so a one-off note
  // never gets surfaced as if it were a habitual choice.
  const favouriteDiagnoses = useMemo(() => topFrequent(visits.map((visit) => visit.diagnosis)), [visits]);
  const favouritePrescriptions = useMemo(() => topFrequent(visits.map((visit) => visit.prescription)), [visits]);

  async function copySummary(visit: OpdVisit, patient?: PatientRecord) {
    await navigator.clipboard.writeText(createDoctorSummaryText(visit, patient));
  }

  function printSummary(visit: OpdVisit, patient?: PatientRecord) {
    setPrintable({ visit, patient });
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="grid shrink-0 gap-3">
          {/* Overview panel — separate, independently toggled */}
          <div className="flex items-start gap-0">
            <button
              type="button"
              onClick={() => setStatsOpen((value) => !value)}
              aria-expanded={statsOpen}
              aria-label={statsOpen ? "Collapse Overview panel" : "Expand Overview panel"}
              title="Overview"
              className="grid h-14 w-6 shrink-0 place-items-center rounded-lg bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.35)] transition hover:-translate-y-0.5 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30"
            >
              {statsOpen ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
            </button>
            <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${statsOpen ? "ml-3 w-[360px] opacity-100" : "ml-0 w-0 opacity-0"}`}>
              <div className="w-[360px] rounded border border-line/80 bg-white shadow-sm">
                <div className="border-b border-line p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-600">Overview</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">Today&apos;s queue stats</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 p-4">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded border border-line/80 bg-white p-3 shadow-sm">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-soft text-brand">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 text-xs font-semibold uppercase leading-tight tracking-[0.1em] text-muted">{label}</span>
                      </span>
                      <span className="shrink-0 text-lg font-bold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity panel — separate, independently toggled */}
          <div className="flex items-start gap-0">
            <button
              type="button"
              onClick={() => setActivityOpen((value) => !value)}
              aria-expanded={activityOpen}
              aria-label={activityOpen ? "Collapse Recent Activity panel" : "Expand Recent Activity panel"}
              title="Recent Activity"
              className="grid h-14 w-6 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
            >
              {activityOpen ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
            </button>
            <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${activityOpen ? "ml-3 w-[360px] opacity-100" : "ml-0 w-0 opacity-0"}`}>
              <div className="w-[360px]">
                <DoctorRecentActivity />
              </div>
            </div>
          </div>

          {/* Doctor Queue panel — separate, independently toggled */}
          <div className="flex items-start gap-0">
            <button
              type="button"
              onClick={() => setQueueOpen((value) => !value)}
              aria-expanded={queueOpen}
              aria-label={queueOpen ? "Collapse Doctor Queue panel" : "Expand Doctor Queue panel"}
              title="Doctor Queue"
              className="grid h-14 w-6 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white shadow-[0_10px_24px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
            >
              {queueOpen ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
            </button>
            <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${queueOpen ? "ml-3 w-[360px] opacity-100" : "ml-0 w-0 opacity-0"}`}>
              <div className="w-[360px]">
                <aside className="rounded border border-line/80 bg-white shadow-sm">
                  <div className="border-b border-line p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Doctor Queue</p>
                        <h2 className="mt-1 text-xl font-bold text-ink">Consultations</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionButton variant="primary" onClick={() => setShowNewConsultation((value) => !value)} aria-expanded={showNewConsultation}>
                          <UserPlus size={16} /> New Consultation
                        </ActionButton>
                        <ActionButton variant="secondary" onClick={() => void loadWorkspace()} className="h-11 w-11 p-0" aria-label="Refresh doctor queue">
                          <RefreshCw size={17} />
                        </ActionButton>
                      </div>
                    </div>
                    {showNewConsultation ? (
                      <form onSubmit={createWalkInConsultation} className="mt-4 grid grid-cols-1 gap-2 rounded border border-line bg-soft/60 p-3">
                        <p className="text-xs font-bold text-ink">Start a walk-in consultation (no appointment needed)</p>
                        <div className="grid grid-cols-1 gap-2">
                          <input name="patientName" required placeholder="Patient name" className="min-h-9 rounded border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
                          <input name="phone" required type="tel" placeholder="Phone number" className="min-h-9 rounded border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
                        </div>
                        <input name="symptoms" placeholder="Symptoms, comma separated (optional)" className="min-h-9 rounded border border-line bg-white px-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
                        <div className="flex flex-wrap items-center gap-2">
                          <select name="priority" defaultValue="Routine" className="min-h-9 rounded border border-line bg-white px-2 text-sm font-semibold text-ink">
                            <option>Routine</option>
                            <option>Urgent</option>
                          </select>
                          <ActionButton type="submit" variant="primary" size="sm" disabled={creatingConsultation}>
                            {creatingConsultation ? "Starting…" : "Start Consultation"}
                          </ActionButton>
                          <ActionButton type="button" variant="ghost" size="sm" onClick={() => setShowNewConsultation(false)}>
                            Cancel
                          </ActionButton>
                        </div>
                      </form>
                    ) : null}
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
                  <div className="grid max-h-[780px] grid-cols-1 gap-3 overflow-auto p-4">
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
                        className={`rounded border p-3 text-left transition hover:-translate-y-0.5 hover:border-brand ${selectedVisit?.id === visit.id ? "border-brand bg-cyan-50 shadow-sm" : "border-line bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-base font-bold text-ink">{visit.patientName}</h3>
                          <span className="shrink-0 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-bold text-muted">{visit.status}</span>
                        </div>
                        <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.1em] text-brand">{visit.token}{visit.uhid ? ` | ${visit.uhid}` : ""}</p>
                        <p className="mt-1 truncate text-xs text-muted">{visit.service}</p>
                      </button>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 grid gap-4">
          {selectedVisit ? (
            <DoctorConsultationCard
              key={selectedVisit.id}
              visit={selectedVisit}
              patient={selectedPatient}
              updateVisit={updateVisit}
              copySummary={copySummary}
              printSummary={printSummary}
              favouriteDiagnoses={favouriteDiagnoses}
              favouritePrescriptions={favouritePrescriptions}
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
        </div>
      </div>

      {printable ? <DoctorPrintableSummary visit={printable.visit} patient={printable.patient} /> : null}
    </>
  );
}
