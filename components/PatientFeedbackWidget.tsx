"use client";

import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { PatientVisitSummary } from "@/components/PatientHealthDashboard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { notify } from "@/lib/notify";

type FeedbackResponse = { ok: boolean; error?: string };

/** Prompts for a rating on the most recent completed visit — one submission per visit, enforced server-side. */
export function PatientFeedbackWidget({ visits }: { visits: PatientVisitSummary[] }) {
  const latestCompleted = useMemo(
    () =>
      [...visits]
        .filter((visit) => visit.status === "Completed")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [visits]
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!latestCompleted) return null;

  if (submitted) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        Thanks for sharing your feedback!
      </div>
    );
  }

  async function submit() {
    if (!rating) {
      notify.error("Please select a rating.");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/patient/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId: latestCompleted.id, rating, comment })
    });
    const data = (await response.json().catch(() => ({}))) as FeedbackResponse;
    setSubmitting(false);
    if (!response.ok || !data.ok) {
      if (data.error?.toLowerCase().includes("already")) {
        setSubmitted(true);
        return;
      }
      notify.error(data.error || "Unable to submit feedback.");
      return;
    }
    setSubmitted(true);
    notify.success("Thanks for sharing your feedback!");
  }

  return (
    <div className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-ink">How was your visit on {new Date(latestCompleted.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}?</p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star size={22} className={value <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-line"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Anything you'd like to share (optional)"
        className="mt-3 min-h-16 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
      />
      <ActionButton variant="primary" size="sm" className="mt-3" onClick={() => void submit()} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit feedback"}
      </ActionButton>
    </div>
  );
}
