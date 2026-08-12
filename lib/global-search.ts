import type { AppointmentRecord } from "@/lib/appointment-types";
import type { StaffMember } from "@/lib/hr-types";
import type { InventoryItem } from "@/lib/inventory-types";
import { admissionReference, type IpdAdmission } from "@/lib/ipd-types";
import type { LabOrder } from "@/lib/lab-types";
import type { PatientRecord } from "@/lib/patient-types";

export type SearchCategory = "Patients" | "Appointments" | "Laboratory" | "Pharmacy" | "Admissions" | "Employees";

export type SearchResult = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  /** Anchor into the operations dashboard, or a patient phone for drawer opens. */
  href: string;
  /** When set, selecting this result should open the Patient Drawer instead of navigating. */
  patientPhone?: string;
  score: number;
};

function fieldScore(query: string, ...fields: Array<string | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    const value = field.toLowerCase();
    if (value === q) best = Math.max(best, 100);
    else if (value.startsWith(q)) best = Math.max(best, 80);
    else if (value.includes(q)) best = Math.max(best, 50);
  }
  return best;
}

/**
 * Pure, testable ranking over already-fetched records (Track 2.6). Kept
 * data-source-agnostic so the API route supplies live store data and unit
 * tests can supply fixtures without touching the document store.
 */
export function searchPatients(query: string, patients: PatientRecord[]): SearchResult[] {
  return patients
    .map((patient) => ({
      id: patient.id,
      category: "Patients" as const,
      title: patient.name,
      subtitle: `${patient.uhid} · ${patient.phone}${patient.bloodGroup ? ` · ${patient.bloodGroup}` : ""}`,
      href: "/mudgalgastromedics-os/patients",
      patientPhone: patient.phone,
      score: fieldScore(query, patient.name, patient.uhid, patient.phone, patient.allergies)
    }))
    .filter((result) => result.score > 0);
}

export function searchAppointments(query: string, appointments: AppointmentRecord[]): SearchResult[] {
  return appointments
    .map((appointment) => ({
      id: appointment.id,
      category: "Appointments" as const,
      title: appointment.name,
      subtitle: `${appointment.service} · ${appointment.status}${appointment.date ? ` · ${appointment.date}` : ""}`,
      href: "/mudgalgastromedics-os/appointments",
      patientPhone: appointment.phone,
      score: fieldScore(query, appointment.name, appointment.phone, appointment.service, appointment.uhid)
    }))
    .filter((result) => result.score > 0);
}

export function searchLabOrders(query: string, orders: LabOrder[]): SearchResult[] {
  return orders
    .map((order) => ({
      id: order.id,
      category: "Laboratory" as const,
      title: order.patientName,
      subtitle: `${order.tests.join(", ") || order.service} · ${order.status}${order.criticalFlag ? " · CRITICAL" : ""}`,
      href: "/mudgalgastromedics-os/lab",
      patientPhone: order.phone,
      score: fieldScore(query, order.patientName, order.phone, order.token, ...order.tests)
    }))
    .filter((result) => result.score > 0);
}

export function searchInventory(query: string, items: InventoryItem[]): SearchResult[] {
  return items
    .map((item) => ({
      id: item.id,
      category: "Pharmacy" as const,
      title: item.name,
      subtitle: `${item.category} · ${item.quantity} ${item.unit} in stock`,
      href: "/mudgalgastromedics-os/inventory",
      score: fieldScore(query, item.name, item.category, item.vendor)
    }))
    .filter((result) => result.score > 0);
}

export function searchAdmissions(query: string, admissions: IpdAdmission[]): SearchResult[] {
  return admissions
    .map((admission) => ({
      id: admission.id,
      category: "Admissions" as const,
      title: admission.patientName,
      subtitle: `${admissionReference(admission)} · ${admission.ward} · Bed ${admission.bedLabel} · ${admission.status}`,
      href: "/mudgalgastromedics-os/ipd",
      patientPhone: admission.phone,
      // Admission number and UHID are searchable because staff arrive holding
      // one of them — off a discharge summary, a bill, or a phone call.
      score: fieldScore(query, admission.patientName, admission.phone, admission.admissionNo, admission.uhid, admission.bedLabel, admission.diagnosis)
    }))
    .filter((result) => result.score > 0);
}

export function searchStaff(query: string, staff: StaffMember[]): SearchResult[] {
  return staff
    .map((member) => ({
      id: member.id,
      category: "Employees" as const,
      title: member.name,
      subtitle: `${member.role} · ${member.department}`,
      href: "/mudgalgastromedics-os/hr",
      score: fieldScore(query, member.name, member.role, member.department, member.phone)
    }))
    .filter((result) => result.score > 0);
}

/** Merge, sort by score, cap per category so one category can't crowd out the rest. */
export function rankSearchResults(groups: SearchResult[][], perCategoryLimit = 5): SearchResult[] {
  return groups
    .flatMap((group) =>
      group
        .sort((a, b) => b.score - a.score)
        .slice(0, perCategoryLimit)
    )
    .sort((a, b) => b.score - a.score);
}
