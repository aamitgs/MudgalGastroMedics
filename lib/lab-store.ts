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

export async function listPatientLabOrders(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 6) return [];

  return (await docStore.load()).orders.filter((order) => {
    const orderPhone = order.phone.replace(/\D/g, "");
    return orderPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(orderPhone);
  });
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

/**
 * Hard delete — only a Cancelled order with no result, no payment and no
 * critical flag ever recorded. resultSummary/reportReference are real
 * diagnostic documentation independent of status; paymentStatus "Paid" is
 * real financial movement; a critical flag (even a since-unmarked one still
 * has criticalAcknowledgedAt/By set, which this checks too) is a recorded
 * panic value a doctor may have signed off on — none of those are safe to
 * erase regardless of the order's current status.
 */
export async function deleteLabOrder(id: string) {
  const doc = await docStore.load();
  const order = doc.orders.find((item) => item.id === id);
  if (!order) return { error: "Lab order not found." };
  if (
    order.status !== "Cancelled" ||
    order.resultSummary ||
    order.reportReference ||
    order.paymentStatus === "Paid" ||
    order.criticalFlag ||
    order.criticalAcknowledgedAt
  ) {
    return { error: "Only a Cancelled order with no result, payment or critical-flag history can be deleted." };
  }

  doc.orders = doc.orders.filter((item) => item.id !== id);
  await docStore.save(doc);
  return { order };
}
