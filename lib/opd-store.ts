import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";

type OpdStore = {
  visits: OpdVisit[];
};

const store = createDocumentStore<OpdStore>("opd-queue", (parsed) => {
  const doc = parsed as Partial<OpdStore> | undefined;
  return { visits: Array.isArray(doc?.visits) ? (doc.visits as OpdVisit[]) : [] };
});

export async function listOpdVisits() {
  return (await store.load()).visits;
}

export async function getOpdVisitById(id: string) {
  return (await store.load()).visits.find((visit) => visit.id === id) ?? null;
}

export async function listPatientOpdVisits(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return (await store.load()).visits.filter((visit) => {
    const visitPhone = visit.phone.replace(/\D/g, "");
    return visitPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(visitPhone);
  });
}

export async function createOpdVisit(appointment: AppointmentRecord) {
  const doc = await store.load();
  const existing = doc.visits.find((visit) => visit.appointmentId === appointment.id && visit.status !== "Cancelled");
  if (existing) return existing;

  const today = new Date().toISOString().slice(0, 10);
  const sequence = doc.visits.filter((visit) => visit.createdAt.slice(0, 10) === today).length + 1;
  const visit: OpdVisit = {
    id: generateId("OPD"),
    token: `MGM-${String(sequence).padStart(3, "0")}`,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    uhid: appointment.uhid,
    createdAt: new Date().toISOString(),
    status: "Waiting",
    patientName: appointment.name,
    phone: appointment.phone,
    service: appointment.service,
    priority: appointment.priority,
    symptoms: appointment.symptoms,
    billingStatus: "Not Started",
    estimatedAmount: "",
    paymentMethod: "Cash",
    receiptId: "",
    paidAt: "",
    notes: appointment.message,
    clinicalNote: "",
    diagnosis: "",
    prescription: "",
    advice: "",
    followUpDate: ""
  };

  doc.visits.unshift(visit);
  await store.save(doc);
  return visit;
}

function createReceiptId(visits: OpdVisit[]) {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const paidCount = visits.filter((visit) => visit.paidAt?.slice(0, 10) === date.toISOString().slice(0, 10)).length + 1;
  return `MGM-R-${day}-${String(paidCount).padStart(3, "0")}`;
}

export async function updateOpdVisit(input: {
  id: string;
  status?: OpdVisitStatus;
  billingStatus?: OpdVisit["billingStatus"];
  estimatedAmount?: string;
  paymentMethod?: OpdVisit["paymentMethod"];
  notes?: string;
  clinicalNote?: string;
  diagnosis?: string;
  prescription?: string;
  prescriptionItems?: OpdVisit["prescriptionItems"];
  advice?: string;
  followUpDate?: string;
  referralTo?: string;
  referralLetter?: string;
  certificateNote?: string;
  /** Name of the authenticated doctor making this update, if it touches a clinical field. */
  actingDoctorName?: string;
  refundAction?: "request" | "complete";
  refundReason?: string;
  refundAmount?: string;
  /** Name of the authenticated staff member making a refund request/completion. */
  actingStaffName?: string;
}) {
  const doc = await store.load();
  const visit = doc.visits.find((item) => item.id === input.id);
  if (!visit) return null;

  if (input.status) {
    visit.status = input.status;
    if (input.status === "In Consultation") visit.consultationStartedAt ||= new Date().toISOString();
  }
  const touchesClinical = [input.clinicalNote, input.diagnosis, input.prescription, input.prescriptionItems, input.advice, input.followUpDate, input.referralTo, input.referralLetter, input.certificateNote].some((value) => value !== undefined);
  if (touchesClinical && input.actingDoctorName) visit.doctorName ||= input.actingDoctorName;
  if (input.billingStatus) {
    visit.billingStatus = input.billingStatus;
    if (input.billingStatus === "Paid") {
      visit.paidAt ||= new Date().toISOString();
      visit.receiptId ||= createReceiptId(doc.visits);
    }
    if (input.billingStatus !== "Paid") {
      visit.paidAt = "";
      visit.receiptId = "";
    }
  }
  if (typeof input.estimatedAmount === "string") visit.estimatedAmount = input.estimatedAmount.trim();
  if (input.paymentMethod) visit.paymentMethod = input.paymentMethod;
  if (typeof input.notes === "string") visit.notes = input.notes.trim();
  if (typeof input.clinicalNote === "string") visit.clinicalNote = input.clinicalNote.trim();
  if (typeof input.diagnosis === "string") visit.diagnosis = input.diagnosis.trim();
  if (typeof input.prescription === "string") visit.prescription = input.prescription.trim();
  if (input.prescriptionItems !== undefined) visit.prescriptionItems = input.prescriptionItems;
  if (typeof input.advice === "string") visit.advice = input.advice.trim();
  if (typeof input.followUpDate === "string") visit.followUpDate = input.followUpDate.trim();
  if (typeof input.referralTo === "string") visit.referralTo = input.referralTo.trim();
  if (typeof input.referralLetter === "string") visit.referralLetter = input.referralLetter.trim();
  if (typeof input.certificateNote === "string") visit.certificateNote = input.certificateNote.trim();

  if (input.refundAction === "request" && visit.billingStatus === "Paid" && !visit.refundStatus) {
    visit.refundStatus = "Requested";
    visit.refundReason = input.refundReason?.trim() || "";
    visit.refundAmount = input.refundAmount?.trim() || visit.estimatedAmount;
    visit.refundRequestedAt = new Date().toISOString();
    visit.refundRequestedBy = input.actingStaffName || "";
  }
  if (input.refundAction === "complete" && visit.refundStatus === "Requested") {
    visit.refundStatus = "Refunded";
    visit.refundedAt = new Date().toISOString();
    visit.refundedBy = input.actingStaffName || "";
  }

  await store.save(doc);
  return visit;
}

/**
 * Hard delete — only a Cancelled visit with zero billing/refund footprint.
 * A Completed visit is real clinical documentation and never qualifies, same
 * as deleteAppointment's Cancelled-only rule. Unlike patient/appointment
 * activity, everything needed to judge this lives on the visit record itself
 * (billingStatus, paidAt, receiptId, refundStatus), so this can self-guard
 * intra-store — no cross-store lookup, no circular-import concern.
 */
export async function deleteOpdVisit(id: string) {
  const doc = await store.load();
  const visit = doc.visits.find((item) => item.id === id);
  if (!visit) return { error: "Visit not found." };
  if (visit.status !== "Cancelled") return { error: "Cancel this visit before deleting it." };
  if (visit.billingStatus !== "Not Started" || visit.paidAt || visit.receiptId || visit.refundStatus) {
    return { error: "This visit has billing or refund history and can't be deleted." };
  }

  doc.visits = doc.visits.filter((item) => item.id !== id);
  await store.save(doc);
  return { visit };
}
