"use client";

import { BadgeIndianRupee, Download, FileCheck2, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AccountEntry, InsuranceClaim, InsuranceClaimStatus } from "@/lib/finance-types";
import { accountEntryTypes, insuranceClaimStatuses } from "@/lib/finance-types";
import type { IpdAdmission } from "@/lib/ipd-types";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const claimExportHeaders = ["Patient", "Phone", "Insurer", "Policy Number", "Claim Number", "Requested", "Approved", "Settled", "Status"];

function claimExportRow(claim: InsuranceClaim) {
  return [
    claim.patientName,
    claim.phone,
    claim.insurer,
    claim.policyNumber ?? "",
    claim.claimNumber ?? "",
    String(claim.requestedAmount),
    String(claim.approvedAmount),
    String(claim.settledAmount),
    claim.status
  ];
}

type FinanceResponse = {
  ok: boolean;
  claims?: InsuranceClaim[];
  claim?: InsuranceClaim;
  entries?: AccountEntry[];
  entry?: AccountEntry;
  admissions?: IpdAdmission[];
  visits?: OpdVisit[];
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function formatAmount(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function AdminFinance() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [sourceType, setSourceType] = useState<"ipd" | "opd">("ipd");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFinance() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/finance", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as FinanceResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load finance.");
      setLoading(false);
      return;
    }
    setClaims(data.claims ?? []);
    setEntries(data.entries ?? []);
    setAdmissions(data.admissions ?? []);
    setVisits(data.visits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialFinance() {
      const response = await fetch("/api/finance", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as FinanceResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load finance.");
        setLoading(false);
        return;
      }
      setClaims(data.claims ?? []);
      setEntries(data.entries ?? []);
      setAdmissions(data.admissions ?? []);
      setVisits(data.visits ?? []);
      setLoading(false);
    }
    void loadInitialFinance();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const income = entries.filter((entry) => ["Income", "Deposit"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = entries.filter((entry) => ["Expense", "Refund"].includes(entry.type)).reduce((sum, entry) => sum + entry.amount, 0);
    return [
      { label: "Claims", value: claims.length },
      { label: "Claim Settled", value: formatAmount(claims.reduce((sum, claim) => sum + claim.settledAmount, 0)) },
      { label: "Cashbook Income", value: formatAmount(income) },
      { label: "Expenses", value: formatAmount(expenses) }
    ];
  }, [claims, entries]);

  async function createClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "claim" })
    });
    const data = (await response.json().catch(() => ({}))) as FinanceResponse;
    if (!response.ok || !data.ok || !data.claim) {
      setError(data.error || "Unable to create insurance claim.");
      return;
    }
    setClaims((items) => [data.claim as InsuranceClaim, ...items]);
    event.currentTarget.reset();
    setError("");
  }

  async function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "entry" })
    });
    const data = (await response.json().catch(() => ({}))) as FinanceResponse;
    if (!response.ok || !data.ok || !data.entry) {
      setError(data.error || "Unable to create account entry.");
      return;
    }
    setEntries((items) => [data.entry as AccountEntry, ...items]);
    event.currentTarget.reset();
    setError("");
  }

  async function updateClaim(id: string, updates: Partial<Pick<InsuranceClaim, "status" | "requestedAmount" | "approvedAmount" | "settledAmount" | "claimNumber" | "documents" | "notes">>) {
    const response = await fetch("/api/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as FinanceResponse;
    if (!response.ok || !data.ok || !data.claim) {
      setError(data.error || "Unable to update claim.");
      return;
    }
    setClaims((items) => items.map((item) => (item.id === id ? data.claim as InsuranceClaim : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Insurance + Accounts</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Claims, deposits and cashbook</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Track TPA/insurance claims and maintain a simple hospital ledger for income, deposits, expenses and refunds.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            variant="secondary"
            onClick={() => downloadCsv(claimExportHeaders, claims.map(claimExportRow), "insurance-claims.csv")}
            disabled={claims.length === 0}
          >
            <Download size={17} /> Export CSV
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => void loadFinance()}>
            <RefreshCw size={17} /> Refresh Finance
          </ActionButton>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-2">
        <form onSubmit={createClaim} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><FileCheck2 size={19} /> Create insurance claim</p>
          <div className="grid gap-3">
            <select aria-label="Source type" value={sourceType} onChange={(event) => setSourceType(event.target.value as "ipd" | "opd")} className={fieldClass}>
              <option value="ipd">IPD Admission</option>
              <option value="opd">OPD Visit</option>
            </select>
            {sourceType === "ipd" ? (
              <select aria-label="Admission" name="admissionId" className={fieldClass} required>
                <option value="">Select admission</option>
                {admissions.map((admission) => <option key={admission.id} value={admission.id}>{admission.id} | {admission.patientName}{admission.uhid ? ` | ${admission.uhid}` : ""}</option>)}
              </select>
            ) : (
              <select aria-label="OPD visit" name="visitId" className={fieldClass} required>
                <option value="">Select OPD visit</option>
                {visits.map((visit) => <option key={visit.id} value={visit.id}>{visit.token} | {visit.patientName}{visit.uhid ? ` | ${visit.uhid}` : ""}</option>)}
              </select>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <input name="insurer" className={fieldClass} placeholder="Insurer" required />
              <input name="tpa" className={fieldClass} placeholder="TPA" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="policyNumber" className={fieldClass} placeholder="Policy number" />
              <input name="claimNumber" className={fieldClass} placeholder="Claim number" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input name="requestedAmount" className={fieldClass} type="number" min="0" placeholder="Requested" />
              <input name="approvedAmount" className={fieldClass} type="number" min="0" placeholder="Approved" />
              <input name="settledAmount" className={fieldClass} type="number" min="0" placeholder="Settled" />
            </div>
            <input name="documents" className={fieldClass} placeholder="Documents / file references" />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Claim notes" />
            <ActionButton type="submit" variant="primary">Save Claim</ActionButton>
          </div>
        </form>

        <form onSubmit={createEntry} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><BadgeIndianRupee size={19} /> Add account entry</p>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Date" name="date" className={fieldClass} type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <select aria-label="Type" name="type" className={fieldClass} defaultValue="Expense">{accountEntryTypes.map((type) => <option key={type}>{type}</option>)}</select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="category" className={fieldClass} placeholder="Category" required />
              <input name="amount" className={fieldClass} type="number" min="0" placeholder="Amount" required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select aria-label="Payment method" name="method" className={fieldClass} defaultValue="Cash">{["Cash", "UPI", "Card", "Bank", "Insurance", "Other"].map((method) => <option key={method}>{method}</option>)}</select>
              <input name="reference" className={fieldClass} placeholder="Reference / voucher" />
            </div>
            <input name="party" className={fieldClass} placeholder="Party / vendor / patient" />
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Ledger notes" />
            <ActionButton type="submit" variant="success">Save Entry</ActionButton>
          </div>
        </form>
      </div>

      <div className="grid gap-5 border-t border-line p-4 xl:grid-cols-2">
        <div className="grid gap-3">
          <p className="text-sm font-bold text-ink">Insurance claims</p>
          {loading ? <ModuleSkeleton /> : null}
          {claims.map((claim) => (
            <article key={claim.id} className="rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{claim.id}{claim.uhid ? ` | ${claim.uhid}` : ""}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{claim.patientName}</h3>
                  <p className="mt-1 text-sm text-muted">{claim.insurer}{claim.tpa ? ` | ${claim.tpa}` : ""}</p>
                </div>
                <select aria-label="Claim status" value={claim.status} onChange={(event) => void updateClaim(claim.id, { status: event.target.value as InsuranceClaimStatus })} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                  {insuranceClaimStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                <p className="rounded border border-line bg-soft/60 p-2"><span className="font-bold text-ink">Requested:</span> {formatAmount(claim.requestedAmount)}</p>
                <p className="rounded border border-line bg-soft/60 p-2"><span className="font-bold text-ink">Approved:</span> {formatAmount(claim.approvedAmount)}</p>
                <p className="rounded border border-line bg-soft/60 p-2"><span className="font-bold text-ink">Settled:</span> {formatAmount(claim.settledAmount)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-bold text-ink">Recent account entries</p>
          {entries.map((entry) => (
            <article key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/40 p-4">
              <div>
                <p className="font-bold text-ink">{entry.category}</p>
                <p className="text-sm text-muted">{entry.date} | {entry.type} | {entry.method}{entry.party ? ` | ${entry.party}` : ""}</p>
              </div>
              <p className="font-bold text-teal-dark">{formatAmount(entry.amount)}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
