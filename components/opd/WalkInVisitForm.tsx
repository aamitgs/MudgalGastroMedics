"use client";

import { FormEvent, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";
import type { OpdVisit } from "@/lib/opd-types";

type WalkInResponse = { ok: boolean; visit?: OpdVisit; error?: string };

type WalkInVisitFormProps = {
  /** Called once the visit exists server-side, so each surface can fold it into its own list/selection. */
  onCreated: (visit: OpdVisit) => void;
  onCancel?: () => void;
  submitLabel?: string;
  busyLabel?: string;
  heading?: string;
};

const fieldClass =
  "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

/**
 * The one walk-in intake used by both the Doctor Portal and the OPD Queue
 * module. A walk-in is the only way to open an OPD visit for a patient with no
 * appointment for today, and an OPD visit is what IPD admission requires — so
 * reception needs this on their own screens, not just doctors on /doctor.
 *
 * POST /api/opd re-checks appointments:create server-side; callers gate
 * rendering on the same permission for UI convenience only.
 */
export function WalkInVisitForm({
  onCreated,
  onCancel,
  submitLabel = "Start Consultation",
  busyLabel = "Starting…",
  heading = "Start a walk-in consultation (no appointment needed)"
}: WalkInVisitFormProps) {
  const [submitting, setSubmitting] = useState(false);

  // Takes the form element itself (captured synchronously at submit time),
  // never the synthetic event — React nulls event.currentTarget once the
  // handler's synchronous phase ends, which this function outlives via
  // multiple awaits, and the retry closure re-invokes this same function
  // much later still.
  async function submitWalkIn(form: HTMLFormElement) {
    const formData = new FormData(form);
    const patientName = String(formData.get("patientName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!patientName || !phone) {
      notify.error("Patient name and phone are required.");
      return;
    }
    setSubmitting(true);
    const symptoms = String(formData.get("symptoms") || "")
      .split(",")
      .map((symptom) => symptom.trim())
      .filter(Boolean);
    const priority = formData.get("priority");
    let response: Response;
    try {
      response = await fetch("/api/opd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName, phone, service: "OPD", symptoms, priority })
      });
    } catch {
      setSubmitting(false);
      notify.retryable("Unable to reach the server. Check your connection and retry.", () => void submitWalkIn(form));
      return;
    }
    const data = (await response.json().catch(() => ({}))) as WalkInResponse;
    setSubmitting(false);
    if (!response.ok || !data.ok || !data.visit) {
      notify.error(data.error || "Unable to start consultation.");
      return;
    }
    form.reset();
    onCreated(data.visit);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitWalkIn(event.currentTarget);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 rounded border border-line bg-soft/60 p-3">
      <p className="text-xs font-bold text-ink">{heading}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="patientName" required placeholder="Patient name" className={fieldClass} />
        <input name="phone" required type="tel" placeholder="Phone number" className={fieldClass} />
      </div>
      <input name="symptoms" placeholder="Symptoms, comma separated (optional)" className={fieldClass} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Priority"
          name="priority"
          defaultValue="Routine"
          className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
        >
          <option>Routine</option>
          <option>Urgent</option>
        </select>
        <ActionButton type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? busyLabel : submitLabel}
        </ActionButton>
        {onCancel ? (
          <ActionButton type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </ActionButton>
        ) : null}
      </div>
    </form>
  );
}
