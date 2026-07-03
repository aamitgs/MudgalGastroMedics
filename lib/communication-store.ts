import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CommunicationChannel, CommunicationLog, CommunicationStatus, CommunicationTemplateKey } from "@/lib/communication-types";
import { communicationTemplates } from "@/lib/communication-types";
import { getPatientById, listPatients } from "@/lib/patient-store";

type CommunicationStore = {
  logs: CommunicationLog[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmCommunicationStore?: CommunicationStore;
};

const storeFile = join(process.cwd(), ".data", "communication.json");

function readStoreFromDisk(): CommunicationStore {
  try {
    if (!existsSync(storeFile)) return { logs: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<CommunicationStore>;
    return {
      logs: Array.isArray(parsed.logs) ? parsed.logs : []
    };
  } catch {
    return { logs: [] };
  }
}

function writeStoreToDisk(store: CommunicationStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmCommunicationStore ??= readStoreFromDisk();
  return globalStore.__mgmCommunicationStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makeId() {
  return `COM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function findTemplate(key: string) {
  return communicationTemplates.find((template) => template.key === key) ?? communicationTemplates[0];
}

export function listCommunicationLogs() {
  return getStore().logs;
}

export function createCommunicationLog(input: Record<string, unknown>) {
  const patientId = normalizeText(input.patientId);
  const patient = patientId ? getPatientById(patientId) : null;
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

  getStore().logs.unshift(log);
  writeStoreToDisk(getStore());
  return { log };
}

export function updateCommunicationLog(input: {
  id: string;
  status?: CommunicationStatus;
  channel?: CommunicationChannel;
  subject?: string;
  message?: string;
  scheduledFor?: string;
  owner?: string;
  notes?: string;
}) {
  const log = getStore().logs.find((item) => item.id === input.id);
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
  writeStoreToDisk(getStore());
  return log;
}

export function getCommunicationRecipients() {
  return listPatients().map((patient) => ({
    id: patient.id,
    uhid: patient.uhid,
    name: patient.name,
    phone: patient.phone
  }));
}
