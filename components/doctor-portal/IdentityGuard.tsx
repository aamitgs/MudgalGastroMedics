"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";

/**
 * Positive patient identification before clinical writes (Clinical Safety,
 * Track 0.6). Unlike the allergy/interaction alerts — clinical-judgment calls
 * the doctor may reasonably override — there is no valid reason to write to a
 * chart without first confirming it's the right patient, so this is a
 * one-click gate (not a dismissible warning): the clinical note, prescription,
 * advice and follow-up fields stay disabled until confirmed. Standard
 * "two-patient-identifier" practice (name + phone; age when recorded, since
 * this record has no discrete date-of-birth field), audited per visit.
 */
export function IdentityGuard({
  visitId,
  name,
  phone,
  age,
  onConfirmed
}: {
  visitId: string;
  name: string;
  phone: string;
  age?: string;
  onConfirmed: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    let response: Response;
    try {
      response = await fetch("/api/clinical/identity-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, patientName: name, phone })
      });
    } catch {
      setSaving(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void confirm());
      return;
    }
    try {
      if (!response.ok) {
        notify.error("Could not record identity confirmation. Try again.");
        return;
      }
      setConfirmed(true);
      onConfirmed();
      notify.success("Identity confirmed", { id: "identity-ack" });
    } finally {
      setSaving(false);
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        <ShieldCheck size={17} className="shrink-0" /> Identity confirmed — {name}, {phone}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border-2 border-cyan-300 bg-cyan-50 p-4" role="alert">
      <div className="flex items-start gap-2.5">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.1em] text-brand">Confirm patient identity</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">
            Verify with the patient in front of you: <strong>{name}</strong>, phone {phone}
            {age ? `, age ${age}` : ""}. Clinical note, prescription, advice and follow-up unlock once confirmed.
          </p>
        </div>
      </div>
      <ActionButton variant="primary" className="self-start" onClick={() => void confirm()} loading={saving}>
        <CheckCircle2 size={16} /> Confirm identity — matches
      </ActionButton>
    </div>
  );
}
