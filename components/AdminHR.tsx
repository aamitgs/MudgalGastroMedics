"use client";

import { CalendarCheck2, Download, Phone, RefreshCw, UserRoundPlus, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AttendanceRecord, AttendanceStatus, StaffMember, StaffPermission, StaffStatus } from "@/lib/hr-types";
import { attendanceStatuses, staffPermissions, staffRoles, staffStatuses } from "@/lib/hr-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const staffExportHeaders = ["Name", "Phone", "Email", "Role", "Department", "Shift", "Status", "Joining Date"];

function staffExportRow(member: StaffMember) {
  return [
    member.name,
    member.phone,
    member.email ?? "",
    member.role,
    member.department,
    member.shift,
    member.status,
    member.joiningDate ?? ""
  ];
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
      setError(data.error || "Unable to add staff member.");
      return;
    }
    setStaff((items) => [data.staffMember as StaffMember, ...items]);
    form.reset();
    setError("");
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
      setError(data.error || "Unable to mark attendance.");
      return;
    }
    setAttendance((items) => [record, ...items.filter((item) => item.id !== record.id)]);
    form.reset();
    setError("");
  }

  async function updateStaffStatus(id: string, status: StaffStatus) {
    const response = await fetch("/api/hr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mode: "staff", status })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok || !data.staffMember) {
      setError(data.error || "Unable to update staff.");
      return;
    }
    setStaff((items) => items.map((item) => (item.id === id ? data.staffMember as StaffMember : item)));
  }

  async function togglePermission(member: StaffMember, permission: StaffPermission) {
    const permissions = member.permissions.includes(permission)
      ? member.permissions.filter((item) => item !== permission)
      : [...member.permissions, permission];
    const response = await fetch("/api/hr", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, mode: "staff", permissions })
    });
    const data = (await response.json().catch(() => ({}))) as HrResponse;
    if (!response.ok || !data.ok || !data.staffMember) {
      setError(data.error || "Unable to update staff permissions.");
      return;
    }
    setStaff((items) => items.map((item) => (item.id === member.id ? data.staffMember as StaffMember : item)));
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
      setError(data.error || "Unable to update attendance.");
      return;
    }
    setAttendance((items) => items.map((item) => (item.id === id ? record : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">HR + Staff</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Staff directory and attendance</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Maintain staff roles, shifts, emergency contacts and daily attendance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadCsv(staffExportHeaders, staff.map(staffExportRow), "staff-directory.csv")}
            disabled={staff.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button type="button" onClick={() => void loadHr()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <RefreshCw size={17} /> Refresh HR
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

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
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><UserRoundPlus size={19} /> Add staff member</p>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="name" className={fieldClass} placeholder="Full name" required />
              <input name="phone" className={fieldClass} placeholder="Phone" required />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Role" name="role" className={fieldClass} defaultValue="Admin">{staffRoles.map((role) => <option key={role}>{role}</option>)}</select>
              <input name="department" className={fieldClass} placeholder="Department" required />
              <select aria-label="Shift" name="shift" className={fieldClass} defaultValue="General">{shifts.map((shift) => <option key={shift}>{shift}</option>)}</select>
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
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.28)]">Save Staff</button>
          </div>
        </form>

        <form onSubmit={markAttendance} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><CalendarCheck2 size={19} /> Mark attendance</p>
          <div className="grid gap-3">
            <select aria-label="Staff member" name="staffId" className={fieldClass} required>
              <option value="">Select staff member</option>
              {staff.map((member) => <option key={member.id} value={member.id}>{member.name} | {member.role}</option>)}
            </select>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Date" name="date" className={fieldClass} type="date" defaultValue={todayKey()} />
              <select aria-label="Status" name="status" className={fieldClass} defaultValue="Present">{attendanceStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Check in" name="checkIn" className={fieldClass} type="time" />
              <input aria-label="Check out" name="checkOut" className={fieldClass} type="time" />
            </div>
            <textarea name="notes" className={`${fieldClass} min-h-20 py-3`} placeholder="Leave reason, late arrival or handover notes" />
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)]">Save Attendance</button>
          </div>
        </form>
      </div>

      <div className="grid gap-5 border-t border-line p-4 xl:grid-cols-2">
        <div className="grid gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><UsersRound size={17} /> Staff directory</p>
          {loading ? <ModuleSkeleton /> : null}
          {staff.map((member) => (
            <article key={member.id} className="rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{member.role} | {member.shift}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{member.name}</h3>
                  <p className="mt-1 text-sm text-muted">{member.department} | Salary: {formatAmount(member.salary)}</p>
                </div>
                <select aria-label="Status" value={member.status} onChange={(event) => void updateStaffStatus(member.id, event.target.value as StaffStatus)} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                  {staffStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a href={`tel:${member.phone}`} className="inline-flex items-center gap-2 rounded border border-line bg-soft px-3 py-2 font-bold text-ink transition hover:border-brand hover:text-brand"><Phone size={15} /> {member.phone}</a>
                {member.email ? <span className="rounded border border-line bg-soft px-3 py-2 text-muted">{member.email}</span> : null}
                {member.emergencyContact ? <span className="rounded border border-line bg-soft px-3 py-2 text-muted">Emergency: {member.emergencyContact}</span> : null}
              </div>
              <div className="mt-3 rounded border border-line bg-soft/50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {staffPermissions.map((permission) => {
                    const active = member.permissions.includes(permission);
                    return (
                      <button
                        key={permission}
                        type="button"
                        onClick={() => void togglePermission(member, permission)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition ${active ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "border-line bg-surface text-muted hover:border-brand hover:text-brand"}`}
                      >
                        {permission}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-bold text-ink">Recent attendance</p>
          {attendance.length === 0 ? <p className="rounded border border-line bg-soft/60 p-4 text-sm font-semibold text-muted">No attendance marked yet.</p> : null}
          {attendance.slice(0, 12).map((record) => (
            <article key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-soft/40 p-4">
              <div>
                <p className="font-bold text-ink">{record.staffName}</p>
                <p className="text-sm text-muted">{record.date}{record.checkIn ? ` | In ${record.checkIn}` : ""}{record.checkOut ? ` | Out ${record.checkOut}` : ""}</p>
              </div>
              <select aria-label="Status" value={record.status} onChange={(event) => void updateAttendanceStatus(record.id, event.target.value as AttendanceStatus)} className="rounded border border-line bg-surface px-3 py-2 text-sm font-bold text-ink">
                {attendanceStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
