"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Copy, FileDown, FileText, Printer, RefreshCw, Search, Send, ShieldCheck, Sparkles, Stamp, Stethoscope, UserPlus, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { detectDrugInteractions, type DrugInteractionMatch } from "@/lib/clinical/drug-interactions";
import { detectMedicationOverlap } from "@/lib/clinical/medication-overlap";
import { site } from "@/lib/site-data";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { DoctorRecentActivity } from "@/components/chrome/DoctorRecentActivity";
import { AiMedicalCertificateDraft } from "@/components/opd/AiMedicalCertificateDraft";
import { AiReferralLetterDraft } from "@/components/opd/AiReferralLetterDraft";
import { AiVisitAssistant } from "@/components/opd/AiVisitAssistant";
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
        <ActionButton variant="secondary" size="sm" onClick={() => void generate()} loading={loading}>
          <Sparkles size={13} /> {summary ? "Regenerate" : "Generate summary"}
        </ActionButton>
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
    let response: Response;
    try {
      response = await fetch("/api/clinical/allergy-acknowledged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, allergies: recorded, reason: reason.trim() })
      });
    } catch {
      // Previously unhandled: a thrown network error propagated past this
      // try/finally as an unhandled rejection, resetting saving but giving
      // zero explanation. This surfaces it instead of leaving the clinician
      // to guess why "Acknowledge" silently did nothing.
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void acknowledge());
      return;
    }
    try {
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
        <ActionButton variant="danger" className="shrink-0" onClick={() => void acknowledge()} loading={saving}>
          <CheckCircle2 size={16} /> Acknowledge — reviewed
        </ActionButton>
      </div>
    </div>
  );
}

/**
 * Drug–drug interaction alert at prescribe time (Clinical Safety, Track 0.5).
 * Renders only for `"high"` severity matches — `"moderate"` matches stay a
 * passive advisory inline in `PrescriptionField`, mirroring the duplicate-
 * medication check, so routine warnings don't dilute attention to the serious
 * ones. Non-blocking — the prescription still autosaves — but the clinician
 * must actively acknowledge review, audit-logged per drug pair along with an
 * optional reason. Resets whenever the set of matched interactions changes
 * (the prescription is live text, unlike the allergy list which is fixed for
 * the visit).
 */
function InteractionGuard({ visitId, matches }: { visitId: string; matches: DrugInteractionMatch[] }) {
  const signature = matches.map((match) => match.ruleId).sort().join("|");
  const [acknowledgedSignature, setAcknowledgedSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  if (!matches.length) return null;
  const acknowledged = acknowledgedSignature === signature;

  async function acknowledge() {
    setSaving(true);
    let responses: Response[];
    try {
      responses = await Promise.all(
        matches.map((match) =>
          fetch("/api/clinical/interaction-acknowledged", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId, drugA: match.drugA, drugB: match.drugB, reason: reason.trim() })
          })
        )
      );
    } catch {
      // Previously unhandled: Promise.all rejects the whole batch on the
      // first thrown network error, propagating as an unhandled rejection.
      // Retry resends every drug-pair acknowledgement in the batch again —
      // idempotent (records review state), not a partial-batch resume.
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void acknowledge());
      return;
    }
    try {
      if (responses.some((response) => !response.ok)) {
        notify.error("Could not record acknowledgement. Try again.");
        return;
      }
      setAcknowledgedSignature(signature);
      notify.success("Interaction reviewed", { id: "interaction-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Drug interaction reviewed before prescribing.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-red-300 bg-red-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-[0.1em] text-red-700">High-risk drug interaction</p>
          <div className="mt-2 grid gap-2.5">
            {matches.map((match) => (
              <div key={match.ruleId}>
                <p className="text-sm font-bold text-red-900">{match.drugA} + {match.drugB}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-red-800">{match.mechanism}</p>
                <p className="mt-0.5 text-xs font-semibold text-red-700">{match.guidance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional: note how this was addressed (e.g. switched drug, dose adjusted, monitoring planned)"
          className="min-h-10 flex-1 rounded border border-red-300 bg-white px-3 text-sm text-ink placeholder:text-red-900/40 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
        />
        <ActionButton variant="danger" className="shrink-0" onClick={() => void acknowledge()} loading={saving}>
          <CheckCircle2 size={16} /> Acknowledge — reviewed
        </ActionButton>
      </div>
    </div>
  );
}

/**
 * Positive patient identification before clinical writes (Clinical Safety,
 * Track 0.6). Unlike the allergy/interaction alerts — clinical-judgment calls
 * the doctor may reasonably override — there is no valid reason to write to a
 * chart without first confirming it's the right patient, so this is a
 * one-click gate (not a dismissible warning): the clinical note, prescription,
 * advice and follow-up fields stay disabled until confirmed. Standard
 * "two-patient-identifier" practice (name + phone; age when recorded, since
 * this record has no discrete date-of-birth field), audited per visit.
 */
function IdentityGuard({
  visitId,
  name,
  phone,
  age,
  onConfirmed
}: {
  visitId: string;
  name: string;
  phone: string;
  age?: string;
  onConfirmed: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/clinical/identity-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, patientName: name, phone })
      });
    } catch {
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void confirm());
      return;
    }
    try {
      if (!response.ok) {
        notify.error("Could not record identity confirmation. Try again.");
        return;
      }
      setConfirmed(true);
      onConfirmed();
      notify.success("Identity confirmed", { id: "identity-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Identity confirmed — {name}, {phone}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-cyan-300 bg-cyan-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.1em] text-brand">Confirm patient identity</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">
            Verify with the patient in front of you: <strong>{name}</strong>, phone {phone}
            {age ? `, age ${age}` : ""}. Clinical note, prescription, advice and follow-up unlock once confirmed.
          </p>
        </div>
      </div>
      <ActionButton variant="primary" className="self-start" onClick={() => void confirm()} loading={saving}>
        <CheckCircle2 size={16} /> Confirm identity — matches
      </ActionButton>
    </div>
  );
}

/**
 * Prescription entry with live duplicate-medication detection (Clinical Safety,
 * Track 0.4) and drug–drug interaction detection (Track 0.5). Advisory only —
 * both checks are free-text heuristics, so they warn and never block. Saving
 * is unchanged (onBlur).
 */
function FavouriteChips({ favourites, onPick }: { favourites: string[]; onPick: (value: string) => void }) {
  if (!favourites.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {favourites.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          title={value}
          className="max-w-[220px] truncate rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
        >
          <Sparkles size={11} className="mr-1 inline -mt-0.5" />
          {value}
        </button>
      ))}
    </div>
  );
}

function DiagnosisField({
  visit,
  disabled,
  favourites,
  onSave
}: {
  visit: OpdVisit;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(visit.diagnosis ?? "");

  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-ink">Diagnosis</span>
      {!draft.trim() ? <FavouriteChips favourites={favourites} onPick={(value) => { setDraft(value); onSave(value); }} /> : null}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => onSave(event.target.value)}
        disabled={disabled}
        className={inputClass}
        placeholder="Short working diagnosis / impression"
      />
    </label>
  );
}

function PrescriptionField({
  visit,
  currentMedicines,
  disabled,
  favourites,
  onSave
}: {
  visit: OpdVisit;
  currentMedicines?: string;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(visit.prescription ?? "");
  const overlap = useMemo(
    () => detectMedicationOverlap(draft, currentMedicines ?? ""),
    [draft, currentMedicines]
  );
  const interactions = useMemo(
    () => detectDrugInteractions(draft, currentMedicines ?? ""),
    [draft, currentMedicines]
  );
  const highRiskInteractions = interactions.filter((match) => match.severity === "high");
  const moderateInteractions = interactions.filter((match) => match.severity === "moderate");

  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-ink">Prescription</span>
      {!draft.trim() ? (
        <FavouriteChips
          favourites={favourites}
          onPick={(value) => {
            setDraft(value);
            onSave(value);
          }}
        />
      ) : null}
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => onSave(event.target.value)}
        disabled={disabled}
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
      {moderateInteractions.length ? (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
            {moderateInteractions.map((match) => (
              <p key={match.ruleId}>
                {match.drugA} + {match.drugB}: {match.mechanism}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {highRiskInteractions.length ? (
        <div className="mt-2">
          <InteractionGuard visitId={visit.id} matches={highRiskInteractions} />
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

const textareaClass = "min-h-28 w-full rounded border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-60";
const inputClass = "min-h-9 w-full rounded border border-line bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-soft disabled:opacity-60";

/** Distinct values used at least twice, most-frequent first — a single past entry isn't a "favourite". */
function topFrequent(values: (string | undefined)[], limit = 6) {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

export function DoctorPortalWorkspace() {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printable, setPrintable] = useState<PrintableDoctorSummary | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [creatingConsultation, setCreatingConsultation] = useState(false);

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

        <DoctorRecentActivity />

        <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
          <aside className="rounded border border-line/80 bg-white shadow-sm xl:self-start">
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
                <form onSubmit={createWalkInConsultation} className="mt-4 grid gap-2 rounded border border-line bg-soft/60 p-3">
                  <p className="text-xs font-bold text-ink">Start a walk-in consultation (no appointment needed)</p>
                  <div className="grid gap-2">
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

          <section className="grid gap-4">
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
  printSummary,
  favouriteDiagnoses,
  favouritePrescriptions
}: {
  visit: OpdVisit;
  patient?: PatientRecord;
  updateVisit: (id: string, updates: Partial<Pick<OpdVisit, "status" | "clinicalNote" | "diagnosis" | "prescription" | "advice" | "followUpDate" | "referralTo" | "referralLetter" | "certificateNote">>) => Promise<void>;
  copySummary: (visit: OpdVisit, patient?: PatientRecord) => Promise<void>;
  printSummary: (visit: OpdVisit, patient?: PatientRecord) => void;
  favouriteDiagnoses: string[];
  favouritePrescriptions: string[];
}) {
  const [identityConfirmed, setIdentityConfirmed] = useState(false);

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
            <ActionButton variant="primary" onClick={() => void updateVisit(visit.id, { status: "In Consultation" })}>Start</ActionButton>
            <ActionButton variant="success" onClick={() => void updateVisit(visit.id, { status: "Completed" })}>Complete</ActionButton>
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

        <AiVisitAssistant key={`${visit.id}-assistant`} visitId={visit.id} />

        <AllergyGuard key={visit.id} visitId={visit.id} allergies={patient?.allergies} />

        <IdentityGuard
          visitId={visit.id}
          name={visit.patientName}
          phone={visit.phone}
          age={patient?.age}
          onConfirmed={() => setIdentityConfirmed(true)}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            <DiagnosisField
              key={`${visit.id}-diagnosis`}
              visit={visit}
              disabled={!identityConfirmed}
              favourites={favouriteDiagnoses}
              onSave={(value) => void updateVisit(visit.id, { diagnosis: value })}
            />
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><FileText size={16} /> Clinical Note</span>
              <textarea
                defaultValue={visit.clinicalNote}
                onBlur={(event) => void updateVisit(visit.id, { clinicalNote: event.target.value })}
                disabled={!identityConfirmed}
                className={textareaClass}
                placeholder="History, examination, impression, procedure note"
              />
            </label>
          </div>
          <PrescriptionField
            key={visit.id}
            visit={visit}
            currentMedicines={patient?.currentMedicines}
            disabled={!identityConfirmed}
            favourites={favouritePrescriptions}
            onSave={(value) => void updateVisit(visit.id, { prescription: value })}
          />
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Advice / Procedure Instructions</span>
            <textarea
              defaultValue={visit.advice}
              onBlur={(event) => void updateVisit(visit.id, { advice: event.target.value })}
              disabled={!identityConfirmed}
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
              disabled={!identityConfirmed}
              className={inputClass}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton variant="secondary" className="whitespace-nowrap" onClick={() => void copySummary(visit, patient)}>
                <Copy size={16} /> Copy Summary
              </ActionButton>
              <ActionButton variant="primary" className="whitespace-nowrap" onClick={() => printSummary(visit, patient)}>
                <Printer size={16} /> Print
              </ActionButton>
              <a href={`/api/pdf/medical-certificate?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-soft px-4 font-bold text-ink hover:border-brand hover:text-brand">
                <Stamp size={16} /> Certificate
              </a>
              {visit.referralLetter?.trim() ? (
                <a href={`/api/pdf/referral-letter?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-soft px-4 font-bold text-ink hover:border-brand hover:text-brand">
                  <Send size={16} /> Referral Letter
                </a>
              ) : null}
              <a href={`/api/pdf/prescription?visitId=${encodeURIComponent(visit.id)}`} className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded border border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.22)]">
                <FileDown size={16} /> Download PDF
              </a>
            </div>
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Referred To</span>
            <input
              type="text"
              defaultValue={visit.referralTo}
              onBlur={(event) => void updateVisit(visit.id, { referralTo: event.target.value })}
              disabled={!identityConfirmed}
              className={inputClass}
              placeholder="Specialist name, department or facility"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Referral Letter</span>
            <textarea
              key={visit.referralLetter}
              defaultValue={visit.referralLetter}
              onBlur={(event) => void updateVisit(visit.id, { referralLetter: event.target.value })}
              disabled={!identityConfirmed}
              className={textareaClass}
              placeholder="Reason for referral and relevant findings"
            />
            <AiReferralLetterDraft
              visitId={visit.id}
              referredTo={visit.referralTo}
              onUseDraft={(draft) => void updateVisit(visit.id, { referralLetter: draft })}
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-ink">Certificate Note</span>
            <textarea
              key={visit.certificateNote}
              defaultValue={visit.certificateNote}
              onBlur={(event) => void updateVisit(visit.id, { certificateNote: event.target.value })}
              disabled={!identityConfirmed}
              className={textareaClass}
              placeholder="Optional custom wording for the medical certificate — leave blank to use the default findings/advice text"
            />
            <AiMedicalCertificateDraft
              visitId={visit.id}
              onUseDraft={(draft) => void updateVisit(visit.id, { certificateNote: draft })}
            />
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
