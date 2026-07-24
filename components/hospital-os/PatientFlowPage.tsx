"use client";

import { Download, Eye } from "lucide-react";
import { useMemo, useState } from "react";
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
import { StatusBadge, type BadgeTone } from "@/components/design-system/StatusBadge";
import { OperationsTable } from "@/components/hospital-os/OperationsTable";
import { PatientWorkspace } from "@/components/hospital-os/PatientWorkspace";
import { canAccessSection, downloadCsvFile, fetchHospitalSnapshot, hospitalRoleToAccessRole, openPatientWorkspace, patientFlowExportRow } from "@/lib/hospital-os-data";
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
 * Today's live patient-flow queue — the sidebar's "Patients" entry, its own
 * dedicated route, split out from the dashboard (Dashboard/Notifications/
 * Patients routing fix) so it has real back/forward and a direct link,
 * same as every other module. "Patient List" (full CRUD) is separate.
 */
export function PatientFlowPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [cancelTarget, setCancelTarget] = useState<PatientFlowRow | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { role } = useHospitalOsStore();
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

  const { rows } = snapshot;

  // UI convenience only — the PATCH endpoints re-check "appointments":"edit"
  // server-side on every request, same as every other mutation in the app.
  const canCancel = roleHasPermission(hospitalRoleToAccessRole[role], "appointments", "edit");
  // Same gate the dashboard used before Patient Flow moved to its own route —
  // a role with only patientFlow access (Reception, PRO) still opens this
  // page, but never had the clinical snapshot/timeline panel either.
  const canSeeWorkspace = canAccessSection(role, "clinicalWorkspace");

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
          {canCancel ? (
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
  ], [canCancel, openPatientDrawer]);

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
    <>
      <OperationsTable
        table={table}
        isLoading={isLoading}
        isError={isError}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      {canSeeWorkspace ? <PatientWorkspace rows={rows} /> : null}

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
    </>
  );
}
