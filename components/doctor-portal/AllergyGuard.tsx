"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";

/**
 * Active allergy alert at prescribe time (Clinical Safety, Track 0.1). Renders
 * only when the patient has a recorded allergy. Non-blocking — the prescription
 * still autosaves — but the clinician must actively acknowledge review, which
 * is audit-logged along with an optional clinical reason (e.g. "prescribed
 * anyway — patient no longer reacts", "switched to alternative drug"). The
 * reason is optional, not required, to keep acknowledgement itself
 * non-obstructive; the audit trail records "Not specified" when omitted.
 * Resets per visit (keyed on visit id at the call site).
 */
export function AllergyGuard({ visitId, allergies }: { visitId: string; allergies?: string }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const recorded = allergies?.trim();
  if (!recorded) return null;

  async function acknowledge() {
    setSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/clinical/allergy-acknowledged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, allergies: recorded, reason: reason.trim() })
      });
    } catch {
      // Previously unhandled: a thrown network error propagated past this
      // try/finally as an unhandled rejection, resetting saving but giving
      // zero explanation. This surfaces it instead of leaving the clinician
      // to guess why "Acknowledge" silently did nothing.
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void acknowledge());
      return;
    }
    try {
      if (!response.ok) {
        notify.error("Could not record acknowledgement. Try again.");
        return;
      }
      setAcknowledged(true);
      notify.success("Allergies reviewed", { id: "allergy-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (acknowledged) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Allergies reviewed before prescribing: {recorded}
        {reason.trim() ? <span className="font-normal text-emerald-700"> — {reason.trim()}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-red-300 bg-red-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.1em] text-red-700">Allergy alert</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-red-900">
            Allergies on record: {recorded}. Confirm the prescription accounts for these before finalizing.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional: note how this was addressed (e.g. switched drug, patient no longer reacts)"
          className="min-h-10 flex-1 rounded border border-red-300 bg-white px-3 text-sm text-ink placeholder:text-red-900/40 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10"
        />
        <ActionButton variant="danger" className="shrink-0" onClick={() => void acknowledge()} loading={saving}>
          <CheckCircle2 size={16} /> Acknowledge — reviewed
        </ActionButton>
      </div>
    </div>
  );
}
