"use client";

import { History } from "lucide-react";
import { useEffect, useState } from "react";
import type { ClinicalEvent } from "@/lib/hospital-os-data";

type TimelineResponse = { ok: boolean; events?: ClinicalEvent[]; error?: string };

/**
 * Full clinical history (appointments, OPD, IPD, labs, pharmacy) for the
 * patient in front of the doctor — same source and endpoint as the admin
 * PatientTimelinePanel, but a plain fetch instead of react-query since the
 * Doctor Portal's StaffChrome shell deliberately has no QueryClientProvider
 * (kept lean for a screen used dozens of times a day). Collapsed by default
 * — RecentLabsStrip above already covers the "at a glance" case, this is
 * the "open records without leaving the consultation screen" fallback.
 */
export function PreviousVisitHistory({ phone, patientName }: { phone: string; patientName: string }) {
  const [events, setEvents] = useState<ClinicalEvent[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || events !== null) return;
    let active = true;
    fetch(`/api/hospital-os/patient-timeline?phone=${encodeURIComponent(phone)}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((data: TimelineResponse) => {
        if (!active) return;
        if (!data.ok || !data.events) {
          setError(data.error || "Unable to load clinical history.");
          return;
        }
        setEvents(data.events);
      })
      .catch(() => {
        if (active) setError("Unable to reach the server.");
      });
    return () => {
      active = false;
    };
  }, [open, events, phone]);

  return (
    <details className="rounded border border-line bg-white" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer items-center gap-1.5 p-4 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <History size={14} /> Previous Visits &amp; Clinical History
      </summary>
      <div className="border-t border-line p-4">
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        {!error && events === null ? (
          <div className="grid gap-2" aria-busy="true" aria-label="Loading clinical history">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded border border-line bg-soft/70" />
            ))}
          </div>
        ) : null}
        {!error && events !== null && !events.length ? (
          <p className="text-sm text-muted">No prior clinical events recorded for {patientName} yet.</p>
        ) : null}
        {!error && events?.length ? (
          <div className="grid gap-2">
            {events.map((event, index) => (
              <article key={`${event.time}-${event.title}-${index}`} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 rounded border border-line/70 p-2.5 text-xs">
                <p className="font-bold text-brand">{event.time}</p>
                <div>
                  <p className="font-semibold text-ink">{event.title}</p>
                  <p className="mt-0.5 leading-relaxed text-muted">{event.detail}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
