"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { type MaxDoseMatch } from "@/lib/clinical/max-dose";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";

/**
 * Maximum-daily-dose alert at prescribe time (Clinical Safety — item-12 quartet
 * alongside allergy, duplicate-medication and drug-interaction checks). Renders
 * only when a structured Rx drug's aggregated daily dose exceeds its curated
 * ceiling. Non-blocking — the prescription still autosaves — but because a
 * breached ceiling is serious by definition, the clinician must actively
 * acknowledge review, audit-logged per drug along with an optional reason
 * (e.g. "specialist-directed high dose, monitoring in place"). Resets whenever
 * the set of exceedances changes (the prescription is live), mirroring the
 * interaction guard.
 */
export function MaxDoseGuard({ visitId, matches }: { visitId: string; matches: MaxDoseMatch[] }) {
  const signature = matches.map((match) => match.ruleId).sort().join("|");
  const [acknowledgedSignature, setAcknowledgedSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  if (!matches.length) return null;
  const acknowledged = acknowledgedSignature === signature;

  async function acknowledge() {
    setSaving(true);
    let responses: Response[];
    try {
      responses = await Promise.all(
        matches.map((match) =>
          fetch("/api/clinical/max-dose-acknowledged", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitId,
              drug: match.drug,
              dailyDose: `${match.dailyDoseMg} mg/day`,
              maxDose: `${match.maxDailyMg} mg/day`,
              reason: reason.trim()
            })
          })
        )
      );
    } catch {
      // Mirrors the interaction guard: a thrown network error rejects the whole
      // Promise.all batch; retry resends every drug's acknowledgement, which is
      // idempotent (it records review state, not a partial-batch resume).
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void acknowledge());
      return;
    }
    try {
      if (responses.some((response) => !response.ok)) {
        notify.error("Could not record acknowledgement. Try again.");
        return;
      }
      setAcknowledgedSignature(signature);
      notify.success("Dose reviewed", { id: "max-dose-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Daily dose reviewed before prescribing.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-red-300 bg-red-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-[0.1em] text-red-700">Maximum daily dose exceeded</p>
          <div className="mt-2 grid gap-2.5">
            {matches.map((match) => (
              <div key={match.ruleId}>
                <p className="text-sm font-bold text-red-900">
                  {match.drug}: {match.dailyDoseMg} mg/day prescribed — ceiling {match.maxDailyMg} mg/day
                </p>
                <p className="mt-0.5 text-xs font-semibold text-red-700">{match.detail}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-red-800">{match.rationale}</p>
                <p className="mt-0.5 text-xs font-semibold text-red-700">{match.guidance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional: note why this dose is intended (e.g. specialist-directed, monitoring planned)"
          className="min-h-10 flex-1 rounded border border-red-300 bg-white px-3 text-sm text-ink placeholder:text-red-900/40 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
        />
        <ActionButton variant="danger" className="shrink-0" onClick={() => void acknowledge()} loading={saving}>
          <CheckCircle2 size={16} /> Acknowledge — reviewed
        </ActionButton>
      </div>
    </div>
  );
}
