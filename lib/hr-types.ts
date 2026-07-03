export type StaffStatus = "Active" | "On Leave" | "Inactive";

export type StaffRole = "Doctor" | "Nurse" | "Reception" | "Pharmacy" | "Lab" | "Housekeeping" | "Admin" | "Technician";

export type StaffPermission =
  | "hms:admin"
  | "reports:read"
  | "cms:read"
  | "cms:write"
  | "cms:publish"
  | "clinical:write"
  | "billing:write"
  | "inventory:write";

export type StaffMember = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: StaffStatus;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  department: string;
  shift: "Morning" | "Evening" | "Night" | "General";
  joiningDate?: string;
  salary?: number;
  permissions: StaffPermission[];
  emergencyContact?: string;
  notes?: string;
};

export type AttendanceStatus = "Present" | "Absent" | "Half Day" | "Leave";

export type AttendanceRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  staffId: string;
  staffName: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
};

export const staffStatuses: StaffStatus[] = ["Active", "On Leave", "Inactive"];
export const staffRoles: StaffRole[] = ["Doctor", "Nurse", "Reception", "Pharmacy", "Lab", "Housekeeping", "Admin", "Technician"];
export const attendanceStatuses: AttendanceStatus[] = ["Present", "Absent", "Half Day", "Leave"];

export const staffPermissions: StaffPermission[] = [
  "hms:admin",
  "reports:read",
  "cms:read",
  "cms:write",
  "cms:publish",
  "clinical:write",
  "billing:write",
  "inventory:write"
];
