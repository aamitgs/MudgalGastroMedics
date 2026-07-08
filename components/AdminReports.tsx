"use client";

import { AlertTriangle, BarChart3, CalendarDays, ClipboardList, PackageX, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

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

  async function loadReport() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/reports", { cache: "no-store" });
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

    async function loadInitialReport() {
      const response = await fetch("/api/reports", { cache: "no-store" });
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

    void loadInitialReport();

    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Appointments Today", value: report.appointments.today, icon: CalendarDays },
      { label: "Patient Records", value: report.patients.total, icon: ClipboardList },
      { label: "OPD Visits Today", value: report.opd.today, icon: ClipboardList },
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
      { label: "Low Stock Items", value: report.inventory.lowStockCount, icon: PackageX }
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
        <ActionButton onClick={() => void loadReport()}>
          <RefreshCw size={17} /> Refresh Reports
        </ActionButton>
      </div>

      {error && report ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      {report ? (
        <div className="grid grid-cols-2 gap-2 border-b border-line p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
          {kpis.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded border border-line bg-soft/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted" title={label}>{label}</p>
                <Icon className="shrink-0 text-brand" size={14} />
              </div>
              <p className="mt-1 text-lg font-bold leading-tight text-ink">{value}</p>
            </div>
          ))}
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
          onAction={() => void loadReport()}
        />
      ) : null}

      {report ? (
        <div className="grid gap-5 p-4 lg:grid-cols-3">
          <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="text-sm font-bold text-ink">Appointment funnel</p>
            <div className="mt-4 grid gap-3">
              {[
                ["Total requests", report.appointments.total],
                ["New", report.appointments.new],
                ["Confirmed", report.appointments.confirmed],
                ["Urgent", report.appointments.urgent]
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between rounded border border-line bg-surface px-4 py-3">
                  <span className="font-semibold text-muted">{label as string}</span>
                  <span className="font-bold text-ink">{value as number}</span>
                </div>
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
