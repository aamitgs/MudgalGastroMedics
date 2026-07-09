"use client";

import { CalendarCheck2, Download, Phone, ShieldCheck, UserRoundPlus, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { AttendanceRecord, AttendanceStatus, StaffMember, StaffPermission, StaffStatus } from "@/lib/hr-types";
import { attendanceStatuses, staffPermissions, staffRoles, staffStatuses } from "@/lib/hr-types";
import type { AttendanceSortField } from "@/lib/attendance-query";
import { queryAttendance } from "@/lib/attendance-query";
import type { StaffSortField } from "@/lib/staff-directory-query";
import { queryStaffDirectory } from "@/lib/staff-directory-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";

const staffExportHeaders = ["Name", "Phone", "Email", "Role", "Department", "Shift", "Status", "Joining Date"];

function staffExportRow(member: StaffMember) {
  return [member.name, member.phone, member.email ?? "", member.role, member.department, member.shift, member.status, member.joiningDate ?? ""];
}

const attendanceExportHeaders = ["Staff", "Date", "Status", "Check In", "Check Out", "Notes"];

function attendanceExportRow(record: AttendanceRecord) {
  return [record.staffName, record.date, record.status, record.checkIn ?? "", record.checkOut ?? "", record.notes ?? ""];
}

type HrResponse = {
  ok: boolean;
  staff?: StaffMember[];
  staffMember?: StaffMember;
  attendance?: AttendanceRecord[] | AttendanceRecord;
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const shifts: StaffMember["shift"][] = ["Morning", "Evening", "Night", "General"];
const rowsPerPage = 25;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatAmount(value?: number) {
  if (!value) return "Not set";
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function AdminHR() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [staffPage, setStaffPage] = useState(0);
  const [staffFilter, setStaffFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffMember["role"] | "">("");
  const [staffStatusFilter, setStaffStatusFilter] = useState<StaffStatus | "">("");
  const [staffSorting, setStaffSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [permissionsMember, setPermissionsMember] = useState<StaffMember | null>(null);

  const [attendancePage, setAttendancePage] = useState(0);
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<AttendanceStatus | "">("");
  const [attendanceSorting, setAttendanceSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const staffSortField = (staffSorting[0]?.id as StaffSortField | undefined) ?? "name";
  const staffSortDir = staffSorting[0]?.desc ? "desc" : "asc";
  const attendanceSortField = (attendanceSorting[0]?.id as AttendanceSortField | undefined) ?? "createdAt";
  const attendanceSortDir = attendanceSorting[0]?.desc ? "desc" : "asc";

  async function loadHr() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/hr", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load HR records.");
      setLoading(false);
      return;
    }
    setStaff(data.staff ?? []);
    setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialHr() {
      const response = await fetch("/api/hr", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as HrResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load HR records.");
        setLoading(false);
        return;
      }
      setStaff(data.staff ?? []);
      setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
      setLoading(false);
    }
    void loadInitialHr();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const today = todayKey();
    const todaysAttendance = attendance.filter((record) => record.date === today);
    return [
      { label: "Total Staff", value: staff.length },
      { label: "Active Staff", value: staff.filter((member) => member.status === "Active").length },
      { label: "On Leave", value: staff.filter((member) => member.status === "On Leave").length },
      { label: "Present Today", value: todaysAttendance.filter((record) => record.status === "Present").length }
    ];
  }, [attendance, staff]);

  async function createStaffMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/hr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "staff" })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok || !data.staffMember) {
      notify.error(data.error || "Unable to add staff member.");
      return;
    }
    setStaff((items) => [data.staffMember as StaffMember, ...items]);
    notify.success("Staff member saved");
    form.reset();
  }

  async function markAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/hr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, mode: "attendance" })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    const record = Array.isArray(data.attendance) ? null : data.attendance;
    if (!response.ok || !data.ok || !record) {
      notify.error(data.error || "Unable to mark attendance.");
      return;
    }
    setAttendance((items) => [record, ...items.filter((item) => item.id !== record.id)]);
    notify.success("Attendance recorded");
    form.reset();
  }

  async function updateStaffStatus(id: string, status: StaffStatus) {
    const response = await fetch("/api/hr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mode: "staff", status })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok || !data.staffMember) {
      notify.error(data.error || "Unable to update staff.");
      return;
    }
    const updated = data.staffMember as StaffMember;
    setStaff((items) => items.map((item) => (item.id === id ? updated : item)));
  }

  async function togglePermission(member: StaffMember, permission: StaffPermission) {
    const permissions = member.permissions.includes(permission) ? member.permissions.filter((item) => item !== permission) : [...member.permissions, permission];
    const response = await fetch("/api/hr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, mode: "staff", permissions })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok || !data.staffMember) {
      notify.error(data.error || "Unable to update staff permissions.");
      return;
    }
    const updated = data.staffMember as StaffMember;
    setStaff((items) => items.map((item) => (item.id === member.id ? updated : item)));
    setPermissionsMember((current) => (current?.id === member.id ? updated : current));
  }

  async function updateAttendanceStatus(id: string, status: AttendanceStatus) {
    const response = await fetch("/api/hr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mode: "attendance", status })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    const record = Array.isArray(data.attendance) ? null : data.attendance;
    if (!response.ok || !data.ok || !record) {
      notify.error(data.error || "Unable to update attendance.");
      return;
    }
    setAttendance((items) => items.map((item) => (item.id === id ? record : item)));
  }

  function updateStaffFilter(value: string) {
    setStaffFilter(value);
    setStaffPage(0);
  }

  function updateRoleFilter(value: StaffMember["role"] | "") {
    setRoleFilter(value);
    setStaffPage(0);
  }

  function updateStaffStatusFilter(value: StaffStatus | "") {
    setStaffStatusFilter(value);
    setStaffPage(0);
  }

  function updateAttendanceFilter(value: string) {
    setAttendanceFilter(value);
    setAttendancePage(0);
  }

  function updateAttendanceStatusFilter(value: AttendanceStatus | "") {
    setAttendanceStatusFilter(value);
    setAttendancePage(0);
  }

  // Both tables paginate client-side against the already-loaded arrays: the
  // "Mark attendance" dropdown needs the complete staff list, and the
  // "Present Today" stat needs the complete attendance history, so both are
  // resident in memory regardless of the table's current page/filter.
  const { staff: staffPageRows, pageCount: staffPageCount } = useMemo(
    () =>
      queryStaffDirectory(staff, {
        page: staffPage,
        pageSize: rowsPerPage,
        sortBy: staffSortField,
        sortDir: staffSortDir,
        query: staffFilter,
        role: roleFilter || undefined,
        status: staffStatusFilter || undefined
      }),
    [staff, staffPage, staffSortField, staffSortDir, staffFilter, roleFilter, staffStatusFilter]
  );

  const { attendance: attendancePageRows, pageCount: attendancePageCount } = useMemo(
    () =>
      queryAttendance(attendance, {
        page: attendancePage,
        pageSize: rowsPerPage,
        sortBy: attendanceSortField,
        sortDir: attendanceSortDir,
        query: attendanceFilter,
        status: attendanceStatusFilter || undefined
      }),
    [attendance, attendancePage, attendanceSortField, attendanceSortDir, attendanceFilter, attendanceStatusFilter]
  );

  const staffColumns = useMemo<ColumnDef<StaffMember, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 170,
        cell: ({ row }) => <span className="font-bold text-ink">{row.original.name}</span>
      },
      { accessorKey: "role", header: "Role", size: 110 },
      { accessorKey: "department", header: "Department", size: 140 },
      { accessorKey: "shift", header: "Shift", size: 100, enableSorting: false },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <select
            aria-label="Status"
            value={row.original.status}
            onChange={(event) => void updateStaffStatus(row.original.id, event.target.value as StaffStatus)}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {staffStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      {
        id: "phone",
        header: "Phone",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <a href={`tel:${row.original.phone}`} className="inline-flex items-center gap-1.5 text-ink hover:text-brand">
            <Phone size={13} /> {row.original.phone}
          </a>
        )
      },
      {
        accessorKey: "salary",
        header: "Salary",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => formatAmount(row.original.salary)
      },
      {
        id: "actions",
        header: "Actions",
        size: 130,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={() => setPermissionsMember((current) => (current?.id === row.original.id ? null : row.original))}
            aria-expanded={permissionsMember?.id === row.original.id}
          >
            <ShieldCheck size={13} /> Permissions
          </ActionButton>
        )
      }
    ],
    [permissionsMember]
  );

  const attendanceColumns = useMemo<ColumnDef<AttendanceRecord, unknown>[]>(
    () => [
      { accessorKey: "staffName", header: "Staff", size: 170, cell: ({ row }) => <span className="font-bold text-ink">{row.original.staffName}</span> },
      { accessorKey: "date", header: "Date", size: 120 },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        cell: ({ row }) => (
          <select
            aria-label="Attendance status"
            value={row.original.status}
            onChange={(event) => void updateAttendanceStatus(row.original.id, event.target.value as AttendanceStatus)}
            className="rounded border border-line bg-soft px-2 py-1 text-xs font-bold text-ink"
          >
            {attendanceStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )
      },
      { id: "checkIn", header: "In", size: 90, enableSorting: false, cell: ({ row }) => row.original.checkIn || "—" },
      { id: "checkOut", header: "Out", size: 90, enableSorting: false, cell: ({ row }) => row.original.checkOut || "—" },
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
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">HR + Staff</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Staff directory and attendance</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Maintain staff roles, shifts, emergency contacts and daily attendance.</p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-2">
        <form onSubmit={createStaffMember} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <UserRoundPlus size={19} /> Add staff member
          </p>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="name" className={fieldClass} placeholder="Full name" required />
              <input name="phone" className={fieldClass} placeholder="Phone" required />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Role" name="role" className={fieldClass} defaultValue="Admin">
                {staffRoles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <input name="department" className={fieldClass} placeholder="Department" required />
              <select aria-label="Shift" name="shift" className={fieldClass} defaultValue="General">
                {shifts.map((shift) => (
                  <option key={shift}>{shift}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <input name="email" className={fieldClass} placeholder="Email" />
              <input aria-label="Joining date" name="joiningDate" className={fieldClass} type="date" />
              <input name="salary" className={fieldClass} type="number" min="0" placeholder="Monthly salary" />
            </div>
            <input name="emergencyContact" className={fieldClass} placeholder="Emergency contact" />
            <p className="rounded border border-line bg-soft/60 p-3 text-xs font-semibold text-muted">
              Permissions are assigned from the selected role. Admin can adjust permissions after saving the staff member.
            </p>
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Role notes, documents or duty instructions" />
            <ActionButton type="submit" variant="primary">
              Save Staff
            </ActionButton>
          </div>
        </form>

        <form onSubmit={markAttendance} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarCheck2 size={19} /> Mark attendance
          </p>
          <div className="grid gap-3">
            <select aria-label="Staff member" name="staffId" className={fieldClass} required>
              <option value="">Select staff member</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} | {member.role}
                </option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Date" name="date" className={fieldClass} type="date" defaultValue={todayKey()} />
              <select aria-label="Status" name="status" className={fieldClass} defaultValue="Present">
                {attendanceStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Check in" name="checkIn" className={fieldClass} type="time" />
              <input aria-label="Check out" name="checkOut" className={fieldClass} type="time" />
            </div>
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Leave reason, late arrival or handover notes" />
            <ActionButton type="submit" variant="success">
              Save Attendance
            </ActionButton>
          </div>
        </form>
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <UsersRound size={17} /> Staff directory
        </p>
        <DataTable
          columns={staffColumns}
          data={staffPageRows}
          getRowId={(member) => member.id}
          pageIndex={staffPage}
          pageCount={staffPageCount}
          onPageChange={setStaffPage}
          sorting={staffSorting}
          onSortingChange={setStaffSorting}
          globalFilter={staffFilter}
          onGlobalFilterChange={updateStaffFilter}
          searchPlaceholder="Search name, phone, email, department"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadHr()}
          emptyState={{
            icon: UsersRound,
            title: staffFilter || roleFilter || staffStatusFilter ? "No staff match your filters" : "No staff members yet",
            description:
              staffFilter || roleFilter || staffStatusFilter
                ? "Try a different search term, or clear the role/status filters."
                : "Add your first staff member with the form above.",
            action: staffFilter || roleFilter || staffStatusFilter ? "Clear filters" : undefined,
            onAction:
              staffFilter || roleFilter || staffStatusFilter
                ? () => {
                    setStaffFilter("");
                    setRoleFilter("");
                    setStaffStatusFilter("");
                  }
                : undefined
          }}
          export={{ headers: staffExportHeaders, row: staffExportRow, filename: "staff-directory.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <>
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) => updateRoleFilter(event.target.value as StaffMember["role"] | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All roles</option>
                {staffRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by staff status"
                value={staffStatusFilter}
                onChange={(event) => updateStaffStatusFilter(event.target.value as StaffStatus | "")}
                className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                <option value="">All statuses</option>
                {staffStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(staffExportHeaders, selected.map(staffExportRow), "selected-staff.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />

        {permissionsMember ? (
          <div className="rounded border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">
                  {permissionsMember.role} · {permissionsMember.department}
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink">{permissionsMember.name}</h3>
                {permissionsMember.emergencyContact ? <p className="mt-1 text-sm text-muted">Emergency: {permissionsMember.emergencyContact}</p> : null}
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => setPermissionsMember(null)}>
                Close
              </ActionButton>
            </div>
            <div className="mt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {staffPermissions.map((permission) => {
                  const active = permissionsMember.permissions.includes(permission);
                  return (
                    <button
                      key={permission}
                      type="button"
                      onClick={() => void togglePermission(permissionsMember, permission)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 text-xs font-bold transition ${active ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : "border-line bg-surface text-muted hover:border-brand hover:text-brand"}`}
                    >
                      {permission}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Recent attendance</p>
        <DataTable
          columns={attendanceColumns}
          data={attendancePageRows}
          getRowId={(record) => record.id}
          pageIndex={attendancePage}
          pageCount={attendancePageCount}
          onPageChange={setAttendancePage}
          sorting={attendanceSorting}
          onSortingChange={setAttendanceSorting}
          globalFilter={attendanceFilter}
          onGlobalFilterChange={updateAttendanceFilter}
          searchPlaceholder="Search staff, date"
          loading={loading}
          error={error || undefined}
          onRetry={() => void loadHr()}
          emptyState={{
            icon: CalendarCheck2,
            title: attendanceFilter || attendanceStatusFilter ? "No attendance matches your filters" : "No attendance marked yet",
            description:
              attendanceFilter || attendanceStatusFilter
                ? "Try a different search term, or clear the status filter."
                : "Mark today's attendance with the form above — presence feeds the staff dashboard and daily analytics.",
            action: attendanceFilter || attendanceStatusFilter ? "Clear filters" : undefined,
            onAction:
              attendanceFilter || attendanceStatusFilter
                ? () => {
                    setAttendanceFilter("");
                    setAttendanceStatusFilter("");
                  }
                : undefined
          }}
          export={{ headers: attendanceExportHeaders, row: attendanceExportRow, filename: "attendance.csv" }}
          toolbarExtra={
            <select
              aria-label="Filter by attendance status"
              value={attendanceStatusFilter}
              onChange={(event) => updateAttendanceStatusFilter(event.target.value as AttendanceStatus | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              {attendanceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(attendanceExportHeaders, selected.map(attendanceExportRow), "selected-attendance.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />
      </div>
    </div>
  );
}
