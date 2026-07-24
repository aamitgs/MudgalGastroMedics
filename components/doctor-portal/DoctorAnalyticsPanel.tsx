"use client";

import type { DoctorAnalytics } from "@/lib/clinical/doctor-analytics";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-line/80 bg-white p-3 shadow-sm">
      <span className="text-xs font-semibold uppercase leading-tight tracking-[0.1em] text-muted">{label}</span>
      <span className="shrink-0 text-lg font-bold text-ink">{value}</span>
    </div>
  );
}

function RankedList({ title, entries }: { title: string; entries: DoctorAnalytics["topDiagnoses"] }) {
  if (!entries.length) return null;
  return (
    <div className="rounded border border-line/80 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">{title}</p>
      <div className="grid gap-1.5">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-ink" title={entry.label}>{entry.label}</span>
            <span className="shrink-0 rounded-full bg-soft px-2 py-0.5 text-xs font-bold text-muted">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Consultation analytics (Track: consultation analytics) — every number
 * derived from real OpdVisit data already loaded for the queue, nothing
 * estimated. "—" (not "0" or an invented figure) whenever there isn't yet
 * enough real data to compute a metric honestly.
 */
export function DoctorAnalyticsPanel({ analytics }: { analytics: DoctorAnalytics }) {
  return (
    <div className="grid gap-2">
      <StatRow label="Completed Consultations" value={String(analytics.totalConsultations)} />
      <StatRow label="Avg. Consultation Time" value={analytics.avgConsultationMinutes !== null ? `${analytics.avgConsultationMinutes} min` : "—"} />
      <StatRow label="Avg. Patients / Day" value={analytics.avgPatientsPerDay !== null ? String(analytics.avgPatientsPerDay) : "—"} />
      <StatRow label="Follow-up Compliance" value={analytics.followUpCompliancePercent !== null ? `${analytics.followUpCompliancePercent}%` : "—"} />
      <RankedList title="Most Common Diagnoses" entries={analytics.topDiagnoses} />
      <RankedList title="Most Prescribed Medicines" entries={analytics.topMedicines} />
    </div>
  );
}
