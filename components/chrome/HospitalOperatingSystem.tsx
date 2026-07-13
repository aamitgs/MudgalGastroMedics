"use client";

import Fuse from "fuse.js";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bed,
  Building2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  MoreHorizontal,
  LogOut,
  ShieldCheck,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
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
import { CommandPalette } from "@/components/hospital-os/CommandPalette";
import { DashboardOverview } from "@/components/hospital-os/DashboardOverview";
import { DoctorWorkspace } from "@/components/hospital-os/DoctorWorkspace";
import { OperationsTable } from "@/components/hospital-os/OperationsTable";
import { PatientPortalPanel } from "@/components/hospital-os/PatientPortalPanel";
import { PatientRegistrationForm } from "@/components/hospital-os/PatientRegistrationForm";
import { PatientWorkspace } from "@/components/hospital-os/PatientWorkspace";
import { ShortcutsDialog } from "@/components/hospital-os/ShortcutsDialog";
import { TopNav } from "@/components/hospital-os/TopNav";
import {
  canAccessCommandEntity,
  accessRoleToHospitalRole,
  canAccessSection,
  commandRecords,
  downloadCsvFile,
  navGroupOrder,
  navItems,
  openPatientWorkspace,
  patientFlowExportRow,
  roleFallbackMessage,
  statusTone
} from "@/lib/hospital-os-data";
import type { AuditTrailItem, DashboardMetric, DoctorAssignment, HospitalRealtimeEvent, HospitalTrendPoint, NavBadgeCounts, PatientFlowRow, RealtimeMessage } from "@/lib/hospital-os-data";
import { roleMeta, type AccessRole } from "@/lib/access/matrix";
import { createHospitalRealtimeClient } from "@/lib/websocket/hospital-os-client";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import {
  assignHospitalDoctor,
  bulkUpdatePatientFlow
} from "@/app/mudgalgastromedics-os/actions";

const commandFuse = new Fuse(commandRecords, {
  includeScore: true,
  threshold: 0.35,
  keys: [
    { name: "title", weight: 0.45 },
    { name: "subtitle", weight: 0.25 },
    { name: "entity", weight: 0.2 },
    { name: "keywords", weight: 0.1 }
  ]
});

type HospitalSnapshotResponse = {
  ok: boolean;
  rows?: PatientFlowRow[];
  metrics?: DashboardMetric[];
  trend?: HospitalTrendPoint[];
  navBadges?: NavBadgeCounts;
  error?: string;
};

type HospitalSnapshot = {
  rows: PatientFlowRow[];
  metrics: DashboardMetric[];
  trend: HospitalTrendPoint[];
  navBadges: NavBadgeCounts;
};

function realtimeEventMessage(event: HospitalRealtimeEvent) {
  switch (event.type) {
    case "notification.created":
      return event.payload.message;
    case "queue.updated":
      return `Queue: ${event.payload.uhid} moved to ${event.payload.status}`;
    case "bed.updated":
      return `Bed ${event.payload.bedId}: ${event.payload.status}`;
    case "doctor.updated":
      return `Doctor ${event.payload.doctorId} is now ${event.payload.available ? "available" : "unavailable"}`;
    case "pharmacy.stock.updated":
      return `Pharmacy stock: ${event.payload.item} at ${event.payload.stock} (threshold ${event.payload.threshold})`;
    case "dashboard.metric.updated":
      return `${event.payload.metric} updated to ${event.payload.value}`;
    default:
      return "Hospital OS event";
  }
}

function exportPatientFlowRow(patient: PatientFlowRow) {
  const patientSlug = patient.patient.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  downloadCsvFile([patientFlowExportRow(patient)], `hospital-os-patient-flow-${patientSlug}.csv`);
}

async function fetchHospitalSnapshot(): Promise<HospitalSnapshot> {
  const response = await fetch("/api/hospital-os/snapshot", { cache: "no-store" });
  const data = await response.json().catch(() => ({})) as HospitalSnapshotResponse;

  if (!response.ok || !data.ok || !data.rows) {
    throw new Error(data.error || "Unable to load Hospital OS snapshot.");
  }

  // metrics/trend are always computed live by the API from real store data
  // (never omitted); these fall back to empty, not fabricated numbers, so a
  // malformed response degrades to "no data" rather than misleading figures.
  return { rows: data.rows, metrics: data.metrics ?? [], trend: data.trend ?? [], navBadges: data.navBadges ?? {} };
}

type OsSession = {
  name: string;
  legacy: boolean;
  activeRole: AccessRole;
  heldRoles: AccessRole[];
};

async function fetchOsSession(): Promise<OsSession | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  if (!data?.ok) return null;
  return {
    name: data.user?.name ?? "Staff",
    legacy: Boolean(data.legacy),
    activeRole: data.activeRole,
    heldRoles: data.user?.roles ?? []
  };
}

function HospitalOsProviders() {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        refetchOnWindowFocus: false
      }
    }
  }));

  return (
    <QueryClientProvider client={client}>
      <HospitalOsApp />
    </QueryClientProvider>
  );
}

export function HospitalOperatingSystem() {
  return <HospitalOsProviders />;
}

function HospitalOsApp() {
  const reducedMotion = useReducedMotion();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [globalFilter, setGlobalFilter] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
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
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "polling" | "closed">("connecting");
  // Starts empty, not fabricated sample events — the realtime feed (below)
  // shows a neutral waiting state until the WebSocket/polling connection
  // delivers real activity. Each entry carries a generated id (not just the
  // message text) since the same message can legitimately recur — using text
  // as the React key caused "duplicate key" warnings when it did.
  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>([]);
  const navRef = useRef<HTMLElement | null>(null);

  const {
    role,
    sidebarCollapsed,
    darkMode,
    selectedRows,
    flowStatus,
    setRole,
    setSidebarCollapsed,
    toggleSidebar,
    toggleDarkMode,
    setSelectedRows
  } = useHospitalOsStore();

  const {
    data: snapshot = { rows: [], metrics: [], trend: [], navBadges: {} },
    isLoading,
    isError
  } = useQuery({
    queryKey: ["hospital-os", "patient-flow"],
    queryFn: fetchHospitalSnapshot
  });

  const queryClient = useQueryClient();
  const { data: osSession } = useQuery({
    queryKey: ["hospital-os", "session"],
    queryFn: fetchOsSession
  });
  const [pendingElevationRole, setPendingElevationRole] = useState<AccessRole | "">("");
  const [elevationPassword, setElevationPassword] = useState("");
  const [roleSwitchError, setRoleSwitchError] = useState("");
  const [roleSwitchBusy, setRoleSwitchBusy] = useState(false);

  // The OS workspace follows the authenticated session's active role; there is
  // no free role picker — switching roles goes through the real, audited
  // /api/auth/role endpoint below.
  useEffect(() => {
    if (osSession) setRole(accessRoleToHospitalRole[osSession.activeRole] ?? "Front Desk");
  }, [osSession, setRole]);

  async function switchWorkspaceRole(target: AccessRole, password?: string) {
    setRoleSwitchBusy(true);
    setRoleSwitchError("");
    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: target, password })
      });
      const data = await response.json().catch(() => ({}));
      if (!data.ok) {
        setRoleSwitchError(data.error || "Could not switch role.");
        return;
      }
      setPendingElevationRole("");
      setElevationPassword("");
      await queryClient.invalidateQueries({ queryKey: ["hospital-os", "session"] });
    } finally {
      setRoleSwitchBusy(false);
    }
  }

  async function signOutOfWorkspace() {
    if (osSession?.legacy) await fetch("/api/admin/session", { method: "DELETE" });
    else await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }
  const { rows, metrics: liveDashboardMetrics, trend: liveTrend } = snapshot;

  const tableRows = useMemo(() => rows.map((row) => ({
    ...row,
    doctor: doctorOverrides[row.id] ?? row.doctor,
    status: bulkStatusOverrides[row.id] ?? row.status
  })), [bulkStatusOverrides, doctorOverrides, rows]);

  useEffect(() => {
    const storedSidebar = window.localStorage.getItem("hospital-os-sidebar");
    const storedTheme = window.localStorage.getItem("hospital-os-theme");
    if (storedSidebar) setSidebarCollapsed(storedSidebar === "collapsed");
    if (storedTheme === "dark" && !darkMode) toggleDarkMode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hospital-os-sidebar", sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("hospital-os-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const client = createHospitalRealtimeClient({
      url: process.env.NEXT_PUBLIC_HOSPITAL_WS_URL,
      pollingUrl: "/api/hospital-os/realtime",
      pollingMs: 6000,
      onStatus: setRealtimeStatus,
      onEvent: (event) => {
        const text = realtimeEventMessage(event);
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setRealtimeMessages((items) => [{ id, text }, ...items].slice(0, 5));
      }
    });

    client.connect();
    return () => client.disconnect();
  }, []);

  useEffect(() => {
    setSelectedRows(rowSelection);
  }, [rowSelection, setSelectedRows]);

  const visibleNav = useMemo(
    () =>
      navItems
        .filter((item) => item.roles.includes(role))
        .map((item) => {
          const liveCount = snapshot.navBadges[item.label as keyof NavBadgeCounts];
          return liveCount === undefined ? item : { ...item, badge: String(liveCount) };
        }),
    [role, snapshot.navBadges]
  );

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

  const commandResults = useMemo(() => {
    const matches = commandQuery.trim()
      ? commandFuse.search(commandQuery).map((result) => result.item)
      : commandRecords;
    return matches.filter((item) => canAccessCommandEntity(role, item.entity));
  }, [commandQuery, role]);

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

  function onSidebarKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    const buttons = Array.from(navRef.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? []);
    const currentIndex = buttons.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons[(currentIndex + 1) % buttons.length]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      buttons[(currentIndex - 1 + buttons.length) % buttons.length]?.focus();
    }
    if (event.key === "Enter") {
      (document.activeElement as HTMLElement | null)?.click();
    }
  }

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

  const shellClass = darkMode ? "hospital-os-theme dark" : "hospital-os-theme";

  return (
    <main className={`${shellClass} min-h-screen bg-[var(--hos-bg)] text-[var(--hos-text)]`}>
      <div className="flex min-h-screen">
        <aside
          className={`${mobileNav ? "fixed inset-y-0 left-0 z-50" : "hidden"} ${sidebarCollapsed ? "w-[88px]" : "w-[286px]"} border-r border-[var(--hos-border)] bg-[var(--hos-surface)] lg:sticky lg:top-0 lg:z-20 lg:block lg:h-screen`}
        >
          <div className="flex h-16 items-center justify-between border-b border-[var(--hos-border)] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--hos-primary)] text-white">
                <HeartPulse size={19} />
              </div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">MudgalGastromedics OS</p>
                  <p className="truncate text-xs text-[var(--hos-muted-text)]">Connected Healthcare. Unified Operations.</p>
                </div>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation">
              <X size={16} />
            </Button>
          </div>

          <div className="flex h-[calc(100vh-64px)] flex-col gap-3 overflow-y-auto p-3">
            {!sidebarCollapsed ? (
              <div className="px-2 py-2">
                <p className="text-xs font-semibold uppercase text-[var(--hos-muted-text)]">Signed in</p>
                <div className="mt-2 grid gap-2 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--hos-text)]">{osSession ? osSession.name : "Loading session..."}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--hos-muted-text)]">
                      {osSession ? roleMeta[osSession.activeRole].label : ""}
                      {osSession?.legacy ? " (legacy login)" : ""}
                    </p>
                  </div>
                  {osSession && !osSession.legacy && osSession.heldRoles.length > 1 ? (
                    <select
                      value={pendingElevationRole || osSession.activeRole}
                      onChange={(event) => {
                        const target = event.target.value as AccessRole;
                        if (target === osSession.activeRole) {
                          setPendingElevationRole("");
                          return;
                        }
                        if (target === "super-admin") {
                          setPendingElevationRole(target);
                          return;
                        }
                        void switchWorkspaceRole(target);
                      }}
                      disabled={roleSwitchBusy}
                      className="min-h-9 w-full rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-xs font-semibold text-[var(--hos-text)]"
                      aria-label="Switch to another of your roles"
                    >
                      {osSession.heldRoles.map((held) => (
                        <option key={held} value={held}>{roleMeta[held].label}</option>
                      ))}
                    </select>
                  ) : null}
                  {pendingElevationRole === "super-admin" ? (
                    <div className="grid gap-2">
                      <input
                        type="password"
                        value={elevationPassword}
                        onChange={(event) => setElevationPassword(event.target.value)}
                        placeholder="Confirm password to elevate"
                        className="min-h-9 w-full rounded-lg border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 text-xs text-[var(--hos-text)]"
                        aria-label="Password confirmation for Super Admin elevation"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={roleSwitchBusy || !elevationPassword}
                        onClick={() => void switchWorkspaceRole("super-admin", elevationPassword)}
                        className="min-h-9 bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]"
                      >
                        <ShieldCheck size={14} /> Elevate for 30 min
                      </Button>
                    </div>
                  ) : null}
                  {roleSwitchError ? <p className="text-xs font-semibold text-[var(--hos-danger)]">{roleSwitchError}</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void signOutOfWorkspace()}
                    className="min-h-9 border-[var(--hos-border)] bg-[var(--hos-surface)]"
                  >
                    <LogOut size={14} /> Sign out
                  </Button>
                </div>
              </div>
            ) : null}

            <nav ref={navRef} onKeyDown={onSidebarKeyDown} className="grid gap-2" aria-label="Hospital OS sections">
              {navGroupOrder.map((group) => {
                const items = visibleNav.filter((item) => item.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="grid gap-1" role="group" aria-label={group}>
                    {!sidebarCollapsed ? (
                      <p className="px-3 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--hos-muted-text)]/70">{group}</p>
                    ) : null}
                    {items.map(({ label, icon: Icon, badge, href }) => (
                      <a
                        href={href}
                        key={label}
                        data-nav-item
                        onClick={() => {
                          setActiveNav(label);
                          setMobileNav(false);
                        }}
                        className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition hover:bg-[var(--hos-muted)] ${activeNav === label ? "bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]" : "text-[var(--hos-muted-text)]"}`}
                        title={sidebarCollapsed ? label : undefined}
                        aria-current={activeNav === label ? "page" : undefined}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!sidebarCollapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
                        {!sidebarCollapsed && badge ? <Badge className="bg-white/15 text-white hover:bg-white/15">{badge}</Badge> : null}
                      </a>
                    ))}
                  </div>
                );
              })}
            </nav>

            <Button type="button" variant="outline" onClick={toggleSidebar} className="mt-auto hidden min-h-10 gap-2 border-[var(--hos-border)] bg-[var(--hos-bg)] lg:inline-flex">
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!sidebarCollapsed ? "Collapse" : null}
            </Button>
          </div>
        </aside>

        {mobileNav ? <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileNav(false)} /> : null}

        <section className="min-w-0 flex-1">
          <TopNav
            onOpenSidebar={() => setMobileNav(true)}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            darkMode={darkMode}
            onToggleTheme={toggleDarkMode}
            realtimeStatus={realtimeStatus}
          />

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
          </div>
        </section>
      </div>

      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        query={commandQuery}
        setQuery={setCommandQuery}
        results={commandResults}
      />
      <ShortcutsDialog open={shortcutsOpen} setOpen={setShortcutsOpen} />
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
    </main>
  );
}
