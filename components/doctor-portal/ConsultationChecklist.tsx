"use client";

import { Check } from "lucide-react";
import { getStatusToneClass } from "@/components/design-system/StatusBadge";
import type { OpdVisit } from "@/lib/opd-types";

/**
 * At-a-glance completion status, derived entirely from the visit object
 * already in hand — no extra state, no extra fetch. Advisory only (Part 8:
 * clinical alerts warn, never block) — a doctor can complete a visit with
 * items unchecked, e.g. a walk-in with no follow-up needed.
 */
export function ConsultationChecklist({ visit, identityConfirmed }: { visit: OpdVisit; identityConfirmed: boolean }) {
  const items: { label: string; done: boolean }[] = [
    { label: "Patient Verified", done: identityConfirmed },
    { label: "Vitals", done: Boolean(visit.vitalsBp || visit.vitalsPulse || visit.vitalsWeight) },
    { label: "Complaints", done: Boolean(visit.presentingComplaints?.trim()) },
    { label: "History", done: Boolean(visit.history?.trim()) },
    { label: "Examination", done: Boolean(visit.generalExamination?.trim() || visit.perAbdomen?.trim()) },
    { label: "Diagnosis", done: Boolean(visit.diagnosis?.trim()) },
    { label: "Prescription", done: Boolean(visit.prescription?.trim() || visit.prescriptionItems?.length) },
    { label: "Advice", done: Boolean(visit.investigationAdvice?.trim()) },
    { label: "Follow-up", done: Boolean(visit.followUpDate) }
  ];

  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Consultation completion checklist">
      {items.map((item) => (
        <span
          key={item.label}
          role="listitem"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusToneClass(item.done ? "success" : "inactive")}`}
        >
          {item.done ? <Check size={12} /> : null}
          {item.label}
        </span>
      ))}
    </div>
  );
}
