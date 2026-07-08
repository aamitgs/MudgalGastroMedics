"use client";

import { Activity, AlertTriangle, BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DrilldownPanel } from "@/components/design-system/DrilldownPanel";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const analyticsWindows = [7, 14, 30, 90] as const;
const chartColors = { brand: "#087d9e", green: "#10b981", amber: "#f59e0b" };

type AnalyticsSnapshot = {
  generatedAt: string;
  range: { days: number; from: string; to: string };
  executive: {
    appointmentConversion: number;
    opdCompletionRate: number;
    bedOccupancy: number;
    stockRisk: number;
    staffPresence: number;
    aiReviewRate: number;
  };
  volume: Record<string, number>;
  financial: {
    opdRevenue: number;
    ledgerIncome: number;
    ledgerExpense: number;
    ledgerBalance: number;
    pharmacyRevenue: number;
    labRevenue: number;
  };
  trend: Array<{
    date: string;
    appointments: number;
    opd: number;
    revenue: number;
    lab: number;
    pharmacy: number;
    procedures: number;
  }>;
  serviceMix: Array<{ label: string; value: number }>;
  symptomMix: Array<{ label: string; value: number }>;
  paymentMix: Array<{ label: string; value: number }>;
  workload: Array<{ label: string; value: number }>;
  risks: Record<string, number>;
};

type AnalyticsResponse = {
  ok: boolean;
  analytics?: AnalyticsSnapshot;
  error?: string;
};

function formatAmount(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

// Real Recharts bar list (Track 3.5) replacing hand-rolled CSS-width divs —
// same external shape (items/tone) as the component it replaces, so every
// call site below is unchanged.
function BarList({ items, tone = "brand" }: { items: Array<{ label: string; value: number }>; tone?: "brand" | "green" | "amber" }) {
  if (items.length === 0) return <p className="rounded border border-line bg-soft/60 p-4 text-sm font-semibold text-muted">No data yet.</p>;
  const color = chartColors[tone];
  return (
    <div style={{ height: Math.max(items.length * 34, 90) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ left: 12, right: 24 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ fill: "var(--site-soft)" }} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [windowDays, setWindowDays] = useState<(typeof analyticsWindows)[number]>(14);

  async function loadAnalytics() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/analytics?days=${windowDays}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as AnalyticsResponse;
    if (!response.ok || !data.ok || !data.analytics) {
      setError(data.error || "Unable to load analytics.");
      setLoading(false);
      return;
    }
    setAnalytics(data.analytics);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadOnWindowChange() {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/analytics?days=${windowDays}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as AnalyticsResponse;
      if (!active) return;
      if (!response.ok || !data.ok || !data.analytics) {
        setError(data.error || "Unable to load analytics.");
        setLoading(false);
        return;
      }
      setAnalytics(data.analytics);
      setLoading(false);
    }
    void loadOnWindowChange();
    return () => {
      active = false;
    };
  }, [windowDays]);

  const executiveCards = useMemo(() => {
    if (!analytics) return [];
    return [
      ["Appointment to OPD", analytics.executive.appointmentConversion],
      ["OPD Completion", analytics.executive.opdCompletionRate],
      ["Bed Occupancy", analytics.executive.bedOccupancy],
      ["Stock Risk", analytics.executive.stockRisk],
      ["Staff Presence", analytics.executive.staffPresence],
      ["AI Reviewed", analytics.executive.aiReviewRate]
    ];
  }, [analytics]);

  const trendBars = useMemo(() => {
    if (!analytics) return [];
    return analytics.trend.map((item) => ({
      label: item.date.slice(5),
      value: item.appointments + item.opd + item.lab + item.pharmacy + item.procedures
    }));
  }, [analytics]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Analytics</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Operational intelligence</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Track conversion, workload, revenue mix, care volume, operational risk and activity trends.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            Trend window
            <select
              value={windowDays}
              onChange={(event) => setWindowDays(Number(event.target.value) as (typeof analyticsWindows)[number])}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink"
            >
              {analyticsWindows.map((count) => (
                <option key={count} value={count}>
                  {count} days
                </option>
              ))}
            </select>
          </label>
          <ActionButton variant="secondary" onClick={() => void loadAnalytics()}>
            <RefreshCw size={17} /> Refresh Analytics
          </ActionButton>
        </div>
      </div>

      {error && analytics ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? (
        <div className="p-4">
          <ModuleSkeleton />
        </div>
      ) : null}

      {!loading && !analytics ? (
        <ModuleEmptyState
          icon={AlertTriangle}
          title="Unable to load analytics"
          description={error || "Something went wrong while loading operational intelligence."}
          action="Retry"
          onAction={() => void loadAnalytics()}
        />
      ) : null}

      {analytics ? (
        <>
          <div className="grid gap-4 border-b border-line p-4 md:grid-cols-3 xl:grid-cols-6">
            {executiveCards.map(([label, value]) => (
              <div key={String(label)} className="rounded border border-line bg-soft/60 p-4">
                <p className="text-xl font-bold text-ink">{value}%</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 border-b border-line p-4 xl:grid-cols-[1fr_0.85fr]">
            <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-lg font-bold text-ink"><TrendingUp size={19} /> Activity trend</p>
                <span className="rounded-full border border-line bg-soft px-3 py-1 text-xs font-bold text-muted">{analytics.range.from} to {analytics.range.to}</span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--site-line)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" name="Activity" stroke={chartColors.brand} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
              <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><BarChart3 size={19} /> Revenue analytics</p>
              <div className="grid gap-3">
                {[
                  ["OPD Revenue", formatAmount(analytics.financial.opdRevenue)],
                  ["Pharmacy Revenue", formatAmount(analytics.financial.pharmacyRevenue)],
                  ["Lab Revenue", formatAmount(analytics.financial.labRevenue)],
                  ["Ledger Income", formatAmount(analytics.financial.ledgerIncome)],
                  ["Ledger Expense", formatAmount(analytics.financial.ledgerExpense)],
                  ["Ledger Balance", formatAmount(analytics.financial.ledgerBalance)]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between rounded border border-line bg-surface px-4 py-3">
                    <span className="font-semibold text-muted">{label}</span>
                    <span className="font-bold text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-4 xl:grid-cols-3">
            <div className="rounded border border-line bg-surface p-4">
              <p className="mb-4 text-lg font-bold text-ink">Service mix</p>
              <BarList items={analytics.serviceMix} tone="brand" />
            </div>
            <div className="rounded border border-line bg-surface p-4">
              <p className="mb-4 text-lg font-bold text-ink">Symptom signals</p>
              <BarList items={analytics.symptomMix} tone="amber" />
            </div>
            <div className="rounded border border-line bg-surface p-4">
              <p className="mb-4 text-lg font-bold text-ink">Payment mix</p>
              <BarList items={analytics.paymentMix} tone="green" />
            </div>
          </div>

          <div className="grid gap-5 border-t border-line p-4 xl:grid-cols-[1fr_0.7fr]">
            <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
              <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><Activity size={19} /> Live workload</p>
              <BarList items={analytics.workload} />
            </div>
            <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),#fff7ed)] p-4">
              <p className="mb-4 text-lg font-bold text-ink">Risk watchlist</p>
              <div className="grid gap-3">
                {Object.entries(analytics.risks).map(([key, value]) => (
                  <DrilldownPanel key={key} metric={`risks.${key}`}>
                    <div className="flex justify-between rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 hover:border-amber-400">
                      <span className="font-semibold capitalize text-amber-900 dark:text-amber-300">{key.replace(/([A-Z])/g, " $1")}</span>
                      <span className="font-bold text-amber-900 dark:text-amber-300">{value}</span>
                    </div>
                  </DrilldownPanel>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
