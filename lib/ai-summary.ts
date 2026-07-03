import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { listPatientAppointments } from "@/lib/appointment-store";
import { listPatientOpdVisits } from "@/lib/opd-store";
import { listPatientIpdAdmissions, listVitals } from "@/lib/ipd-store";

export const aiPatientSummarySafetyNote =
  "AI-generated summary for staff review only. It does not diagnose, prescribe or replace clinical judgment — verify against the source record before acting.";

export type PatientSummaryResult =
  | { ok: true; summary: string; safetyNote: string }
  | { ok: false; error: string };

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function buildTimelineText(phone: string) {
  const appointments = listPatientAppointments(phone);
  const visits = listPatientOpdVisits(phone);
  const admissions = listPatientIpdAdmissions(phone);
  const vitals = admissions.flatMap((admission) => listVitals(admission.id));

  const lines: string[] = [];

  for (const appointment of appointments) {
    lines.push(
      `[Appointment ${appointment.createdAt}] service=${appointment.service}; status=${appointment.status}; priority=${appointment.priority || "Routine"}; symptoms=${appointment.symptoms.join(", ") || "none noted"}`
    );
  }

  for (const visit of visits) {
    lines.push(
      `[OPD visit ${visit.createdAt}] service=${visit.service}; status=${visit.status}; clinicalNote=${visit.clinicalNote || "none"}; prescription=${visit.prescription || "none"}; advice=${visit.advice || "none"}; followUp=${visit.followUpDate || "none"}`
    );
  }

  for (const admission of admissions) {
    lines.push(
      `[IPD admission ${admission.createdAt}] ward=${admission.ward}; bed=${admission.bedLabel}; diagnosis=${admission.diagnosis || "none"}; carePlan=${admission.carePlan || "none"}; discharged=${admission.dischargedAt ?? "still admitted"}; dischargeSummary=${admission.dischargeSummary || "none"}`
    );
  }

  for (const vital of vitals) {
    lines.push(
      `[Vitals ${vital.recordedAt}] HR=${vital.heartRate ?? "-"} SpO2=${vital.spo2 ?? "-"} BP=${vital.bloodPressure ?? "-"} Temp=${vital.temperature ?? "-"}`
    );
  }

  return { lines, hasAnyRecord: lines.length > 0, patientName: visits[0]?.patientName ?? appointments[0]?.name ?? admissions[0]?.patientName };
}

export async function generatePatientSummary(phone: string): Promise<PatientSummaryResult> {
  if (!hasApiKey()) {
    return { ok: false, error: "AI summary is not configured. Set ANTHROPIC_API_KEY to enable this feature." };
  }

  const { lines, hasAnyRecord, patientName } = buildTimelineText(phone);
  if (!hasAnyRecord) {
    return { ok: false, error: "No appointments, visits or admissions on record for this patient yet." };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 700,
      system:
        "You summarize a hospital patient's timeline into a short clinical brief for staff review. " +
        "Be factual and concise — 4 to 6 short bullet points covering: reason for visits, key findings/diagnoses, current care plan or prescriptions, and any follow-up due. " +
        "Only use the timeline data given to you; never infer a diagnosis that is not already stated in the record. " +
        "Do not add a diagnosis, prescribe treatment, or predict outcomes. This is a review aid, not a clinical decision.",
      messages: [
        {
          role: "user",
          content: `Patient: ${patientName ?? "Unknown"}\n\nTimeline (oldest first):\n${lines.join("\n")}\n\nSummarize this into a short clinical brief.`
        }
      ]
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "AI summary was declined for this request. Try again or write the summary manually." };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "AI summary returned no text output." };
    }

    return { ok: true, summary: textBlock.text.trim(), safetyNote: aiPatientSummarySafetyNote };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "AI summary is not configured correctly (invalid API key)." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "AI summary is temporarily rate-limited. Try again shortly." };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: `AI summary request failed: ${message}` };
  }
}
