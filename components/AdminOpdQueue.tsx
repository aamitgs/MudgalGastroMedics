"use client";

import { Banknote, ClipboardList, Download, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";
import { opdVisitStatuses } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { toast } from "sonner";

const opdExportHeaders = ["Token", "Patient", "Phone", "Service", "Status", "Billing Status", "Created"];

function opdExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.status, visit.billingStatus, visit.createdAt];
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  visit?: OpdVisit;
  error?: string;
};

const billingStatuses: OpdVisit["billingStatus"][] = ["Not Started", "Estimate Shared", "Paid"];
const paymentMethods: NonNullable<OpdVisit["paymentMethod"]>[] = ["Cash", "UPI", "Card", "Insurance", "Other"];

export function AdminOpdQueue() {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVisits() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/opd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load OPD queue.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setLoading(false);
  }

  async function updateVisit(id: string, updates: Partial<Pick<OpdVisit, "status" | "billingStatus" | "estimatedAmount" | "paymentMethod" | "notes">>) {
    const response = await fetch("/api/opd", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok || !data.visit) {
      setError(data.error || "Unable to update OPD visit.");
      return;
    }
    setVisits((items) => items.map((item) => (item.id === id ? data.visit as OpdVisit : item)));
    toast.success("Visit updated");
  }

  useEffect(() => {
    let active = true;

    async function loadInitialVisits() {
      const response = await fetch("/api/opd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as OpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load OPD queue.");
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

  const stats = useMemo(() => {
    return [
      { label: "Waiting", value: visits.filter((visit) => visit.status === "Waiting").length },
      { label: "In Consultation", value: visits.filter((visit) => visit.status === "In Consultation").length },
      { label: "Completed", value: visits.filter((visit) => visit.status === "Completed").length },
      { label: "Paid", value: visits.filter((visit) => visit.billingStatus === "Paid").length }
    ];
  }, [visits]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">OPD Queue</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Today&apos;s patient tokens</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(opdExportHeaders, visits.map(opdExportRow), "opd-queue.csv")}
            disabled={visits.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadVisits()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh Queue
          </button>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 p-4">
        {loading ? <ModuleSkeleton /> : null}
        {!loading && visits.length === 0 ? (
          <div className="rounded border border-dashed border-line bg-soft/60 p-8 text-center">
            <ClipboardList className="mx-auto text-brand" size={34} />
            <p className="mt-4 text-xl font-bold text-ink">No OPD tokens yet.</p>
            <p className="mt-2 text-muted">Create a token from an appointment request above.</p>
          </div>
        ) : null}
        {visits.map((visit) => (
          <article key={visit.id} className="rounded border border-line/80 bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto]">
              <div className="grid h-20 w-24 place-items-center rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 text-center">
                <span>
                  <span className="block text-xs font-black uppercase tracking-[0.14em] text-brand">Token</span>
                  <span className="mt-1 block text-2xl font-bold text-ink">{visit.token}</span>
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-ink">{visit.patientName}</h3>
                  {visit.uhid ? <span className="rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand">{visit.uhid}</span> : null}
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{visit.status}</span>
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-muted">{visit.billingStatus}</span>
                  {visit.receiptId ? <span className="rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">{visit.receiptId}</span> : null}
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
                  <p><span className="font-bold text-ink">Phone:</span> {visit.phone}</p>
                  <p><span className="font-bold text-ink">Service:</span> {visit.service}</p>
                  <p><span className="font-bold text-ink">Priority:</span> {visit.priority || "Routine"}</p>
                  <p><span className="font-bold text-ink">Payment:</span> {visit.paymentMethod || "Cash"} {visit.estimatedAmount ? `| Rs. ${visit.estimatedAmount}` : ""}</p>
                </div>
                {visit.symptoms.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visit.symptoms.map((symptom) => (
                      <span key={symptom} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-teal-dark">{symptom}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="grid content-start gap-2 lg:w-56">
                <select aria-label="Visit status"
                  value={visit.status}
                  onChange={(event) => void updateVisit(visit.id, { status: event.target.value as OpdVisitStatus })}
                  className="rounded border border-line bg-surface px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  {opdVisitStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <select aria-label="Billing status"
                  value={visit.billingStatus}
                  onChange={(event) => void updateVisit(visit.id, { billingStatus: event.target.value as OpdVisit["billingStatus"] })}
                  className="rounded border border-line bg-surface px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  {billingStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={visit.paymentMethod || "Cash"}
                  onChange={(event) => void updateVisit(visit.id, { paymentMethod: event.target.value as OpdVisit["paymentMethod"] })}
                  className="rounded border border-line bg-surface px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  {paymentMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
                <label className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    defaultValue={visit.estimatedAmount}
                    onBlur={(event) => void updateVisit(visit.id, { estimatedAmount: event.target.value })}
                    className="min-h-10 w-full rounded border border-line bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                    placeholder="Estimate"
                  />
                </label>
              </div>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><Stethoscope size={16} /> OPD Notes</span>
              <textarea
                defaultValue={visit.notes}
                onBlur={(event) => void updateVisit(visit.id, { notes: event.target.value })}
                className="min-h-20 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                placeholder="Consultation, billing or reception notes"
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
