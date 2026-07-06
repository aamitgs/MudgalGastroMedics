"use client";

import { Activity, CheckCircle2, ClipboardList, Layers3, Plus, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { HmsBuildStatus, HmsModule, HmsModuleRecord, HmsRecordStatus } from "@/lib/hms-types";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

type HmsResponse = {
  ok: boolean;
  modules?: HmsModule[];
  records?: HmsModuleRecord[];
  record?: HmsModuleRecord;
  error?: string;
};

const statusTone: Record<HmsBuildStatus, string> = {
  "Live MVP": "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300",
  Foundation: "border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300",
  Planned: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
  "Production Pending": "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
};

const recordStatuses: HmsRecordStatus[] = ["Active", "Pending", "Completed", "On Hold"];
const priorities: HmsModuleRecord["priority"][] = ["Low", "Normal", "High", "Urgent"];
const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function AdminEnterpriseModules() {
  const [modules, setModules] = useState<HmsModule[]>([]);
  const [records, setRecords] = useState<HmsModuleRecord[]>([]);
  const [selectedModule, setSelectedModule] = useState("project-setup");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadModules() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/hms", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as HmsResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load platform modules.");
      setLoading(false);
      return;
    }
    setModules(data.modules ?? []);
    setRecords(data.records ?? []);
    setLoading(false);
  }

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/hms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as HmsResponse;
    if (!response.ok || !data.ok || !data.record) {
      setError(data.error || "Unable to save the record.");
      return;
    }
    setRecords((items) => [data.record as HmsModuleRecord, ...items]);
    form.reset();
  }

  async function updateRecord(id: string, status: HmsRecordStatus) {
    const response = await fetch("/api/hms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const data = (await response.json().catch(() => ({}))) as HmsResponse;
    if (!response.ok || !data.ok || !data.record) {
      setError(data.error || "Unable to update the record.");
      return;
    }
    setRecords((items) => items.map((item) => (item.id === id ? data.record as HmsModuleRecord : item)));
  }

  useEffect(() => {
    let active = true;

    async function loadInitialModules() {
      const response = await fetch("/api/hms", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as HmsResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load platform modules.");
        setLoading(false);
        return;
      }
      setModules(data.modules ?? []);
      setRecords(data.records ?? []);
      setLoading(false);
    }

    void loadInitialModules();

    return () => {
      active = false;
    };
  }, []);

  const selected = modules.find((module) => module.id === selectedModule) ?? modules[0];
  const selectedRecords = records.filter((record) => record.moduleId === selected?.id);
  const stats = useMemo(() => {
    const live = modules.filter((module) => module.status === "Live MVP").length;
    const foundation = modules.filter((module) => module.status === "Foundation").length;
    const planned = modules.filter((module) => module.status === "Planned").length;
    const completedRecords = records.filter((record) => record.status === "Completed").length;
    return [
      { label: "Total Modules", value: modules.length, icon: Layers3 },
      { label: "Live MVP", value: live, icon: Activity },
      { label: "Foundation", value: foundation, icon: ClipboardList },
      { label: "Completed Tasks", value: completedRecords, icon: CheckCircle2 },
      { label: "Planned Modules", value: planned, icon: Plus }
    ];
  }, [modules, records]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Platform Modules</p>
          <h2 className="mt-1 text-xl font-bold text-ink">30-module command center</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Every requested module now has a tracked product surface. Live MVP modules are usable today; foundation and planned modules are ready for deeper workflows.
          </p>
        </div>
        <ActionButton
          variant="secondary"
          onClick={() => void loadModules()}
        >
          <RefreshCw size={17} /> Refresh Modules
        </ActionButton>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-5">
        {loading ? <ModuleSkeleton /> : null}
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid max-h-[760px] gap-3 overflow-auto pr-1 md:grid-cols-2">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => setSelectedModule(module.id)}
              aria-pressed={selectedModule === module.id}
              className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:border-brand ${selectedModule === module.id ? "border-brand bg-cyan-50 dark:bg-cyan-950 shadow-sm" : "border-line bg-surface"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-brand">{String(module.order).padStart(2, "0")}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone[module.status]}`}>{module.status}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold leading-tight text-ink">{module.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{module.summary}</p>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))]">
            <div className="border-b border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">{selected.group} Module</p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{selected.name}</h3>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone[selected.status]}`}>{selected.status}</span>
              </div>
              <p className="mt-3 leading-relaxed text-muted">{selected.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.capabilities.map((capability) => (
                  <span key={capability} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-teal-dark">{capability}</span>
                ))}
              </div>
              <p className="mt-4 rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 p-3 text-sm font-semibold text-cyan-900 dark:text-cyan-300">
                Next: {selected.nextStep}
              </p>
            </div>

            <form onSubmit={addRecord} className="grid gap-3 border-b border-line p-4">
              <input type="hidden" name="moduleId" value={selected.id} />
              <p className="flex items-center gap-2 text-lg font-bold text-ink"><Plus size={18} /> Add module task / record</p>
              <input name="title" className={fieldClass} placeholder={`New ${selected.name} task`} required />
              <div className="grid gap-3 md:grid-cols-3">
                <select aria-label="Status" name="status" className={fieldClass} defaultValue="Pending">
                  {recordStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Normal">
                  {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
                <input name="owner" className={fieldClass} placeholder="Owner / team" defaultValue={selected.group} />
              </div>
              <textarea name="notes" className={`${fieldClass} min-h-24 py-3`} placeholder="Implementation notes, workflow details, or requirements" />
              <ActionButton type="submit" variant="primary">
                Save Module Record
              </ActionButton>
            </form>

            <div className="grid gap-3 p-4">
              {selectedRecords.length === 0 ? <p className="rounded border border-dashed border-line bg-surface p-4 text-sm font-semibold text-muted">No records yet for this module.</p> : null}
              {selectedRecords.map((record) => (
                <article key={record.id} className="rounded border border-line bg-surface p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{record.id} | {record.priority}</p>
                      <h4 className="mt-1 text-lg font-bold text-ink">{record.title}</h4>
                      <p className="mt-1 text-sm text-muted">Owner: {record.owner} | Updated {new Date(record.updatedAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <select aria-label="Status"
                      value={record.status}
                      onChange={(event) => void updateRecord(record.id, event.target.value as HmsRecordStatus)}
                      className="min-h-10 rounded border border-line bg-soft px-3 text-sm font-bold text-ink"
                    >
                      {recordStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                  {record.notes ? <p className="mt-3 rounded border border-line bg-soft/70 p-3 text-sm leading-relaxed text-muted">{record.notes}</p> : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
