"use client";

import { BadgeIndianRupee, ClipboardList, CreditCard, Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";

const billingExportHeaders = ["Token", "Patient", "Phone", "Service", "Billing Status", "Amount", "Payment Method", "Receipt ID"];

function billingExportRow(visit: OpdVisit) {
  return [visit.token, visit.patientName, visit.phone, visit.service, visit.billingStatus, visit.estimatedAmount ?? "", visit.paymentMethod ?? "", visit.receiptId ?? ""];
}

type OpdResponse = {
  ok: boolean;
  visits?: OpdVisit[];
  error?: string;
};

function amountValue(value: string | undefined) {
  const parsed = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminBillingSummary() {
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBilling() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/opd", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as OpdResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load billing summary.");
      setLoading(false);
      return;
    }
    setVisits(data.visits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialBilling() {
      const response = await fetch("/api/opd", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as OpdResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load billing summary.");
        setLoading(false);
        return;
      }
      setVisits(data.visits ?? []);
      setLoading(false);
    }

    void loadInitialBilling();

    return () => {
      active = false;
    };
  }, []);

  const billing = useMemo(() => {
    const paidVisits = visits.filter((visit) => visit.billingStatus === "Paid");
    const pendingVisits = visits.filter((visit) => visit.billingStatus !== "Paid");
    return {
      paidTotal: paidVisits.reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0),
      pendingTotal: pendingVisits.reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0),
      paidVisits,
      pendingVisits,
      paymentSplit: ["Cash", "UPI", "Card", "Insurance", "Other"].map((method) => ({
        method,
        value: paidVisits.filter((visit) => (visit.paymentMethod || "Cash") === method).reduce((total, visit) => total + amountValue(visit.estimatedAmount), 0)
      }))
    };
  }, [visits]);

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Billing Desk</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Revenue and receipts</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(billingExportHeaders, visits.map(billingExportRow), "billing.csv")}
            disabled={visits.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadBilling()}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand"
          >
            <RefreshCw size={17} /> Refresh Billing
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {[
          { label: "Paid Total", value: formatAmount(billing.paidTotal), icon: BadgeIndianRupee },
          { label: "Pending Estimate", value: formatAmount(billing.pendingTotal), icon: CreditCard },
          { label: "Paid Receipts", value: billing.paidVisits.length, icon: ClipboardList },
          { label: "Pending Bills", value: billing.pendingVisits.length, icon: ClipboardList }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line bg-soft/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <Icon className="text-brand" size={22} />
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="text-sm font-bold text-ink">Payment method split</p>
          <div className="mt-4 grid gap-3">
            {billing.paymentSplit.map((item) => (
              <div key={item.method} className="flex items-center justify-between rounded border border-line bg-surface px-4 py-3">
                <span className="font-semibold text-muted">{item.method}</span>
                <span className="font-bold text-ink">{formatAmount(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-line bg-surface">
          <div className="border-b border-line p-4">
            <p className="text-sm font-bold text-ink">Recent paid receipts</p>
          </div>
          <div className="grid gap-3 p-4">
            {loading ? <p className="text-sm font-semibold text-muted">Loading billing...</p> : null}
            {!loading && billing.paidVisits.length === 0 ? <p className="text-sm font-semibold text-muted">No paid receipts yet.</p> : null}
            {billing.paidVisits.slice(0, 6).map((visit) => (
              <div key={visit.id} className="grid gap-2 rounded border border-line bg-soft/40 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-bold text-ink">{visit.patientName}</p>
                  <p className="text-sm text-muted">{visit.service} | {visit.receiptId || "Receipt pending"}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-bold text-teal-dark">{formatAmount(amountValue(visit.estimatedAmount))}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{visit.paymentMethod || "Cash"}</p>
                </div>
                <a
                  href={`/api/pdf/invoice?visitId=${encodeURIComponent(visit.id)}`}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-white px-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
                >
                  <Download size={14} /> Receipt PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
