"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";

type AiSummaryResponse = {
  ok: boolean;
  summary?: string;
  safetyNote?: string;
  error?: string;
};

export function AiPatientSummaryPanel({ phone }: { phone: string }) {
  const [summary, setSummary] = useState("");
  const [safetyNote, setSafetyNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/patient-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = (await response.json().catch(() => ({}))) as AiSummaryResponse;
    setLoading(false);
    if (!response.ok || !data.ok || !data.summary) {
      setError(data.error || "Unable to generate AI summary.");
      setSummary("");
      return;
    }
    setSummary(data.summary);
    setSafetyNote(data.safetyNote || "");
  }

  return (
    <div className="rounded border border-cyan-200 bg-cyan-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand"><Sparkles size={15} /> AI Clinical Brief</p>
        <ActionButton variant="secondary" size="sm" onClick={() => void generate()} loading={loading}>
          <Sparkles size={13} /> {summary ? "Regenerate" : "Generate summary"}
        </ActionButton>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
      {summary ? (
        <div className="mt-3 rounded border border-cyan-200 bg-white p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{summary}</p>
          {safetyNote ? <p className="mt-2 text-xs font-semibold text-muted">{safetyNote}</p> : null}
        </div>
      ) : !error && !loading ? (
        <p className="mt-2 text-xs text-muted">Summarizes this patient&apos;s appointments, OPD visits and admissions into a short review brief.</p>
      ) : null}
    </div>
  );
}
