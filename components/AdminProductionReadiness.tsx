"use client";

import { AlertTriangle, CheckCircle2, RefreshCw, Rocket, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProductionCheck, ProductionCheckStatus } from "@/lib/production-readiness";

type ProductionReadiness = {
  generatedAt: string;
  status: ProductionCheckStatus;
  summary: {
    passing: number;
    warning: number;
    failing: number;
    total: number;
  };
  checks: ProductionCheck[];
  releaseGate: boolean;
  recommendation: string;
};

type ReadinessResponse = {
  ok: boolean;
  readiness?: ProductionReadiness;
  error?: string;
};

function statusClass(status: ProductionCheckStatus) {
  if (status === "pass") return "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300";
  if (status === "warn") return "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300";
  return "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300";
}

function StatusIcon({ status }: { status: ProductionCheckStatus }) {
  if (status === "pass") return <CheckCircle2 size={18} />;
  if (status === "warn") return <AlertTriangle size={18} />;
  return <ShieldAlert size={18} />;
}

export function AdminProductionReadiness() {
  const [readiness, setReadiness] = useState<ProductionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReadiness() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/production/readiness", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ReadinessResponse;
    if (!response.ok || !data.ok || !data.readiness) {
      setError(data.error || "Unable to load production readiness.");
      setLoading(false);
      return;
    }
    setReadiness(data.readiness);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialReadiness() {
      const response = await fetch("/api/production/readiness", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ReadinessResponse;
      if (!active) return;
      if (!response.ok || !data.ok || !data.readiness) {
        setError(data.error || "Unable to load production readiness.");
        setLoading(false);
        return;
      }
      setReadiness(data.readiness);
      setLoading(false);
    }
    void loadInitialReadiness();
    return () => {
      active = false;
    };
  }, []);

  const checksByArea = useMemo(() => {
    if (!readiness) return [];
    const groups = new Map<string, ProductionCheck[]>();
    for (const check of readiness.checks) {
      groups.set(check.area, [...(groups.get(check.area) || []), check]);
    }
    return Array.from(groups.entries());
  }, [readiness]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Production</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Deployment readiness</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Environment, security, data, operations and compliance checks before going live with patient data.</p>
        </div>
        <button type="button" onClick={() => void loadReadiness()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
          <RefreshCw size={17} /> Refresh Readiness
        </button>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? <p className="border-b border-line p-4 font-semibold text-muted">Loading production readiness...</p> : null}

      {readiness ? (
        <>
          <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
            {[
              ["Passing", readiness.summary.passing],
              ["Warnings", readiness.summary.warning],
              ["Failing", readiness.summary.failing],
              ["Total Checks", readiness.summary.total]
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-line bg-soft/60 p-4">
                <p className="text-2xl font-bold text-ink">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className={`m-5 rounded border p-4 ${readiness.releaseGate ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950" : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"}`}>
            <div className="flex gap-3">
              <span className="mt-1 shrink-0">{readiness.releaseGate ? <Rocket size={22} className="text-emerald-700 dark:text-emerald-300" /> : <ShieldAlert size={22} className="text-red-700 dark:text-red-300" />}</span>
              <div>
                <p className={`text-lg font-bold ${readiness.releaseGate ? "text-emerald-900 dark:text-emerald-300" : "text-red-900 dark:text-red-300"}`}>
                  {readiness.releaseGate ? "Release gate open" : "Release gate blocked"}
                </p>
                <p className={`mt-1 text-sm leading-relaxed ${readiness.releaseGate ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>{readiness.recommendation}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-4 xl:grid-cols-2">
            {checksByArea.map(([area, checks]) => (
              <section key={area} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
                <p className="mb-4 text-lg font-bold text-ink">{area}</p>
                <div className="grid gap-3">
                  {checks.map((item) => (
                    <article key={item.id} className={`rounded border p-4 ${statusClass(item.status)}`}>
                      <div className="flex items-start gap-3">
                        <StatusIcon status={item.status} />
                        <div>
                          <p className="font-bold">{item.label}</p>
                          <p className="mt-1 text-sm leading-relaxed opacity-90">{item.detail}</p>
                          <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] opacity-80">{item.action}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="border-t border-line p-4 text-xs font-semibold text-muted">Generated {new Date(readiness.generatedAt).toLocaleString("en-IN")}</p>
        </>
      ) : null}
    </div>
  );
}
