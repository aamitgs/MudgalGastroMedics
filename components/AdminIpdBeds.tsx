"use client";

import { BedDouble, FileDown, RefreshCw, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BedWardMap, type OccupancyStats } from "@/components/design-system/BedWardMap";
import type { BedStatus, BedTransfer, HospitalBed, IpdAdmission, IpdAdmissionStatus, VitalsReading } from "@/lib/ipd-types";
import { ipdAdmissionStatuses } from "@/lib/ipd-types";
import type { OpdVisit } from "@/lib/opd-types";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { toast } from "sonner";

type IpdResponse = {
  ok: boolean;
  beds?: HospitalBed[];
  admissions?: IpdAdmission[];
  admission?: IpdAdmission;
  bed?: HospitalBed;
  visits?: OpdVisit[];
  vitals?: VitalsReading[];
  transfers?: BedTransfer[];
  transfer?: BedTransfer;
  reading?: VitalsReading;
  occupancy?: OccupancyStats;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

const emptyOccupancy: OccupancyStats = {
  totalBeds: 0,
  occupiedBeds: 0,
  hospitalOccupancyPercent: 0,
  bedsPendingTurnover: 0,
  bedsOverdueTurnover: 0,
  averageLengthOfStayDays: 0,
  projectedVacancies24h: 0,
  wardOccupancy: []
};

export function AdminIpdBeds() {
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [vitals, setVitals] = useState<VitalsReading[]>([]);
  const [transfers, setTransfers] = useState<BedTransfer[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyStats>(emptyOccupancy);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function applySnapshot(data: IpdResponse) {
    setBeds(data.beds ?? []);
    setAdmissions(data.admissions ?? []);
    setVisits(data.visits ?? []);
    setVitals(data.vitals ?? []);
    setTransfers(data.transfers ?? []);
    setOccupancy(data.occupancy ?? emptyOccupancy);
  }

  async function loadIpd() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ipd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load IPD.");
      setLoading(false);
      return;
    }
    applySnapshot(data);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialIpd() {
      const response = await fetch("/api/ipd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as IpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load IPD.");
        setLoading(false);
        return;
      }
      applySnapshot(data);
      setLoading(false);
    }

    void loadInitialIpd();

    return () => {
      active = false;
    };
  }, []);

  async function patchIpd(payload: Record<string, unknown>) {
    const response = await fetch("/api/ipd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to update IPD.");
      return null;
    }
    setError("");
    toast.success("IPD update saved");
    return data;
  }

  async function handleTransfer(admissionId: string, toBedId: string, reason: string) {
    const data = await patchIpd({ type: "transfer", admissionId, toBedId, reason });
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
    if (data.beds) setBeds(data.beds);
    if (data.transfer) setTransfers((items) => [data.transfer as BedTransfer, ...items]);
    void loadIpd();
  }

  async function handleLogVitals(admissionId: string, payload: Partial<VitalsReading>) {
    const data = await patchIpd({ type: "vitals", admissionId, ...payload });
    if (!data) return;
    if (data.reading) setVitals((items) => [data.reading as VitalsReading, ...items]);
  }

  async function handleEscalate(admissionId: string, escalated: boolean, reason?: string) {
    const data = await patchIpd({ type: "escalate", id: admissionId, escalated, reason });
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
  }

  async function handleBedStatus(bedId: string, status: BedStatus) {
    const data = await patchIpd({ type: "bed", id: bedId, status });
    if (!data) return;
    if (data.bed) setBeds((items) => items.map((item) => (item.id === data.bed!.id ? data.bed! : item)));
  }

  async function handleMarkForDischarge(admissionId: string, markedForDischarge: boolean) {
    const data = await patchIpd({ id: admissionId, markedForDischarge });
    if (!data) return;
    if (data.admission) setAdmissions((items) => items.map((item) => (item.id === data.admission!.id ? data.admission! : item)));
  }

  const filteredAdmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return admissions;
    return admissions.filter((admission) =>
      [admission.id, admission.token, admission.uhid, admission.patientName, admission.phone, admission.bedLabel, admission.status, admission.diagnosis]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [admissions, query]);

  async function createAdmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/ipd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.admission) {
      setError(data.error || "Unable to admit patient.");
      return;
    }
    setAdmissions((items) => [data.admission as IpdAdmission, ...items.filter((item) => item.id !== data.admission?.id)]);
    setBeds(data.beds ?? beds);
    toast.success("Patient admitted");
    event.currentTarget.reset();
    setError("");
  }

  async function updateAdmission(id: string, updates: Partial<Pick<IpdAdmission, "status" | "bedId" | "diagnosis" | "carePlan" | "nursingNotes" | "dietAdvice" | "depositAmount" | "dischargeSummary" | "assignedNurse" | "expectedDischargeDate">>) {
    const response = await fetch("/api/ipd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.admission) {
      setError(data.error || "Unable to update admission.");
      return;
    }
    setAdmissions((items) => items.map((item) => (item.id === id ? data.admission as IpdAdmission : item)));
    setBeds(data.beds ?? beds);
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">IPD + Bed Management</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Admissions and live bed board</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Admit from OPD, assign beds, transfer rooms, track nursing notes and discharge summaries.</p>
        </div>
        <button type="button" onClick={() => void loadIpd()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
          <RefreshCw size={17} /> Refresh IPD
        </button>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="border-b border-line p-4">
        <BedWardMap
          beds={beds}
          admissions={admissions}
          vitals={vitals}
          transfers={transfers}
          visits={visits}
          occupancy={occupancy}
          onTransfer={handleTransfer}
          onLogVitals={handleLogVitals}
          onEscalate={handleEscalate}
          onBedStatus={handleBedStatus}
          onMarkForDischarge={handleMarkForDischarge}
        />
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.84fr_1.16fr]">
        <form onSubmit={createAdmission} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><BedDouble size={19} /> Admit patient</p>
          <div className="grid gap-3">
            <select aria-label="OPD visit" name="visitId" className={fieldClass} required>
              <option value="">Select OPD visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>{visit.token} | {visit.patientName}{visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}</option>
              ))}
            </select>
            <select aria-label="Bed" name="bedId" className={fieldClass} required>
              <option value="">Select vacant bed</option>
              {beds.filter((bed) => bed.status === "Vacant").map((bed) => <option key={bed.id} value={bed.id}>{bed.label} | {bed.ward}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <select aria-label="Admission type" name="admissionType" className={fieldClass} defaultValue="Observation">
                {["Observation", "Post Procedure", "Planned", "Emergency"].map((type) => <option key={type}>{type}</option>)}
              </select>
              <input name="depositAmount" className={fieldClass} type="number" min="0" placeholder="Deposit amount" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="admittingDoctor" className={fieldClass} placeholder="Admitting doctor" defaultValue="Dr. Deepak Kumar Sharma" />
              <input name="assignedNurse" className={fieldClass} placeholder="Assigned nurse" />
            </div>
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Expected discharge
              <input aria-label="Expected discharge date" name="expectedDischargeDate" className={fieldClass} type="datetime-local" />
            </label>
            <input name="diagnosis" className={fieldClass} placeholder="Provisional diagnosis" required />
            <textarea name="carePlan" className={`${fieldClass} min-h-24 py-3`} placeholder="Care plan / monitoring instructions" />
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">
              Create Admission
            </button>
          </div>
        </form>

        <div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admission, UHID, patient, bed" className="min-h-10 w-full rounded border border-line bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </label>
          <div className="mt-4 grid max-h-[820px] gap-3 overflow-auto pr-1">
            {loading ? <ModuleSkeleton /> : null}
            {!loading && filteredAdmissions.length === 0 ? <p className="rounded border border-dashed border-line bg-soft/60 p-4 text-sm font-semibold text-muted">No IPD admissions yet.</p> : null}
            {filteredAdmissions.map((admission) => (
              <article key={admission.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{admission.id} | {admission.token}{admission.uhid ? ` | ${admission.uhid}` : ""}</p>
                    <h3 className="mt-1 text-lg font-bold text-ink">{admission.patientName}</h3>
                    <p className="mt-1 text-sm text-muted">{admission.bedLabel} | {admission.ward} | {admission.diagnosis}</p>
                  </div>
                  <select aria-label="Admission status" value={admission.status} onChange={(event) => void updateAdmission(admission.id, { status: event.target.value as IpdAdmissionStatus })} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                    {ipdAdmissionStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <select aria-label="Bed" value={admission.bedId} onChange={(event) => void updateAdmission(admission.id, { bedId: event.target.value })} className={fieldClass} disabled={admission.status !== "Admitted"}>
                    <option value={admission.bedId}>{admission.bedLabel}</option>
                    {beds.filter((bed) => bed.status === "Vacant").map((bed) => <option key={bed.id} value={bed.id}>{bed.label} | {bed.ward}</option>)}
                  </select>
                  <input defaultValue={admission.depositAmount} onBlur={(event) => void updateAdmission(admission.id, { depositAmount: Number(event.target.value) })} className={fieldClass} type="number" min="0" placeholder="Deposit" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input defaultValue={admission.assignedNurse} onBlur={(event) => void updateAdmission(admission.id, { assignedNurse: event.target.value })} className={fieldClass} placeholder="Assigned nurse" />
                  <input defaultValue={admission.expectedDischargeDate} onBlur={(event) => void updateAdmission(admission.id, { expectedDischargeDate: event.target.value })} className={fieldClass} type="datetime-local" />
                </div>
                <textarea defaultValue={admission.carePlan} onBlur={(event) => void updateAdmission(admission.id, { carePlan: event.target.value })} className={`${fieldClass} mt-3 min-h-20 py-3`} placeholder="Care plan" />
                <textarea defaultValue={admission.nursingNotes} onBlur={(event) => void updateAdmission(admission.id, { nursingNotes: event.target.value })} className={`${fieldClass} mt-3 min-h-20 py-3`} placeholder="Nursing notes" />
                <textarea defaultValue={admission.dietAdvice} onBlur={(event) => void updateAdmission(admission.id, { dietAdvice: event.target.value })} className={`${fieldClass} mt-3 min-h-16 py-3`} placeholder="Diet advice" />
                <textarea defaultValue={admission.dischargeSummary} onBlur={(event) => void updateAdmission(admission.id, { dischargeSummary: event.target.value })} className={`${fieldClass} mt-3 min-h-20 py-3`} placeholder="Discharge summary" />
                <a
                  href={`/api/pdf/discharge-summary?admissionId=${encodeURIComponent(admission.id)}`}
                  className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded border border-line bg-soft px-4 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  <FileDown size={15} /> Download Discharge Summary PDF
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
