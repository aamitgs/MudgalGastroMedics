import "server-only";
import { listPatientAppointments } from "@/lib/appointment-store";
import type { ClinicalEvent } from "@/lib/hospital-os-data";
import { listPatientIpdAdmissions, listVitals } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";

type TimelineEntry = ClinicalEvent & { at: string };

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function formatEventTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  });
}

function entry(at: string, type: ClinicalEvent["type"], title: string, detail: string): TimelineEntry {
  return { at, time: formatEventTime(at), type, title, detail };
}

/**
 * One chronological clinical timeline per patient (Master Prompt P3), aggregated
 * from the same source-of-truth stores the AI patient summary uses: appointments,
 * OPD visits, IPD admissions with vitals, lab orders and pharmacy dispenses.
 * Matched by registered phone — the patient identity key used across stores.
 */
export async function buildPatientTimeline(phone: string): Promise<ClinicalEvent[]> {
  const key = normalizePhone(phone);
  if (key.length < 6) return [];

  const [appointments, visits, admissions, labOrders, dispenses] = await Promise.all([
    listPatientAppointments(phone),
    listPatientOpdVisits(phone),
    listPatientIpdAdmissions(phone),
    listLabOrders(),
    listPharmacyDispenses()
  ]);

  const events: TimelineEntry[] = [];

  for (const appointment of appointments) {
    events.push(entry(
      appointment.createdAt,
      "appointment",
      `Appointment ${appointment.status.toLowerCase()}`,
      `${appointment.service}${appointment.symptoms.length ? ` · ${appointment.symptoms.join(", ")}` : ""}${appointment.priority ? ` · ${appointment.priority}` : ""}`
    ));
  }

  for (const visit of visits) {
    events.push(entry(
      visit.createdAt,
      "consult",
      `OPD visit · ${visit.status}`,
      `${visit.service} · Token ${visit.token}${visit.clinicalNote ? ` · ${visit.clinicalNote}` : ""}`
    ));
    if (visit.prescription) {
      events.push(entry(visit.createdAt, "consult", "Prescription issued", visit.prescription));
    }
    if (visit.billingStatus === "Paid") {
      events.push(entry(
        visit.paidAt || visit.createdAt,
        "billing",
        "OPD payment received",
        `${visit.service}${visit.estimatedAmount ? ` · ${visit.estimatedAmount}` : ""}${visit.paymentMethod ? ` · ${visit.paymentMethod}` : ""}`
      ));
    }
  }

  for (const admission of admissions) {
    events.push(entry(
      admission.createdAt,
      "admission",
      `Admitted · ${admission.ward}`,
      `Bed ${admission.bedLabel}${admission.diagnosis ? ` · ${admission.diagnosis}` : ""}`
    ));
    if (admission.dischargedAt) {
      events.push(entry(
        admission.dischargedAt,
        "discharge",
        "Discharged",
        admission.dischargeSummary || `From ${admission.ward}, bed ${admission.bedLabel}`
      ));
    }
    for (const reading of await listVitals(admission.id)) {
      const parts = [
        reading.bloodPressure ? `BP ${reading.bloodPressure}` : "",
        reading.heartRate ? `pulse ${reading.heartRate}` : "",
        reading.spo2 ? `SpO2 ${reading.spo2}%` : "",
        reading.temperature ? `temp ${reading.temperature}°` : ""
      ].filter(Boolean);
      events.push(entry(
        reading.recordedAt,
        "vitals",
        "Vitals recorded",
        `${parts.join(", ") || "Reading captured"} · by ${reading.recordedBy}`
      ));
    }
  }

  for (const order of labOrders) {
    if (normalizePhone(order.phone) !== key) continue;
    events.push(entry(
      order.createdAt,
      "lab",
      `Lab order · ${order.status}`,
      `${order.tests.join(", ") || order.service} · ${order.priority}${order.resultSummary ? ` · ${order.resultSummary}` : ""}`
    ));
  }

  for (const record of dispenses) {
    if (record.status === "Cancelled" || normalizePhone(record.phone) !== key) continue;
    events.push(entry(
      record.createdAt,
      "pharmacy",
      `Pharmacy · ${record.status.toLowerCase()}`,
      `${record.items.map((item) => item.name).join(", ") || record.service} · Rs ${record.total.toLocaleString("en-IN")}`
    ));
  }

  return events
    .sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime())
    .map(({ time, title, detail, type }) => ({ time, title, detail, type }));
}
