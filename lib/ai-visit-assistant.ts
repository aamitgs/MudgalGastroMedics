import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getOpdVisitById } from "@/lib/opd-store";
import { findPatientByPhone, getPatientById } from "@/lib/patient-store";

export const aiVisitAssistantSafetyNote =
  "Answers are grounded only in this visit's own record — not a diagnosis or treatment recommendation. Verify anything important before acting on it.";

export type VisitAssistantTurn = { role: "user" | "assistant"; content: string };

export type VisitAssistantResult =
  | { ok: true; answer: string; safetyNote: string }
  | { ok: false; error: string };

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

async function findPatientForVisit(patientId: string | undefined, phone: string) {
  if (patientId) {
    const byId = await getPatientById(patientId);
    if (byId) return byId;
  }
  return (await findPatientByPhone(phone)) ?? undefined;
}

/**
 * Screen-context-only Q&A about one OPD visit (Track 4.3) — deliberately NOT
 * an agentic assistant: it never queries the database on its own or answers
 * about any other patient. Every answer is grounded in exactly the fields
 * already visible to the doctor on this visit's consultation card, re-fetched
 * fresh on every question so answers reflect the latest edits. This is the
 * same safety boundary already established for discharge summary/referral
 * letter/certificate drafting, just applied to open-ended questions instead
 * of one fixed document.
 */
export async function answerVisitQuestion(visitId: string, question: string, history: VisitAssistantTurn[] = []): Promise<VisitAssistantResult> {
  if (!hasApiKey()) {
    return { ok: false, error: "AI assistant is not configured. Set ANTHROPIC_API_KEY to enable this feature." };
  }

  const visit = await getOpdVisitById(visitId);
  if (!visit) {
    return { ok: false, error: "Visit not found." };
  }
  const patient = await findPatientForVisit(visit.patientId, visit.phone);

  const record = `Patient: ${visit.patientName}${patient?.age ? `, age ${patient.age}` : ""}${patient?.gender ? `, ${patient.gender}` : ""}
Visit reason/service: ${visit.service}
Status: ${visit.status}
Symptoms: ${visit.symptoms.join(", ") || "none noted"}
Known allergies: ${patient?.allergies || "none on record"}
Current medicines: ${patient?.currentMedicines || "none on record"}
Diagnosis: ${visit.diagnosis || "none noted"}
Clinical note: ${visit.clinicalNote || "none noted"}
Prescription: ${visit.prescription || "none noted"}
Advice: ${visit.advice || "none noted"}
Follow-up date: ${visit.followUpDate || "none set"}
Referred to: ${visit.referralTo || "not referred"}`;

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system:
        "You answer a staff member's questions about ONE patient visit for a hospital OS. " +
        "You are given the complete record for this visit below — use only that; never invent a fact, diagnosis, medicine, or history not stated in it. " +
        "If the answer isn't in the record, say so plainly rather than guessing. " +
        "Never suggest a diagnosis, a new medication, or a change to treatment — you may only restate, summarize, or clarify what's already recorded. " +
        "Keep answers short (2-4 sentences) and in plain language for a busy clinician. " +
        `\n\nVisit record:\n${record}`,
      messages: [...history.map((turn) => ({ role: turn.role, content: turn.content })), { role: "user" as const, content: question }]
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "The assistant declined to answer that. Try rephrasing." };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "The assistant returned no text output." };
    }

    return { ok: true, answer: textBlock.text.trim(), safetyNote: aiVisitAssistantSafetyNote };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "AI assistant is not configured correctly (invalid API key)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "AI assistant is temporarily rate-limited. Try again shortly." };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `AI assistant request failed: ${message}` };
  }
}
