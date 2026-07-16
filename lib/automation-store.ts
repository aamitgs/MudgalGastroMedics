import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { generateId } from "@/lib/id";
import { listAppointments } from "@/lib/appointment-store";
import { listAiReviews } from "@/lib/ai-review-store";
import { listCommunicationLogs } from "@/lib/communication-store";
import { listInventoryItems } from "@/lib/inventory-store";
import { listIpdAdmissions } from "@/lib/ipd-store";
import { listLabOrders } from "@/lib/lab-store";
import { listOpdVisits } from "@/lib/opd-store";
import { listPharmacyDispenses } from "@/lib/pharmacy-store";
import { listProcedureSchedules, procedureChecklistProgress } from "@/lib/procedure-store";
import { getStaffById } from "@/lib/hr-store";
import type { AutomationTask, AutomationTaskPriority, AutomationTaskStatus, AutomationTaskType } from "@/lib/automation-types";
import { evaluateRecalls, recallEscalationDays } from "@/lib/clinical/recall";
import type { OpdVisit } from "@/lib/opd-types";

type AutomationStore = {
  tasks: AutomationTask[];
};

const docStore = createDocumentStore<AutomationStore>("automation", (parsed) => {
  const doc = parsed as Partial<AutomationStore> | undefined;
  return { tasks: Array.isArray(doc?.tasks) ? (doc.tasks as AutomationStore["tasks"]) : [] };
});







function makeId() {
  return generateId("AUT");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function upsertGeneratedTask(doc: AutomationStore, input: Omit<AutomationTask, "id" | "createdAt" | "updatedAt" | "status"> & { status?: AutomationTaskStatus }) {
  const existing = doc.tasks.find((task) => task.key === input.key);
  const now = new Date().toISOString();
  if (existing) {
    if (["Done", "Skipped"].includes(existing.status)) return existing;
    existing.updatedAt = now;
    existing.dueAt = input.dueAt;
    existing.type = input.type;
    existing.priority = input.priority;
    existing.title = input.title;
    existing.description = input.description;
    existing.sourceId = input.sourceId;
    existing.patientId = input.patientId;
    existing.uhid = input.uhid;
    existing.patientName = input.patientName;
    existing.phone = input.phone;
    existing.owner = input.owner || existing.owner;
    existing.actionUrl = input.actionUrl;
    return existing;
  }

  const task: AutomationTask = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    status: input.status || "Open",
    ...input
  };
  doc.tasks.unshift(task);
  return task;
}

/** Auto-closes an open OPD-follow-up task once the patient has actually come back — the reminder did its job even if staff never manually clicked Done. */
function resolveFulfilledRecallTask(doc: AutomationStore, key: string, visit: OpdVisit) {
  const existing = doc.tasks.find((task) => task.key === key);
  if (!existing || ["Done", "Skipped"].includes(existing.status)) return;
  existing.status = "Done";
  existing.updatedAt = new Date().toISOString();
  existing.notes = [existing.notes, `Auto-resolved — ${visit.patientName} was seen again on or after the follow-up date.`].filter(Boolean).join(" ");
}

/** A follow-up overdue past the escalation window is a real chronic-care safety gap, not a routine reminder — surface it accordingly in the task queue. */
function recallPriority(daysOverdue: number | undefined): AutomationTaskPriority {
  if (daysOverdue === undefined || daysOverdue <= 0) return "Normal";
  return daysOverdue > recallEscalationDays ? "Urgent" : "High";
}

export async function listAutomationTasks() {
  return (await docStore.load()).tasks;
}

export async function createAutomationTask(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const title = normalizeText(input.title);
  if (!title) return { error: "Task title is required." };

  const ownerStaffId = normalizeText(input.ownerStaffId);
  let owner = normalizeText(input.owner);
  if (ownerStaffId) {
    const staff = await getStaffById(ownerStaffId);
    if (!staff) return { error: "Staff member not found." };
    owner = staff.name;
  }

  const now = new Date().toISOString();
  const task: AutomationTask = {
    id: makeId(),
    key: `manual:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
    dueAt: normalizeText(input.dueAt) || today(),
    type: (normalizeText(input.type) as AutomationTaskType) || "Appointment Follow-up",
    status: "Open",
    priority: (normalizeText(input.priority) as AutomationTaskPriority) || "Normal",
    title,
    description: normalizeText(input.description),
    patientName: normalizeText(input.patientName),
    phone: normalizeText(input.phone),
    owner,
    ownerStaffId: ownerStaffId || undefined,
    notes: normalizeText(input.notes)
  };
  doc.tasks.unshift(task);
  await docStore.save(doc);
  return { task };
}

export async function updateAutomationTask(input: {
  id: string;
  status?: AutomationTaskStatus;
  priority?: AutomationTaskPriority;
  dueAt?: string;
  owner?: string;
  /** Assigning a real staff member (Track 4.7) also refreshes the display-name `owner` string, so existing UI/CSV export keep working unchanged. Pass "" to unassign. */
  ownerStaffId?: string;
  notes?: string;
}) {
  const doc = await docStore.load();
  const task = doc.tasks.find((item) => item.id === input.id);
  if (!task) return null;
  if (input.status) task.status = input.status;
  if (input.priority) task.priority = input.priority;
  if (typeof input.dueAt === "string") task.dueAt = input.dueAt.trim();
  if (typeof input.owner === "string") task.owner = input.owner.trim();
  if (typeof input.ownerStaffId === "string") {
    if (input.ownerStaffId) {
      const staff = await getStaffById(input.ownerStaffId);
      if (!staff) return { error: "Staff member not found." };
      task.ownerStaffId = staff.id;
      task.owner = staff.name;
    } else {
      task.ownerStaffId = undefined;
    }
  }
  if (typeof input.notes === "string") task.notes = input.notes.trim();
  task.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return task;
}

export async function generateAutomationTasks() {
  const doc = await docStore.load();
  const generated: AutomationTask[] = [];
  const todayKey = today();

  for (const appointment of await listAppointments()) {
    if (["New", "Contacted"].includes(appointment.status)) {
      generated.push(upsertGeneratedTask(doc, {
        key: `appointment-follow:${appointment.id}`,
        dueAt: todayKey,
        type: "Appointment Follow-up",
        priority: appointment.priority === "Urgent symptoms" ? "Urgent" : "Normal",
        title: `Follow up appointment request: ${appointment.name}`,
        description: `Call/WhatsApp patient for ${appointment.service}, confirm timing and reports.`,
        sourceId: appointment.id,
        patientId: appointment.patientId,
        uhid: appointment.uhid,
        patientName: appointment.name,
        phone: appointment.phone,
        owner: "Reception",
        actionUrl: "/admin"
      }));
    }
  }

  const opdVisits = await listOpdVisits();
  const recalls = evaluateRecalls(opdVisits);
  for (const visit of opdVisits) {
    if (visit.followUpDate) {
      const key = `opd-follow:${visit.id}:${visit.followUpDate}`;
      const recall = recalls.get(visit.id);
      if (recall?.status === "fulfilled") {
        resolveFulfilledRecallTask(doc, key, visit);
      } else {
        generated.push(upsertGeneratedTask(doc, {
          key,
          dueAt: visit.followUpDate,
          type: "OPD Follow-up",
          priority: recallPriority(recall?.daysOverdue),
          title: `OPD follow-up due: ${visit.patientName}`,
          description:
            recall?.status === "overdue"
              ? `Overdue by ${recall.daysOverdue} day(s) — remind patient about follow-up for ${visit.service}.`
              : `Remind patient about follow-up for ${visit.service}.`,
          sourceId: visit.id,
          patientId: visit.patientId,
          uhid: visit.uhid,
          patientName: visit.patientName,
          phone: visit.phone,
          owner: "Reception",
          actionUrl: "/mudgalgastromedics-os/doctor-portal"
        }));
      }
    }
    if (visit.billingStatus !== "Paid" && Number(String(visit.estimatedAmount || "").replace(/[^\d.]/g, "")) > 0) {
      generated.push(upsertGeneratedTask(doc, {
        key: `opd-payment:${visit.id}`,
        dueAt: todayKey,
        type: "Payment Reminder",
        priority: "Normal",
        title: `OPD payment pending: ${visit.patientName}`,
        description: `Pending estimate ${visit.estimatedAmount} for ${visit.service}.`,
        sourceId: visit.id,
        patientId: visit.patientId,
        uhid: visit.uhid,
        patientName: visit.patientName,
        phone: visit.phone,
        owner: "Billing",
        actionUrl: "/admin"
      }));
    }
  }

  for (const procedure of await listProcedureSchedules()) {
    const progress = procedureChecklistProgress(procedure);
    if (!["Completed", "Cancelled"].includes(procedure.status) && progress < 100) {
      generated.push(upsertGeneratedTask(doc, {
        key: `procedure-prep:${procedure.id}`,
        dueAt: procedure.scheduledDate || todayKey,
        type: "Procedure Prep",
        priority: procedure.priority === "Urgent" ? "Urgent" : "High",
        title: `Procedure checklist pending: ${procedure.patientName}`,
        description: `${procedure.procedureTitle} checklist is ${progress}% complete.`,
        sourceId: procedure.id,
        patientId: procedure.patientId,
        uhid: procedure.uhid,
        patientName: procedure.patientName,
        phone: procedure.phone,
        owner: "Procedure Team",
        actionUrl: "/admin"
      }));
    }
  }

  for (const order of await listLabOrders()) {
    if (order.status === "Result Ready") {
      generated.push(upsertGeneratedTask(doc, {
        key: `lab-delivery:${order.id}`,
        dueAt: todayKey,
        type: "Lab Delivery",
        priority: order.priority === "Urgent" ? "High" : "Normal",
        title: `Deliver lab report: ${order.patientName}`,
        description: `${order.tests.join(", ")} result is ready for patient follow-up.`,
        sourceId: order.id,
        patientId: order.patientId,
        uhid: order.uhid,
        patientName: order.patientName,
        phone: order.phone,
        owner: "Lab",
        actionUrl: "/admin"
      }));
    }
    if (order.paymentStatus === "Unpaid" && Number(order.amount || 0) > 0) {
      generated.push(upsertGeneratedTask(doc, {
        key: `lab-payment:${order.id}`,
        dueAt: todayKey,
        type: "Payment Reminder",
        priority: "Normal",
        title: `Lab payment pending: ${order.patientName}`,
        description: `Pending lab amount Rs. ${order.amount} for ${order.tests.join(", ")}.`,
        sourceId: order.id,
        patientId: order.patientId,
        uhid: order.uhid,
        patientName: order.patientName,
        phone: order.phone,
        owner: "Billing",
        actionUrl: "/admin"
      }));
    }
  }

  for (const dispense of await listPharmacyDispenses()) {
    if (dispense.paymentStatus === "Unpaid" && dispense.total > 0) {
      generated.push(upsertGeneratedTask(doc, {
        key: `pharmacy-payment:${dispense.id}`,
        dueAt: todayKey,
        type: "Payment Reminder",
        priority: "Normal",
        title: `Pharmacy payment pending: ${dispense.patientName}`,
        description: `Pending pharmacy amount Rs. ${dispense.total}.`,
        sourceId: dispense.id,
        patientId: dispense.patientId,
        uhid: dispense.uhid,
        patientName: dispense.patientName,
        phone: dispense.phone,
        owner: "Pharmacy",
        actionUrl: "/admin"
      }));
    }
  }

  for (const item of await listInventoryItems()) {
    if (item.quantity <= item.reorderLevel) {
      generated.push(upsertGeneratedTask(doc, {
        key: `low-stock:${item.id}`,
        dueAt: todayKey,
        type: "Low Stock",
        priority: item.quantity <= 0 ? "Urgent" : "High",
        title: `Low stock: ${item.name}`,
        description: `${item.quantity} ${item.unit} left. Reorder level is ${item.reorderLevel}.`,
        sourceId: item.id,
        owner: "Inventory",
        actionUrl: "/admin"
      }));
    }
  }

  for (const review of await listAiReviews()) {
    if (["Needs Review", "Escalated"].includes(review.status)) {
      generated.push(upsertGeneratedTask(doc, {
        key: `ai-review:${review.id}`,
        dueAt: todayKey,
        type: "AI Review",
        priority: review.status === "Escalated" || review.urgency === "Urgent Reception Call" ? "Urgent" : "Normal",
        title: `AI review pending: ${review.patientName}`,
        description: `${review.route} note needs human review.`,
        sourceId: review.id,
        patientId: review.patientId,
        uhid: review.uhid,
        patientName: review.patientName,
        phone: review.phone,
        owner: "Doctor/Reception",
        actionUrl: "/admin"
      }));
    }
  }

  for (const log of await listCommunicationLogs()) {
    if (["Queued", "Follow-up Needed", "Failed"].includes(log.status)) {
      generated.push(upsertGeneratedTask(doc, {
        key: `communication:${log.id}`,
        dueAt: log.scheduledFor?.slice(0, 10) || todayKey,
        type: "Communication Follow-up",
        priority: log.status === "Failed" ? "High" : "Normal",
        title: `Communication follow-up: ${log.patientName}`,
        description: `${log.channel} ${log.template} is ${log.status}.`,
        sourceId: log.id,
        patientId: log.patientId,
        uhid: log.uhid,
        patientName: log.patientName,
        phone: log.phone,
        owner: "Reception",
        actionUrl: "/admin"
      }));
    }
  }

  for (const admission of await listIpdAdmissions()) {
    if (admission.status === "Admitted") {
      generated.push(upsertGeneratedTask(doc, {
        key: `ipd-review:${admission.id}:${todayKey}`,
        dueAt: addDays(1),
        type: "IPD Review",
        priority: admission.admissionType === "Emergency" ? "High" : "Normal",
        title: `IPD daily review: ${admission.patientName}`,
        description: `${admission.ward} ${admission.bedLabel} care plan and nursing notes review.`,
        sourceId: admission.id,
        patientId: admission.patientId,
        uhid: admission.uhid,
        patientName: admission.patientName,
        phone: admission.phone,
        owner: "IPD Team",
        actionUrl: "/admin"
      }));
    }
  }

  await docStore.save(doc);
  return generated;
}
