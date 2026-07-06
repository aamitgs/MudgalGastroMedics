"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClinicalEvent } from "@/lib/hospital-os-data";

type TimelineResponse = { ok: boolean; events?: ClinicalEvent[]; error?: string };

async function fetchPatientTimeline(phone: string): Promise<ClinicalEvent[]> {
  const response = await fetch(`/api/hospital-os/patient-timeline?phone=${encodeURIComponent(phone)}`, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as TimelineResponse;
  if (!response.ok || !data.ok || !data.events) {
    throw new Error(data.error || "Unable to load the patient timeline.");
  }
  return data.events;
}

/**
 * Real chronological clinical timeline for the active patient (Track 1.9),
 * replacing the static demo events. Lives outside the OS shell monolith as the
 * first extraction toward roadmap 4.10.
 */
export function PatientTimelinePanel({ phone, patientName }: { phone?: string; patientName: string }) {
  const { data: events, isPending, isError, refetch } = useQuery({
    queryKey: ["hospital-os", "patient-timeline", phone],
    queryFn: () => fetchPatientTimeline(phone ?? ""),
    enabled: Boolean(phone)
  });

  if (!phone) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Timeline unavailable for this record"
        description={`${patientName} has no registered contact number, so clinical history cannot be matched across appointments, OPD, IPD, lab and pharmacy.`}
        action="Open patient registration"
        onAction={() => window.location.assign("/admin#module-patients")}
      />
    );
  }

  if (isPending) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading patient timeline">
        {[0, 1, 2].map((row) => (
          <div key={row} className="grid grid-cols-[110px_1fr] gap-4 rounded-lg border border-[var(--hos-border)] p-4">
            <Skeleton className="h-4 w-20" />
            <div className="grid gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Timeline could not be loaded"
        description="The clinical history request failed. Check your connection and try again — no data has been lost."
        action="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={`No clinical events yet for ${patientName}`}
        description="Appointments, OPD visits, vitals, lab orders, pharmacy dispenses and admissions will appear here chronologically as they are recorded."
        action="Book appointment"
        onAction={() => window.location.assign("/admin#module-appointments")}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event, index) => (
        <article key={`${event.time}-${event.title}-${index}`} className="grid grid-cols-[110px_1fr] gap-4 rounded-lg border border-[var(--hos-border)] p-4">
          <p className="text-sm font-semibold text-[var(--hos-primary)]">{event.time}</p>
          <div>
            <h3 className="font-semibold">{event.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--hos-muted-text)]">{event.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
