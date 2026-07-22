"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Eye, MoreHorizontal } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/design-system/EmptyState";
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
  roleFallbackMessage,
  statusTone
} from "@/lib/hospital-os-data";
import type { PatientFlowRow } from "@/lib/hospital-os-data";
import { notify } from "@/lib/notify";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";

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
 */
async function cancelPatientFlowRow(row: PatientFlowRow, queryClient: QueryClient) {
  const noun = row.kind === "opd-visit" ? "visit" : "appointment";
  if (!window.confirm(`Cancel ${row.patient}'s ${noun}? This cannot be undone.`)) return;

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
    return;
  }

  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!response.ok || !data.ok) {
    notify.error(data.error || `Unable to cancel this ${noun}.`);
    return;
  }

  notify.success(`${noun === "visit" ? "Visit" : "Appointment"} cancelled`);
  await queryClient.invalidateQueries({ queryKey: ["hospital-os", "patient-flow"] });
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
      cell: ({ row }) => <span className="font-semibold text-[var(--hos-text)]">{row.original.uhid}</span>
    },
    {
      accessorKey: "patient",
      header: "Patient",
      cell: ({ row }) => (
        <button type="button" className="text-left" onClick={() => openPatientWorkspace(row.original.id)}>
          <span className="block font-semibold text-[var(--hos-text)]">{row.original.patient}</span>
          <span className="block text-xs text-[var(--hos-muted-text)]">{row.original.age} years - {row.original.risk} risk</span>
        </button>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline" className={statusTone[row.original.status]}>{row.original.status}</Badge>
    },
    { accessorKey: "doctor", header: "Doctor" },
    { accessorKey: "department", header: "Department" },
    {
      accessorKey: "billing",
      header: "Billing",
      cell: ({ row }) => <Badge variant="outline" className={statusTone[row.original.billing]}>{row.original.billing}</Badge>
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
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Preview ${row.original.patient}`}
            title={row.original.phone ? "Preview patient" : "No contact number on this row — preview unavailable"}
            disabled={!row.original.phone}
            onClick={() => openPatientDrawer(row.original.phone as string, row.original.patient)}
          >
            <Eye size={16} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={`Open actions for ${row.original.patient}`}>
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openPatientWorkspace(row.original.id)}>Open patient workspace</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportPatientFlowRow(row.original)}>Export row</DropdownMenuItem>
              {access.canCancel ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => void cancelPatientFlowRow(row.original, queryClient)}
                  >
                    Cancel {row.original.kind === "opd-visit" ? "visit" : "appointment"}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [access.canCancel, openPatientDrawer, queryClient]);

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
    </div>
  );
}
