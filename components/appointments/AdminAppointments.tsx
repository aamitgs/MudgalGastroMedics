"use client";

import { AlertTriangle, BrainCircuit, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, Copy, Download, MessageCircle, Phone, Plus, Trash2, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { createAppointmentPlanningNote } from "@/lib/ai-planning";
import { roleHasPermission } from "@/lib/access/matrix";
import type { AppointmentRecord, AppointmentStatus } from "@/lib/appointment-types";
import { appointmentStatuses } from "@/lib/appointment-types";
import type { AppointmentSortField } from "@/lib/appointment-query";
import { hospitalRoleToAccessRole } from "@/lib/hospital-os-data";
import { bloodGroups } from "@/lib/patient-types";
import { opdWindows } from "@/lib/site-data";
import { downloadCsv } from "@/lib/table-export";
import { appointmentStaffBookingSchema, type AppointmentStaffBookingInput } from "@/lib/validation/operations";
import { ActionButton } from "@/components/design-system/ActionButton";
import { AppointmentWaitlistPanel } from "@/components/appointments/AppointmentWaitlistPanel";
import { DataTable } from "@/components/design-system/DataTable";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DraftRestoredNotice } from "@/components/design-system/DraftRestoredNotice";
import { FormField } from "@/components/design-system/FormField";
import { FormSection } from "@/components/design-system/FormSection";
import { RecentValueChips } from "@/components/design-system/RecentValueChips";
import { getStatusToneClass, type BadgeTone } from "@/components/design-system/StatusBadge";
import { notify } from "@/lib/notify";
import { useAdvancedForm } from "@/hooks/useAdvancedForm";
import { useFormDraft } from "@/hooks/useFormDraft";
import { useHospitalOsStore } from "@/stores/hospital-os-store";
import { usePatientDrawerStore } from "@/stores/patient-drawer-store";
import { useRecentValues } from "@/hooks/useRecentValues";

const appointmentServices = ["OPD", "IPD"];
const appointmentPriorities = ["Routine", "Soon", "Urgent symptoms"];
const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

type DuplicateMatch = { id: string; uhid: string; name: string; phone: string; age?: string; gender?: string; bloodGroup?: string; allergies?: string };

/** Local calendar date (not UTC) — matches the plain YYYY-MM-DD the date input/store use. */
function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const appointmentExportHeaders = ["Name", "Phone", "Service", "Date", "Time Slot", "Priority", "Status", "Created"];

function appointmentExportRow(appointment: AppointmentRecord) {
  return [
    appointment.name,
    appointment.phone,
    appointment.service,
    appointment.date ?? "",
    appointment.timeSlot ?? "",
    appointment.priority ?? "",
    appointment.status,
    appointment.createdAt
  ];
}

type AppointmentListResponse = {
  ok: boolean;
  appointments?: AppointmentRecord[];
  pageCount?: number;
  stats?: { total: number; new: number; confirmed: number; urgent: number };
  error?: string;
};

type MutationResponse = { ok: boolean; appointment?: AppointmentRecord; error?: string };

const pageSize = 25;

const statusTone: Record<AppointmentStatus, BadgeTone> = {
  New: "info",
  Contacted: "warning",
  Confirmed: "success",
  Completed: "inactive",
  Cancelled: "critical"
};

export function AdminAppointments() {
  const openDrawer = usePatientDrawerStore((state) => state.openDrawer);
  const role = useHospitalOsStore((state) => state.role);
  // UI convenience only — DELETE /api/appointment re-checks appointments:delete
  // server-side (reserved for admin/super-admin in the access matrix) on every
  // request, same as every other mutation in the app.
  const canDelete = roleHasPermission(hospitalRoleToAccessRole[role], "appointments", "delete");

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [stats, setStats] = useState({ total: 0, new: 0, confirmed: 0, urgent: 0 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [planAppointment, setPlanAppointment] = useState<AppointmentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ items: AppointmentRecord[]; clearSelection?: () => void } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [typedName, setTypedName] = useState("");
  const [confirmedNewPatient, setConfirmedNewPatient] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const sortField = (sorting[0]?.id as AppointmentSortField | undefined) ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  // Reception unified booking (Reception module): reuses the exact same
  // phone-match duplicate check the Patients registration form already has
  // (Track 0.3) — so booking recognizes a returning patient by phone instead
  // of always creating a fresh record via upsertPatientFromInput, and
  // reception never has to leave this page to search the Patients module
  // first or retype details that are already on file.
  async function checkDuplicate(phone: string) {
    setConfirmedNewPatient(false);
    if (phone.replace(/\D/g, "").length < 6) {
      setDuplicateMatch(null);
      return;
    }
    const response = await fetch(`/api/patients/match?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    setDuplicateMatch(response.ok && data.ok ? data.match : null);
  }

  async function loadAppointments() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pageIndex), pageSize: String(pageSize), sortBy: sortField, sortDir });
    if (globalFilter.trim()) params.set("q", globalFilter.trim());
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/appointment?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const data = ((await response?.json().catch(() => ({}))) ?? {}) as AppointmentListResponse;
    if (!response?.ok || !data.ok) {
      setError(data.error || "Unable to load appointments.");
      setLoading(false);
      return;
    }
    setAppointments(data.appointments ?? []);
    setPageCount(data.pageCount ?? 1);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAppointments(), globalFilter ? 250 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, sortField, sortDir, globalFilter, statusFilter]);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: AppointmentStatus | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  async function updateStatus(id: string, status: AppointmentStatus) {
    let response: Response;
    try {
      response = await fetch("/api/appointment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void updateStatus(id, status));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as MutationResponse;
    if (!response.ok || !data.ok || !data.appointment) {
      // Mutation failures are transient/non-blocking (toast), never the
      // table's load-error state — a failed update must not blank the list.
      notify.error(data.error || "Unable to update appointment.");
      return;
    }
    setAppointments((items) => items.map((item) => (item.id === id ? (data.appointment as AppointmentRecord) : item)));
    notify.success("Appointment updated");
  }

  async function createOpdToken(appointmentId: string) {
    let response: Response;
    try {
      response = await fetch("/api/opd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId })
      });
    } catch {
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void createOpdToken(appointmentId));
      return;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Unable to create OPD token.");
      return;
    }
    notify.success("OPD token created", { description: "Refresh the OPD Queue section below." });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    let deleted = 0;
    let lastError = "";
    for (const appointment of deleteTarget.items) {
      let response: Response;
      try {
        response = await fetch("/api/appointment", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: appointment.id })
        });
      } catch {
        lastError = "Unable to reach the server. Check your connection and retry.";
        continue;
      }
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        deleted += 1;
      } else {
        lastError = data.error || "Unable to delete this appointment.";
      }
    }
    setIsDeleting(false);

    if (deleted > 0) {
      notify.success(deleted === 1 ? "Appointment deleted" : `${deleted} appointments deleted`);
      void loadAppointments();
    }
    if (deleted < deleteTarget.items.length) {
      notify.error(lastError || "Some appointments could not be deleted.");
    }
    setDeleteTarget(null);
  }

  const allergyRecents = useRecentValues("patient-allergies");
  const conditionRecents = useRecentValues("patient-chronic-conditions");
  const medicineRecents = useRecentValues("patient-current-medicines");

  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
    reset: resetBookingForm,
    submit: submitBooking
  } = useAdvancedForm<AppointmentStaffBookingInput>({
    schema: appointmentStaffBookingSchema,
    defaultValues: {
      name: "",
      phone: "",
      service: "",
      date: "",
      timeSlot: `Morning ${opdWindows[0].startLabel}-${opdWindows[0].endLabel}`,
      priority: "Routine",
      message: "",
      email: "",
      age: "",
      gender: "",
      bloodGroup: "",
      address: "",
      emergencyContact: "",
      allergies: "",
      chronicConditions: "",
      currentMedicines: ""
    },
    async onValid(values) {
      let response: Response;
      try {
        response = await fetch("/api/appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, forceNew: duplicateMatch && confirmedNewPatient })
        });
      } catch {
        notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitBooking());
        return;
      }
      const data = (await response.json().catch(() => ({}))) as MutationResponse;
      if (!response.ok || !data.ok || !data.appointment) {
        notify.error(data.error || "Unable to book this appointment.");
        return;
      }
      notify.success("Appointment booked", { description: `${data.appointment.name} · ${data.appointment.uhid ?? data.appointment.id}` });
      for (const token of (values.allergies ?? "").split(",")) allergyRecents.remember(token);
      for (const token of (values.chronicConditions ?? "").split(",")) conditionRecents.remember(token);
      for (const token of (values.currentMedicines ?? "").split(",")) medicineRecents.remember(token);
      resetBookingForm();
      bookingDraft.clear();
      setDuplicateMatch(null);
      setConfirmedNewPatient(false);
      setTypedName("");
      setShowMoreDetails(false);
      void loadAppointments();
    }
  });

  const bookingDraft = useFormDraft<AppointmentStaffBookingInput>("appointment-booking", watch, resetBookingForm);

  function insertRecentValue(field: "allergies" | "chronicConditions" | "currentMedicines", value: string) {
    const current = (getValues(field) ?? "").trim();
    setValue(field, current ? `${current}, ${value}` : value, { shouldValidate: true });
  }

  const statTiles = useMemo(
    () => [
      { label: "Total Requests", value: stats.total, icon: CalendarDays },
      { label: "New", value: stats.new, icon: Clock3 },
      { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2 },
      { label: "Urgent Symptoms", value: stats.urgent, icon: UserRound }
    ],
    [stats]
  );

  const columns = useMemo<ColumnDef<AppointmentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 190,
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => openDrawer(row.original.phone, row.original.name)}
              title="Open patient summary"
              className="rounded text-left font-bold text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {row.original.name}
            </button>
            {row.original.uhid ? <span className="ml-2 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black uppercase text-brand dark:border-cyan-900 dark:bg-cyan-950">{row.original.uhid}</span> : null}
          </div>
        )
      },
      { accessorKey: "phone", header: "Phone", size: 130 },
      { accessorKey: "service", header: "Service", size: 160 },
      {
        id: "when",
        header: "Date / Time",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{row.original.date || "Flexible"} · {row.original.timeSlot || "Flexible"}</span>
      },
      {
        id: "priority",
        header: "Priority",
        size: 130,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.priority === "Urgent symptoms" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle size={12} /> Urgent
            </span>
          ) : (
            <span className="text-muted">{row.original.priority || "Routine"}</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ row }) => {
          const cancelled = row.original.status === "Cancelled";
          return (
            <select
              aria-label="Appointment status"
              value={row.original.status}
              onChange={(event) => void updateStatus(row.original.id, event.target.value as AppointmentStatus)}
              disabled={cancelled}
              title={cancelled ? "Cancelled — status is final" : undefined}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-60 ${getStatusToneClass(statusTone[row.original.status])}`}
            >
              {appointmentStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          );
        }
      },
      {
        id: "actions",
        header: "Actions",
        size: 170,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const cancelled = row.original.status === "Cancelled";
          const onAppointmentDate = !row.original.date || row.original.date === todayDateString();
          const canCreateOpdToken = !cancelled && onAppointmentDate;
          return (
            <div className="flex items-center gap-1">
              <a
                href={`tel:${row.original.phone}`}
                title="Call"
                className="grid h-8 w-8 place-items-center rounded border border-line text-ink hover:border-brand hover:text-brand"
              >
                <Phone size={14} />
              </a>
              <a
                href={`https://wa.me/${row.original.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="grid h-8 w-8 place-items-center rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                <MessageCircle size={14} />
              </a>
              <ActionButton
                variant="secondary"
                size="sm"
                title="AI Plan"
                aria-expanded={planAppointment?.id === row.original.id}
                onClick={() => setPlanAppointment((current) => (current?.id === row.original.id ? null : row.original))}
                className="h-8 w-8 min-h-8 border-cyan-200 bg-cyan-50 px-0 text-brand hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950"
              >
                <BrainCircuit size={14} />
              </ActionButton>
              <ActionButton
                variant="success"
                size="sm"
                title={canCreateOpdToken ? "Create OPD Token" : cancelled ? "Cancelled — locked" : "Available on the appointment date"}
                disabled={!canCreateOpdToken}
                onClick={() => void createOpdToken(row.original.id)}
                className="h-8 w-8 min-h-8 px-0"
              >
                <CalendarDays size={14} />
              </ActionButton>
              {canDelete ? (
                <ActionButton
                  variant="danger"
                  size="sm"
                  title={cancelled ? "Delete permanently" : "Cancel this appointment first"}
                  disabled={!cancelled}
                  onClick={() => setDeleteTarget({ items: [row.original] })}
                  className="h-8 w-8 min-h-8 px-0"
                >
                  <Trash2 size={14} />
                </ActionButton>
              ) : null}
            </div>
          );
        }
      }
    ],
    // updateStatus/createOpdToken only forward call-time arguments via functional setState, so they're safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDrawer, planAppointment, canDelete]
  );

  return (
    /*
      The single column is declared rather than left implicit. A grid with no
      `grid-template-columns` falls back to one implicit `auto` track, which
      cannot size below its content's min-content width — so the appointments
      table held this whole page 234px wider than the shell and put every
      viewport into horizontal scroll. `minmax(0, …)` lets the track shrink and
      hands scrolling back to the table's own overflow region, where it belongs.
    */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-4">
        {statTiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded border border-line/80 bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="grid h-10 w-10 place-items-center rounded bg-soft text-brand">
                <Icon size={19} />
              </span>
              <span className="text-xl font-bold text-ink">{value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded border border-line/80 bg-surface shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Reception Queue</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Appointment Requests</h2>
          </div>
        </div>

        <div className="p-4">
          <form onSubmit={submitBooking} noValidate className="mb-4 rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
            <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
              <Plus size={19} /> New appointment
            </p>
            {bookingDraft.restored ? (
              <DraftRestoredNotice onDiscard={bookingDraft.clear} message="Recovered an unfinished booking from before — review and save, or discard it." />
            ) : null}
            <div className="grid gap-4">
              <FormSection title="Patient" description="Search by phone first — an existing patient's details load automatically, no retyping.">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                  <FormField label="Patient name" htmlFor="booking-name" required error={errors.name?.message}>
                    <input
                      id="booking-name"
                      className={fieldClass}
                      placeholder="Patient name"
                      {...register("name", { onChange: (event) => setTypedName(event.target.value) })}
                    />
                  </FormField>
                  <FormField label="Phone" htmlFor="booking-phone" required error={errors.phone?.message}>
                    <input
                      id="booking-phone"
                      className={fieldClass}
                      placeholder="Mobile number"
                      inputMode="tel"
                      {...register("phone", { onBlur: (event) => void checkDuplicate(event.target.value) })}
                    />
                  </FormField>
                </div>

                {duplicateMatch ? (
                  <div className="flex items-start gap-2.5 rounded border-2 border-amber-300 bg-amber-50 p-3 dark:bg-amber-950" role="alert">
                    <UsersRound size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                      <p className="font-black uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">Existing patient found</p>
                      <p className="mt-1">
                        {duplicateMatch.name} · {duplicateMatch.uhid} · {duplicateMatch.phone}
                        {duplicateMatch.age || duplicateMatch.gender ? ` · ${[duplicateMatch.age, duplicateMatch.gender].filter(Boolean).join(", ")}` : ""}
                        {duplicateMatch.bloodGroup ? ` · ${duplicateMatch.bloodGroup}` : ""}
                      </p>
                      {duplicateMatch.allergies ? <p className="mt-1 font-bold text-red-700 dark:text-red-300">Allergies: {duplicateMatch.allergies}</p> : null}
                      {typedName.trim() && typedName.trim().toLowerCase() !== duplicateMatch.name.toLowerCase() ? (
                        <p className="mt-1 text-xs">Typed name differs from the record on file — confirm this is the same person before booking.</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmedNewPatient(false)}
                          aria-pressed={!confirmedNewPatient}
                          className={`rounded border px-3 py-1.5 text-xs font-bold transition ${!confirmedNewPatient ? "border-amber-600 bg-amber-600 text-white" : "border-amber-300 bg-white text-amber-800"}`}
                        >
                          Same person — book for them
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmedNewPatient(true)}
                          aria-pressed={confirmedNewPatient}
                          className={`rounded border px-3 py-1.5 text-xs font-bold transition ${confirmedNewPatient ? "border-amber-600 bg-amber-600 text-white" : "border-amber-300 bg-white text-amber-800"}`}
                        >
                          Different person, same number
                        </button>
                      </div>
                      {confirmedNewPatient ? (
                        <p className="mt-2 text-xs">Booking will create a new, separate patient record with its own UHID, even though the number matches {duplicateMatch.name}.</p>
                      ) : (
                        <p className="mt-2 text-xs">Booking will use {duplicateMatch.name}&apos;s existing record — no new UHID is generated.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((current) => !current)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    {showMoreDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showMoreDetails ? "Hide" : "Add"} more patient details (optional — for a new patient)
                  </button>
                )}

                {showMoreDetails && !duplicateMatch ? (
                  <div className="grid gap-3 rounded border border-line/70 bg-mist/40 p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                      <FormField label="Age" htmlFor="booking-age" error={errors.age?.message}>
                        <input id="booking-age" className={fieldClass} placeholder="Age" inputMode="numeric" {...register("age")} />
                      </FormField>
                      <FormField label="Gender" htmlFor="booking-gender">
                        <select id="booking-gender" className={fieldClass} defaultValue="" {...register("gender")}>
                          <option value="">Gender</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </FormField>
                      <FormField label="Blood group" htmlFor="booking-blood-group">
                        <select id="booking-blood-group" className={fieldClass} defaultValue="" {...register("bloodGroup")}>
                          <option value="">Blood group</option>
                          {bloodGroups.filter(Boolean).map((group) => (
                            <option key={group}>{group}</option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                      <FormField label="Email" htmlFor="booking-email" error={errors.email?.message}>
                        <input id="booking-email" className={fieldClass} placeholder="Email" type="email" {...register("email")} />
                      </FormField>
                      <FormField label="Emergency contact" htmlFor="booking-emergency-contact" error={errors.emergencyContact?.message}>
                        <input id="booking-emergency-contact" className={fieldClass} placeholder="Emergency contact" {...register("emergencyContact")} />
                      </FormField>
                    </div>
                    <FormField label="Address" htmlFor="booking-address" error={errors.address?.message}>
                      <textarea id="booking-address" className={`${fieldClass} min-h-16 py-3`} placeholder="Address" {...register("address")} />
                    </FormField>
                    <FormField label="Allergies / drug reactions" htmlFor="booking-allergies" error={errors.allergies?.message}>
                      <textarea id="booking-allergies" className={`${fieldClass} min-h-16 py-3`} placeholder="Allergies / drug reactions" {...register("allergies")} />
                      <RecentValueChips values={allergyRecents.values} onPick={(value) => insertRecentValue("allergies", value)} />
                    </FormField>
                    <FormField label="Chronic conditions" htmlFor="booking-chronic-conditions" error={errors.chronicConditions?.message}>
                      <textarea id="booking-chronic-conditions" className={`${fieldClass} min-h-16 py-3`} placeholder="Chronic conditions, liver disease history, diabetes, hypertension..." {...register("chronicConditions")} />
                      <RecentValueChips values={conditionRecents.values} onPick={(value) => insertRecentValue("chronicConditions", value)} />
                    </FormField>
                    <FormField label="Current medicines" htmlFor="booking-current-medicines" error={errors.currentMedicines?.message}>
                      <textarea id="booking-current-medicines" className={`${fieldClass} min-h-16 py-3`} placeholder="Current medicines" {...register("currentMedicines")} />
                      <RecentValueChips values={medicineRecents.values} onPick={(value) => insertRecentValue("currentMedicines", value)} />
                    </FormField>
                  </div>
                ) : null}
              </FormSection>

              <FormSection title="Visit">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
                  <FormField label="Appointment type" htmlFor="booking-service" required error={errors.service?.message}>
                    <select id="booking-service" className={fieldClass} defaultValue="" {...register("service")}>
                      <option value="">Select type</option>
                      {appointmentServices.map((service) => (
                        <option key={service}>{service}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Priority" htmlFor="booking-priority">
                    <select id="booking-priority" className={fieldClass} {...register("priority")}>
                      {appointmentPriorities.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Preferred date" htmlFor="booking-date">
                    <input id="booking-date" type="date" className={fieldClass} {...register("date")} />
                  </FormField>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                  <FormField label="Preferred time" htmlFor="booking-time-slot" required error={errors.timeSlot?.message}>
                    <select id="booking-time-slot" className={fieldClass} {...register("timeSlot")}>
                      <option>{`Morning ${opdWindows[0].startLabel}-${opdWindows[0].endLabel}`}</option>
                      <option>{`Evening ${opdWindows[1].startLabel}-${opdWindows[1].endLabel}`}</option>
                    </select>
                  </FormField>
                  <FormField label="Notes" htmlFor="booking-message" hint="Symptoms, call context, anything reception should know.">
                    <input id="booking-message" className={fieldClass} placeholder="Notes" {...register("message")} />
                  </FormField>
                </div>
              </FormSection>

              <ActionButton type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                Book appointment
              </ActionButton>
            </div>
          </form>

          <DataTable
            columns={columns}
            data={appointments}
            getRowId={(appointment) => appointment.id}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageChange={setPageIndex}
            sorting={sorting}
            onSortingChange={setSorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={updateGlobalFilter}
            searchPlaceholder="Search patient, phone, service"
            loading={loading}
            error={error || undefined}
            onRetry={() => void loadAppointments()}
            emptyState={{
              icon: CalendarDays,
              title: globalFilter || statusFilter ? "No requests match your filters" : "No appointment requests yet",
              description:
                globalFilter || statusFilter
                  ? "Try a different patient name, phone number or service."
                  : "Requests from the website booking form land here in real time — refresh to pick up the latest.",
              action: globalFilter || statusFilter ? "Clear filters" : undefined,
              onAction:
                globalFilter || statusFilter
                  ? () => {
                      setGlobalFilter("");
                      setStatusFilter("");
                    }
                  : undefined
            }}
            export={{ headers: appointmentExportHeaders, row: appointmentExportRow, filename: "appointments.csv" }}
            stickyFirstColumn
            toolbarExtra={
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as AppointmentStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {appointmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            }
            bulkActions={(selected, clear) => {
              const allCancelled = selected.every((appointment) => appointment.status === "Cancelled");
              return (
                <>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      downloadCsv(appointmentExportHeaders, selected.map(appointmentExportRow), "selected-appointments.csv");
                      clear();
                    }}
                  >
                    <Download size={14} /> Export selected
                  </ActionButton>
                  {canDelete ? (
                    <ActionButton
                      variant="danger"
                      size="sm"
                      disabled={!allCancelled}
                      title={allCancelled ? "Delete selected permanently" : "Only Cancelled appointments can be deleted — cancel the rest first"}
                      onClick={() => setDeleteTarget({ items: selected, clearSelection: clear })}
                    >
                      <Trash2 size={14} /> Delete selected
                    </ActionButton>
                  ) : null}
                </>
              );
            }}
          />

          {planAppointment ? <PlanningNote appointment={planAppointment} onClose={() => setPlanAppointment(null)} /> : null}
        </div>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.items.length === 1 ? "this appointment" : `${deleteTarget.items.length} appointments`}?</DialogTitle>
                <DialogDescription>
                  {deleteTarget.items.length === 1
                    ? `This permanently removes ${deleteTarget.items[0].name}'s cancelled appointment (${deleteTarget.items[0].id}). This cannot be undone.`
                    : "This permanently removes the selected cancelled appointments. This cannot be undone."}
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

      <AppointmentWaitlistPanel />
    </div>
  );
}

function PlanningNote({ appointment, onClose }: { appointment: AppointmentRecord; onClose: () => void }) {
  const note = createAppointmentPlanningNote(appointment);
  const scriptText = note.receptionScript;

  async function copyScript() {
    await navigator.clipboard.writeText(scriptText);
    notify.success("Reception script copied");
  }

  return (
    <div className="mt-4 overflow-hidden rounded border border-cyan-200 bg-surface shadow-sm dark:border-cyan-900">
      <div className="flex flex-col justify-between gap-4 border-b border-cyan-100 bg-[linear-gradient(135deg,var(--site-soft),var(--site-surface))] p-4 dark:border-cyan-900 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">AI Planning Note · {appointment.name}</p>
          <h4 className="mt-1 text-2xl font-bold text-ink">{note.route}</h4>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{note.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] ${
              note.urgency === "Urgent Reception Call"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                : note.urgency === "Priority Review"
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
          >
            {note.urgency === "Urgent Reception Call" ? <AlertTriangle size={15} /> : <BrainCircuit size={15} />}
            {note.urgency}
          </span>
          <ActionButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </ActionButton>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 p-4 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Review flags</p>
          <div className="grid gap-2">
            {note.flags.map((flag) => (
              <span key={flag} className="rounded border border-line bg-soft/60 px-3 py-2 text-sm font-semibold text-teal-dark">
                {flag}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Preparation checklist</p>
          <ol className="grid gap-2">
            {note.preparation.map((item, index) => (
              <li key={item} className="flex gap-3 rounded border border-line bg-surface px-3 py-2 text-sm text-muted">
                <span className="font-bold text-brand">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Reception script</p>
            <ActionButton variant="secondary" size="sm" onClick={() => void copyScript()} className="min-h-7 gap-1 px-2 text-xs">
              <Copy size={13} /> Copy
            </ActionButton>
          </div>
          <p className="rounded border border-line bg-surface p-3 text-sm leading-relaxed text-muted">{note.receptionScript}</p>
          <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {note.safetyNote}
          </p>
        </div>
      </div>
    </div>
  );
}
