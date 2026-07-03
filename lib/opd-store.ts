import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";

type OpdStore = {
  visits: OpdVisit[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmOpdStore?: OpdStore;
};

const storeFile = join(process.cwd(), ".data", "opd-queue.json");

function readVisitsFromDisk(): OpdVisit[] {
  try {
    if (!existsSync(storeFile)) return [];
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<OpdStore>;
    return Array.isArray(parsed.visits) ? parsed.visits : [];
  } catch {
    return [];
  }
}

function writeVisitsToDisk(visits: OpdVisit[]) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify({ visits }, null, 2));
}

function getStore() {
  globalStore.__mgmOpdStore ??= { visits: readVisitsFromDisk() };
  return globalStore.__mgmOpdStore;
}

function todaysVisitCount() {
  const today = new Date().toISOString().slice(0, 10);
  return getStore().visits.filter((visit) => visit.createdAt.slice(0, 10) === today).length;
}

export function listOpdVisits() {
  return getStore().visits;
}

export function getOpdVisitById(id: string) {
  return getStore().visits.find((visit) => visit.id === id) ?? null;
}

export function listPatientOpdVisits(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return getStore().visits.filter((visit) => {
    const visitPhone = visit.phone.replace(/\D/g, "");
    return visitPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(visitPhone);
  });
}

export function createOpdVisit(appointment: AppointmentRecord) {
  const existing = getStore().visits.find((visit) => visit.appointmentId === appointment.id && visit.status !== "Cancelled");
  if (existing) return existing;

  const sequence = todaysVisitCount() + 1;
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

  getStore().visits.unshift(visit);
  writeVisitsToDisk(getStore().visits);
  return visit;
}

function createReceiptId() {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const paidCount = getStore().visits.filter((visit) => visit.paidAt?.slice(0, 10) === date.toISOString().slice(0, 10)).length + 1;
  return `MGM-R-${day}-${String(paidCount).padStart(3, "0")}`;
}

export function updateOpdVisit(input: {
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
  const visit = getStore().visits.find((item) => item.id === input.id);
  if (!visit) return null;

  if (input.status) visit.status = input.status;
  if (input.billingStatus) {
    visit.billingStatus = input.billingStatus;
    if (input.billingStatus === "Paid") {
      visit.paidAt ||= new Date().toISOString();
      visit.receiptId ||= createReceiptId();
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

  writeVisitsToDisk(getStore().visits);
  return visit;
}
