"use client";

import { Download, FileHeart, Plus, RefreshCw, Search, UserRoundCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { PatientRecord, PatientStatus } from "@/lib/patient-types";
import { bloodGroups, patientStatuses } from "@/lib/patient-types";
import { downloadCsv } from "@/lib/table-export";

const patientExportHeaders = ["UHID", "Name", "Phone", "Email", "Age", "Gender", "Blood Group", "City", "Status", "Last Visit"];

function patientExportRow(patient: PatientRecord) {
  return [
    patient.uhid,
    patient.name,
    patient.phone,
    patient.email ?? "",
    patient.age ?? "",
    patient.gender ?? "",
    patient.bloodGroup ?? "",
    patient.city ?? "",
    patient.status,
    patient.lastVisitAt ?? ""
  ];
}

type PatientResponse = {
  ok: boolean;
  patients?: PatientRecord[];
  patient?: PatientRecord;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function AdminPatients() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPatients() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/patients", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load patients.");
      setLoading(false);
      return;
    }
    setPatients(data.patients ?? []);
    setLoading(false);
  }

  async function addPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok || !data.patient) {
      setError(data.error || "Unable to save patient.");
      return;
    }
    setPatients((items) => [data.patient as PatientRecord, ...items.filter((item) => item.id !== data.patient?.id)]);
    form.reset();
  }

  async function updateStatus(id: string, status: PatientStatus) {
    const response = await fetch("/api/patients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as PatientResponse;
    if (!response.ok || !data.ok || !data.patient) {
      setError(data.error || "Unable to update patient.");
      return;
    }
    setPatients((items) => items.map((item) => (item.id === id ? data.patient as PatientRecord : item)));
  }

  useEffect(() => {
    let active = true;

    async function loadInitialPatients() {
      const response = await fetch("/api/patients", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as PatientResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load patients.");
        setLoading(false);
        return;
      }
      setPatients(data.patients ?? []);
      setLoading(false);
    }

    void loadInitialPatients();

    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return patients;
    return patients.filter((patient) =>
      [patient.uhid, patient.name, patient.phone, patient.email, patient.city, patient.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [patients, query]);

  const stats = useMemo(() => {
    return [
      { label: "Patient Records", value: patients.length },
      { label: "Active", value: patients.filter((patient) => patient.status === "Active").length },
      { label: "Flagged", value: patients.filter((patient) => patient.status === "Flagged").length },
      { label: "With Allergy Notes", value: patients.filter((patient) => Boolean(patient.allergies)).length }
    ];
  }, [patients]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Patient Master / UHID</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Permanent patient records</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            New appointment requests now create or match a UHID automatically by phone number. Use this master to manage core patient profile details.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(patientExportHeaders, filteredPatients.map(patientExportRow), "patients.csv")}
            disabled={filteredPatients.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadPatients()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh Patients
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.82fr_1.18fr]">
        <form onSubmit={addPatient} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Plus size={19} /> Create patient record</p>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" className={fieldClass} placeholder="Patient name" required />
              <input name="phone" className={fieldClass} placeholder="Mobile number" inputMode="tel" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input name="age" className={fieldClass} placeholder="Age" inputMode="numeric" />
              <select name="gender" className={fieldClass} defaultValue="">
                <option value="">Gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
              <select name="bloodGroup" className={fieldClass} defaultValue="">
                <option value="">Blood group</option>
                {bloodGroups.filter(Boolean).map((group) => <option key={group}>{group}</option>)}
              </select>
            </div>
            <input name="email" className={fieldClass} placeholder="Email" type="email" />
            <input name="emergencyContact" className={fieldClass} placeholder="Emergency contact" />
            <textarea name="address" className={`${fieldClass} min-h-20 py-3`} placeholder="Address" />
            <textarea name="allergies" className={`${fieldClass} min-h-20 py-3`} placeholder="Allergies / drug reactions" />
            <textarea name="chronicConditions" className={`${fieldClass} min-h-20 py-3`} placeholder="Chronic conditions, liver disease history, diabetes, hypertension..." />
            <textarea name="currentMedicines" className={`${fieldClass} min-h-20 py-3`} placeholder="Current medicines" />
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">
              Save Patient + Generate UHID
            </button>
          </div>
        </form>

        <div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search UHID, patient, phone, city"
              className="min-h-10 w-full rounded border border-line bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </label>

          <div className="mt-4 grid max-h-[720px] gap-3 overflow-auto pr-1">
            {loading ? <p className="rounded border border-line bg-soft/60 p-4 font-semibold text-muted">Loading patients...</p> : null}
            {!loading && filteredPatients.length === 0 ? (
              <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
                <FileHeart className="mx-auto text-brand" size={34} />
                <p className="mt-4 text-xl font-bold text-ink">No patient records found.</p>
              </div>
            ) : null}
            {filteredPatients.map((patient) => (
              <article key={patient.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand">{patient.uhid}</span>
                      <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{patient.status}</span>
                    </div>
                    <h3 className="mt-3 flex items-center gap-2 text-xl font-bold text-ink"><UserRoundCheck size={20} className="text-brand" /> {patient.name}</h3>
                    <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                      <p><span className="font-bold text-ink">Phone:</span> {patient.phone}</p>
                      <p><span className="font-bold text-ink">Age/Gender:</span> {[patient.age, patient.gender].filter(Boolean).join(" / ") || "-"}</p>
                      <p><span className="font-bold text-ink">Blood:</span> {patient.bloodGroup || "-"}</p>
                      <p><span className="font-bold text-ink">Last visit:</span> {patient.lastVisitAt ? new Date(patient.lastVisitAt).toLocaleDateString("en-IN") : "-"}</p>
                    </div>
                    {patient.allergies || patient.chronicConditions || patient.currentMedicines ? (
                      <div className="mt-3 grid gap-2">
                        {patient.allergies ? <p className="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm font-semibold text-red-800 dark:text-red-300">Allergies: {patient.allergies}</p> : null}
                        {patient.chronicConditions ? <p className="rounded border border-line bg-soft/60 p-3 text-sm text-muted"><span className="font-bold text-ink">Conditions:</span> {patient.chronicConditions}</p> : null}
                        {patient.currentMedicines ? <p className="rounded border border-line bg-soft/60 p-3 text-sm text-muted"><span className="font-bold text-ink">Medicines:</span> {patient.currentMedicines}</p> : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <a href={`tel:${patient.phone}`} className="rounded border border-line bg-surface px-4 py-2 text-center font-bold text-ink transition hover:border-brand hover:text-brand">Call</a>
                    <a href={`https://wa.me/${patient.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-4 py-2 text-center font-bold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950">WhatsApp</a>
                    <select
                      value={patient.status}
                      onChange={(event) => void updateStatus(patient.id, event.target.value as PatientStatus)}
                      className="rounded border border-line bg-surface px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    >
                      {patientStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
