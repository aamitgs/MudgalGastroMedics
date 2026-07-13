import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getOpdVisitById } from "@/lib/opd-store";

export const aiMedicalCertificateSafetyNote =
  "AI-drafted starting point for staff review only. It does not diagnose or replace clinical judgment — read, correct and confirm every line before saving.";

export type MedicalCertificateDraftResult =
  | { ok: true; draft: string; safetyNote: string }
  | { ok: false; error: string };

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function generateMedicalCertificateDraft(visitId: string): Promise<MedicalCertificateDraftResult> {
  if (!hasApiKey()) {
    return { ok: false, error: "AI drafting is not configured. Set ANTHROPIC_API_KEY to enable this feature." };
  }

  const visit = await getOpdVisitById(visitId);
  if (!visit) {
    return { ok: false, error: "Visit not found." };
  }
  if (!visit.diagnosis?.trim() && !visit.clinicalNote?.trim()) {
    return { ok: false, error: "Add a diagnosis or clinical note first — there's nothing on record yet to draft from." };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      system:
        "You draft the body wording of a hospital medical certificate for a staff member to review, correct and finalize. " +
        "Write 1 to 2 short paragraphs stating the clinical findings and advice (e.g. rest, activity restriction, fitness to resume work/school, follow-up). " +
        "Only use the record data given to you; never infer a diagnosis, duration, or restriction that is not already stated in the record. " +
        "Do not include patient name, exam date, letterhead or signature — those are added separately around this text. " +
        "This is a starting draft for a clinician to edit, not a finished or authoritative document — do not present it as final.",
      messages: [
        {
          role: "user",
          content: `Service: ${visit.service}\nDiagnosis: ${visit.diagnosis || "none noted"}\nClinical note: ${visit.clinicalNote || "none noted"}\nAdvice so far: ${visit.advice || "none noted"}\n\nDraft the certificate wording from this record.`
        }
      ]
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "AI drafting was declined for this request. Try again or write the certificate manually." };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "AI drafting returned no text output." };
    }

    return { ok: true, draft: textBlock.text.trim(), safetyNote: aiMedicalCertificateSafetyNote };
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
