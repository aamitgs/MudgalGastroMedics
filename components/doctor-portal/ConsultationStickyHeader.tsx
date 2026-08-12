"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import type { AutosaveState } from "@/hooks/useDraftRecovery";
import type { OpdVisit, OpdVisitStatus } from "@/lib/opd-types";
import type { PatientRecord } from "@/lib/patient-types";

/**
 * Live "MM:SS since consultation started" — starts null (not Date.now()) so
 * the first render matches server output; the interval only ever runs
 * client-side, same reasoning as any other clock-driven UI in this app.
 */
function useElapsedLabel(since?: string) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!since) {
      const reset = window.setTimeout(() => setNow(null), 0);
      return () => window.clearTimeout(reset);
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(initial);
    };
  }, [since]);

  if (!since || now === null) return null;
  const startedAt = new Date(since).getTime();
  if (Number.isNaN(startedAt)) return null;
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Floating header (Track: sticky consultation header) — stays visible while
 * scrolling a long consultation so the doctor never loses sight of which
 * patient they're editing, how long the visit has run, or whether their
 * last edit actually saved. `top-14` matches StaffChrome's own sticky top
 * bar height (min-h-14) so the two stack without overlapping.
 */
export function ConsultationStickyHeader({
  visit,
  patient,
  aggregateSaveState,
  onStatusChange,
  onOpenShortcuts
}: {
  visit: OpdVisit;
  patient?: PatientRecord;
  aggregateSaveState: AutosaveState;
  onStatusChange: (status: OpdVisitStatus) => void;
  onOpenShortcuts: () => void;
}) {
  const elapsed = useElapsedLabel(visit.status === "In Consultation" ? visit.consultationStartedAt : undefined);
  const ageGender = [patient?.age, patient?.gender].filter(Boolean).join(", ");

  return (
    <div className="sticky top-14 z-30 border-b border-line bg-[linear-gradient(135deg,#ffffff,#ecfeff)]/95 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-black uppercase tracking-[0.16em] text-brand">
            <span>{visit.token} | {visit.status}</span>
            {visit.visitNo ? <span className="font-mono normal-case tracking-normal text-muted">{visit.visitNo}</span> : null}
            {elapsed ? <span className="normal-case tracking-normal text-ink">· {elapsed} elapsed</span> : null}
            <SaveStatusIndicator state={aggregateSaveState} />
          </p>
          <h2 className="mt-2 truncate text-2xl font-bold leading-tight text-ink">{visit.patientName}</h2>
          <p className="mt-2 text-sm font-semibold text-muted">
            {visit.service} | {visit.phone}
            {visit.uhid ? ` | ${visit.uhid}` : ""}
            {ageGender ? ` | ${ageGender}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-3 md:min-w-[440px]">
            <ActionButton variant="primary" onClick={() => onStatusChange("In Consultation")}>Start</ActionButton>
            <ActionButton id="visit-complete-button" variant="success" onClick={() => onStatusChange("Completed")}>Complete</ActionButton>
            <select
              aria-label="Visit status"
              value={visit.status}
              onChange={(event) => onStatusChange(event.target.value as OpdVisitStatus)}
              className="rounded border border-line bg-white px-3 py-2 font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              {["Waiting", "In Consultation", "Completed", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center justify-center gap-1.5 self-end text-xs font-semibold text-muted transition hover:text-brand"
          >
            <Keyboard size={13} /> Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}
