import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { listIpdAdmissions, listVitals } from "@/lib/ipd-store";

export const aiDischargeSummarySafetyNote =
  "AI-drafted starting point for staff review only. It does not diagnose or replace clinical judgment — read, correct and confirm every line before saving.";

export type DischargeSummaryDraftResult =
  | { ok: true; draft: string; safetyNote: string }
  | { ok: false; error: string };

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function generateDischargeSummaryDraft(admissionId: string): Promise<DischargeSummaryDraftResult> {
  if (!hasApiKey()) {
    return { ok: false, error: "AI drafting is not configured. Set ANTHROPIC_API_KEY to enable this feature." };
  }

  const admission = (await listIpdAdmissions()).find((item) => item.id === admissionId);
  if (!admission) {
    return { ok: false, error: "Admission not found." };
  }
  if (!admission.diagnosis?.trim() && !admission.carePlan?.trim() && !admission.nursingNotes?.trim()) {
    return { ok: false, error: "Add a diagnosis, care plan or nursing notes first — there's nothing on record yet to draft from." };
  }

  const vitals = (await listVitals(admission.id)).slice(0, 8);
  const vitalsText = vitals
    .map((reading) => {
      const parts = [
        reading.heartRate !== undefined ? `HR ${reading.heartRate}` : "",
        reading.spo2 !== undefined ? `SpO2 ${reading.spo2}%` : "",
        reading.bloodPressure ? `BP ${reading.bloodPressure}` : "",
        reading.temperature !== undefined ? `Temp ${reading.temperature}°F` : ""
      ].filter(Boolean);
      return `[${reading.recordedAt}] ${parts.join(", ") || "no readings"}`;
    })
    .join("\n");

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 700,
      system:
        "You draft a hospital in-patient discharge summary for a staff member to review, correct and finalize. " +
        "Write 4 to 6 short sections covering: admission reason/diagnosis, course of care, condition at discharge, and follow-up/home-care advice. " +
        "Only use the record data given to you; never infer a diagnosis, medication, or outcome that is not already stated in the record. " +
        "This is a starting draft for a clinician to edit, not a finished or authoritative document — do not present it as final.",
      messages: [
        {
          role: "user",
          content: `Patient: ${admission.patientName}\nWard/Bed: ${admission.ward} / ${admission.bedLabel}\nAdmitted: ${admission.createdAt}\nAdmitting doctor: ${admission.admittingDoctor}\n\nDiagnosis: ${admission.diagnosis || "none noted"}\nCare plan: ${admission.carePlan || "none noted"}\nNursing notes: ${admission.nursingNotes || "none noted"}\nDiet advice: ${admission.dietAdvice || "none noted"}\n\nRecent vitals:\n${vitalsText || "none recorded"}\n\nDraft a discharge summary from this record.`
        }
      ]
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "AI drafting was declined for this request. Try again or write the summary manually." };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "AI drafting returned no text output." };
    }

    return { ok: true, draft: textBlock.text.trim(), safetyNote: aiDischargeSummarySafetyNote };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "AI drafting is not configured correctly (invalid API key)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "AI drafting is temporarily rate-limited. Try again shortly." };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `AI drafting request failed: ${message}` };
  }
}
