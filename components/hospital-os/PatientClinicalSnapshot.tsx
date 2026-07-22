"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { AppointmentRecord } from "@/lib/appointment-types";
import type { PatientFlowRow } from "@/lib/hospital-os-data";
import type { OpdVisit } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";

type PatientSummary = {
  patient: PatientRecord | null;
  nextAppointment: AppointmentRecord | null;
  recentVisits: OpdVisit[];
  criticalUnacknowledged: number;
  outstanding: { amount: number };
};

type SummaryResponse = { ok: boolean; summary?: PatientSummary; error?: string };

async function fetchPatientSummary(phone: string): Promise<PatientSummary> {
  const response = await fetch(`/api/patients/summary?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as SummaryResponse;
  if (!response.ok || !data.ok || !data.summary) {
    throw new Error(data.error || "Unable to load patient context.");
  }
  return data.summary;
}

function nextActionFor(summary: PatientSummary) {
  if (summary.criticalUnacknowledged > 0) {
    return `Acknowledge ${summary.criticalUnacknowledged} critical lab result${summary.criticalUnacknowledged === 1 ? "" : "s"}.`;
  }
  const followUpDate = summary.recentVisits[0]?.followUpDate;
  if (followUpDate) return `Follow-up due ${followUpDate}.`;
  if (summary.outstanding.amount > 0) return `Clear pending balance of Rs ${summary.outstanding.amount.toLocaleString("en-IN")}.`;
  if (summary.nextAppointment) return `Upcoming appointment: ${summary.nextAppointment.service} on ${summary.nextAppointment.date || "a flexible date"}.`;
  return "No pending action flagged.";
}

/**
 * Real per-patient clinical snapshot (Track 1.9 follow-up), replacing the
 * static "Age/Sex 42/Male, Abdominal pain, reflux" demo card and the
 * hardcoded "BP 126/82..." Vitals/Prescription/Next-action cards that showed
 * identical text for every patient regardless of who was selected — the more
 * clinically sensitive of the two Track 1.9 mock-data issues, since it looked
 * like real per-patient data rather than a dashboard-wide number. Reuses
 * /api/patients/summary (already built for the Global Patient Drawer,
 * Track 2.1) rather than a new endpoint.
 */
export function PatientClinicalSnapshot({ activePatient }: { activePatient: PatientFlowRow }) {
  const { data: summary, isPending, isError, refetch } = useQuery({
    queryKey: ["hospital-os", "patient-summary", activePatient.phone],
    queryFn: () => fetchPatientSummary(activePatient.phone ?? ""),
    enabled: Boolean(activePatient.phone)
  });

  const visit = summary?.recentVisits[0];
  const primaryConcern = visit?.symptoms?.length ? visit.symptoms.join(", ") : activePatient.department;

  return (
    <div className="grid gap-4 lg:col-span-3 lg:grid-cols-[330px_1fr]">
      <div className="rounded-lg border border-line bg-mist p-4">
        <p className="text-xs font-semibold uppercase text-muted">Clinical brief</p>
        <dl className="mt-4 grid gap-3 text-sm">
          {[
            ["Age / Sex", [activePatient.age || "-", summary?.patient?.gender].filter(Boolean).join(" / ")],
            ["Primary Concern", primaryConcern || "Not recorded"],
            ["Risk", activePatient.risk],
            ["Insurance", activePatient.insurance]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {!activePatient.phone ? (
          <p className="rounded-lg border border-line p-4 text-sm text-muted md:col-span-3">
            No registered contact number for this record, so clinical note, prescription and next-action context cannot be matched.
          </p>
        ) : isPending ? (
          <>
            <div className="h-24 animate-pulse rounded-lg border border-line bg-soft/70" aria-hidden="true" />
            <div className="h-24 animate-pulse rounded-lg border border-line bg-soft/70" aria-hidden="true" />
            <div className="h-24 animate-pulse rounded-lg border border-line bg-soft/70" aria-hidden="true" />
          </>
        ) : isError ? (
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-2 rounded-lg border border-line p-4 text-left text-sm text-muted transition hover:border-coral md:col-span-3"
          >
            <AlertTriangle size={16} className="shrink-0 text-coral" /> Could not load clinical context — click to retry.
            <RefreshCw size={14} className="ml-auto shrink-0" />
          </button>
        ) : (
          [
            ["Clinical Note", visit?.clinicalNote || "No clinical note recorded for this visit yet."],
            ["Prescription", visit?.prescription || "No prescription recorded for this visit yet."],
            ["Next action", summary ? nextActionFor(summary) : "No pending action flagged."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border border-line p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
