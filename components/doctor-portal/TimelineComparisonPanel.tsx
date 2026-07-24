"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";

type VitalsSnapshotKey =
  | "vitalsBp"
  | "vitalsPulse"
  | "vitalsWeight"
  | "vitalsHeight"
  | "vitalsRespiratoryRate"
  | "vitalsTemperature"
  | "vitalsSpo2"
  | "vitalsBloodSugar";

type PreviousSnapshot = Record<VitalsSnapshotKey, string | undefined> & {
  createdAt: string;
  diagnosis?: string;
  prescriptionItems?: PrescriptionItem[];
  prescription?: string;
  investigationAdvice?: string;
};

type SnapshotResponse = { ok: boolean; visit?: PreviousSnapshot | null; error?: string };

const vitalsRows: { key: VitalsSnapshotKey; label: string }[] = [
  { key: "vitalsBp", label: "BP" },
  { key: "vitalsPulse", label: "Pulse" },
  { key: "vitalsWeight", label: "Weight" },
  { key: "vitalsHeight", label: "Height" },
  { key: "vitalsRespiratoryRate", label: "Resp. Rate" },
  { key: "vitalsTemperature", label: "Temp" },
  { key: "vitalsSpo2", label: "SpO2" },
  { key: "vitalsBloodSugar", label: "Blood Sugar" }
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function medicineLabel(items?: PrescriptionItem[], fallback?: string) {
  if (items?.length) return items.map((item) => `${item.medicine}${item.strength ? ` ${item.strength}` : ""}`).join(", ");
  return fallback?.trim() || "";
}

/**
 * Side-by-side previous-vs-current vitals/diagnosis/prescription/advice
 * (Track: timeline comparison) — a structured diff, distinct from
 * PreviousVisitHistory's chronological narrative feed just above it in the
 * card. Collapsed by default like that panel; a changed vitals value is
 * bolded in the "This Visit" column so a trend (BP up, weight down) is
 * visible without reading every number. Advisory only — no thresholds or
 * interpretation, the doctor's own reading of the numbers governs.
 */
export function TimelineComparisonPanel({ visit }: { visit: OpdVisit }) {
  const [snapshot, setSnapshot] = useState<PreviousSnapshot | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || snapshot !== undefined) return;
    let active = true;
    fetch(`/api/opd/previous-visit-snapshot?phone=${encodeURIComponent(visit.phone)}&excludeVisitId=${encodeURIComponent(visit.id)}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((data: SnapshotResponse) => {
        if (!active) return;
        if (!data.ok) {
          setError(data.error || "Unable to load the previous visit.");
          return;
        }
        setSnapshot(data.visit ?? null);
      })
      .catch(() => {
        if (active) setError("Unable to reach the server.");
      });
    return () => {
      active = false;
    };
  }, [open, snapshot, visit.phone, visit.id]);

  const currentMedicine = medicineLabel(visit.prescriptionItems, visit.prescription);
  const previousMedicine = snapshot ? medicineLabel(snapshot.prescriptionItems, snapshot.prescription) : "";

  return (
    <details className="rounded border border-line bg-white" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer items-center gap-1.5 p-4 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <ArrowLeftRight size={14} /> Compare With Previous Visit
      </summary>
      <div className="border-t border-line p-4">
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        {!error && snapshot === undefined ? <p className="text-sm text-muted">Loading…</p> : null}
        {!error && snapshot === null ? <p className="text-sm text-muted">No previous visit found for this patient.</p> : null}
        {!error && snapshot ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 p-2 text-left text-xs font-bold uppercase tracking-[0.06em] text-muted" scope="col"></th>
                  <th className="p-2 text-left text-xs font-bold uppercase tracking-[0.06em] text-muted" scope="col">Previous · {formatDate(snapshot.createdAt)}</th>
                  <th className="p-2 text-left text-xs font-bold uppercase tracking-[0.06em] text-brand" scope="col">This Visit</th>
                </tr>
              </thead>
              <tbody>
                {vitalsRows.map(({ key, label }) => {
                  const prev = snapshot[key];
                  const curr = visit[key];
                  if (!prev?.trim() && !curr?.trim()) return null;
                  const changed = Boolean(prev?.trim() && curr?.trim() && prev.trim() !== curr.trim());
                  return (
                    <tr key={key} className="border-t border-line/70">
                      <td className="p-2 font-semibold text-ink">{label}</td>
                      <td className="p-2 text-muted">{prev || "—"}</td>
                      <td className={changed ? "p-2 font-bold text-brand" : "p-2 text-ink"}>{curr || "—"}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-line/70">
                  <td className="p-2 font-semibold text-ink">Diagnosis</td>
                  <td className="p-2 text-muted">{snapshot.diagnosis || "—"}</td>
                  <td className="p-2 text-ink">{visit.diagnosis || "—"}</td>
                </tr>
                <tr className="border-t border-line/70">
                  <td className="p-2 font-semibold text-ink">Prescription</td>
                  <td className="p-2 text-muted">{previousMedicine || "—"}</td>
                  <td className="p-2 text-ink">{currentMedicine || "—"}</td>
                </tr>
                <tr className="border-t border-line/70">
                  <td className="p-2 font-semibold text-ink">Advice / Investigations</td>
                  <td className="p-2 text-muted">{snapshot.investigationAdvice || "—"}</td>
                  <td className="p-2 text-ink">{visit.investigationAdvice || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </details>
  );
}
