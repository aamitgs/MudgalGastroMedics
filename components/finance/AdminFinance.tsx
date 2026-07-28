"use client";

import { BadgeIndianRupee, Download, FileCheck2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { roleHasPermission } from "@/lib/access/matrix";
import type { AccountEntry, AccountEntryType, InsuranceClaim, InsuranceClaimStatus } from "@/lib/finance-types";
import { accountEntryMethods, accountEntryTypes, insuranceClaimStatuses } from "@/lib/finance-types";
import type { AccountEntrySortField } from "@/lib/account-entry-query";
import { queryAccountEntries } from "@/lib/account-entry-query";
import { hospitalRoleToAccessRole } from "@/lib/hospital-os-data";
import type { InsuranceClaimSortField } from "@/lib/insurance-claim-query";
import { queryInsuranceClaims } from "@/lib/insurance-claim-query";
import type { IpdAdmission } from "@/lib/ipd-types";
import type { OpdVisit } from "@/lib/opd-types";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/design-system/FormField";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { accountEntryCreateSchema, insuranceClaimCreateSchema, type AccountEntryCreateInput, type InsuranceClaimCreateInput } from "@/lib/validation/finance";

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

const entryExportHeaders = ["Date", "Type", "Category", "Amount", "Method", "Party", "Notes"];

function entryExportRow(entry: AccountEntry) {
  return [entry.date, entry.type, entry.category, String(entry.amount), entry.method, entry.party ?? "", entry.notes ?? ""];
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
const rowsPerPage = 25;

function formatAmount(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

const entryTypeTone: Record<AccountEntryType, BadgeTone> = {
  Income: "success",
  Deposit: "success",
  Expense: "critical",
  Refund: "critical",
  Adjustment: "inactive"
};

export function AdminFinance() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const role = useHospitalOsStore((state) => state.role);
  // UI convenience only — DELETE /api/finance re-checks billing:delete
  // server-side (admin/super-admin only). Only insurance claims get a
  // delete UI — the account ledger has no delete endpoint to call.
  const canDelete = roleHasPermission(hospitalRoleToAccessRole[role], "billing", "delete");

  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ items: InsuranceClaim[]; clearSelection?: () => void } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [claimPage, setClaimPage] = useState(0);
  const [claimFilter, setClaimFilter] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<InsuranceClaimStatus | "">("");
  const [claimSorting, setClaimSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const [entryPage, setEntryPage] = useState(0);
  const [entryFilter, setEntryFilter] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<AccountEntryType | "">("");
  const [entrySorting, setEntrySorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const claimSortField = (claimSorting[0]?.id as InsuranceClaimSortField | undefined) ?? "createdAt";
  const claimSortDir = claimSorting[0]?.desc ? "desc" : "asc";
  const entrySortField = (entrySorting[0]?.id as AccountEntrySortField | undefined) ?? "createdAt";
  const entrySortDir = entrySorting[0]?.desc ? "desc" : "asc";

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

  const defaultClaimValues: InsuranceClaimCreateInput = {
    sourceType: "ipd",
    admissionId: "",
    visitId: "",
    insurer: "",
    tpa: "",
    policyNumber: "",
    claimNumber: "",
    requestedAmount: undefined,
    approvedAmount: undefined,
    settledAmount: undefined,
    documents: "",
    notes: ""
  };

  const {
    register: registerClaim,
    watch: watchClaim,
    setValue: setClaimValue,
    formState: { errors: claimErrors, isSubmitting: isClaimSubmitting },
    reset: resetClaimForm,
    submit: submitClaim
  } = useAdvancedForm<InsuranceClaimCreateInput>({
    schema: insuranceClaimCreateSchema,
    defaultValues: defaultClaimValues,
    async onValid(values) {
      let response: Response;
      try {
        response = await fetch("/api/finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, mode: "claim" })
        });
      } catch {
        notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitClaim());
        return;
      }
      const data = (await response.json().catch(() => ({}))) as FinanceResponse;
      if (!response.ok || !data.ok || !data.claim) {
        notify.error(data.error || "Unable to create insurance claim.");
        return;
      }
      setClaims((items) => [data.claim as InsuranceClaim, ...items]);
      notify.success("Insurance claim saved");
      resetClaimForm(defaultClaimValues);
    }
  });
  const claimSourceType = watchClaim("sourceType");

  const defaultEntryValues: AccountEntryCreateInput = {
    date: new Date().toISOString().slice(0, 10),
    type: "Expense",
    category: "",
    amount: 0,
    method: "Cash",
    reference: "",
    party: "",
    notes: ""
  };

  const {
    register: registerEntry,
    formState: { errors: entryErrors, isSubmitting: isEntrySubmitting },
    reset: resetEntryForm,
    submit: submitEntry
  } = useAdvancedForm<AccountEntryCreateInput>({
    schema: accountEntryCreateSchema,
    defaultValues: defaultEntryValues,
    async onValid(values) {
      let response: Response;
      try {
        response = await fetch("/api/finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, mode: "entry" })
        });
      } catch {
        notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitEntry());
        return;
      }
      const data = (await response.json().catch(() => ({}))) as FinanceResponse;
      if (!response.ok || !data.ok || !data.entry) {
        notify.error(data.error || "Unable to create account entry.");
        return;
      }
      setEntries((items) => [data.entry as AccountEntry, ...items]);
      notify.success("Account entry saved");
      resetEntryForm(defaultEntryValues);
    }
  });

  async function updateClaim(id: string, updates: Partial<Pick<InsuranceClaim, "status" | "requestedAmount" | "approvedAmount" | "settledAmount" | "claimNumber" | "documents" | "notes">>) {
    let response: Response;
    try {
      response = await fetch("/api/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateClaim(id, updates));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as FinanceResponse;
    if (!response.ok || !data.ok || !data.claim) {
      notify.error(data.error || "Unable to update claim.");
      return;
    }
    const updated = data.claim as InsuranceClaim;
    setClaims((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    let deleted = 0;
    let lastError = "";
    for (const claim of deleteTarget.items) {
      let response: Response;
      try {
        response = await fetch("/api/finance", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: claim.id })
        });
      } catch {
        lastError = "Unable to reach the server. Check your connection and retry.";
        continue;
      }
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        deleted += 1;
      } else {
        lastError = data.error || "Unable to delete this claim.";
      }
    }
    setIsDeleting(false);

    if (deleted > 0) {
      notify.success(deleted === 1 ? "Claim deleted" : `${deleted} claims deleted`);
      void loadFinance();
    }
    if (deleted < deleteTarget.items.length) {
      notify.error(lastError || "Some claims could not be deleted.");
    }
    setDeleteTarget(null);
  }

  function updateClaimFilter(value: string) {
    setClaimFilter(value);
    setClaimPage(0);
  }

  function updateClaimStatusFilter(value: InsuranceClaimStatus | "") {
    setClaimStatusFilter(value);
    setClaimPage(0);
  }

  function updateEntryFilter(value: string) {
    setEntryFilter(value);
    setEntryPage(0);
  }

  function updateEntryTypeFilter(value: AccountEntryType | "") {
    setEntryTypeFilter(value);
    setEntryPage(0);
  }

  // Both tables paginate client-side against the already-loaded arrays: the
  // "Create insurance claim" form's admission/visit dropdowns need the
  // complete lists regardless, and claim/ledger volume is small enough that
  // a server round-trip would add latency without reducing anything
  // actually transferred — same reasoning as IPD and HR.
  const { claims: claimPageRows, pageCount: claimPageCount } = useMemo(
    () =>
      queryInsuranceClaims(claims, {
        page: claimPage,
        pageSize: rowsPerPage,
        sortBy: claimSortField,
        sortDir: claimSortDir,
        query: claimFilter,
        status: claimStatusFilter || undefined
      }),
    [claims, claimPage, claimSortField, claimSortDir, claimFilter, claimStatusFilter]
  );

  const { entries: entryPageRows, pageCount: entryPageCount } = useMemo(
    () =>
      queryAccountEntries(entries, {
        page: entryPage,
        pageSize: rowsPerPage,
        sortBy: entrySortField,
        sortDir: entrySortDir,
        query: entryFilter,
        type: entryTypeFilter || undefined
      }),
    [entries, entryPage, entrySortField, entrySortDir, entryFilter, entryTypeFilter]
  );

  const claimColumns = useMemo<ColumnDef<InsuranceClaim, unknown>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        size: 170,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.patientName)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.patientName}
            </button>
            {row.original.uhid ? <span className="ml-2 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase text-brand dark:border-cyan-900 dark:bg-cyan-950">{row.original.uhid}</span> : null}
          </div>
        )
      },
      {
        accessorKey: "insurer",
        header: "Insurer / TPA",
        size: 170,
        cell: ({ row }) => (
          <span>
            {row.original.insurer}
            {row.original.tpa ? <span className="text-muted"> · {row.original.tpa}</span> : null}
          </span>
        )
      },
      { id: "requested", header: "Requested", size: 110, enableSorting: false, cell: ({ row }) => formatAmount(row.original.requestedAmount) },
      { id: "approved", header: "Approved", size: 110, enableSorting: false, cell: ({ row }) => formatAmount(row.original.approvedAmount) },
      { accessorKey: "settledAmount", header: "Settled", size: 110, cell: ({ row }) => formatAmount(row.original.settledAmount) },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => (
          <select
            aria-label="Claim status"
            value={row.original.status}
            onChange={(event) => void updateClaim(row.original.id, { status: event.target.value as InsuranceClaimStatus })}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {insuranceClaimStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      ...(canDelete
        ? [
            {
              id: "actions",
              header: "Actions",
              size: 60,
              enableSorting: false,
              enableHiding: false,
              cell: ({ row }: { row: { original: InsuranceClaim } }) => (
                <ActionButton
                  variant="danger"
                  size="sm"
                  className="h-8 w-8 min-h-8 px-0"
                  disabled={row.original.status !== "Draft"}
                  title={row.original.status === "Draft" ? "Delete permanently" : "Only Draft claims can be deleted"}
                  onClick={() => setDeleteTarget({ items: [row.original] })}
                >
                  <Trash2 size={13} />
                </ActionButton>
              )
            } satisfies ColumnDef<InsuranceClaim, unknown>
          ]
        : [])
    ],
    // updateClaim only forwards call-time arguments via functional setState, so it's safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, canDelete]
  );

  const entryColumns = useMemo<ColumnDef<AccountEntry, unknown>[]>(
    () => [
      { accessorKey: "date", header: "Date", size: 110 },
      {
        accessorKey: "type",
        header: "Type",
        size: 110,
        cell: ({ row }) => <StatusBadge tone={entryTypeTone[row.original.type]} className="rounded-full px-2 py-0.5 text-xs">{row.original.type}</StatusBadge>
      },
      { accessorKey: "category", header: "Category", size: 160, cell: ({ row }) => <span className="font-bold text-ink">{row.original.category}</span> },
      { accessorKey: "amount", header: "Amount", size: 110, cell: ({ row }) => <span className="font-bold text-teal-dark">{formatAmount(row.original.amount)}</span> },
      { id: "method", header: "Method", size: 100, enableSorting: false, cell: ({ row }) => row.original.method },
      { id: "party", header: "Party", size: 150, enableSorting: false, cell: ({ row }) => row.original.party || "—" },
      {
        id: "notes",
        header: "Notes",
        size: 180,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.notes ? (
            <span className="line-clamp-1 text-muted" title={row.original.notes}>
              {row.original.notes}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )
      }
    ],
    []
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Insurance + Accounts</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Claims, deposits and cashbook</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Track TPA/insurance claims and maintain a simple hospital ledger for income, deposits, expenses and refunds.</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 xl:grid-cols-2">
        <form onSubmit={submitClaim} noValidate className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <FileCheck2 size={19} /> Create insurance claim
          </p>
          <div className="grid gap-3">
            <select
              aria-label="Source type"
              className={fieldClass}
              {...registerClaim("sourceType", {
                onChange: (event) => {
                  // Only one of admissionId/visitId is ever rendered — clear
                  // the one that's about to hide so a stale selection from
                  // before the switch can't be submitted alongside the new one.
                  setClaimValue(event.target.value === "ipd" ? "visitId" : "admissionId", "");
                }
              })}
            >
              <option value="ipd">IPD Admission</option>
              <option value="opd">OPD Visit</option>
            </select>
            {claimSourceType === "ipd" ? (
              <FormField label="Admission" htmlFor="claim-admissionId" error={claimErrors.admissionId?.message}>
                <select id="claim-admissionId" className={fieldClass} {...registerClaim("admissionId")}>
                  <option value="">Select admission</option>
                  {admissions.map((admission) => (
                    <option key={admission.id} value={admission.id}>
                      {admission.id} | {admission.patientName}
                      {admission.uhid ? ` | ${admission.uhid}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="OPD visit" htmlFor="claim-visitId" error={claimErrors.visitId?.message}>
                <select id="claim-visitId" className={fieldClass} {...registerClaim("visitId")}>
                  <option value="">Select OPD visit</option>
                  {visits.map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.token} | {visit.patientName}
                      {visit.uhid ? ` | ${visit.uhid}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <FormField label="Insurer" htmlFor="claim-insurer" error={claimErrors.insurer?.message}>
                <input id="claim-insurer" className={fieldClass} placeholder="Insurer" {...registerClaim("insurer")} />
              </FormField>
              <FormField label="TPA" htmlFor="claim-tpa" error={claimErrors.tpa?.message}>
                <input id="claim-tpa" className={fieldClass} placeholder="TPA" {...registerClaim("tpa")} />
              </FormField>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <FormField label="Policy number" htmlFor="claim-policyNumber" error={claimErrors.policyNumber?.message}>
                <input id="claim-policyNumber" className={fieldClass} placeholder="Policy number" {...registerClaim("policyNumber")} />
              </FormField>
              <FormField label="Claim number" htmlFor="claim-claimNumber" error={claimErrors.claimNumber?.message}>
                <input id="claim-claimNumber" className={fieldClass} placeholder="Claim number" {...registerClaim("claimNumber")} />
              </FormField>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
              <FormField label="Requested" htmlFor="claim-requestedAmount" error={claimErrors.requestedAmount?.message}>
                <input id="claim-requestedAmount" className={fieldClass} type="number" min="0" placeholder="Requested" {...registerClaim("requestedAmount")} />
              </FormField>
              <FormField label="Approved" htmlFor="claim-approvedAmount" error={claimErrors.approvedAmount?.message}>
                <input id="claim-approvedAmount" className={fieldClass} type="number" min="0" placeholder="Approved" {...registerClaim("approvedAmount")} />
              </FormField>
              <FormField label="Settled" htmlFor="claim-settledAmount" error={claimErrors.settledAmount?.message}>
                <input id="claim-settledAmount" className={fieldClass} type="number" min="0" placeholder="Settled" {...registerClaim("settledAmount")} />
              </FormField>
            </div>
            <FormField label="Documents / file references" htmlFor="claim-documents" error={claimErrors.documents?.message}>
              <input id="claim-documents" className={fieldClass} placeholder="Documents / file references" {...registerClaim("documents")} />
            </FormField>
            <FormField label="Claim notes" htmlFor="claim-notes" error={claimErrors.notes?.message}>
              <textarea id="claim-notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Claim notes" {...registerClaim("notes")} />
            </FormField>
            <ActionButton type="submit" variant="primary" loading={isClaimSubmitting} disabled={isClaimSubmitting}>
              Save Claim
            </ActionButton>
          </div>
        </form>

        <form onSubmit={submitEntry} noValidate className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <BadgeIndianRupee size={19} /> Add account entry
          </p>
          <div className="grid gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <FormField label="Date" htmlFor="entry-date" error={entryErrors.date?.message}>
                <input id="entry-date" className={fieldClass} type="date" {...registerEntry("date")} />
              </FormField>
              <FormField label="Type" htmlFor="entry-type" error={entryErrors.type?.message}>
                <select id="entry-type" className={fieldClass} {...registerEntry("type")}>
                  {accountEntryTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <FormField label="Category" htmlFor="entry-category" error={entryErrors.category?.message}>
                <input id="entry-category" className={fieldClass} placeholder="Category" {...registerEntry("category")} />
              </FormField>
              <FormField label="Amount" htmlFor="entry-amount" error={entryErrors.amount?.message}>
                <input id="entry-amount" className={fieldClass} type="number" min="0" placeholder="Amount" {...registerEntry("amount")} />
              </FormField>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
              <FormField label="Payment method" htmlFor="entry-method" error={entryErrors.method?.message}>
                <select id="entry-method" className={fieldClass} {...registerEntry("method")}>
                  {accountEntryMethods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Reference / voucher" htmlFor="entry-reference" error={entryErrors.reference?.message}>
                <input id="entry-reference" className={fieldClass} placeholder="Reference / voucher" {...registerEntry("reference")} />
              </FormField>
            </div>
            <FormField label="Party / vendor / patient" htmlFor="entry-party" error={entryErrors.party?.message}>
              <input id="entry-party" className={fieldClass} placeholder="Party / vendor / patient" {...registerEntry("party")} />
            </FormField>
            <FormField label="Notes" htmlFor="entry-notes" error={entryErrors.notes?.message}>
              <textarea id="entry-notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Ledger notes" {...registerEntry("notes")} />
            </FormField>
            <ActionButton type="submit" variant="success" loading={isEntrySubmitting} disabled={isEntrySubmitting}>
              Save Entry
            </ActionButton>
          </div>
        </form>
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Insurance claims</p>
        <DataTable
          columns={claimColumns}
          data={claimPageRows}
          getRowId={(claim) => claim.id}
          pageIndex={claimPage}
          pageCount={claimPageCount}
          onPageChange={setClaimPage}
          sorting={claimSorting}
          onSortingChange={setClaimSorting}
          globalFilter={claimFilter}
          onGlobalFilterChange={updateClaimFilter}
          searchPlaceholder="Search patient, insurer, policy, claim number"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadFinance()}
          emptyState={{
            icon: FileCheck2,
            title: claimFilter || claimStatusFilter ? "No claims match your filters" : "No insurance claims yet",
            description: claimFilter || claimStatusFilter ? "Try a different search term, or clear the status filter." : "Create a claim with the form above.",
            action: claimFilter || claimStatusFilter ? "Clear filters" : undefined,
            onAction:
              claimFilter || claimStatusFilter
                ? () => {
                    setClaimFilter("");
                    setClaimStatusFilter("");
                  }
                : undefined
          }}
          export={{ headers: claimExportHeaders, row: claimExportRow, filename: "insurance-claims.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <select
              aria-label="Filter by claim status"
              value={claimStatusFilter}
              onChange={(event) => updateClaimStatusFilter(event.target.value as InsuranceClaimStatus | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {insuranceClaimStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => {
            const allEligible = selected.every((claim) => claim.status === "Draft");
            return (
              <>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    downloadCsv(claimExportHeaders, selected.map(claimExportRow), "selected-insurance-claims.csv");
                    clear();
                  }}
                >
                  <Download size={14} /> Export selected
                </ActionButton>
                {canDelete ? (
                  <ActionButton
                    variant="danger"
                    size="sm"
                    disabled={!allEligible}
                    title={allEligible ? "Delete selected permanently" : "Only Draft claims can be deleted"}
                    onClick={() => setDeleteTarget({ items: selected, clearSelection: clear })}
                  >
                    <Trash2 size={14} /> Delete selected
                  </ActionButton>
                ) : null}
              </>
            );
          }}
        />
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Recent account entries</p>
        <DataTable
          columns={entryColumns}
          data={entryPageRows}
          getRowId={(entry) => entry.id}
          pageIndex={entryPage}
          pageCount={entryPageCount}
          onPageChange={setEntryPage}
          sorting={entrySorting}
          onSortingChange={setEntrySorting}
          globalFilter={entryFilter}
          onGlobalFilterChange={updateEntryFilter}
          searchPlaceholder="Search category, party, reference, notes"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadFinance()}
          emptyState={{
            icon: BadgeIndianRupee,
            title: entryFilter || entryTypeFilter ? "No entries match your filters" : "No account entries yet",
            description: entryFilter || entryTypeFilter ? "Try a different search term, or clear the type filter." : "Add income, deposits, expenses or refunds with the form above.",
            action: entryFilter || entryTypeFilter ? "Clear filters" : undefined,
            onAction:
              entryFilter || entryTypeFilter
                ? () => {
                    setEntryFilter("");
                    setEntryTypeFilter("");
                  }
                : undefined
          }}
          export={{ headers: entryExportHeaders, row: entryExportRow, filename: "account-entries.csv" }}
          toolbarExtra={
            <select
              aria-label="Filter by entry type"
              value={entryTypeFilter}
              onChange={(event) => updateEntryTypeFilter(event.target.value as AccountEntryType | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All types</option>
              {accountEntryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(entryExportHeaders, selected.map(entryExportRow), "selected-account-entries.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.items.length === 1 ? "this claim" : `${deleteTarget.items.length} claims`}?</DialogTitle>
                <DialogDescription>
                  {deleteTarget.items.length === 1
                    ? `This permanently removes the Draft insurance claim for ${deleteTarget.items[0].patientName} (${deleteTarget.items[0].insurer}). This cannot be undone.`
                    : "This permanently removes the selected Draft insurance claims. This cannot be undone."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <ActionButton variant="secondary" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
                  Keep it
                </ActionButton>
                <ActionButton
                  variant="danger"
                  loading={isDeleting}
                  disabled={isDeleting}
                  onClick={async () => {
                    const clearSelection = deleteTarget.clearSelection;
                    await handleConfirmDelete();
                    clearSelection?.();
                  }}
                >
                  {isDeleting ? "Deleting…" : "Delete permanently"}
                </ActionButton>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
