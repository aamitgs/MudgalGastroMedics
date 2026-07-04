import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { getPublicProcedures } from "@/lib/cms-public";
import { getOpdVisitById } from "@/lib/opd-store";
import { defaultProcedureChecklist, procedureScheduleStatuses } from "@/lib/procedure-types";
import type { ProcedureChecklist, ProcedureSchedule, ProcedureScheduleStatus } from "@/lib/procedure-types";

type ProcedureStore = {
  schedules: ProcedureSchedule[];
};

const docStore = createDocumentStore<ProcedureStore>("procedure-schedules", (parsed) => {
  const doc = parsed as Partial<ProcedureStore> | undefined;
  return { schedules: Array.isArray(doc?.schedules) ? (doc.schedules as ProcedureStore["schedules"]) : [] };
});






function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listProcedureSchedules() {
  const doc = await docStore.load();
  return doc.schedules;
}

export async function createProcedureSchedule(input: Record<string, unknown>) {
  const doc = await docStore.load();
  const visitId = normalizeText(input.visitId);
  const visit = (await getOpdVisitById(visitId));
  if (!visit) return { error: "OPD visit not found." };

  const procedureSlug = normalizeText(input.procedureSlug);
  const procedure = (await getPublicProcedures()).find((item) => item.slug === procedureSlug);
  if (!procedure) return { error: "Valid procedure is required." };

  const scheduledDate = normalizeText(input.scheduledDate);
  const scheduledTime = normalizeText(input.scheduledTime);
  if (!scheduledDate || !scheduledTime) return { error: "Scheduled date and time are required." };

  const now = new Date().toISOString();
  const schedule: ProcedureSchedule = {
    id: `PROC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    visitId: visit.id,
    token: visit.token,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    procedureSlug: procedure.slug,
    procedureTitle: procedure.title,
    scheduledDate,
    scheduledTime,
    room: normalizeText(input.room) || "Endoscopy Room",
    doctor: normalizeText(input.doctor) || "Dr. Deepak Kumar Sharma",
    anesthesiaPlan: normalizeText(input.anesthesiaPlan),
    priority: normalizeText(input.priority) === "Urgent" ? "Urgent" : "Routine",
    status: "Planned",
    checklist: { ...defaultProcedureChecklist },
    findings: "",
    complications: "",
    notes: normalizeText(input.notes)
  };

  doc.schedules.unshift(schedule);
  await docStore.save(doc);
  return { schedule };
}

export async function updateProcedureSchedule(input: {
  id: string;
  status?: ProcedureScheduleStatus;
  checklist?: Partial<ProcedureChecklist>;
  findings?: string;
  complications?: string;
  notes?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  room?: string;
  doctor?: string;
  anesthesiaPlan?: string;
}) {
  const doc = await docStore.load();
  const schedule = doc.schedules.find((item) => item.id === input.id);
  if (!schedule) return null;

  if (input.status && procedureScheduleStatuses.includes(input.status)) schedule.status = input.status;
  if (input.checklist) schedule.checklist = { ...schedule.checklist, ...input.checklist };
  if (typeof input.findings === "string") schedule.findings = input.findings.trim();
  if (typeof input.complications === "string") schedule.complications = input.complications.trim();
  if (typeof input.notes === "string") schedule.notes = input.notes.trim();
  if (typeof input.scheduledDate === "string") schedule.scheduledDate = input.scheduledDate.trim();
  if (typeof input.scheduledTime === "string") schedule.scheduledTime = input.scheduledTime.trim();
  if (typeof input.room === "string") schedule.room = input.room.trim();
  if (typeof input.doctor === "string") schedule.doctor = input.doctor.trim();
  if (typeof input.anesthesiaPlan === "string") schedule.anesthesiaPlan = input.anesthesiaPlan.trim();
  schedule.updatedAt = new Date().toISOString();

  await docStore.save(doc);
  return schedule;
}

export function procedureChecklistProgress(schedule: ProcedureSchedule) {
  const values = Object.values(schedule.checklist);
  if (!values.length) return 0;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}
