import "server-only";
import { createDocumentStore } from "@/lib/document-store";
import { getAppointmentById, listAppointments } from "@/lib/appointment-store";
import { createAppointmentPlanningNote } from "@/lib/ai-planning";
import { generateId } from "@/lib/id";
import type { AiCaseReview, AiCaseSource, AiReviewStatus } from "@/lib/ai-types";
import { getOpdVisitById, listOpdVisits } from "@/lib/opd-store";

type AiReviewStore = {
  reviews: AiCaseReview[];
};

const docStore = createDocumentStore<AiReviewStore>("ai-reviews", (parsed) => {
  const doc = parsed as Partial<AiReviewStore> | undefined;
  return { reviews: Array.isArray(doc?.reviews) ? (doc.reviews as AiReviewStore["reviews"]) : [] };
});






function makeId() {
  return generateId("AIR");
}

export async function listAiReviews() {
  const doc = await docStore.load();
  return doc.reviews;
}

export async function generateAiReview(source: AiCaseSource, sourceId: string) {
  const doc = await docStore.load();
  const now = new Date().toISOString();
  const existing = doc.reviews.find((review) => review.source === source && review.sourceId === sourceId);

  if (source === "Appointment") {
    const appointment = (await getAppointmentById(sourceId));
    if (!appointment) return { error: "Appointment not found." };
    const note = createAppointmentPlanningNote(appointment);
    const review: AiCaseReview = {
      id: existing?.id || makeId(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      source,
      sourceId,
      patientId: appointment.patientId,
      uhid: appointment.uhid,
      patientName: appointment.name,
      phone: appointment.phone,
      service: appointment.service,
      urgency: note.urgency,
      route: note.route,
      summary: note.summary,
      flags: note.flags,
      preparation: note.preparation,
      receptionScript: note.receptionScript,
      safetyNote: note.safetyNote,
      doctorReviewNote: existing?.doctorReviewNote,
      reviewedBy: existing?.reviewedBy,
      reviewedAt: existing?.reviewedAt,
      status: existing?.status && existing.status !== "Draft" ? existing.status : "Needs Review"
    };
    await upsertReview(review);
    return { review };
  }

  const visit = (await getOpdVisitById(sourceId));
  if (!visit) return { error: "OPD visit not found." };
  const urgency: AiCaseReview["urgency"] = visit.priority === "Urgent symptoms" || visit.symptoms.some((symptom) => /blood|black stool|jaundice|vomit|weight loss|pain/i.test(symptom))
    ? "Urgent Reception Call"
    : visit.priority === "Soon"
      ? "Priority Review"
      : "Routine";
  const review: AiCaseReview = {
    id: existing?.id || makeId(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    source,
    sourceId,
    patientId: visit.patientId,
    uhid: visit.uhid,
    patientName: visit.patientName,
    phone: visit.phone,
    service: visit.service,
    urgency,
    route: routeForVisit(visit.service, visit.symptoms),
    summary: `${visit.patientName} is in ${visit.status} for ${visit.service}. Symptoms noted: ${visit.symptoms.length ? visit.symptoms.join(", ") : "not specified"}.`,
    flags: [
      urgency === "Urgent Reception Call" ? "Priority symptom review required" : "",
      visit.clinicalNote ? "Clinical note available for doctor review" : "Clinical note pending",
      visit.prescription ? "Prescription note available" : "Prescription not recorded",
      visit.followUpDate ? "Follow-up date recorded" : "Follow-up date pending"
    ].filter(Boolean),
    preparation: [
      "Review OPD symptoms, history and any uploaded reports before final advice.",
      "Confirm medicine allergies and current medicines before prescription finalization.",
      visit.followUpDate ? "Share follow-up date with patient and reception." : "Set follow-up date if clinically needed.",
      urgency === "Urgent Reception Call" ? "Escalate promptly to doctor/reception for clinical review." : "Keep in routine clinical workflow unless symptoms change."
    ],
    receptionScript: `Hello ${visit.patientName}, this is Mudgal Gastromedics Hospital reception. Your OPD visit for ${visit.service} is being reviewed. Please contact us if symptoms worsen or if you need help with reports/follow-up.`,
    safetyNote: "AI planning support is for reception and doctor review only. It does not diagnose, prescribe or replace clinical judgment.",
    doctorReviewNote: existing?.doctorReviewNote,
    reviewedBy: existing?.reviewedBy,
    reviewedAt: existing?.reviewedAt,
    status: existing?.status && existing.status !== "Draft" ? existing.status : "Needs Review"
  };
  await upsertReview(review);
  return { review };
}

function routeForVisit(service: string, symptoms: string[]) {
  const haystack = `${service} ${symptoms.join(" ")}`.toLowerCase();
  if (haystack.includes("ercp") || haystack.includes("jaundice") || haystack.includes("cbd")) return "Pancreato-biliary / ERCP review";
  if (haystack.includes("colonoscopy") || haystack.includes("blood") || haystack.includes("constipation")) return "Colonoscopy / lower GI review";
  if (haystack.includes("fibroscan") || haystack.includes("liver") || haystack.includes("fatty")) return "Liver clinic review";
  if (haystack.includes("endoscopy") || haystack.includes("procedure")) return "Procedure coordination";
  return "Gastroenterology consultation";
}

async function upsertReview(review: AiCaseReview) {
  const doc = await docStore.load();
  const index = doc.reviews.findIndex((item) => item.id === review.id);
  if (index >= 0) {
    doc.reviews[index] = review;
  } else {
    doc.reviews.unshift(review);
  }
  await docStore.save(doc);
}

export async function updateAiReview(input: {
  id: string;
  status?: AiReviewStatus;
  doctorReviewNote?: string;
  reviewedBy?: string;
}) {
  const doc = await docStore.load();
  const review = doc.reviews.find((item) => item.id === input.id);
  if (!review) return null;
  if (input.status) {
    review.status = input.status;
    if (input.status === "Reviewed" || input.status === "Escalated") {
      review.reviewedAt = new Date().toISOString();
    }
  }
  if (typeof input.doctorReviewNote === "string") review.doctorReviewNote = input.doctorReviewNote.trim();
  if (typeof input.reviewedBy === "string") review.reviewedBy = input.reviewedBy.trim();
  review.updatedAt = new Date().toISOString();
  await docStore.save(doc);
  return review;
}

export async function getAiSources() {
  return {
    appointments: (await listAppointments()).map((appointment) => ({
      id: appointment.id,
      patientName: appointment.name,
      uhid: appointment.uhid,
      service: appointment.service,
      status: appointment.status,
      createdAt: appointment.createdAt
    })),
    visits: (await listOpdVisits()).map((visit) => ({
      id: visit.id,
      token: visit.token,
      patientName: visit.patientName,
      uhid: visit.uhid,
      service: visit.service,
      status: visit.status,
      createdAt: visit.createdAt
    }))
  };
}

export async function seedMissingAiReviews() {
  const doc = await docStore.load();
  const created: AiCaseReview[] = [];
  for (const appointment of (await listAppointments()).slice(0, 10)) {
    if (!doc.reviews.some((review) => review.source === "Appointment" && review.sourceId === appointment.id)) {
      const result = (await generateAiReview("Appointment", appointment.id));
      if ("review" in result && result.review) created.push(result.review);
    }
  }
  return created;
}
