import "server-only";
import { listAppointments } from "@/lib/appointment-store";
import { listAiReviews } from "@/lib/ai-review-store";
import { evaluateRecalls } from "@/lib/clinical/recall";
import { listInventoryItems } from "@/lib/inventory-store";
import { listLabOrders } from "@/lib/lab-store";
import { listOpdVisits } from "@/lib/opd-store";
import { listPatients } from "@/lib/patient-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";
import type { ReportRange } from "@/lib/reports";

export type DrilldownResult = { title: string; headers: string[]; rows: string[][] };

function inRange(dateIso: string | undefined, range: ReportRange) {
  if (!dateIso) return false;
  const day = dateIso.slice(0, 10);
  return day >= range.from && day <= range.to;
}

/**
 * Maps a report/analytics tile's metric key to the underlying records behind
 * it (Track 3.5 drill-down) — a fixed, known set of tiles rather than a
 * generic query language, since each tile's meaning (which store, which
 * filter) is specific to how lib/reports.ts / lib/analytics.ts computed it.
 * Date-range-scoped metrics ("today" tiles) respect `range`; risk-watchlist
 * metrics are current-state gauges (e.g. "patients flagged right now") and
 * intentionally ignore it — there's no "flagged between these dates" in the
 * data model, only a current status.
 */
export async function getDrilldownRecords(metric: string, range: ReportRange, doctor?: string): Promise<DrilldownResult | null> {
  switch (metric) {
    case "appointments.today": {
      const rows = (await listAppointments()).filter((appointment) => inRange(appointment.createdAt, range));
      return {
        title: "Appointments in range",
        headers: ["Name", "Phone", "Service", "Status", "Priority", "Requested"],
        rows: rows.map((appointment) => [appointment.name, appointment.phone, appointment.service, appointment.status, appointment.priority ?? "", appointment.createdAt])
      };
    }
    case "appointments.new": {
      const rows = (await listAppointments()).filter((appointment) => appointment.status === "New");
      return {
        title: "New appointment requests",
        headers: ["Name", "Phone", "Service", "Priority", "Requested"],
        rows: rows.map((appointment) => [appointment.name, appointment.phone, appointment.service, appointment.priority ?? "", appointment.createdAt])
      };
    }
    case "appointments.confirmed": {
      const rows = (await listAppointments()).filter((appointment) => appointment.status === "Confirmed");
      return {
        title: "Confirmed appointments",
        headers: ["Name", "Phone", "Service", "Date", "Requested"],
        rows: rows.map((appointment) => [appointment.name, appointment.phone, appointment.service, appointment.date ?? "", appointment.createdAt])
      };
    }
    case "appointments.urgent":
    case "risks.urgentAppointments": {
      const rows = (await listAppointments()).filter((appointment) => appointment.priority === "Urgent symptoms");
      return {
        title: "Urgent appointment requests",
        headers: ["Name", "Phone", "Service", "Status", "Requested"],
        rows: rows.map((appointment) => [appointment.name, appointment.phone, appointment.service, appointment.status, appointment.createdAt])
      };
    }
    case "opd.today": {
      const rows = (await listOpdVisits())
        .filter((visit) => inRange(visit.createdAt, range))
        .filter((visit) => !doctor || visit.doctorName === doctor);
      return {
        title: doctor ? `OPD visits in range — ${doctor}` : "OPD visits in range",
        headers: ["Patient", "Phone", "Service", "Status", "Doctor", "Visit Date"],
        rows: rows.map((visit) => [visit.patientName, visit.phone, visit.service, visit.status, visit.doctorName || "Unassigned", visit.createdAt])
      };
    }
    case "inventory.lowStock":
    case "risks.lowStockItems": {
      const rows = (await listInventoryItems()).filter((item) => item.quantity <= item.reorderLevel);
      return {
        title: "Low-stock inventory items",
        headers: ["Name", "Category", "Quantity", "Reorder Level", "Unit"],
        rows: rows.map((item) => [item.name, item.category, String(item.quantity), String(item.reorderLevel), item.unit])
      };
    }
    case "risks.flaggedPatients": {
      const rows = (await listPatients()).filter((patient) => patient.status === "Flagged");
      return {
        title: "Flagged patients",
        headers: ["UHID", "Name", "Phone", "Status"],
        rows: rows.map((patient) => [patient.uhid, patient.name, patient.phone, patient.status])
      };
    }
    case "risks.escalatedAiReviews": {
      const rows = (await listAiReviews()).filter((review) => review.status === "Escalated");
      return {
        title: "Escalated AI reviews",
        headers: ["Patient", "Phone", "Service", "Urgency", "Reviewed"],
        rows: rows.map((review) => [review.patientName, review.phone, review.service, review.urgency, review.reviewedAt ?? ""])
      };
    }
    case "risks.unpaidLab": {
      const rows = (await listLabOrders()).filter((order) => order.paymentStatus === "Unpaid");
      return {
        title: "Unpaid lab orders",
        headers: ["Patient", "Phone", "Tests", "Amount", "Status"],
        rows: rows.map((order) => [order.patientName, order.phone, order.tests.join(", "), String(order.amount ?? 0), order.status])
      };
    }
    case "risks.unpaidPharmacy": {
      const rows = (await listPharmacyDispenses()).filter((record) => record.paymentStatus === "Unpaid");
      return {
        title: "Unpaid pharmacy dispenses",
        headers: ["Patient", "Phone", "Service", "Total"],
        rows: rows.map((record) => [record.patientName, record.phone, record.service, String(record.total)])
      };
    }
    case "risks.criticalLabsUnacked": {
      const rows = (await listLabOrders()).filter((order) => order.criticalFlag && !order.criticalAcknowledgedAt && order.status !== "Cancelled");
      return {
        title: "Unacknowledged critical labs",
        headers: ["Patient", "Phone", "Tests", "Status"],
        rows: rows.map((order) => [order.patientName, order.phone, order.tests.join(", "), order.status])
      };
    }
    case "risks.overdueRecalls": {
      const visits = await listOpdVisits();
      const recalls = evaluateRecalls(visits);
      const overdue = visits
        .map((visit) => ({ visit, recall: recalls.get(visit.id) }))
        .filter((entry) => entry.recall?.status === "overdue")
        .sort((a, b) => (b.recall!.daysOverdue ?? 0) - (a.recall!.daysOverdue ?? 0));
      return {
        title: "Overdue follow-ups",
        headers: ["Patient", "Phone", "Service", "Due Date", "Days Overdue"],
        rows: overdue.map(({ visit, recall }) => [visit.patientName, visit.phone, visit.service, recall!.dueDate, String(recall!.daysOverdue)])
      };
    }
    default:
      return null;
  }
}
