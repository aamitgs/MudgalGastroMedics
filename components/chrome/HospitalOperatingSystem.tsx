"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/design-system/EmptyState";
import { AcceptancePanel } from "@/components/hospital-os/AcceptancePanel";
import { AppointmentBookingForm } from "@/components/hospital-os/AppointmentBookingForm";
import { AssignDoctorDialog } from "@/components/hospital-os/AssignDoctorDialog";
import { AuditTrailPanel } from "@/components/hospital-os/AuditTrailPanel";
import { BillingForm } from "@/components/hospital-os/BillingForm";
import { DashboardOverview } from "@/components/hospital-os/DashboardOverview";
import { DoctorWorkspace } from "@/components/hospital-os/DoctorWorkspace";
import { HospitalOsPageShell } from "@/components/hospital-os/HospitalOsPageShell";
import { OperationsTable } from "@/components/hospital-os/OperationsTable";
import { PatientPortalPanel } from "@/components/hospital-os/PatientPortalPanel";
import { PatientRegistrationForm } from "@/components/hospital-os/PatientRegistrationForm";
import { PatientWorkspace } from "@/components/hospital-os/PatientWorkspace";
import {
  canAccessSection,
  downloadCsvFile,
  fetchHospitalSnapshot,
  openPatientWorkspace,
  patientFlowExportRow,
  roleFallbackMessage,
  statusTone
} from "@/lib/hospital-os-data";
import type { AuditTrailItem, DoctorAssignment, PatientFlowRow } from "@/lib/hospital-os-data";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import {
  assignHospitalDoctor,
  bulkUpdatePatientFlow
} from "@/app/mudgalgastromedics-os/actions";

function exportPatientFlowRow(patient: PatientFlowRow) {
  const patientSlug = patient.patient.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  downloadCsvFile([patientFlowExportRow(patient)], `hospital-os-patient-flow-${patientSlug}.csv`);
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
 * Dashboard-only content (Track 4.13, docs/build-roadmap.md): the sidebar,
 * TopNav, command palette and keyboard shortcuts that used to live inline
 * here now live in HospitalOsShell, shared with every per-module route. This
 * component owns only what's specific to the /mudgalgastromedics-os
 * dashboard itself — the live patient-flow table, bulk actions, doctor
 * assignment, audit trail and the role-gated section list.
 */
function DashboardContent({ roleTodayBand }: { roleTodayBand?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkStatusOverrides, setBulkStatusOverrides] = useState<Record<string, PatientFlowRow["status"]>>({});
  const [doctorOverrides, setDoctorOverrides] = useState<Record<string, string>>({});
  const [doctorAssignment, setDoctorAssignment] = useState<DoctorAssignment | null>(null);
  const [doctorAssignmentError, setDoctorAssignmentError] = useState("");
  const [isDoctorAssignmentPending, startDoctorAssignmentTransition] = useTransition();
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [isBulkPending, startBulkTransition] = useTransition();
  const [auditTrail, setAuditTrail] = useState<AuditTrailItem[]>([]);

  const { role, selectedRows, flowStatus, setSelectedRows, realtimeMessages } = useHospitalOsStore();

  const {
    data: snapshot = { rows: [], metrics: [], trend: [], navBadges: {} },
    isLoading,
    isError
  } = useQuery({
    queryKey: ["hospital-os", "patient-flow"],
    queryFn: fetchHospitalSnapshot
  });

  const { rows, metrics: liveDashboardMetrics, trend: liveTrend } = snapshot;

  const tableRows = useMemo(() => rows.map((row) => ({
    ...row,
    doctor: doctorOverrides[row.id] ?? row.doctor,
    status: bulkStatusOverrides[row.id] ?? row.status
  })), [bulkStatusOverrides, doctorOverrides, rows]);

  useEffect(() => {
    setSelectedRows(rowSelection);
  }, [rowSelection, setSelectedRows]);

  const access = useMemo(() => {
    const clinicalWorkspace = canAccessSection(role, "clinicalWorkspace");
    const patientPortalPreview = canAccessSection(role, "patientPortalPreview");
    const patientRegistration = canAccessSection(role, "patientRegistration");
    const appointmentBooking = canAccessSection(role, "appointmentBooking");
    const billing = canAccessSection(role, "billing");
    const patientFlow = canAccessSection(role, "patientFlow");
    const acceptance = canAccessSection(role, "acceptance");
    const auditTrail = canAccessSection(role, "auditTrail");
    const appointmentFlow = patientRegistration || appointmentBooking || billing;
    const acceptanceRow = acceptance || auditTrail;
    return {
      clinicalWorkspace,
      patientPortalPreview,
      patientRegistration,
      appointmentBooking,
      billing,
      patientFlow,
      acceptance,
      auditTrail,
      appointmentFlow,
      acceptanceRow,
      hasAnySection: clinicalWorkspace || patientPortalPreview || appointmentFlow || patientFlow || acceptanceRow
    };
  }, [role]);

  const recordSessionAudit = useCallback((item: Omit<AuditTrailItem, "recordedAt">) => {
    setAuditTrail((current) => [
      { ...item, recordedAt: new Date().toISOString() },
      ...current
    ].slice(0, 6));
  }, []);

  const columns = useMemo<ColumnDef<PatientFlowRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={`Open actions for ${row.original.patient}`}>
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openPatientWorkspace(row.original.id)}>Open patient workspace</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {
              setDoctorAssignmentError("");
              setDoctorAssignment({ patientId: row.original.id, patientName: row.original.patient, doctor: row.original.doctor });
            }}>Assign doctor</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportPatientFlowRow(row.original)}>Export row</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], []);

  // TanStack Table intentionally returns imperative helpers that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableRows,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection
    },
    enableRowSelection: true,
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

  function bulkScheduleSelectedRows() {
    const selected = table.getSelectedRowModel().rows;
    if (selected.length === 0) {
      setBulkError("Select at least one patient flow row.");
      return;
    }

    const rowIds = selected.map((row) => row.original.id);
    setBulkError("");
    startBulkTransition(async () => {
      const result = await bulkUpdatePatientFlow({ rowIds, status: "Scheduled" });
      if (!result.ok) {
        setBulkError(result.message);
        return;
      }

      setBulkStatusOverrides((current) => {
        const next = { ...current };
        rowIds.forEach((rowId) => {
          next[rowId] = "Scheduled";
        });
        return next;
      });
      setBulkMessage(`${result.message}${result.auditId ? ` Audit ${result.auditId}.` : ""}`);
      if (result.auditId) {
        recordSessionAudit({
          id: result.auditId,
          action: "hospital_os.patient_flow.bulk_updated",
          entityType: "patient_flow",
          entityId: `${rowIds.length} selected rows`
        });
      }
      setRowSelection({});
    });
  }

  function saveDoctorAssignment(assignment: DoctorAssignment) {
    setDoctorAssignmentError("");
    startDoctorAssignmentTransition(async () => {
      const result = await assignHospitalDoctor({
        patientId: assignment.patientId,
        doctor: assignment.doctor
      });
      if (!result.ok) {
        setDoctorAssignmentError(result.message);
        return;
      }

      setDoctorOverrides((current) => ({
        ...current,
        [assignment.patientId]: assignment.doctor
      }));
      if (result.auditId) {
        recordSessionAudit({
          id: result.auditId,
          action: "hospital_os.patient_flow.doctor_assigned",
          entityType: "patient_flow",
          entityId: assignment.patientId
        });
      }
      setDoctorAssignment(null);
    });
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

      {access.clinicalWorkspace ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
          <PatientWorkspace rows={rows} />
          <DoctorWorkspace rows={rows} onAuditEvent={recordSessionAudit} />
        </section>
      ) : null}

      {access.patientPortalPreview ? <PatientPortalPanel onAuditEvent={recordSessionAudit} /> : null}

      {access.appointmentFlow ? (
        <section id="appointment-flow" className="scroll-mt-20 grid gap-5 xl:grid-cols-3">
          {access.patientRegistration ? <PatientRegistrationForm onAuditEvent={recordSessionAudit} /> : null}
          {access.appointmentBooking ? <AppointmentBookingForm onAuditEvent={recordSessionAudit} /> : null}
          {access.billing ? <BillingForm onAuditEvent={recordSessionAudit} /> : null}
        </section>
      ) : null}

      {access.patientFlow ? (
        <OperationsTable
          table={table}
          isLoading={isLoading}
          isError={isError}
          selectedCount={Object.keys(selectedRows).length}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          bulkMessage={bulkMessage}
          bulkError={bulkError}
          isBulkPending={isBulkPending}
          onBulkSchedule={bulkScheduleSelectedRows}
        />
      ) : null}

      {access.acceptanceRow ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          {access.acceptance ? <AcceptancePanel flowStatus={flowStatus} /> : null}
          {access.auditTrail ? <AuditTrailPanel items={auditTrail} /> : null}
        </section>
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

      <AssignDoctorDialog
        assignment={doctorAssignment}
        setAssignment={(assignment) => {
          if (!assignment) setDoctorAssignmentError("");
          setDoctorAssignment(assignment);
        }}
        error={doctorAssignmentError}
        isPending={isDoctorAssignmentPending}
        onSave={saveDoctorAssignment}
      />
    </div>
  );
}
