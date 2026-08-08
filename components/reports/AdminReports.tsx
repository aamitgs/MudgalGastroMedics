"use client";

import { AlertTriangle, BarChart3, CalendarDays, ClipboardList, PackageX, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DrilldownPanel } from "@/components/design-system/DrilldownPanel";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type AdminReport = {
  generatedAt: string;
  appointments: {
    total: number;
    today: number;
    new: number;
    confirmed: number;
    urgent: number;
  };
  patients: {
    total: number;
    active: number;
    flagged: number;
    addedToday: number;
  };
  opd: {
    total: number;
    today: number;
    waiting: number;
    inConsultation: number;
    completedToday: number;
  };
  billing: {
    paidToday: number;
    paidTotal: number;
    pendingEstimate: number;
    receiptsToday: number;
    revenueByMethod: Array<{ method: string; total: number }>;
  };
  pharmacy: {
    dispensesToday: number;
    totalDispenses: number;
    paidToday: number;
    unpaidTotal: number;
  };
  lab: {
    ordersToday: number;
    totalOrders: number;
    resultReady: number;
    paidToday: number;
    unpaidTotal: number;
  };
  procedures: {
    scheduledToday: number;
    totalScheduled: number;
    active: number;
    completedToday: number;
    readyToday: number;
  };
  ipd: {
    totalBeds: number;
    vacantBeds: number;
    occupiedBeds: number;
    activeAdmissions: number;
    dischargesToday: number;
  };
  finance: {
    activeClaims: number;
    settledClaims: number;
    claimSettledTotal: number;
    incomeToday: number;
    expenseToday: number;
    ledgerBalance: number;
  };
  hr: {
    totalStaff: number;
    activeStaff: number;
    onLeave: number;
    presentToday: number;
    absentToday: number;
  };
  communication: {
    totalLogs: number;
    today: number;
    sentToday: number;
    queued: number;
    followUpNeeded: number;
  };
  ai: {
    totalReviews: number;
    needsReview: number;
    escalated: number;
    reviewed: number;
  };
  automation: {
    totalTasks: number;
    open: number;
    queued: number;
    escalated: number;
    done: number;
  };
  inventory: {
    totalItems: number;
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      name: string;
      category: string;
      quantity: number;
      reorderLevel: number;
      unit: string;
    }>;
  };
  availableDoctors: string[];
};

type ReportResponse = {
  ok: boolean;
  report?: AdminReport;
  error?: string;
};

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminReports() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState(todayKey());
  const [to, setTo] = useState(todayKey());
  const [doctor, setDoctor] = useState("");

  async function loadReport(range: { from: string; to: string }) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ from: range.from, to: range.to });
    if (doctor) params.set("doctor", doctor);
    const response = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as ReportResponse;
    if (!response.ok || !data.ok || !data.report) {
      setError(data.error || "Unable to load reports.");
      setLoading(false);
      return;
    }
    setReport(data.report);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadOnRangeChange() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ from, to });
      if (doctor) params.set("doctor", doctor);
      const response = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as ReportResponse;
      if (!active) return;
      if (!response.ok || !data.ok || !data.report) {
        setError(data.error || "Unable to load reports.");
        setLoading(false);
        return;
      }
      setReport(data.report);
      setLoading(false);
    }

    void loadOnRangeChange();

    return () => {
      active = false;
    };
  }, [from, to, doctor]);

  function resetToToday() {
    setFrom(todayKey());
    setTo(todayKey());
  }

  const range = { from, to };

  // Not every tile drills the same way: "today"-scoped ones (appointments,
  // OPD) respect the selected date range; the rest are current-state totals
  // (patient records on file, active admissions, staff roster...) with no
  // date dimension to filter by, so only a representative, genuinely
  // drillable subset gets a metric key here.
  const kpis = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Appointments Today", value: report.appointments.today, icon: CalendarDays, metric: "appointments.today" },
      { label: "Patient Records", value: report.patients.total, icon: ClipboardList },
      { label: "OPD Visits Today", value: report.opd.today, icon: ClipboardList, metric: "opd.today" },
      { label: "Revenue Today", value: formatAmount(report.billing.paidToday), icon: BarChart3 },
      { label: "Pharmacy Today", value: formatAmount(report.pharmacy.paidToday), icon: BarChart3 },
      { label: "Lab Orders", value: report.lab.ordersToday, icon: ClipboardList },
      { label: "Procedures", value: report.procedures.scheduledToday, icon: ClipboardList },
      { label: "IPD Active", value: report.ipd.activeAdmissions, icon: ClipboardList },
      { label: "Claims", value: report.finance.activeClaims, icon: ClipboardList },
      { label: "Staff Present", value: report.hr.presentToday, icon: ClipboardList },
      { label: "Follow-up Logs", value: report.communication.followUpNeeded, icon: ClipboardList },
      { label: "AI Review", value: report.ai.needsReview, icon: ClipboardList },
      { label: "Auto Tasks", value: report.automation.open, icon: ClipboardList },
      { label: "Low Stock Items", value: report.inventory.lowStockCount, icon: PackageX, metric: "inventory.lowStock" }
    ];
  }, [report]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Management Reports</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Daily operating summary</h2>
          {report ? <p className="mt-1 text-sm text-muted">Generated {new Date(report.generatedAt).toLocaleString("en-IN")}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            From
            <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="min-h-9 rounded border border-line bg-surface px-2 text-sm text-ink" />
          </label>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            To
            <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="min-h-9 rounded border border-line bg-surface px-2 text-sm text-ink" />
          </label>
          {report && report.availableDoctors.length > 0 ? (
            <label className="flex items-center gap-1.5 text-sm font-semibold text-muted">
              Doctor
              <select
                value={doctor}
                onChange={(event) => setDoctor(event.target.value)}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm text-ink"
              >
                <option value="">All doctors</option>
                {report.availableDoctors.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {from !== todayKey() || to !== todayKey() ? (
            <ActionButton variant="secondary" size="sm" onClick={resetToToday}>
              Today
            </ActionButton>
          ) : null}
          <ActionButton onClick={() => void loadReport(range)}>
            <RefreshCw size={17} /> Refresh Reports
          </ActionButton>
        </div>
      </div>

      {error && report ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      {report ? (
        <div className="grid grid-cols-2 gap-2 border-b border-line p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
          {kpis.map(({ label, value, icon: Icon, metric }) => {
            const tile = (
              // Labels wrap to two lines rather than truncating: these tiles sit
              // seven-across on a wide screen, so "Appointments Today" and
              // "Patient Records" were being cut to "APPOINTMENTS…". A title
              // tooltip alone would not have fixed it — these tiles are read on
              // tablets at the desk, where there is no hover. min-h keeps the
              // value row aligned across tiles whether the label runs one line
              // or two.
              <div className="rounded border border-line bg-soft/60 px-3 py-2.5 hover:border-brand">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-h-8 text-[11px] font-semibold uppercase leading-4 tracking-tight text-muted" title={label}>{label}</p>
                  <Icon className="mt-0.5 shrink-0 text-brand" size={14} />
                </div>
                <p className="mt-1 text-lg font-bold leading-tight text-ink">{value}</p>
              </div>
            );
            return metric ? (
              <DrilldownPanel key={label} metric={metric} range={range} doctor={doctor || undefined}>
                {tile}
              </DrilldownPanel>
            ) : (
              <div key={label}>{tile}</div>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="p-4">
          <ModuleSkeleton />
        </div>
      ) : null}

      {!loading && !report ? (
        <ModuleEmptyState
          icon={AlertTriangle}
          title="Unable to load reports"
          description={error || "Something went wrong while loading the daily operating summary."}
          action="Retry"
          onAction={() => void loadReport(range)}
        />
      ) : null}

      {report ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 lg:grid-cols-3">
          <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="text-sm font-bold text-ink">Appointment funnel</p>
            <div className="mt-4 grid gap-3">
              <div className="flex justify-between rounded border border-line bg-surface px-4 py-3">
                <span className="font-semibold text-muted">Total requests</span>
                <span className="font-bold text-ink">{report.appointments.total}</span>
              </div>
              {(
                [
                  ["New", report.appointments.new, "appointments.new"],
                  ["Confirmed", report.appointments.confirmed, "appointments.confirmed"],
                  ["Urgent", report.appointments.urgent, "appointments.urgent"]
                ] as const
              ).map(([label, value, metric]) => (
                <DrilldownPanel key={label} metric={metric}>
                  <div className="flex justify-between rounded border border-line bg-surface px-4 py-3 hover:border-brand">
                    <span className="font-semibold text-muted">{label}</span>
                    <span className="font-bold text-ink">{value}</span>
                  </div>
                </DrilldownPanel>
              ))}
            </div>
          </div>

          <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="text-sm font-bold text-ink">Revenue split today</p>
            <div className="mt-4 grid gap-3">
              {report.billing.revenueByMethod.map((item) => (
                <div key={item.method} className="flex justify-between rounded border border-line bg-surface px-4 py-3">
                  <span className="font-semibold text-muted">{item.method}</span>
                  <span className="font-bold text-ink">{formatAmount(item.total)}</span>
                </div>
              ))}
              <div className="flex justify-between rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-4 py-3">
                <span className="font-bold text-brand">Pending estimate</span>
                <span className="font-bold text-ink">{formatAmount(report.billing.pendingEstimate)}</span>
              </div>
            </div>
          </div>

          <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="text-sm font-bold text-ink">Low-stock alerts</p>
            <div className="mt-4 grid gap-3">
              {report.inventory.lowStockItems.length === 0 ? <p className="rounded border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted">No low-stock items.</p> : null}
              {report.inventory.lowStockItems.map((item) => (
                <div key={item.id} className="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 py-3">
                  <p className="font-bold text-red-800 dark:text-red-300">{item.name}</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{item.quantity} {item.unit} left | Reorder at {item.reorderLevel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
