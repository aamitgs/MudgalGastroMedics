"use client";

import { BrainCircuit, ClipboardCheck, Download, RefreshCw, Sparkles } from "lucide-react";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AiCaseReview, AiCaseSource, AiReviewStatus } from "@/lib/ai-types";
import { aiReviewStatuses } from "@/lib/ai-types";
import { downloadCsv } from "@/lib/table-export";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

const aiReviewExportHeaders = ["Patient", "Phone", "Service", "Source", "Urgency", "Status", "Reviewed By", "Created"];

function aiReviewExportRow(review: AiCaseReview) {
  return [review.patientName, review.phone, review.service, review.source, review.urgency, review.status, review.reviewedBy ?? "", review.createdAt];
}

type AiSourceOption = {
  id: string;
  token?: string;
  patientName: string;
  uhid?: string;
  service: string;
  status: string;
  createdAt: string;
};

type AiSources = {
  appointments: AiSourceOption[];
  visits: AiSourceOption[];
};

type AiReviewResponse = {
  ok: boolean;
  reviews?: AiCaseReview[];
  review?: AiCaseReview;
  sources?: AiSources;
  created?: AiCaseReview[];
  error?: string;
};

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function AdminAiReviews() {
  const [reviews, setReviews] = useState<AiCaseReview[]>([]);
  const [sources, setSources] = useState<AiSources>({ appointments: [], visits: [] });
  const [source, setSource] = useState<AiCaseSource>("Appointment");
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAiReviews() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/reviews", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to load AI reviews.");
      setLoading(false);
      return;
    }
    setReviews(data.reviews ?? []);
    setSources(data.sources ?? { appointments: [], visits: [] });
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialAiReviews() {
      const response = await fetch("/api/ai/reviews", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
      if (!active) return;
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to load AI reviews.");
        setLoading(false);
        return;
      }
      setReviews(data.reviews ?? []);
      setSources(data.sources ?? { appointments: [], visits: [] });
      setLoading(false);
    }
    void loadInitialAiReviews();
    return () => {
      active = false;
    };
  }, []);

  const sourceOptions = source === "Appointment" ? sources.appointments : sources.visits;
  const stats = useMemo(() => {
    return [
      { label: "AI Reviews", value: reviews.length },
      { label: "Needs Review", value: reviews.filter((review) => review.status === "Needs Review").length },
      { label: "Escalated", value: reviews.filter((review) => review.status === "Escalated").length },
      { label: "Reviewed", value: reviews.filter((review) => review.status === "Reviewed").length }
    ];
  }, [reviews]);

  async function generateReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/ai/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, sourceId })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok || !data.review) {
      setError(data.error || "Unable to generate AI review.");
      return;
    }
    setReviews((items) => [data.review as AiCaseReview, ...items.filter((item) => item.id !== data.review?.id)]);
    setError("");
  }

  async function seedReviews() {
    const response = await fetch("/api/ai/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok) {
      setError(data.error || "Unable to seed AI reviews.");
      return;
    }
    setReviews(data.reviews ?? []);
    setError("");
  }

  async function updateReview(id: string, updates: Partial<Pick<AiCaseReview, "status" | "doctorReviewNote" | "reviewedBy">>) {
    const response = await fetch("/api/ai/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const data = (await response.json().catch(() => ({}))) as AiReviewResponse;
    if (!response.ok || !data.ok || !data.review) {
      setError(data.error || "Unable to update AI review.");
      return;
    }
    setReviews((items) => items.map((item) => (item.id === id ? data.review as AiCaseReview : item)));
  }

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">AI Review Layer</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Planning summaries for human review</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">Generate structured routing notes, safety flags and preparation checklists for reception and doctor review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void seedReviews()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-cyan-300 dark:border-cyan-800/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] px-4 font-bold text-white shadow-[0_14px_30px_rgba(8,145,178,0.24)]">
            <Sparkles size={17} /> Seed Recent
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(aiReviewExportHeaders, reviews.map(aiReviewExportRow), "ai-reviews.csv")}
            disabled={reviews.length === 0}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export CSV
          </button>
          <button type="button" onClick={() => void loadAiReviews()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-line bg-soft px-4 font-bold text-ink transition hover:border-brand hover:text-brand">
            <RefreshCw size={17} /> Refresh AI
          </button>
        </div>
      </div>

      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="grid gap-4 border-b border-line p-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-soft/60 p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[0.7fr_1.3fr]">
        <form onSubmit={generateReview} className="rounded border border-line bg-[linear-gradient(135deg,var(--site-surface),var(--site-mist))] p-4">
          <p className="mb-4 flex items-center gap-2 text-lg font-bold text-ink"><BrainCircuit size={19} /> Generate review</p>
          <div className="grid gap-3">
            <select aria-label="Source type" value={source} onChange={(event) => { setSource(event.target.value as AiCaseSource); setSourceId(""); }} className={fieldClass}>
              <option value="Appointment">Appointment</option>
              <option value="OPD">OPD</option>
            </select>
            <select aria-label="Source record" value={sourceId} onChange={(event) => setSourceId(event.target.value)} className={fieldClass} required>
              <option value="">Select source record</option>
              {sourceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.token ? `${option.token} | ` : ""}{option.patientName}{option.uhid ? ` | ${option.uhid}` : ""} | {option.service}
                </option>
              ))}
            </select>
            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded border border-emerald-300 dark:border-emerald-800/20 bg-[linear-gradient(135deg,#10b981,#047857)] px-4 font-bold text-white shadow-[0_18px_42px_rgba(16,185,129,0.24)]">Generate AI Review</button>
          </div>
          <p className="mt-4 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-300">
            AI planning support does not diagnose or prescribe. Every note must be reviewed by reception or doctor before action.
          </p>
        </form>

        <div className="grid gap-4">
          {loading ? <ModuleSkeleton /> : null}
          {!loading && reviews.length === 0 ? (
            <ModuleEmptyState
              icon={Sparkles}
              title="No AI reviews yet"
              description="AI clinical case reviews appear here as visits are processed. Nothing needs your attention right now."
            />
          ) : null}
          {reviews.map((review) => (
            <article key={review.id} className="rounded border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">{review.source} | {review.route}{review.uhid ? ` | ${review.uhid}` : ""}</p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{review.patientName}</h3>
                  <p className="mt-1 text-sm text-muted">{review.service} | {review.urgency}</p>
                </div>
                <select aria-label="Review status" value={review.status} onChange={(event) => void updateReview(review.id, { status: event.target.value as AiReviewStatus })} className="rounded border border-line bg-soft px-3 py-2 text-sm font-bold text-ink">
                  {aiReviewStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <p className="mt-4 rounded border border-line bg-soft/50 p-3 text-sm leading-relaxed text-muted">{review.summary}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><ClipboardCheck size={16} /> Flags</p>
                  <div className="grid gap-2">
                    {review.flags.map((flag) => <span key={flag} className="rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm font-semibold text-amber-800 dark:text-amber-300">{flag}</span>)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-ink">Preparation</p>
                  <div className="grid gap-2">
                    {review.preparation.map((item) => <span key={item} className="rounded border border-line bg-soft/60 px-3 py-2 text-sm text-muted">{item}</span>)}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Reception Script</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{review.receptionScript}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
                <textarea
                  defaultValue={review.doctorReviewNote}
                  onBlur={(event) => void updateReview(review.id, { doctorReviewNote: event.target.value })}
                  className={`${fieldClass} min-h-20 py-3`}
                  placeholder="Doctor/reception review note"
                />
                <input
                  defaultValue={review.reviewedBy}
                  onBlur={(event) => void updateReview(review.id, { reviewedBy: event.target.value })}
                  className={fieldClass}
                  placeholder="Reviewed by"
                />
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">{review.safetyNote}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
