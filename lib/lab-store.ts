import "server-only";
import { evaluateLabCritical } from "@/lib/clinical/lab-critical";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { getOpdVisitById } from "@/lib/opd-store";
import type { LabOrder, LabOrderStatus } from "@/lib/lab-types";

type LabStore = {
  orders: LabOrder[];
};

const docStore = createDocumentStore<LabStore>("lab-orders", (parsed) => {
  const doc = parsed as Partial<LabStore> | undefined;
  return { orders: Array.isArray(doc?.orders) ? (doc.orders as LabStore["orders"]) : [] };
});






function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function listLabOrders() {
  const doc = await docStore.load();
  return doc.orders;
}

export async function createLabOrder(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const visitId = normalizeText(input.visitId);
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { error: "OPD visit not found." };

  const testsInput = input.tests;
  const tests = Array.isArray(testsInput)
    ? testsInput.map(String).map((test) => test.trim()).filter(Boolean)
    : normalizeText(testsInput).split(",").map((test) => test.trim()).filter(Boolean);

  if (!tests.length) return { error: "Add at least one lab test." };

  const now = new Date().toISOString();
  const order: LabOrder = {
    id: generateId("LAB"),
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

  doc.orders.unshift(order);
  await docStore.save(doc);
  return { order };
}

export async function updateLabOrder(input: {
  id: string;
  status?: LabOrderStatus;
  resultSummary?: string;
  reportReference?: string;
  paymentStatus?: LabOrder["paymentStatus"];
  amount?: number;
  notes?: string;
  /** Laboratory judgment: force-mark (or unmark) the result as critical. */
  criticalManual?: boolean;
  /** Doctor sign-off on a critical result; recorded, and clears the active alert. */
  acknowledgeCriticalBy?: string;
}) {
  const doc = await docStore.load();
  const order = doc.orders.find((item) => item.id === input.id);
  if (!order) return null;

  if (input.status) order.status = input.status;
  if (typeof input.reportReference === "string") order.reportReference = input.reportReference.trim();
  if (input.paymentStatus) order.paymentStatus = input.paymentStatus;
  if (typeof input.amount === "number" && Number.isFinite(input.amount)) order.amount = input.amount;
  if (typeof input.notes === "string") order.notes = input.notes.trim();

  if (typeof input.resultSummary === "string") {
    order.resultSummary = input.resultSummary.trim();
    // Threshold pass runs on every result edit, but never overrides a manual flag.
    if (order.criticalSource !== "manual") {
      const evaluation = evaluateLabCritical(order.resultSummary);
      order.criticalFlag = evaluation.critical || undefined;
      order.criticalReasons = evaluation.critical ? evaluation.reasons : undefined;
      order.criticalSource = evaluation.critical ? "threshold" : undefined;
      if (!evaluation.critical) {
        order.criticalAcknowledgedBy = undefined;
        order.criticalAcknowledgedAt = undefined;
      }
    }
  }

  if (typeof input.criticalManual === "boolean") {
    if (input.criticalManual) {
      order.criticalFlag = true;
      order.criticalSource = "manual";
      order.criticalReasons = ["Marked critical by laboratory staff."];
    } else {
      // Unmarking re-runs the threshold pass so a genuine panic value cannot be cleared by hand.
      const evaluation = evaluateLabCritical(order.resultSummary ?? "");
      order.criticalFlag = evaluation.critical || undefined;
      order.criticalReasons = evaluation.critical ? evaluation.reasons : undefined;
      order.criticalSource = evaluation.critical ? "threshold" : undefined;
      order.criticalAcknowledgedBy = undefined;
      order.criticalAcknowledgedAt = undefined;
    }
  }

  if (input.acknowledgeCriticalBy && order.criticalFlag) {
    order.criticalAcknowledgedBy = input.acknowledgeCriticalBy;
    order.criticalAcknowledgedAt = new Date().toISOString();
  }

  order.updatedAt = new Date().toISOString();

  await docStore.save(doc);
  return order;
}
