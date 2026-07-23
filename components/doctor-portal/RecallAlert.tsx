import { AlertTriangle, CalendarClock } from "lucide-react";
import { recallEscalationDays } from "@/lib/clinical/recall";

/** Projection of the most urgent outstanding (overdue/due-soon) recall for one patient — see DoctorPortalWorkspace's patientRecallAlerts. */
export type PatientRecallAlert = {
  status: "overdue" | "due-soon";
  dueDate: string;
  daysOverdue: number;
  service: string;
};

function formatDueDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Chronic-care recall surfaced at the point of care (lib/clinical/recall.ts
 * already drives reception outreach via automation/notifications — this is
 * the same evaluation shown to the doctor while the patient is in front of
 * them). Passive advisory, not blocking — mirrors PrescriptionField's
 * medication-overlap banner rather than AllergyGuard's acknowledgement flow,
 * since there's no prescribing action here to gate.
 */
export function RecallAlert({ recall }: { recall?: PatientRecallAlert }) {
  if (!recall) return null;
  const escalated = recall.status === "overdue" && recall.daysOverdue > recallEscalationDays;
  const tone = escalated
    ? { border: "border-red-300", bg: "bg-red-50 dark:bg-red-950", icon: "text-red-600", text: "text-red-900 dark:text-red-200", label: "text-red-700" }
    : { border: "border-amber-300", bg: "bg-amber-50 dark:bg-amber-950", icon: "text-amber-600", text: "text-amber-900 dark:text-amber-200", label: "text-amber-700" };

  const message =
    recall.status === "overdue"
      ? `Follow-up for ${recall.service} was due ${formatDueDate(recall.dueDate)} — ${recall.daysOverdue} day${recall.daysOverdue === 1 ? "" : "s"} overdue with no later visit on record.`
      : `Follow-up for ${recall.service} is due ${formatDueDate(recall.dueDate)} (in ${Math.abs(recall.daysOverdue)} day${Math.abs(recall.daysOverdue) === 1 ? "" : "s"}).`;

  return (
    <div className={`flex items-start gap-2.5 rounded border ${tone.border} ${tone.bg} p-3`} role="alert">
      <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${tone.icon}`} />
      <div>
        <p className={`text-xs font-black uppercase tracking-[0.1em] ${tone.label}`}>
          {recall.status === "overdue" ? "Recall overdue" : "Recall due soon"}
        </p>
        <p className={`mt-1 text-sm font-semibold leading-relaxed ${tone.text}`}>{message}</p>
      </div>
    </div>
  );
}

/** Small queue-list chip — same data, compact form for scanning the list at a glance. */
export function RecallBadge({ recall }: { recall?: PatientRecallAlert }) {
  if (!recall) return null;
  const escalated = recall.status === "overdue" && recall.daysOverdue > recallEscalationDays;
  const classes = escalated
    ? "border-red-300 bg-red-50 text-red-700"
    : "border-amber-300 bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${classes}`} title={`Recall ${recall.status === "overdue" ? "overdue" : "due soon"}: ${recall.service}`}>
      <CalendarClock size={11} /> Recall
    </span>
  );
}
