import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AttendanceRecord, AttendanceStatus, StaffMember, StaffPermission, StaffRole, StaffStatus } from "@/lib/hr-types";
import { staffPermissions } from "@/lib/hr-types";

type HrStore = {
  staff: StaffMember[];
  attendance: AttendanceRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmHrStore?: HrStore;
};

const storeFile = join(process.cwd(), ".data", "hr.json");

function nowIso() {
  return new Date().toISOString();
}

function seedStore(): HrStore {
  const now = nowIso();
  return {
    staff: [
      {
        id: "STF-ADMIN-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "System Administrator",
        phone: "05623501228",
        email: "mudgalreception@gmail.com",
        role: "Admin",
        department: "Administration",
        shift: "General",
        joiningDate: "2019-01-01",
        permissions: roleDefaultPermissions("Admin"),
        notes: "Default named admin identity for passcode login and CMS publishing."
      },
      {
        id: "STF-DOCTOR-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "Dr. Deepak Kumar Sharma",
        phone: "9828912257",
        email: "mudgalreception@gmail.com",
        role: "Doctor",
        department: "Gastroenterology",
        shift: "General",
        joiningDate: "2019-01-01",
        permissions: roleDefaultPermissions("Doctor"),
        notes: "Consultant Gastroenterologist & Hepatologist"
      },
      {
        id: "STF-RECEPTION-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "Reception Desk",
        phone: "05623501228",
        email: "mudgalreception@gmail.com",
        role: "Reception",
        department: "Front Office",
        shift: "General",
        permissions: roleDefaultPermissions("Reception"),
        notes: "Appointment and patient registration desk"
      },
      {
        id: "STF-PHARMACY-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "Pharmacy Staff",
        phone: "9828912257",
        role: "Pharmacy",
        department: "Pharmacy",
        shift: "Morning",
        permissions: roleDefaultPermissions("Pharmacy"),
        notes: "Medicine dispensing and inventory coordination"
      },
      {
        id: "STF-LAB-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "Lab Technician",
        phone: "9828912257",
        role: "Lab",
        department: "Laboratory",
        shift: "Morning",
        permissions: roleDefaultPermissions("Lab"),
        notes: "Sample collection and report coordination"
      },
      {
        id: "STF-NURSING-001",
        createdAt: now,
        updatedAt: now,
        status: "Active",
        name: "Nursing Staff",
        phone: "9828912257",
        role: "Nurse",
        department: "Procedure Support",
        shift: "General",
        permissions: roleDefaultPermissions("Nurse"),
        notes: "Procedure preparation and recovery support"
      }
    ],
    attendance: []
  };
}

function readStoreFromDisk(): HrStore {
  try {
    if (!existsSync(storeFile)) return seedStore();
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<HrStore>;
    return {
      staff: Array.isArray(parsed.staff) ? parsed.staff.map(withPermissions) : seedStore().staff,
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : []
    };
  } catch {
    return seedStore();
  }
}

function writeStoreToDisk(store: HrStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmHrStore ??= readStoreFromDisk();
  return globalStore.__mgmHrStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function roleDefaultPermissions(role: StaffRole): StaffPermission[] {
  if (role === "Admin") return [...staffPermissions];
  if (role === "Doctor") return ["reports:read", "cms:read", "clinical:write"];
  if (role === "Reception") return ["reports:read", "cms:read", "cms:write", "billing:write"];
  if (role === "Pharmacy") return ["reports:read", "inventory:write", "billing:write"];
  if (role === "Lab" || role === "Technician") return ["reports:read", "clinical:write", "inventory:write"];
  if (role === "Nurse") return ["reports:read", "clinical:write"];
  return ["reports:read"];
}

function normalizePermissions(value: unknown, role: StaffRole): StaffPermission[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : roleDefaultPermissions(role);
  const allowed = values.filter((item): item is StaffPermission => staffPermissions.includes(String(item).trim() as StaffPermission));
  return allowed.length ? Array.from(new Set(allowed)) : roleDefaultPermissions(role);
}

function withPermissions(member: StaffMember): StaffMember {
  return {
    ...member,
    permissions: normalizePermissions(member.permissions, member.role)
  };
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function listStaff() {
  return getStore().staff.map(withPermissions);
}

export function getStaffById(id: string) {
  const member = getStore().staff.find((item) => item.id === id);
  return member ? withPermissions(member) : null;
}

export function listAttendance() {
  return getStore().attendance;
}

export function createStaff(input: Record<string, unknown>) {
  const name = normalizeText(input.name);
  const phone = normalizeText(input.phone);
  const department = normalizeText(input.department);
  if (!name || !phone || !department) return { error: "Name, phone and department are required." };

  const now = nowIso();
  const role = (normalizeText(input.role) as StaffRole) || "Admin";
  const member: StaffMember = {
    id: makeId("STF"),
    createdAt: now,
    updatedAt: now,
    status: "Active",
    name,
    phone,
    email: normalizeText(input.email),
    role,
    department,
    shift: (normalizeText(input.shift) as StaffMember["shift"]) || "General",
    joiningDate: normalizeText(input.joiningDate),
    salary: normalizeNumber(input.salary),
    permissions: normalizePermissions(input.permissions, role),
    emergencyContact: normalizeText(input.emergencyContact),
    notes: normalizeText(input.notes)
  };

  getStore().staff.unshift(member);
  writeStoreToDisk(getStore());
  return { staff: member };
}

export function updateStaff(input: {
  id: string;
  status?: StaffStatus;
  role?: StaffRole;
  permissions?: StaffPermission[];
  shift?: StaffMember["shift"];
  department?: string;
  phone?: string;
  email?: string;
  salary?: number;
  emergencyContact?: string;
  notes?: string;
}) {
  const member = getStore().staff.find((item) => item.id === input.id);
  if (!member) return null;

  if (input.status) member.status = input.status;
  if (input.role) {
    member.role = input.role;
    member.permissions = roleDefaultPermissions(input.role);
  }
  if (input.permissions) member.permissions = normalizePermissions(input.permissions, member.role);
  if (input.shift) member.shift = input.shift;
  if (typeof input.department === "string") member.department = input.department.trim();
  if (typeof input.phone === "string") member.phone = input.phone.trim();
  if (typeof input.email === "string") member.email = input.email.trim();
  if (typeof input.salary === "number" && Number.isFinite(input.salary)) member.salary = input.salary;
  if (typeof input.emergencyContact === "string") member.emergencyContact = input.emergencyContact.trim();
  if (typeof input.notes === "string") member.notes = input.notes.trim();
  member.updatedAt = nowIso();
  writeStoreToDisk(getStore());
  return member;
}

export function createAttendance(input: Record<string, unknown>) {
  const staffId = normalizeText(input.staffId);
  const staffMember = getStore().staff.find((item) => item.id === staffId);
  if (!staffMember) return { error: "Select a valid staff member." };

  const date = normalizeText(input.date) || nowIso().slice(0, 10);
  const status = (normalizeText(input.status) as AttendanceStatus) || "Present";
  const existing = getStore().attendance.find((record) => record.staffId === staffId && record.date === date);
  const now = nowIso();

  if (existing) {
    existing.staffName = staffMember.name;
    existing.status = status;
    existing.checkIn = normalizeText(input.checkIn);
    existing.checkOut = normalizeText(input.checkOut);
    existing.notes = normalizeText(input.notes);
    existing.updatedAt = now;
    writeStoreToDisk(getStore());
    return { attendance: existing };
  }

  const attendance: AttendanceRecord = {
    id: makeId("ATT"),
    createdAt: now,
    updatedAt: now,
    staffId,
    staffName: staffMember.name,
    date,
    status,
    checkIn: normalizeText(input.checkIn),
    checkOut: normalizeText(input.checkOut),
    notes: normalizeText(input.notes)
  };

  getStore().attendance.unshift(attendance);
  writeStoreToDisk(getStore());
  return { attendance };
}

export function updateAttendance(input: {
  id: string;
  status?: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}) {
  const attendance = getStore().attendance.find((item) => item.id === input.id);
  if (!attendance) return null;
  if (input.status) attendance.status = input.status;
  if (typeof input.checkIn === "string") attendance.checkIn = input.checkIn.trim();
  if (typeof input.checkOut === "string") attendance.checkOut = input.checkOut.trim();
  if (typeof input.notes === "string") attendance.notes = input.notes.trim();
  attendance.updatedAt = nowIso();
  writeStoreToDisk(getStore());
  return attendance;
}
