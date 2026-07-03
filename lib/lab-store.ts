import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getOpdVisitById } from "@/lib/opd-store";
import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";

type LabStore = {
  orders: LabOrder[];
};

const globalStore = globalThis as typeof globalThis & {
  __mgmLabStore?: LabStore;
};

const storeFile = join(process.cwd(), ".data", "lab-orders.json");

function readStoreFromDisk(): LabStore {
  try {
    if (!existsSync(storeFile)) return { orders: [] };
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<LabStore>;
    return { orders: Array.isArray(parsed.orders) ? parsed.orders : [] };
  } catch {
    return { orders: [] };
  }
}

function writeStoreToDisk(store: LabStore) {
  mkdirSync(dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

function getStore() {
  globalStore.__mgmLabStore ??= readStoreFromDisk();
  return globalStore.__mgmLabStore;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function listLabOrders() {
  return getStore().orders;
}

export function createLabOrder(input: Record<string, unknown>) {
  const visitId = normalizeText(input.visitId);
  const visit = getOpdVisitById(visitId);
  if (!visit) return { error: "OPD visit not found." };

  const testsInput = input.tests;
  const tests = Array.isArray(testsInput)
    ? testsInput.map(String).map((test) => test.trim()).filter(Boolean)
    : normalizeText(testsInput).split(",").map((test) => test.trim()).filter(Boolean);

  if (!tests.length) return { error: "Add at least one lab test." };

  const now = new Date().toISOString();
  const order: LabOrder = {
    id: `LAB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    visitId: visit.id,
    token: visit.token,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    service: visit.service,
    tests,
    priority: normalizeText(input.priority) === "Urgent" ? "Urgent" : "Routine",
    status: "Ordered",
    sampleType: normalizeText(input.sampleType),
    resultSummary: "",
    reportReference: "",
    amount: normalizeNumber(input.amount),
    paymentStatus: normalizeText(input.paymentStatus) === "Paid" ? "Paid" : "Unpaid",
    notes: normalizeText(input.notes)
  };

  getStore().orders.unshift(order);
  writeStoreToDisk(getStore());
  return { order };
}

export function updateLabOrder(input: {
  id: string;
  status?: LabOrderStatus;
  resultSummary?: string;
  reportReference?: string;
  paymentStatus?: LabOrder["paymentStatus"];
  amount?: number;
  notes?: string;
}) {
  const order = getStore().orders.find((item) => item.id === input.id);
  if (!order) return null;

  if (input.status) order.status = input.status;
  if (typeof input.resultSummary === "string") order.resultSummary = input.resultSummary.trim();
  if (typeof input.reportReference === "string") order.reportReference = input.reportReference.trim();
  if (input.paymentStatus) order.paymentStatus = input.paymentStatus;
  if (typeof input.amount === "number" && Number.isFinite(input.amount)) order.amount = input.amount;
  if (typeof input.notes === "string") order.notes = input.notes.trim();
  order.updatedAt = new Date().toISOString();

  writeStoreToDisk(getStore());
  return order;
}
