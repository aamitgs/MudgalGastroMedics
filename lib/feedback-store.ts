import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { getOpdVisitById } from "@/lib/opd-store";
import type { PatientFeedbackRecord } from "@/lib/feedback-types";

type FeedbackStore = {
  entries: PatientFeedbackRecord[];
};

const store = createDocumentStore<FeedbackStore>("patient-feedback", (parsed) => {
  const doc = parsed as Partial<FeedbackStore> | undefined;
  return { entries: Array.isArray(doc?.entries) ? (doc.entries as PatientFeedbackRecord[]) : [] };
});

export async function listFeedback() {
  return (await store.load()).entries;
}

export async function createFeedback(input: { visitId: string; phone: string; rating: number; comment?: string }) {
  const doc = await store.load();
  if (doc.entries.some((entry) => entry.visitId === input.visitId)) {
    return { error: "Feedback for this visit has already been submitted." };
  }

  const visit = await getOpdVisitById(input.visitId);
  if (!visit) return { error: "Visit not found." };
  // Scoped to the verified session's own phone — a patient can only rate their own visit.
  if (visit.phone.replace(/\D/g, "") !== input.phone.replace(/\D/g, "")) {
    return { error: "This visit does not belong to your account." };
  }
  if (visit.status !== "Completed") {
    return { error: "Feedback can only be submitted after a completed visit." };
  }

  const entry: PatientFeedbackRecord = {
    id: `FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    visitId: visit.id,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    service: visit.service,
    rating: input.rating,
    comment: input.comment?.trim() || undefined
  };

  doc.entries.unshift(entry);
  await store.save(doc);
  return { entry };
}
