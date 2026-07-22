import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AttendanceRecord, AttendanceStatus, StaffMember, StaffPermission, StaffRole, StaffStatus } from "@/lib/hr-types";
import { staffPermissions } from "@/lib/hr-types";

type HrStore = {
  staff: StaffMember[];
  attendance: AttendanceRecord[];
};



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
        email: "admin@mudgalgastromedics.com",
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
        email: "admin@mudgalgastromedics.com",
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
        email: "admin@mudgalgastromedics.com",
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

const store = createDocumentStore<HrStore>("hr", (parsed) => {
  const doc = parsed as Partial<HrStore> | undefined;
  if (!doc) return seedStore();
  return {
    staff: Array.isArray(doc.staff) ? doc.staff.map(withPermissions) : seedStore().staff,
    attendance: Array.isArray(doc.attendance) ? doc.attendance : []
  };
});

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
  return generateId(prefix);
}

export async function listStaff() {
  return (await store.load()).staff.map(withPermissions);
}

/** Self-service only — deliberately separate from updateStaff (the HR-admin editor, hr-records:edit gated) so a legacy-session self-service photo upload can only ever touch its own photo field, nothing else about the record. */
export async function updateStaffPhoto(id: string, photoDocumentId: string) {
  const doc = await store.load();
  const member = doc.staff.find((item) => item.id === id);
  if (!member) return null;
  member.photoDocumentId = photoDocumentId;
  member.updatedAt = nowIso();
  await store.save(doc);
  return member;
}

export async function getStaffById(id: string) {
  const member = (await store.load()).staff.find((item) => item.id === id);
  return member ? withPermissions(member) : null;
}

export async function listAttendance() {
  return (await store.load()).attendance;
}

export async function createStaff(input: Record<string, unknown>) {
  const doc = await store.load();
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

  doc.staff.unshift(member);
  await store.save(doc);
  return { staff: member };
}

export async function updateStaff(input: {
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
  const doc = await store.load();
  const member = doc.staff.find((item) => item.id === input.id);
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
  await store.save(doc);
  return member;
}

export async function createAttendance(input: Record<string, unknown>) {
  const doc = await store.load();
  const staffId = normalizeText(input.staffId);
  const staffMember = doc.staff.find((item) => item.id === staffId);
  if (!staffMember) return { error: "Select a valid staff member." };

  const date = normalizeText(input.date) || nowIso().slice(0, 10);
  const status = (normalizeText(input.status) as AttendanceStatus) || "Present";
  const existing = doc.attendance.find((record) => record.staffId === staffId && record.date === date);
  const now = nowIso();

  if (existing) {
    existing.staffName = staffMember.name;
    existing.status = status;
    existing.checkIn = normalizeText(input.checkIn);
    existing.checkOut = normalizeText(input.checkOut);
    existing.notes = normalizeText(input.notes);
    existing.updatedAt = now;
    await store.save(doc);
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

  doc.attendance.unshift(attendance);
  await store.save(doc);
  return { attendance };
}

export async function updateAttendance(input: {
  id: string;
  status?: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}) {
  const doc = await store.load();
  const attendance = doc.attendance.find((item) => item.id === input.id);
  if (!attendance) return null;
  if (input.status) attendance.status = input.status;
  if (typeof input.checkIn === "string") attendance.checkIn = input.checkIn.trim();
  if (typeof input.checkOut === "string") attendance.checkOut = input.checkOut.trim();
  if (typeof input.notes === "string") attendance.notes = input.notes.trim();
  attendance.updatedAt = nowIso();
  await store.save(doc);
  return attendance;
}

/**
 * Hard delete — Inactive staff only, and only once no attendance history
 * references them (intra-store, cheap to check here). The legacy-login-id
 * check (STF-ADMIN-001/STF-RECEPTION-001/STF-DOCTOR-001 + STAFF_USERS_JSON)
 * and the automation ownerStaffId check live in the route instead: both are
 * genuinely cross-module (staff-auth.ts and automation-store.ts), and
 * automation-store.ts already imports getStaffById FROM this file, so this
 * file importing back from either would be circular.
 */
export async function deleteStaff(id: string) {
  const doc = await store.load();
  const member = doc.staff.find((item) => item.id === id);
  if (!member) return { error: "Staff record not found." };
  if (member.status !== "Inactive") return { error: "Only Inactive staff records can be deleted." };

  const hasAttendance = doc.attendance.some((record) => record.staffId === id);
  if (hasAttendance) return { error: "This staff member has attendance history and can't be deleted." };

  doc.staff = doc.staff.filter((item) => item.id !== id);
  await store.save(doc);
  return { staff: member };
}

/** Hard delete — no status concept applies to attendance, so this is a plain admin/super-admin-gated removal (see app/api/hr/route.ts), audited like everything else. */
export async function deleteAttendance(id: string) {
  const doc = await store.load();
  const record = doc.attendance.find((item) => item.id === id);
  if (!record) return { error: "Attendance record not found." };

  doc.attendance = doc.attendance.filter((item) => item.id !== id);
  await store.save(doc);
  return { attendance: record };
}
