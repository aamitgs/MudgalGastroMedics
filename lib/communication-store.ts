import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import type { CommunicationChannel, CommunicationLog, CommunicationStatus } from "@/lib/communication-types";
import { communicationTemplates } from "@/lib/communication-types";
import { getPatientById, listPatients } from "@/lib/patient-store";

type CommunicationStore = {
  logs: CommunicationLog[];
};

const docStore = createDocumentStore<CommunicationStore>("communication", (parsed) => {
  const doc = parsed as Partial<CommunicationStore> | undefined;
  return { logs: Array.isArray(doc?.logs) ? (doc.logs as CommunicationStore["logs"]) : [] };
});






function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makeId() {
  return generateId("COM");
}

function findTemplate(key: string) {
  return communicationTemplates.find((template) => template.key === key) ?? communicationTemplates[0];
}

export async function listCommunicationLogs() {
  const doc = await docStore.load();
  return doc.logs;
}

export async function createCommunicationLog(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const patientId = normalizeText(input.patientId);
  const patient = patientId ? (await getPatientById(patientId)) : null;
  const patientName = normalizeText(input.patientName) || patient?.name || "";
  const phone = normalizeText(input.phone) || patient?.phone || "";
  if (!patientName || phone.replace(/\D/g, "").length < 6) return { error: "Patient name and valid phone are required." };

  const selectedTemplate = findTemplate(normalizeText(input.template));
  const customMessage = normalizeText(input.message);
  const now = new Date().toISOString();
  const log: CommunicationLog = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    patientId: patient?.id || patientId || undefined,
    uhid: patient?.uhid || normalizeText(input.uhid),
    patientName,
    phone,
    channel: (normalizeText(input.channel) as CommunicationChannel) || "WhatsApp",
    template: selectedTemplate.key,
    status: (normalizeText(input.status) as CommunicationStatus) || "Draft",
    subject: normalizeText(input.subject) || selectedTemplate.subject,
    message: customMessage || selectedTemplate.message,
    scheduledFor: normalizeText(input.scheduledFor),
    owner: normalizeText(input.owner),
    notes: normalizeText(input.notes)
  };

  doc.logs.unshift(log);
  await docStore.save(doc);
  return { log };
}

export async function updateCommunicationLog(input: {
  id: string;
  status?: CommunicationStatus;
  channel?: CommunicationChannel;
  subject?: string;
  message?: string;
  scheduledFor?: string;
  owner?: string;
  notes?: string;
}) {
  const doc = await docStore.load();
  const log = doc.logs.find((item) => item.id === input.id);
  if (!log) return null;
  if (input.status) {
    log.status = input.status;
    if (input.status === "Sent" && !log.sentAt) log.sentAt = new Date().toISOString();
  }
  if (input.channel) log.channel = input.channel;
  if (typeof input.subject === "string") log.subject = input.subject.trim();
  if (typeof input.message === "string") log.message = input.message.trim();
  if (typeof input.scheduledFor === "string") log.scheduledFor = input.scheduledFor.trim();
  if (typeof input.owner === "string") log.owner = input.owner.trim();
  if (typeof input.notes === "string") log.notes = input.notes.trim();
  log.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return log;
}

export async function getCommunicationRecipients() {
  return (await listPatients()).map((patient) => ({
    id: patient.id,
    uhid: patient.uhid,
    name: patient.name,
    phone: patient.phone
  }));
}
