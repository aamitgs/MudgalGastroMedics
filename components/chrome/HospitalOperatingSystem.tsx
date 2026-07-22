"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Download, Eye, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import type { QueryClient } from "@tanstack/react-query";
import { roleHasPermission } from "@/lib/access/matrix";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import { EmptyState } from "@/components/design-system/EmptyState";
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { DashboardOverview } from "@/components/hospital-os/DashboardOverview";
import { HospitalOsPageShell } from "@/components/hospital-os/HospitalOsPageShell";
import { OperationsTable } from "@/components/hospital-os/OperationsTable";
import { PatientWorkspace } from "@/components/hospital-os/PatientWorkspace";
import {
  canAccessSection,
  downloadCsvFile,
  fetchHospitalSnapshot,
  hospitalRoleToAccessRole,
  openPatientWorkspace,
  patientFlowExportRow,
  roleFallbackMessage
} from "@/lib/hospital-os-data";
import type { PatientFlowRow } from "@/lib/hospital-os-data";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

/** CLAUDE.md status-color rule: green=success, amber=warning, red=critical, blue=info, gray=inactive. */
const statusTone: Record<string, BadgeTone> = {
  "In Consultation": "success",
  "Vitals Pending": "warning",
  "Lab Review": "info",
  Scheduled: "inactive",
  "Billing Hold": "critical",
  Discharged: "success",
  Open: "warning",
  Paid: "success",
  Insurance: "info",
  Preauth: "info",
  "Refund Review": "critical"
};

function exportPatientFlowRow(patient: PatientFlowRow) {
  const patientSlug = patient.patient.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  downloadCsvFile([patientFlowExportRow(patient)], `hospital-os-patient-flow-${patientSlug}.csv`);
}

/**
 * Cancel is a real status transition (PATCH → "Cancelled"), never a delete —
 * this codebase has no hard-delete for clinical/appointment records, and the
 * matching row is removed from the next snapshot fetch because the API
 * excludes Cancelled rows from patient flow, not because anything was erased.
 * Routes to the store that actually owns the id (opd-visit vs appointment —
 * see PatientFlowRow.kind); both PATCH endpoints already authorize + audit.
 * Confirmation happens in the caller (a Dialog) — this just performs the PATCH.
 */
async function cancelPatientFlowRow(row: PatientFlowRow, queryClient: QueryClient): Promise<boolean> {
  const noun = row.kind === "opd-visit" ? "visit" : "appointment";
  const endpoint = row.kind === "opd-visit" ? "/api/opd" : "/api/appointment";
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, status: "Cancelled" })
    });
  } catch {
    notify.retryable("Unable to reach the server. Check your connection and retry.", () => void cancelPatientFlowRow(row, queryClient));
    return false;
  }

  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) {
    notify.error(data.error || `Unable to cancel this ${noun}.`);
    return false;
  }

  notify.success(`${noun === "visit" ? "Visit" : "Appointment"} cancelled`);
  await queryClient.invalidateQueries({ queryKey: ["hospital-os", "patient-flow"] });
  return true;
}

/**
 * `roleTodayBand` is a server-rendered RoleTodayBand element passed down from
 * app/mudgalgastromedics-os/page.tsx — RoleTodayBand is an async server
 * component and this whole tree is client-only (next/dynamic, ssr:false), so
 * it can't be imported here directly; it can only arrive pre-rendered as a
 * prop, same as any other "server component passed to a client component".
 *
 * HospitalOsPageShell provides the QueryClient + HospitalOsShell, same as
 * every per-module route — this used to hand-roll its own QueryClient here
 * (Track 2.7 audit: two ad hoc instances with identical config).
 */
export function HospitalOperatingSystem({ roleTodayBand }: { roleTodayBand?: ReactNode }) {
  return (
    <HospitalOsPageShell>
      <DashboardContent roleTodayBand={roleTodayBand} />
    </HospitalOsPageShell>
  );
}

/**
 * Dashboard-only content: the sidebar, TopNav, command palette and keyboard
 * shortcuts live in HospitalOsShell, shared with every per-module route.
 * This component owns only what's specific to the /mudgalgastromedics-os
 * dashboard itself — the live KPIs/trend, the role's "Today" band, a
 * per-patient clinical snapshot, and a real patient-flow table.
 *
 * The build-acceptance checklist, the three "Vercel-style"/"Stripe-style"
 * preview forms, the session-only fake audit trail, the patient-portal
 * design preview, and the bulk-schedule/assign-doctor row actions that used
 * to live here were removed — none of them persisted to the real stores
 * (they only ever wrote a decorative audit-log line), and every one of them
 * duplicates a real, fully-working module already reachable from the
 * sidebar (Patients, Appointments, Billing, Doctor Portal, Patient Portal).
 *
 * Row selection, preview and Cancel do NOT repeat that mistake: selection
 * only powers a read-only "export selected" (no new mutation surface),
 * preview reuses the existing global PatientDrawer (stores/patient-drawer-store.ts)
 * instead of a new panel, and Cancel PATCHes the same appointment/opd
 * endpoints the Appointments and OPD modules already call — it's a second
 * entry point to one real action, not a duplicate implementation of it.
 */
function DashboardContent({ roleTodayBand }: { roleTodayBand?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cancelTarget, setCancelTarget] = useState<PatientFlowRow | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { role, realtimeMessages } = useHospitalOsStore();
  const openPatientDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const queryClient = useQueryClient();

  const {
    data: snapshot = { rows: [], metrics: [], trend: [], navBadges: {} },
    isLoading,
    isError
  } = useQuery({
    queryKey: ["hospital-os", "patient-flow"],
    queryFn: fetchHospitalSnapshot
  });

  const { rows, metrics: liveDashboardMetrics, trend: liveTrend } = snapshot;

  const access = useMemo(() => {
    const clinicalWorkspace = canAccessSection(role, "clinicalWorkspace");
    const patientFlow = canAccessSection(role, "patientFlow");
    // UI convenience only — the PATCH endpoints re-check "appointments":"edit"
    // server-side on every request, same as every other mutation in the app.
    const canCancel = roleHasPermission(hospitalRoleToAccessRole[role], "appointments", "edit");
    return {
      clinicalWorkspace,
      patientFlow,
      canCancel,
      hasAnySection: clinicalWorkspace || patientFlow
    };
  }, [role]);

  const columns = useMemo<ColumnDef<PatientFlowRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
          aria-label={`Select ${row.original.patient}`}
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: "uhid",
      header: "UHID",
      cell: ({ row }) => <span className="font-semibold text-ink">{row.original.uhid}</span>
    },
    {
      accessorKey: "patient",
      header: "Patient",
      cell: ({ row }) => (
        <button type="button" className="text-left" onClick={() => openPatientWorkspace(row.original.id)}>
          <span className="block font-semibold text-ink">{row.original.patient}</span>
          <span className="block text-xs text-muted">{row.original.age} years - {row.original.risk} risk</span>
        </button>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge tone={statusTone[row.original.status]} className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.06em]">
          {row.original.status}
        </StatusBadge>
      )
    },
    { accessorKey: "doctor", header: "Doctor" },
    { accessorKey: "department", header: "Department" },
    {
      accessorKey: "billing",
      header: "Billing",
      cell: ({ row }) => (
        <StatusBadge tone={statusTone[row.original.billing]} className="rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-[0.06em]">
          {row.original.billing}
        </StatusBadge>
      )
    },
    {
      accessorKey: "waitMinutes",
      header: "Wait",
      cell: ({ row }) => <span>{row.original.waitMinutes}m</span>
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ActionButton
            variant="secondary"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label={`Preview ${row.original.patient}`}
            title={row.original.phone ? "Preview patient" : "No contact number on this row — preview unavailable"}
            disabled={!row.original.phone}
            onClick={() => openPatientDrawer(row.original.phone as string, row.original.patient)}
          >
            <Eye size={15} />
          </ActionButton>
          <ActionButton
            variant="secondary"
            size="sm"
            className="h-8 w-8 px-0"
            aria-label={`Export ${row.original.patient}`}
            title="Export row"
            onClick={() => exportPatientFlowRow(row.original)}
          >
            <Download size={15} />
          </ActionButton>
          {access.canCancel ? (
            <ActionButton
              variant="danger"
              size="sm"
              title={`Cancel this ${row.original.kind === "opd-visit" ? "visit" : "appointment"}`}
              onClick={() => setCancelTarget(row.original)}
            >
              Cancel
            </ActionButton>
          ) : null}
        </div>
      )
    }
  ], [access.canCancel, openPatientDrawer]);

  // TanStack Table intentionally returns imperative helpers that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 4
      }
    }
  });

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setIsCancelling(true);
    const cancelled = await cancelPatientFlowRow(cancelTarget, queryClient);
    setIsCancelling(false);
    if (cancelled) setCancelTarget(null);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1560px] gap-5 px-4 py-5 lg:px-6">
      <motion.section
        id="analytics"
        className="scroll-mt-20 grid gap-5 xl:grid-cols-[1fr_420px]"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <DashboardOverview realtimeMessages={realtimeMessages} metrics={liveDashboardMetrics} series={liveTrend} isLoading={isLoading} />
      </motion.section>

      {/* Rendered after DashboardOverview's own h1 (Track 4.13) so RoleTodayBand's
          h2 doesn't precede the page's h1 in DOM order — axe's heading-order
          rule flags exactly that as an invalid jump once a later h3 (e.g. an
          empty-state) appears with no h2 between it and the page's h1. */}
      {roleTodayBand}

      {role === "Doctor" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <Stethoscope size={22} />
            </span>
            <div>
              <p className="font-bold text-ink">Continue to your clinical workspace</p>
              <p className="text-sm text-muted">OPD queue, patient context, prescriptions and follow-up planning.</p>
            </div>
          </div>
          <ActionButton variant="primary" onClick={() => window.location.assign("/mudgalgastromedics-os/doctor-portal")}>
            Open Doctor Portal
          </ActionButton>
        </div>
      ) : null}

      {access.clinicalWorkspace ? <PatientWorkspace rows={rows} /> : null}

      {access.patientFlow ? (
        <OperationsTable
          table={table}
          isLoading={isLoading}
          isError={isError}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      ) : null}

      {!access.hasAnySection ? (
        <EmptyState
          icon={Building2}
          title={roleFallbackMessage[role]?.title ?? "No workspace sections for this role yet"}
          description={roleFallbackMessage[role]?.description ?? `Hospital OS does not have dedicated ${role} sections built yet. Use the full Admin dashboard for now.`}
          action="Open Admin dashboard"
          onAction={() => window.location.assign("/admin")}
        />
      ) : null}

      <Dialog open={cancelTarget !== null} onOpenChange={(open) => !open && !isCancelling && setCancelTarget(null)}>
        <DialogContent>
          {cancelTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Cancel {cancelTarget.kind === "opd-visit" ? "visit" : "appointment"}?</DialogTitle>
                <DialogDescription>
                  This cancels {cancelTarget.patient}&apos;s {cancelTarget.kind === "opd-visit" ? "OPD visit" : "appointment"} ({cancelTarget.uhid}). This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <ActionButton variant="secondary" disabled={isCancelling} onClick={() => setCancelTarget(null)}>
                  Keep it
                </ActionButton>
                <ActionButton variant="danger" loading={isCancelling} disabled={isCancelling} onClick={() => void handleConfirmCancel()}>
                  {isCancelling ? "Cancelling…" : `Cancel ${cancelTarget.kind === "opd-visit" ? "visit" : "appointment"}`}
                </ActionButton>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
