"use client";

import { AlertTriangle, Download, Edit3, Microscope, ScanLine } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { EntityDocumentsSection } from "@/components/design-system/EntityDocumentsSection";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ExternalReferral, ExternalReferralStatus, ExternalReferralType } from "@/lib/external-referral-types";
import { commonPathologyTests, commonRadiologyTests, externalReferralStatuses, externalReferralTypes } from "@/lib/external-referral-types";
import type { ExternalReferralSortField } from "@/lib/external-referral-query";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { notify } from "@/lib/notify";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

const referralExportHeaders = ["Token", "Patient", "Phone", "Type", "Test/Scan", "Facility", "Priority", "Status", "Payment Status", "Created"];

function referralExportRow(referral: ExternalReferral) {
  return [
    referral.token,
    referral.patientName,
    referral.phone,
    referral.type,
    referral.testName,
    referral.facilityName ?? "",
    referral.priority,
    referral.status,
    referral.paymentStatus,
    referral.createdAt
  ];
}

type ReferralListResponse = {
  ok: boolean;
  referrals?: ExternalReferral[];
  referral?: ExternalReferral;
  visits?: OpdVisit[];
  pageCount?: number;
  stats?: { total: number; awaitingResult: number; resultReceived: number; criticalUnacked: number; paidAmount: number };
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

function formatAmount(value: number | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

const pageSize = 25;

/**
 * External Radiology/Pathology referral tracking (Track 4.6). Scoped
 * deliberately to referral tracking, not an in-house acquire/read/approve
 * pipeline — this hospital has no radiologist/pathologist on staff, so
 * imaging/pathology tests are sent to an external facility. Mirrors the
 * Laboratory module's architecture closely (same order→result→report→bill
 * shape, same critical-flag pattern), reuses its `lab-orders` RBAC
 * resource rather than adding a new one, and attaches the returned report
 * via the same document store (Track 3.6) used by the Patient Drawer.
 */
export function AdminExternalReferrals() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const [referrals, setReferrals] = useState<ExternalReferral[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [referralType, setReferralType] = useState<ExternalReferralType>("Radiology");
  const [testName, setTestName] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, awaitingResult: 0, resultReceived: 0, criticalUnacked: 0, paidAmount: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExternalReferralStatus | "">("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingReferral, setEditingReferral] = useState<ExternalReferral | null>(null);

  const sortField = (sorting[0]?.id as ExternalReferralSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function loadReferrals() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (criticalOnly) params.set("criticalOnly", "true");

    const response = await fetch(`/api/external-referrals?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as ReferralListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load referrals.");
      setLoading(false);
      return;
    }
    setReferrals(data.referrals ?? []);
    setVisits(data.visits ?? []);
    setSelectedVisitId((current) => current || data.visits?.[0]?.id || "");
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
    setEditingReferral((current) => {
      if (!current) return current;
      return data.referrals?.find((referral) => referral.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReferrals(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter, criticalOnly]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: ExternalReferralStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function toggleCriticalOnly(value: boolean) {
    setCriticalOnly(value);
    setPageIndex(0);
  }

  async function createReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let response: Response;
    try {
      response = await fetch("/api/external-referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: selectedVisitId,
          type: referralType,
          testName,
          facilityName: formData.get("facilityName"),
          priority: formData.get("priority"),
          amount: formData.get("amount"),
          paymentStatus: formData.get("paymentStatus"),
          notes: formData.get("notes")
        })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void createReferral(event));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as ReferralListResponse;
    if (!response.ok || !data.ok || !data.referral) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed create must not blank the list.
      notify.error(data.error || "Unable to create referral.");
      return;
    }
    setTestName("");
    event.currentTarget.reset();
    void loadReferrals();
  }

  async function updateReferral(
    id: string,
    updates: Partial<Pick<ExternalReferral, "status" | "facilityName" | "resultSummary" | "paymentStatus" | "amount" | "notes">> & {
      criticalManual?: boolean;
      acknowledgeCritical?: boolean;
    }
  ) {
    let response: Response;
    try {
      response = await fetch("/api/external-referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateReferral(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as ReferralListResponse;
    if (!response.ok || !data.ok || !data.referral) {
      notify.error(data.error || "Unable to update referral.");
      return;
    }
    const updated = data.referral as ExternalReferral;
    setReferrals((items) => items.map((item) => (item.id === id ? updated : item)));
    setEditingReferral((current) => (current?.id === id ? updated : current));
  }

  const statTiles = useMemo(
    () => [
      { label: "Referrals", value: stats.total },
      { label: "Awaiting Result", value: stats.awaitingResult },
      { label: "Result Received", value: stats.resultReceived },
      { label: "Critical Unacked", value: stats.criticalUnacked },
      { label: "Paid", value: formatAmount(stats.paidAmount) }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<ExternalReferral, unknown>[]>(
    () => [
      {
        accessorKey: "token",
        header: "Token",
        size: 130,
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-bold text-ink">{row.original.token}</span>
            {row.original.uhid ? <span className="mt-0.5 block text-[10px] text-muted">{row.original.uhid}</span> : null}
          </div>
        )
      },
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 160,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openDrawer(row.original.phone, row.original.patientName)}
            title="Open patient summary"
            className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            {row.original.patientName}
          </button>
        )
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 100,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-muted">
            {row.original.type === "Radiology" ? <ScanLine size={13} /> : <Microscope size={13} />} {row.original.type}
          </span>
        )
      },
      {
        id: "testName",
        header: "Test/Scan",
        size: 170,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 text-muted" title={row.original.testName}>
            {row.original.testName}
          </span>
        )
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 90,
        cell: ({ row }) =>
          row.original.priority === "Urgent" ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Urgent</span>
          ) : (
            <span className="text-muted">Routine</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <select
            aria-label="Referral status"
            value={row.original.status}
            onChange={(event) => void updateReferral(row.original.id, { status: event.target.value as ExternalReferralStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {externalReferralStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "critical",
        header: "Critical",
        size: 150,
        enableSorting: false,
        cell: ({ row }) =>
          !row.original.criticalFlag ? (
            <span className="text-muted">—</span>
          ) : row.original.criticalAcknowledgedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={11} /> Acknowledged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle size={11} /> Critical
            </span>
          )
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        size: 110,
        cell: ({ row }) => (
          <select
            aria-label="Payment status"
            value={row.original.paymentStatus}
            onChange={(event) => void updateReferral(row.original.id, { paymentStatus: event.target.value as ExternalReferral["paymentStatus"] })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            <option>Unpaid</option>
            <option>Paid</option>
          </select>
        )
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 100,
        cell: ({ row }) => formatAmount(row.original.amount)
      },
      {
        id: "actions",
        header: "Actions",
        size: 90,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={() => setEditingReferral((current) => (current?.id === row.original.id ? null : row.original))}
            aria-expanded={editingReferral?.id === row.original.id}
          >
            <Edit3 size={13} /> Result
          </ActionButton>
        )
      }
    ],
    // updateReferral only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, editingReferral]
  );

  const testSuggestions = referralType === "Radiology" ? commonRadiologyTests : commonPathologyTests;

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Radiology &amp; Pathology</p>
          <h2 className="mt-1 text-xl font-bold text-ink">External referral tracking</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
            Track imaging and pathology tests sent to an external facility — order, status, result and attached report.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line p-4 sm:grid-cols-2 md:grid-cols-5">
        {statTiles.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form onSubmit={createReferral} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <ScanLine size={19} /> Create referral
          </p>
          <div className="grid gap-3">
            <select aria-label="Selected visit id" value={selectedVisitId} onChange={(event) => setSelectedVisitId(event.target.value)} className={fieldClass} required>
              <option value="">Select OPD visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.token} | {visit.patientName}
                  {visit.uhid ? ` | ${visit.uhid}` : ""} | {visit.service}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {externalReferralTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReferralType(type)}
                  aria-pressed={referralType === type}
                  className={`flex-1 rounded border px-3 py-2 text-sm font-bold transition ${referralType === type ? "border-brand bg-cyan-50 text-brand dark:bg-cyan-950" : "border-line bg-surface text-muted"}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="rounded border border-line bg-surface p-3">
              <p className="mb-2 text-sm font-bold text-ink">Common {referralType.toLowerCase()} tests</p>
              <div className="flex flex-wrap gap-2">
                {testSuggestions.map((test) => (
                  <button
                    key={test}
                    type="button"
                    onClick={() => setTestName(test)}
                    aria-pressed={testName === test}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${testName === test ? "border-brand bg-cyan-50 text-brand dark:bg-cyan-950" : "border-line bg-surface text-muted"}`}
                  >
                    {test}
                  </button>
                ))}
              </div>
            </div>
            <input value={testName} onChange={(event) => setTestName(event.target.value)} className={fieldClass} placeholder="Test/scan name" required />
            <input name="facilityName" className={fieldClass} placeholder="External facility name (optional)" />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <select aria-label="Priority" name="priority" className={fieldClass} defaultValue="Routine">
                <option>Routine</option>
                <option>Urgent</option>
              </select>
              <input name="amount" className={fieldClass} type="number" min="0" placeholder="Amount" />
            </div>
            <select aria-label="Payment status" name="paymentStatus" className={fieldClass} defaultValue="Unpaid">
              <option>Unpaid</option>
              <option>Paid</option>
            </select>
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Referral notes" />
            <ActionButton type="submit" variant="primary">
              <ScanLine size={17} /> Save Referral
            </ActionButton>
          </div>
        </form>

        <div>
          <DataTable
            columns={columns}
            data={referrals}
            getRowId={(referral) => referral.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search referrals"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadReferrals()}
            emptyState={{
              icon: ScanLine,
              title: globalFilter || statusFilter || criticalOnly ? "No referrals match your filters" : "No external referrals yet",
              description:
                globalFilter || statusFilter || criticalOnly
                  ? "Try a different search term, or clear the status/critical filters."
                  : "Imaging and pathology tests sent to an external facility appear here. Create a referral with the form to the left.",
              action: globalFilter || statusFilter || criticalOnly ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter || criticalOnly
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                      setCriticalOnly(false);
                    }
                  : undefined
            }}
            export={{ headers: referralExportHeaders, row: referralExportRow, filename: "external-referrals.csv" }}
            printTitle="External Referrals"
            stickyFirstColumn
            toolbarExtra={
              <>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => updateStatusFilter(event.target.value as ExternalReferralStatus | "")}
                  className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  <option value="">All statuses</option>
                  {externalReferralStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <label className="inline-flex min-h-9 items-center gap-2 rounded border border-line bg-surface px-3 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={criticalOnly} onChange={(event) => toggleCriticalOnly(event.target.checked)} className="h-4 w-4 accent-red-600" />
                  Critical only
                </label>
              </>
            }
            bulkActions={(selected, clear) => (
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadCsv(referralExportHeaders, selected.map(referralExportRow), "selected-external-referrals.csv");
                  clear();
                }}
              >
                <Download size={14} /> Export selected
              </ActionButton>
            )}
          />

          {editingReferral ? (
            <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">
                    {editingReferral.token}
                    {editingReferral.uhid ? ` · ${editingReferral.uhid}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{editingReferral.patientName}</h3>
                </div>
                <ActionButton variant="ghost" size="sm" onClick={() => setEditingReferral(null)}>
                  Close
                </ActionButton>
              </div>
              <input
                defaultValue={editingReferral.facilityName}
                onBlur={(event) => void updateReferral(editingReferral.id, { facilityName: event.target.value })}
                className={`${fieldClass} mt-3`}
                placeholder="External facility name"
              />
              <textarea
                defaultValue={editingReferral.resultSummary}
                onBlur={(event) => void updateReferral(editingReferral.id, { resultSummary: event.target.value })}
                className={`${fieldClass} mt-3 min-h-20 py-3`}
                placeholder="Result summary / findings"
              />
              {editingReferral.criticalFlag && editingReferral.criticalReasons?.length ? (
                <ul className="mt-2 grid gap-1 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {editingReferral.criticalReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(editingReferral.criticalFlag)}
                    onChange={(event) => void updateReferral(editingReferral.id, { criticalManual: event.target.checked })}
                    className="h-4 w-4 rounded border-line accent-red-600"
                  />
                  Mark critical (reviewing doctor)
                </label>
                {editingReferral.criticalFlag && !editingReferral.criticalAcknowledgedAt ? (
                  <ActionButton variant="danger" size="sm" onClick={() => void updateReferral(editingReferral.id, { acknowledgeCritical: true })}>
                    Acknowledge critical result
                  </ActionButton>
                ) : null}
                {editingReferral.criticalAcknowledgedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle size={13} /> Acknowledged by {editingReferral.criticalAcknowledgedBy} at{" "}
                    {new Date(editingReferral.criticalAcknowledgedAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-brand">Attached report</p>
                <EntityDocumentsSection entityType="external-referral" entityId={editingReferral.id} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
