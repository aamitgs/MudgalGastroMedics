import "server-only";
import { createDocumentStore } from "@/lib/document-store";
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
    id: `OPD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
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
  prescription?: string;
  advice?: string;
  followUpDate?: string;
}) {
  const doc = await store.load();
  const visit = doc.visits.find((item) => item.id === input.id);
  if (!visit) return null;

  if (input.status) visit.status = input.status;
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
  if (typeof input.prescription === "string") visit.prescription = input.prescription.trim();
  if (typeof input.advice === "string") visit.advice = input.advice.trim();
  if (typeof input.followUpDate === "string") visit.followUpDate = input.followUpDate.trim();

  await store.save(doc);
  return visit;
}
