"use client";

import { BedDouble, Salad, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { IpdAdmission } from "@/lib/ipd-types";
import type { PatientRecord } from "@/lib/patient-types";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { notify } from "@/lib/notify";

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const textareaClass = `${fieldClass} min-h-24 py-3`;

type PatientsResponse = { ok: boolean; patients?: PatientRecord[]; patient?: PatientRecord; error?: string };
type IpdResponse = { ok: boolean; admissions?: IpdAdmission[]; admission?: IpdAdmission; error?: string };

function DietPlanRow({ patient, onSave }: { patient: PatientRecord; onSave: (id: string, dietPlan: string) => Promise<void> }) {
  const [draft, setDraft] = useState(patient.dietPlan ?? "");
  return (
    <div className="rounded border border-line bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{patient.name}</h3>
        <span className="text-xs text-muted">
          {patient.uhid} · {patient.phone}
        </span>
      </div>
      {patient.chronicConditions || patient.allergies ? (
        <p className="mt-1 text-xs text-muted">
          {patient.chronicConditions ? `Chronic: ${patient.chronicConditions}` : ""}
          {patient.chronicConditions && patient.allergies ? " · " : ""}
          {patient.allergies ? `Allergies: ${patient.allergies}` : ""}
        </p>
      ) : null}
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => void onSave(patient.id, event.target.value)}
        className={`${textareaClass} mt-2`}
        placeholder="Diet plan — daily guidance, restrictions, follow-up notes"
      />
    </div>
  );
}

function AdmissionDietAdviceRow({ admission, onSave }: { admission: IpdAdmission; onSave: (id: string, dietAdvice: string) => Promise<void> }) {
  const [draft, setDraft] = useState(admission.dietAdvice ?? "");
  return (
    <div className="rounded border border-line bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{admission.patientName}</h3>
        <span className="text-xs text-muted">
          {admission.bedLabel} · {admission.ward}
        </span>
      </div>
      {admission.diagnosis ? <p className="mt-1 text-xs text-muted">Diagnosis: {admission.diagnosis}</p> : null}
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => void onSave(admission.id, event.target.value)}
        className={`${textareaClass} mt-2`}
        placeholder="Diet advice for this admission"
      />
    </div>
  );
}

export function AdminDietPlans() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    const [patientsResponse, ipdResponse] = await Promise.all([
      fetch("/api/patients", { cache: "no-store" }).catch(() => null),
      fetch("/api/ipd", { cache: "no-store" }).catch(() => null)
    ]);
    const patientsData = ((await patientsResponse?.json().catch(() => ({}))) ?? {}) as PatientsResponse;
    const ipdData = ((await ipdResponse?.json().catch(() => ({}))) ?? {}) as IpdResponse;
    setLoading(false);
    if (patientsResponse?.ok && patientsData.ok) setPatients(patientsData.patients ?? []);
    if (ipdResponse?.ok && ipdData.ok) setAdmissions((ipdData.admissions ?? []).filter((admission) => admission.status === "Admitted"));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveDietPlan(id: string, dietPlan: string) {
    const response = await fetch("/api/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dietPlan })
    });
    const data = (await response.json().catch(() => ({}))) as PatientsResponse;
    if (!response.ok || !data.ok || !data.patient) {
      notify.error(data.error || "Unable to save diet plan.");
      return;
    }
    setPatients((current) => current.map((patient) => (patient.id === id ? (data.patient as PatientRecord) : patient)));
    notify.saved("Diet plan saved", { id: "diet-plan-autosave" });
  }

  async function saveDietAdvice(admissionId: string, dietAdvice: string) {
    const response = await fetch("/api/ipd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: admissionId, dietAdvice })
    });
    const data = (await response.json().catch(() => ({}))) as IpdResponse;
    if (!response.ok || !data.ok || !data.admission) {
      notify.error(data.error || "Unable to save diet advice.");
      return;
    }
    setAdmissions((current) => current.map((admission) => (admission.id === admissionId ? (data.admission as IpdAdmission) : admission)));
    notify.saved("Diet advice saved", { id: "diet-advice-autosave" });
  }

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients.slice(0, 25);
    return patients
      .filter((patient) => [patient.name, patient.uhid, patient.phone].filter(Boolean).join(" ").toLowerCase().includes(normalized))
      .slice(0, 25);
  }, [patients, query]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Nutrition</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Diet plans</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Search a patient to write ongoing diet guidance, or update diet advice for a patient currently admitted.</p>
      </div>

      {loading ? (
        <div className="p-4">
          <ModuleSkeleton />
        </div>
      ) : (
        <div className="grid gap-5 p-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Salad size={16} className="text-brand" /> Patient diet plans
            </p>
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, UHID or phone" className={`${fieldClass} pl-9`} />
            </label>
            {filteredPatients.length === 0 ? (
              <ModuleEmptyState icon={Salad} title="No patients found" description="Search by name, UHID or phone to find a patient and write their diet plan." />
            ) : (
              <div className="grid max-h-[600px] gap-2 overflow-auto">
                {filteredPatients.map((patient) => (
                  <DietPlanRow key={patient.id} patient={patient} onSave={saveDietPlan} />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <BedDouble size={16} className="text-brand" /> Currently admitted
            </p>
            {admissions.length === 0 ? (
              <ModuleEmptyState icon={BedDouble} title="No active admissions" description="Diet advice for admitted patients appears here once someone is admitted." />
            ) : (
              <div className="grid max-h-[600px] gap-2 overflow-auto">
                {admissions.map((admission) => (
                  <AdmissionDietAdviceRow key={admission.id} admission={admission} onSave={saveDietAdvice} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
