import { z } from "zod";
import { attendanceStatuses, staffPermissions, staffRoles, staffStatuses } from "@/lib/hr-types";

const optionalText = z.string().trim().optional();
const shifts = ["Morning", "Evening", "Night", "General"] as const;

export const staffCreateSchema = z.object({
  name: z.string({ error: "Staff name is required." }).trim().min(1, "Staff name is required."),
  phone: z.string({ error: "Phone number is required." }).trim().min(1, "Phone number is required."),
  department: z.string({ error: "Department is required." }).trim().min(1, "Department is required."),
  email: optionalText,
  // Matches the store's existing leniency: an invalid/missing role or shift
  // silently falls back to a sane default rather than rejecting the request.
  role: z.enum(staffRoles as [string, ...string[]]).default("Admin"),
  shift: z.enum(shifts).default("General"),
  joiningDate: optionalText,
  salary: optionalText,
  emergencyContact: optionalText,
  notes: optionalText
});

export const attendanceCreateSchema = z.object({
  staffId: z.string({ error: "Staff member is required." }).trim().min(1, "Staff member is required."),
  date: optionalText,
  status: z.enum(attendanceStatuses as [string, ...string[]]).default("Present"),
  checkIn: optionalText,
  checkOut: optionalText,
  notes: optionalText
});

export const staffUpdateSchema = z.object({
  id: z.string({ error: "Record id is required." }).trim().min(1, "Record id is required."),
  status: z.enum(staffStatuses as [string, ...string[]], { error: "Invalid staff status." }).optional(),
  role: z.enum(staffRoles as [string, ...string[]], { error: "Invalid staff role." }).optional(),
  permissions: z.array(z.enum(staffPermissions as [string, ...string[]])).optional(),
  shift: z.enum(shifts, { error: "Invalid shift." }).optional(),
  department: optionalText,
  phone: optionalText,
  email: optionalText,
  salary: z.coerce.number().optional(),
  emergencyContact: optionalText,
  notes: optionalText
});

export const attendanceUpdateSchema = z.object({
  id: z.string({ error: "Record id is required." }).trim().min(1, "Record id is required."),
  status: z.enum(attendanceStatuses as [string, ...string[]], { error: "Invalid attendance status." }).optional(),
  checkIn: optionalText,
  checkOut: optionalText,
  notes: optionalText
});

export const staffDeleteSchema = z.object({
  id: z.string().trim().min(1, "Record id is required."),
  mode: z.enum(["staff", "attendance"]).default("staff")
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
