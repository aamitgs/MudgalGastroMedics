"use client";

import Fuse from "fuse.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bed,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleDollarSign,
  ClipboardList,
  Command,
  CreditCard,
  Download,
  FileText,
  HeartPulse,
  LineChart,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  QrCode,
  LogOut,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  UserRoundPlus,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ZodIssue } from "zod";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/design-system/EmptyState";
import { MetricCard } from "@/components/design-system/MetricCard";
import {
  analyticsSeries,
  canAccessCommandEntity,
  accessRoleToHospitalRole,
  canAccessSection,
  clinicalTimeline,
  commandRecords,
  dashboardMetrics,
  hospitalRoles,
  liveEvents,
  navGroupOrder,
  navItems,
  patientFlowRows,
  roleFallbackMessage,
  v1AiScope
} from "@/lib/hospital-os-data";
import type { CommandRecord, DashboardMetric, HospitalRealtimeEvent, HospitalRole, PatientFlowRow } from "@/lib/hospital-os-data";
import { roleMeta, type AccessRole } from "@/lib/access/matrix";
import { createHospitalRealtimeClient } from "@/lib/websocket/hospital-os-client";
import {
  appointmentSchema,
  billingSchema,
  patientRegistrationSchema
} from "@/lib/validation/hospital-os";
import type { AppointmentInput, BillingInput, PatientRegistrationInput } from "@/lib/validation/hospital-os";
import { LiveClockWeather } from "@/components/LiveClockWeather";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import type { LucideIcon } from "lucide-react";
import {
  assignHospitalDoctor,
  autosaveClinicalNotes,
  bulkUpdatePatientFlow,
  bookHospitalAppointment,
  confirmAiPrescriptionSuggestion,
  postHospitalBilling,
  registerHospitalPatient,
  requestTeleconsultation
} from "@/app/mudgalgastromedics-os/actions";

type FlowErrorMap<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

type AuditTrailItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  recordedAt: string;
};

type DoctorAssignment = {
  patientId: string;
  patientName: string;
  doctor: string;
};

const statusTone: Record<string, string> = {
  "In Consultation": "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  "Vitals Pending": "border-[var(--hos-warning)]/25 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]",
  "Lab Review": "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  Scheduled: "border-[var(--hos-border)] bg-[var(--hos-muted)] text-[var(--hos-text)]",
  "Billing Hold": "border-[var(--hos-danger)]/20 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]",
  Discharged: "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  Open: "border-[var(--hos-warning)]/25 bg-[var(--hos-warning)]/10 text-[var(--hos-warning)]",
  Paid: "border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]",
  Insurance: "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  Preauth: "border-[var(--hos-primary)]/20 bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]",
  "Refund Review": "border-[var(--hos-danger)]/20 bg-[var(--hos-danger)]/10 text-[var(--hos-danger)]"
};

const metricIcons: Record<string, LucideIcon> = {
  "OPD Flow": Activity,
  "Bed Occupancy": Bed,
  "Revenue Today": CircleDollarSign,
  "Critical Alerts": AlertTriangle
};

const assignableDoctors = ["Dr. Deepak Sharma", "Duty Doctor", "Dr. Neha Bansal", "Dr. Arvind Rao"];

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

type HospitalTrendPoint = { time: string; opd: number; revenue: number };

type HospitalSnapshotResponse = {
  ok: boolean;
  rows?: PatientFlowRow[];
  metrics?: DashboardMetric[];
  trend?: HospitalTrendPoint[];
  error?: string;
};

type HospitalSnapshot = {
  rows: PatientFlowRow[];
  metrics: DashboardMetric[];
  trend: HospitalTrendPoint[];
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

const patientFlowExportHeaders = ["UHID", "Patient", "Age", "Status", "Doctor", "Department", "Billing", "Insurance", "Wait Minutes", "Risk", "Last Activity"];

function patientFlowExportRow(patient: PatientFlowRow) {
  return [
    patient.uhid,
    patient.patient,
    String(patient.age),
    patient.status,
    patient.doctor,
    patient.department,
    patient.billing,
    patient.insurance,
    String(patient.waitMinutes),
    patient.risk,
    patient.lastActivity
  ];
}

function downloadCsvFile(rows: string[][], filename: string) {
  const csv = [patientFlowExportHeaders, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

  return { rows: data.rows, metrics: data.metrics ?? dashboardMetrics, trend: data.trend ?? analyticsSeries };
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

function openPatientWorkspace(patientId: string) {
  useHospitalOsStore.getState().setActivePatient(patientId);
  document.querySelector("#patient-workspace")?.scrollIntoView({ block: "start" });
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-semibold text-[var(--hos-muted-text)]">{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-[var(--hos-danger)]">{error}</p> : null}
    </div>
  );
}

function applyIssues<T extends Record<string, unknown>>(issues: ZodIssue[]) {
  return issues.reduce<FlowErrorMap<T>>((errors, issue) => {
    const key = issue.path[0] as keyof T | undefined;
    if (key) errors[key] = issue.message;
    return errors;
  }, {});
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
  const [realtimeMessages, setRealtimeMessages] = useState(liveEvents);
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
    data: snapshot = { rows: [], metrics: dashboardMetrics, trend: analyticsSeries },
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
        const message = realtimeEventMessage(event);
        setRealtimeMessages((items) => [message, ...items].slice(0, 5));
      }
    });

    client.connect();
    return () => client.disconnect();
  }, []);

  useEffect(() => {
    setSelectedRows(rowSelection);
  }, [rowSelection, setSelectedRows]);

  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role]);

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
              <DashboardOverview realtimeMessages={realtimeMessages} metrics={liveDashboardMetrics} series={liveTrend} />
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

function TopNav({
  onOpenSidebar,
  onOpenPalette,
  onOpenShortcuts,
  darkMode,
  onToggleTheme,
  realtimeStatus
}: {
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  realtimeStatus: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--hos-border)] bg-[var(--hos-surface)]/92 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)] lg:hidden" onClick={onOpenSidebar} aria-label="Open navigation">
          <Menu size={18} />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenPalette}
          className="min-h-10 flex-1 justify-start gap-3 border-[var(--hos-border)] bg-[var(--hos-bg)] px-3 text-left text-sm font-normal text-[var(--hos-muted-text)] hover:bg-[var(--hos-bg)]"
        >
          <Search size={17} />
          <span className="truncate">Search patients, UHID, doctor, invoice, medicine, bed, room, procedure...</span>
          <span className="ml-auto hidden rounded-md border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 py-1 text-[11px] font-semibold sm:block">Ctrl K</span>
        </Button>
        <LiveClockWeather variant="os" />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="hidden min-h-10 gap-2 border-[var(--hos-border)] bg-[var(--hos-surface)] md:inline-flex">
              <Building2 size={17} /> Agra Main
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <p className="text-sm font-semibold">Branch switcher</p>
            <p className="mt-2 text-sm text-[var(--hos-muted-text)]">Multi-branch switching is stubbed for v1 and not connected to a backend.</p>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" aria-label="Messages">
          <MessageSquare size={18} />
        </Button>
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" onClick={onOpenShortcuts} aria-label="Keyboard shortcuts">
          <Command size={18} />
        </Button>
        <Button type="button" variant="outline" size="icon" className="relative border-[var(--hos-border)]" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--hos-danger)]" />
        </Button>
        <Button type="button" variant="outline" size="icon" className="border-[var(--hos-border)]" onClick={onToggleTheme} aria-label="Toggle theme">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Avatar className="h-10 w-10 border border-[var(--hos-border)]">
          <AvatarFallback className="bg-[var(--hos-muted)] text-xs font-semibold text-[var(--hos-text)]">MG</AvatarFallback>
        </Avatar>
      </div>
      <div className="border-t border-[var(--hos-border)] px-4 py-2 text-xs font-medium text-[var(--hos-muted-text)] lg:px-6">
        Realtime: <span className="capitalize text-[var(--hos-primary)]">{realtimeStatus}</span> · AI v1 scope excludes AI Receptionist automation.
      </div>
    </header>
  );
}

function ShortcutsDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const shortcuts = [
    ["Ctrl/⌘ K", "Open command palette"],
    ["?", "Open keyboard shortcuts"],
    ["↑ / ↓", "Move through sidebar items"],
    ["Enter", "Activate focused sidebar item"],
    ["Esc", "Close overlays"]
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="hospital-os-theme border-[var(--hos-border)] bg-[var(--hos-surface)] text-[var(--hos-text)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Fast navigation for the Hospital OS workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map(([keys, action]) => (
            <div key={keys} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-3">
              <span className="text-sm text-[var(--hos-muted-text)]">{action}</span>
              <kbd className="rounded-md border border-[var(--hos-border)] bg-[var(--hos-surface)] px-2 py-1 text-xs font-semibold">{keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DashboardOverview({
  realtimeMessages,
  metrics,
  series
}: {
  realtimeMessages: string[];
  metrics: DashboardMetric[];
  series: HospitalTrendPoint[];
}) {
  return (
    <>
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)] shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Stripe-style command center</p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight md:text-[32px]">
                Clean operating telemetry for clinical, financial, and capacity decisions.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--hos-muted-text)]">
                Live KPIs use Recharts consistently across dashboards. Color is reserved for status, action, and alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="gap-2 bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><Plus size={16} /> Create Appointment</Button>
              <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]"><QrCode size={16} /> Wristband QR</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metricIcons[metric.label];
              return <MetricCard key={metric.label} {...metric} icon={Icon} />;
            })}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[260px] rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--hos-border)" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revenueFill)" strokeWidth={2} name="Revenue in lakh" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[260px] rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid stroke="var(--hos-border)" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="opd" fill="#16A34A" radius={[6, 6, 0, 0]} name="OPD patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="realtime-feed" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Realtime feed</p>
              <CardTitle className="mt-1 text-lg">WebSocket with polling fallback</CardTitle>
            </div>
            <Badge variant="outline" className="border-[var(--hos-success)]/20 bg-[var(--hos-success)]/10 text-[var(--hos-success)]">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {realtimeMessages.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-[var(--hos-border)] p-3">
              <Check size={17} className="mt-0.5 text-[var(--hos-success)]" />
              <p className="text-sm leading-5 text-[var(--hos-text)]">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function PatientWorkspace({ rows }: { rows: PatientFlowRow[] }) {
  const activePatientId = useHospitalOsStore((state) => state.activePatientId);
  const activePatient = rows.find((patient) => patient.id === activePatientId) ?? rows[0];

  if (!activePatient) {
    return (
      <Card id="patient-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardContent className="p-6 text-sm text-[var(--hos-muted-text)]">
          No patients in today&rsquo;s flow yet. Registrations and OPD visits appear here automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="patient-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader className="border-b border-[var(--hos-border)]">
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Patient workspace</p>
        <CardTitle className="text-2xl font-semibold">{activePatient.patient} <span className="text-base font-medium text-[var(--hos-muted-text)]">{activePatient.uhid}</span></CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <Tabs defaultValue="summary" className="grid gap-5">
          <TabsList className="h-auto flex-wrap justify-start bg-[var(--hos-muted)] p-1">
            {["summary", "timeline", "vitals", "prescriptions", "reports", "billing", "insurance", "appointments", "notes", "ai"].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">{tab === "ai" ? "AI Summary" : tab}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary" className="mt-0 grid gap-4 lg:grid-cols-[330px_1fr]">
            <ClinicalBrief />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Vitals", "BP 126/82, pulse 82, SpO2 98%, pain score 3/10"],
                ["Prescription", "PPI, antacid, diet plan, follow-up suggestion"],
                ["Next action", "Review LFT panel before discharge decision"]
              ].map(([title, text]) => (
                <Card key={title} className="rounded-lg border-[var(--hos-border)]">
                  <CardContent className="p-4">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--hos-muted-text)]">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="timeline" className="mt-0">
            <div className="grid gap-3">
              {clinicalTimeline.map((event) => (
                <article key={`${event.time}-${event.title}`} className="grid grid-cols-[64px_1fr] gap-4 rounded-lg border border-[var(--hos-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--hos-primary)]">{event.time}</p>
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--hos-muted-text)]">{event.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </TabsContent>
          {["vitals", "prescriptions", "reports", "billing", "insurance", "appointments", "notes", "ai"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              <EmptyState
                icon={tab === "ai" ? Sparkles : FileText}
                title={`${tab === "ai" ? "AI Summary" : tab[0].toUpperCase() + tab.slice(1)} workspace ready`}
                description="This panel loads inside the unified patient workspace without forcing a page navigation."
                action={`Add ${tab === "ai" ? "AI" : tab} record`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ClinicalBrief() {
  return (
    <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--hos-muted-text)]">Clinical brief</p>
      <dl className="mt-4 grid gap-3 text-sm">
        {[
          ["Age / Sex", "42 / Male"],
          ["Primary Concern", "Abdominal pain, reflux"],
          ["Risk", "Moderate"],
          ["Insurance", "Star Health - preauth pending"]
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-[var(--hos-border)] pb-3 last:border-0 last:pb-0">
            <dt className="text-[var(--hos-muted-text)]">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DoctorWorkspace({
  rows,
  onAuditEvent
}: {
  rows: PatientFlowRow[];
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const activePatientId = useHospitalOsStore((state) => state.activePatientId);
  const setActivePatient = useHospitalOsStore((state) => state.setActivePatient);
  const queueRows = rows;
  const activePatient = queueRows.find((row) => row.id === activePatientId) ?? queueRows[0];

  function onQueueKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, patientId: string) {
    const queueButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-doctor-queue-item]"));
    const currentIndex = queueButtons.indexOf(event.currentTarget);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      queueButtons[Math.min(currentIndex + 1, queueButtons.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      queueButtons[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setActivePatient(patientId);
    }
  }

  return (
    <Card id="doctor-workspace" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Doctor workspace</p>
            <CardTitle className="mt-1 text-xl">Single-screen consultation</CardTitle>
          </div>
          <Badge variant="outline" className="border-[var(--hos-border)] text-[var(--hos-muted-text)]">{rows.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {queueRows.slice(0, 4).map((row) => (
          <button
            key={row.uhid}
            type="button"
            data-doctor-queue-item
            aria-pressed={row.id === activePatient?.id}
            aria-label={`Select ${row.patient} consultation`}
            onClick={() => setActivePatient(row.id)}
            onKeyDown={(event) => onQueueKeyDown(event, row.id)}
            className={`rounded-lg border p-4 text-left transition hover:border-[var(--hos-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hos-primary)] ${row.id === activePatient?.id ? "border-[var(--hos-primary)] bg-[var(--hos-primary)]/5" : "border-[var(--hos-border)]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.patient}</p>
                <p className="mt-1 text-xs font-medium text-[var(--hos-muted-text)]">{row.uhid} · wait {row.waitMinutes}m</p>
              </div>
              <Badge variant="outline" className={statusTone[row.status]}>{row.status}</Badge>
            </div>
          </button>
        ))}
        {activePatient ? (
          <>
            <ClinicalNotesEditor key={`notes-${activePatient.id}`} activePatient={activePatient} onAuditEvent={onAuditEvent} />
            <AiPrescriptionAssistant key={`rx-${activePatient.id}`} activePatient={activePatient} onAuditEvent={onAuditEvent} />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--hos-border)] p-4 text-sm text-[var(--hos-muted-text)]">
            No patients in the queue yet. New OPD visits appear here automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AiPrescriptionAssistant({
  activePatient,
  onAuditEvent
}: {
  activePatient: PatientFlowRow;
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const [status, setStatus] = useState<"idle" | "confirmed" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const suggestion = `Continue PPI therapy, add hydration advice, and schedule follow-up review for ${activePatient.risk.toLowerCase()} risk profile.`;

  function confirmSuggestion() {
    setStatus("idle");
    startTransition(async () => {
      const result = await confirmAiPrescriptionSuggestion({
        patientId: activePatient.uhid,
        suggestion
      });
      if (!result.ok) {
        setStatus("error");
        return;
      }
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.ai_prescription.confirmed",
          entityType: "patient",
          entityId: activePatient.uhid
        });
      }
      setStatus("confirmed");
    });
  }

  return (
    <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">AI prescription assistance</p>
          <p className="mt-2 text-sm leading-6 text-[var(--hos-muted-text)]">{suggestion}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--hos-warning)]">Suggestion only. Doctor confirmation is required before saving.</p>
        </div>
        <Sparkles size={18} className="shrink-0 text-[var(--hos-primary)]" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isPending || status === "confirmed"} onClick={confirmSuggestion} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">
          {isPending ? "Confirming..." : status === "confirmed" ? "Confirmed" : "Confirm Suggestion"}
        </Button>
        {status === "confirmed" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Doctor confirmed AI suggestion.</p> : null}
        {status === "error" ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">Suggestion could not be confirmed.</p> : null}
      </div>
    </div>
  );
}

function ClinicalNotesEditor({
  activePatient,
  onAuditEvent
}: {
  activePatient: PatientFlowRow;
  onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void;
}) {
  const [clinicalNotes, setClinicalNotes] = useState(`Focused consultation for ${activePatient.patient}. Review vitals, history, prescriptions, investigations, and follow-up plan.`);
  const [noteSaveStatus, setNoteSaveStatus] = useState("Autosaved");
  const notesEdited = useRef(false);
  const noteSaveRequest = useRef(0);

  useEffect(() => {
    if (!notesEdited.current) return;

    const requestId = noteSaveRequest.current + 1;
    noteSaveRequest.current = requestId;

    const savingTimer = window.setTimeout(() => {
      setNoteSaveStatus("Autosaving...");
    }, 350);

    const autosaveTimer = window.setTimeout(async () => {
      const result = await autosaveClinicalNotes({
        patientId: activePatient.uhid,
        notes: clinicalNotes
      });
      if (noteSaveRequest.current !== requestId) return;
      if (!result.ok) {
        setNoteSaveStatus("Autosave failed");
        return;
      }
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.clinical_notes.autosaved",
          entityType: "patient",
          entityId: activePatient.uhid
        });
      }
      setNoteSaveStatus(`Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    }, 900);

    return () => {
      window.clearTimeout(savingTimer);
      window.clearTimeout(autosaveTimer);
    };
  }, [activePatient.uhid, clinicalNotes, onAuditEvent]);

  return (
    <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`clinical-notes-${activePatient.id}`} className="text-sm font-semibold">Clinical notes for {activePatient.patient}</Label>
        <p role="status" className="text-xs font-semibold text-[var(--hos-muted-text)]">{noteSaveStatus}</p>
      </div>
      <Textarea
        id={`clinical-notes-${activePatient.id}`}
        aria-label={`Clinical notes for ${activePatient.patient}`}
        value={clinicalNotes}
        onChange={(event) => {
          notesEdited.current = true;
          setClinicalNotes(event.target.value);
          setNoteSaveStatus("Unsaved changes");
        }}
        className="mt-3 min-h-28"
      />
    </div>
  );
}

function PatientPortalPanel({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const patientPortalUhid = "MGM-24018";
  const [symptoms, setSymptoms] = useState("");
  const [symptomSummary, setSymptomSummary] = useState("");
  const [symptomError, setSymptomError] = useState("");
  const [showTeleconsult, setShowTeleconsult] = useState(false);
  const [teleconsultOpen, setTeleconsultOpen] = useState(false);
  const [teleconsultSubmitted, setTeleconsultSubmitted] = useState(false);
  const [teleconsultError, setTeleconsultError] = useState("");
  const [isTeleconsultPending, startTeleconsultTransition] = useTransition();

  function reviewSymptoms() {
    const trimmed = symptoms.trim();
    const lowerSymptoms = trimmed.toLowerCase();
    const hasRedFlag = ["severe", "bleeding", "blood", "faint", "chest pain", "vomiting", "black stool"].some((term) => lowerSymptoms.includes(term));
    if (trimmed.length < 5) {
      setSymptomError("Enter a short symptom note before reviewing.");
      setSymptomSummary("");
      setShowTeleconsult(false);
      return;
    }

    setSymptomError("");
    setShowTeleconsult(hasRedFlag);
    setSymptomSummary(hasRedFlag
      ? "Your note includes symptoms that may need urgent attention. Please contact the hospital care team now or use local emergency services if symptoms feel severe."
      : "Based on what you shared, keep tracking symptoms and contact the hospital if discomfort increases, fever appears, vomiting continues, or you feel weak.");
  }

  function submitTeleconsultationRequest() {
    setTeleconsultError("");
    startTeleconsultTransition(async () => {
      const result = await requestTeleconsultation({
        patientId: patientPortalUhid,
        symptomNote: symptoms
      });

      if (!result.ok) {
        setTeleconsultError(result.message);
        return;
      }

      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.teleconsultation.requested",
          entityType: "patient",
          entityId: patientPortalUhid
        });
      }
      setTeleconsultSubmitted(true);
      setTeleconsultOpen(false);
    });
  }

  return (
    <section id="patient-portal-preview" className="scroll-mt-20 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Patient portal</p>
          <CardTitle className="text-2xl">Warm Apple Health-inspired patient view</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["Upcoming appointment today at 3:20 PM", "LFT report summary ready", "Family member access: 2 profiles", "Teleconsultation entry point enabled"].map((item) => (
            <div key={item} className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4 text-sm font-medium">{item}</div>
          ))}
        </CardContent>
      </Card>
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
        <CardHeader>
          <CardTitle className="text-xl">Vitals trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { day: "Mon", pulse: 78, pain: 5 },
              { day: "Tue", pulse: 82, pain: 4 },
              { day: "Wed", pulse: 80, pain: 3 },
              { day: "Thu", pulse: 76, pain: 2 }
            ]}>
              <CartesianGrid stroke="var(--hos-border)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Area dataKey="pulse" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} strokeWidth={2} />
              <Area dataKey="pain" stroke="#16A34A" fill="#16A34A" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)] lg:col-span-2">
        <CardHeader>
          <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">AI symptom checker</p>
          <CardTitle className="text-xl">Informational guidance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3">
            <Textarea
              aria-label="Patient symptom note"
              value={symptoms}
              onChange={(event) => {
                setSymptoms(event.target.value);
                if (symptomError) setSymptomError("");
                if (showTeleconsult) setShowTeleconsult(false);
              }}
              placeholder="Describe symptoms, duration, and severity"
              aria-invalid={Boolean(symptomError)}
              className="min-h-24"
            />
            {symptomError ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{symptomError}</p> : null}
            <Button type="button" onClick={reviewSymptoms} className="w-fit bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">Review Symptoms</Button>
          </div>
          <div className="rounded-lg border border-[var(--hos-border)] bg-[var(--hos-bg)] p-4">
            <p className="text-sm font-semibold">Not a diagnosis</p>
            <p className="mt-2 text-sm leading-6 text-[var(--hos-muted-text)]">
              {symptomSummary || "This checker provides general information only and does not replace a doctor consultation."}
            </p>
            {showTeleconsult ? (
              <Button type="button" variant="outline" onClick={() => setTeleconsultOpen(true)} className="mt-4 border-[var(--hos-border)] bg-[var(--hos-surface)]">
                Start Teleconsultation
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={teleconsultOpen}
        onOpenChange={(open) => {
          setTeleconsultOpen(open);
          if (!open) setTeleconsultError("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teleconsultation request</DialogTitle>
            <DialogDescription>
              A care team member will review this request. Use local emergency services if symptoms feel severe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField label="Symptom note">
              <Textarea aria-label="Teleconsultation symptom note" value={symptoms} readOnly className="min-h-24" />
            </FormField>
            {teleconsultError ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{teleconsultError}</p> : null}
            <Button
              type="button"
              disabled={isTeleconsultPending}
              className="w-fit bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"
              onClick={submitTeleconsultationRequest}
            >
              {isTeleconsultPending ? "Requesting..." : "Request Teleconsultation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {teleconsultSubmitted ? <p role="status" className="sr-only">Teleconsultation request sent.</p> : null}
    </section>
  );
}

function PatientRegistrationForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markPatientRegistered = useHospitalOsStore((state) => state.markPatientRegistered);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.patientRegistration);
  const [isPending, startTransition] = useTransition();
  const [auditId, setAuditId] = useState("");
  const { register, handleSubmit, formState: { errors }, setError, reset } = useForm<PatientRegistrationInput>({
    defaultValues: { firstName: "", lastName: "", mobile: "", age: 42, sex: "Male", concern: "" }
  });

  function onSubmit(values: PatientRegistrationInput) {
    const parsed = patientRegistrationSchema.safeParse(values);
    if (!parsed.success) {
      const issueMap = applyIssues<PatientRegistrationInput>(parsed.error.issues);
      Object.entries(issueMap).forEach(([name, message]) => setError(name as keyof PatientRegistrationInput, { message }));
      return;
    }
    startTransition(async () => {
      const result = await registerHospitalPatient(parsed.data);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof PatientRegistrationInput, { message }));
        return;
      }
      markPatientRegistered({ uhid: "MGM-NEW", patient: `${parsed.data.firstName} ${parsed.data.lastName}` });
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.patient.registered",
          entityType: "patient",
          entityId: `registration-${parsed.data.mobile.slice(-4)}`
        });
      }
      reset(parsed.data);
    });
  }

  return (
    <Card id="patient-registration" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Vercel-style form</p>
        <CardTitle className="text-xl">Patient registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" error={errors.firstName?.message}><Input {...register("firstName")} aria-label="First name" /></FormField>
            <FormField label="Last name" error={errors.lastName?.message}><Input {...register("lastName")} aria-label="Last name" /></FormField>
          </div>
          <FormField label="Mobile" error={errors.mobile?.message}><Input {...register("mobile")} aria-label="Mobile" inputMode="numeric" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Age" error={errors.age?.message}><Input {...register("age")} aria-label="Age" type="number" /></FormField>
            <FormField label="Sex" error={errors.sex?.message}>
              <select {...register("sex")} aria-label="Sex" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </FormField>
          </div>
          <FormField label="Concern" error={errors.concern?.message}><Textarea {...register("concern")} aria-label="Concern" /></FormField>
          <Button type="submit" disabled={isPending} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><UserRoundPlus size={16} /> {isPending ? "Saving..." : "Register Patient"}</Button>
          {flowStatus === "saved" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Patient registration saved. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AppointmentBookingForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markAppointmentBooked = useHospitalOsStore((state) => state.markAppointmentBooked);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.appointment);
  const [isPending, startTransition] = useTransition();
  const [auditId, setAuditId] = useState("");
  const { register, handleSubmit, formState: { errors }, setError } = useForm<AppointmentInput>({
    defaultValues: {
      patientUhid: "MGM-24018",
      doctor: "Dr. Deepak Sharma",
      department: "Gastroenterology",
      appointmentDate: "2026-07-01",
      appointmentTime: "15:20",
      reason: "ERCP follow-up"
    }
  });

  function onSubmit(values: AppointmentInput) {
    const parsed = appointmentSchema.safeParse(values);
    if (!parsed.success) {
      const issueMap = applyIssues<AppointmentInput>(parsed.error.issues);
      Object.entries(issueMap).forEach(([name, message]) => setError(name as keyof AppointmentInput, { message }));
      return;
    }
    startTransition(async () => {
      const result = await bookHospitalAppointment(parsed.data);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof AppointmentInput, { message }));
        return;
      }
      markAppointmentBooked();
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.appointment.booked",
          entityType: "appointment",
          entityId: parsed.data.patientUhid
        });
      }
    });
  }

  return (
    <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Scheduling</p>
        <CardTitle className="text-xl">Appointment booking</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Patient UHID" error={errors.patientUhid?.message}><Input {...register("patientUhid")} aria-label="Patient UHID" /></FormField>
          <FormField label="Doctor" error={errors.doctor?.message}><Input {...register("doctor")} aria-label="Doctor" /></FormField>
          <FormField label="Department" error={errors.department?.message}><Input {...register("department")} aria-label="Department" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" error={errors.appointmentDate?.message}><Input {...register("appointmentDate")} aria-label="Appointment date" type="date" /></FormField>
            <FormField label="Time" error={errors.appointmentTime?.message}><Input {...register("appointmentTime")} aria-label="Appointment time" type="time" /></FormField>
          </div>
          <FormField label="Reason" error={errors.reason?.message}><Textarea {...register("reason")} aria-label="Appointment reason" /></FormField>
          <Button type="submit" disabled={isPending} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><CalendarClock size={16} /> {isPending ? "Booking..." : "Book Appointment"}</Button>
          {flowStatus === "booked" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Appointment booked. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function BillingForm({ onAuditEvent }: { onAuditEvent: (item: Omit<AuditTrailItem, "recordedAt">) => void }) {
  const markBillingPosted = useHospitalOsStore((state) => state.markBillingPosted);
  const flowStatus = useHospitalOsStore((state) => state.flowStatus.billing);
  const [isPending, startTransition] = useTransition();
  const [auditId, setAuditId] = useState("");
  const { register, handleSubmit, formState: { errors }, setError } = useForm<BillingInput>({
    defaultValues: { invoiceId: "INV-5821", patientUhid: "MGM-24018", amount: 18450, payerType: "Insurance", notes: "Insurance review for procedure billing." }
  });

  function onSubmit(values: BillingInput) {
    const parsed = billingSchema.safeParse(values);
    if (!parsed.success) {
      const issueMap = applyIssues<BillingInput>(parsed.error.issues);
      Object.entries(issueMap).forEach(([name, message]) => setError(name as keyof BillingInput, { message }));
      return;
    }
    startTransition(async () => {
      const result = await postHospitalBilling(parsed.data);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, message]) => setError(name as keyof BillingInput, { message }));
        return;
      }
      markBillingPosted();
      setAuditId(result.auditId ?? "");
      if (result.auditId) {
        onAuditEvent({
          id: result.auditId,
          action: "hospital_os.billing.posted",
          entityType: "invoice",
          entityId: parsed.data.invoiceId
        });
      }
    });
  }

  return (
    <Card id="billing" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Stripe-style billing</p>
        <CardTitle className="text-xl">Billing workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Invoice ID" error={errors.invoiceId?.message}><Input {...register("invoiceId")} aria-label="Invoice ID" /></FormField>
          <FormField label="Patient UHID" error={errors.patientUhid?.message}><Input {...register("patientUhid")} aria-label="Billing patient UHID" /></FormField>
          <FormField label="Amount" error={errors.amount?.message}><Input {...register("amount")} aria-label="Amount" type="number" /></FormField>
          <FormField label="Payer" error={errors.payerType?.message}>
            <select {...register("payerType")} aria-label="Payer type" className="min-h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>Self pay</option>
              <option>Insurance</option>
              <option>Corporate</option>
            </select>
          </FormField>
          <FormField label="Notes" error={errors.notes?.message}><Textarea {...register("notes")} aria-label="Billing notes" /></FormField>
          <Button type="submit" disabled={isPending} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90"><CreditCard size={16} /> {isPending ? "Posting..." : "Post Billing"}</Button>
          {flowStatus === "posted" ? <p role="status" className="text-sm font-semibold text-[var(--hos-success)]">Billing posted. {auditId ? `Audit ${auditId}.` : ""}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function OperationsTable({
  table,
  isLoading,
  isError,
  selectedCount,
  globalFilter,
  setGlobalFilter,
  bulkMessage,
  bulkError,
  isBulkPending,
  onBulkSchedule
}: {
  table: ReturnType<typeof useReactTable<PatientFlowRow>>;
  isLoading: boolean;
  isError: boolean;
  selectedCount: number;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  bulkMessage: string;
  bulkError: string;
  isBulkPending: boolean;
  onBulkSchedule: () => void;
}) {
  const exportRows = table.getPrePaginationRowModel().rows.map((row) => {
    return patientFlowExportRow(row.original);
  });

  function exportCsv() {
    downloadCsvFile(exportRows, "hospital-os-patient-flow.csv");
  }

  function exportExcel() {
    const escapeHtml = (value: string) => value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;");
    const tableHtml = [
      "<table>",
      `<thead><tr>${patientFlowExportHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`,
      `<tbody>${exportRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
      "</table>"
    ].join("");
    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hospital-os-patient-flow.xls";
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "All";

  function onPatientRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, patientId: string) {
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>("[data-patient-flow-row]"));
    const currentIndex = rows.indexOf(event.currentTarget);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      rows[Math.min(currentIndex + 1, rows.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      rows[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openPatientWorkspace(patientId);
    }
  }

  return (
    <Card id="operations-table" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader className="border-b border-[var(--hos-border)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Linear-style operations table</p>
            <CardTitle className="mt-1 text-xl">Active patient flow</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Filter table" className="w-48" aria-label="Filter patient flow table" />
            <select
              aria-label="Filter patient flow status"
              value={statusFilter}
              onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value === "All" ? undefined : event.target.value)}
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>All</option>
              <option>Scheduled</option>
              <option>In Consultation</option>
              <option>Vitals Pending</option>
              <option>Lab Review</option>
              <option>Billing Hold</option>
              <option>Discharged</option>
            </select>
            <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
            <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]" onClick={exportExcel}><FileText size={16} /> Export Excel</Button>
            <Button type="button" disabled={selectedCount === 0 || isBulkPending} onClick={onBulkSchedule} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90">
              {isBulkPending ? "Scheduling..." : `Bulk Action ${selectedCount ? `(${selectedCount})` : ""}`}
            </Button>
          </div>
        </div>
        {bulkMessage ? <p role="status" className="mt-3 text-sm font-semibold text-[var(--hos-success)]">{bulkMessage}</p> : null}
        {bulkError ? <p role="alert" className="mt-3 text-sm font-semibold text-[var(--hos-danger)]">{bulkError}</p> : null}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-lg" />)}
          </div>
        ) : null}
        {isError ? (
          <div className="p-5">
            <Alert variant="destructive">
              <AlertTriangle size={18} />
              <AlertTitle>Unable to load patient flow</AlertTitle>
              <AlertDescription>Check the patient flow API or retry once connectivity returns.</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {!isLoading && !isError && table.getRowModel().rows.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Search} title="No matching patient flow records" description="Adjust the table filter or create a new appointment to start a patient flow." action="Create Appointment" />
          </div>
        ) : null}
        {!isLoading && !isError && table.getRowModel().rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="sticky top-0 bg-[var(--hos-bg)]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="border-b border-[var(--hos-border)] text-xs font-semibold uppercase text-[var(--hos-muted-text)]">
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <ChevronsUpDown size={13} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-patient-flow-row
                      tabIndex={0}
                      aria-label={`Open ${row.original.patient} row`}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className="hover:bg-[var(--hos-muted)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hos-primary)] focus-visible:ring-offset-2"
                      onKeyDown={(event) => onPatientRowKeyDown(event, row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border-b border-[var(--hos-border)] text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--hos-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-[var(--hos-muted-text)]">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} &middot; Showing {table.getRowModel().rows.length} of {table.getPrePaginationRowModel().rows.length}
                </p>
                <select
                  aria-label="Rows per patient flow page"
                  value={table.getState().pagination.pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  className="min-h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="4">4 rows</option>
                  <option value="6">6 rows</option>
                  <option value="10">10 rows</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                <Button type="button" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AssignDoctorDialog({
  assignment,
  setAssignment,
  error,
  isPending,
  onSave
}: {
  assignment: DoctorAssignment | null;
  setAssignment: (assignment: DoctorAssignment | null) => void;
  error: string;
  isPending: boolean;
  onSave: (assignment: DoctorAssignment) => void;
}) {
  return (
    <Dialog open={Boolean(assignment)} onOpenChange={(open) => {
      if (!open) setAssignment(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign doctor</DialogTitle>
          <DialogDescription>
            {assignment ? `Update responsible doctor for ${assignment.patientName}.` : "Update responsible doctor."}
          </DialogDescription>
        </DialogHeader>
        {assignment ? (
          <div className="grid gap-4">
            <FormField label="Doctor">
              <select
                aria-label="Assigned doctor"
                value={assignment.doctor}
                disabled={isPending}
                onChange={(event) => setAssignment({ ...assignment, doctor: event.target.value })}
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {assignableDoctors.map((doctor) => <option key={doctor}>{doctor}</option>)}
              </select>
            </FormField>
            {error ? <p role="alert" className="text-sm font-semibold text-[var(--hos-danger)]">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setAssignment(null)}>Cancel</Button>
              <Button type="button" disabled={isPending} className="bg-[var(--hos-primary)] text-white hover:bg-[var(--hos-primary)]/90" onClick={() => onSave(assignment)}>
                {isPending ? "Saving..." : "Save Assignment"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AuditTrailPanel({ items }: { items: AuditTrailItem[] }) {
  return (
    <Card id="session-audit-trail" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">DPDP-aware access record</p>
        <CardTitle className="text-xl">Session audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No session audit events yet"
            description="Successful Hospital OS mutations will appear here with their server audit IDs."
            action="Start Registration"
            onAction={() => document.querySelector("#patient-registration")?.scrollIntoView({ block: "start" })}
          />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--hos-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--hos-text)]">{item.action}</p>
                    <p className="mt-1 text-xs text-[var(--hos-muted-text)]">{item.entityType}: {item.entityId}</p>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--hos-muted-text)]" dateTime={item.recordedAt}>
                    {new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
                <p className="mt-3 break-all rounded-md bg-[var(--hos-muted)] px-2 py-1 text-xs font-semibold text-[var(--hos-muted-text)]">Audit {item.id}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AcceptancePanel({ flowStatus }: { flowStatus: { patientRegistration: string; appointment: string; billing: string } }) {
  return (
    <Card className="rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader>
        <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">v1 scope and controls</p>
        <CardTitle className="text-xl">Acceptance coverage inside this build</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          {[
            "Role-based sidebar, top nav, branch switcher stub, and command palette",
            "Patient Workspace and Doctor Workspace as single-screen experiences",
            "Recharts dashboard with live-updating feed and polling fallback",
            "TanStack Table with sort, filter, pagination, selection, bulk actions, row menus",
            "Dark mode across the Hospital OS route",
            "Skeleton, empty, and error states without bare no-data screens",
            "DPDP-aware audit/access language without unsupported compliance claims"
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-[var(--hos-border)] p-3 text-sm">
              <Check size={16} className="mt-0.5 text-[var(--hos-success)]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-4">
          <Alert>
            <Sparkles size={18} />
            <AlertTitle>AI v1 scope</AlertTitle>
            <AlertDescription>{v1AiScope.join(", ")}. AI Receptionist is deferred to v2.</AlertDescription>
          </Alert>
          <Alert>
            <ShieldCheck size={18} />
            <AlertTitle>Critical flow status</AlertTitle>
            <AlertDescription>
              Registration: {flowStatus.patientRegistration}; Appointment: {flowStatus.appointment}; Billing: {flowStatus.billing}.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}

function CommandPalette({
  open,
  setOpen,
  query,
  setQuery,
  results
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  results: CommandRecord[];
}) {
  function navigate(record: CommandRecord) {
    window.history.pushState(null, "", record.href);
    document.querySelector(record.href)?.scrollIntoView({ block: "start" });
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandRoot>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search patient, doctor, invoice, medicine, appointment, report, bed, room..." />
        <CommandList>
          <CommandEmpty>No matching records. Try a UHID, invoice number, medicine, bed, room, or procedure.</CommandEmpty>
          <CommandGroup heading="Direct results">
            <AnimatePresence>
              {results.map((record) => (
                <CommandItem key={record.id} value={`${record.entity} ${record.title} ${record.subtitle}`} onSelect={() => navigate(record)}>
                  <motion.div
                    className="flex w-full items-center gap-3"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--hos-primary)]/10 text-[var(--hos-primary)]">
                      <Command size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{record.title}</span>
                      <span className="block truncate text-xs text-[var(--hos-muted-text)]">{record.entity} · {record.subtitle}</span>
                    </span>
                    <Send size={14} className="text-[var(--hos-muted-text)]" />
                  </motion.div>
                </CommandItem>
              ))}
            </AnimatePresence>
          </CommandGroup>
        </CommandList>
      </CommandRoot>
    </CommandDialog>
  );
}
