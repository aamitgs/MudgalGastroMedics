"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";

type DraftResponse = { ok: boolean; draft?: string; safetyNote?: string; error?: string };

/**
 * AI-drafted discharge summary starting point (Track 4.3), mirroring the
 * existing AiPatientSummaryPanel pattern in components/doctor-portal/ — same
 * Claude API call shape, same "review before use" flow. The draft only ever
 * reaches the real dischargeSummary field via the explicit "Use this draft"
 * click (the parent then calls its own save path), never written/saved
 * automatically — a clinician always reviews and confirms it first.
 */
export function AiDischargeSummaryDraft({ admissionId, onUseDraft }: { admissionId: string; onUseDraft: (draft: string) => void }) {
  const [draft, setDraft] = useState("");
  const [safetyNote, setSafetyNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/ai/discharge-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionId })
    });
    const data = (await response.json().catch(() => ({}))) as DraftResponse;
    setLoading(false);
    if (!response.ok || !data.ok || !data.draft) {
      setError(data.error || "Unable to draft a discharge summary.");
      setDraft("");
      return;
    }
    setDraft(data.draft);
    setSafetyNote(data.safetyNote || "");
  }

  return (
    <div className="mt-3 rounded border border-cyan-200 bg-cyan-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand">
          <Sparkles size={14} /> AI discharge summary draft
        </p>
        <ActionButton variant="secondary" size="sm" onClick={() => void generate()} loading={loading}>
          <Sparkles size={13} /> {draft ? "Regenerate" : "Draft with AI"}
        </ActionButton>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
      {draft ? (
        <div className="mt-2 rounded border border-cyan-200 bg-white p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{draft}</p>
          {safetyNote ? <p className="mt-2 text-xs font-semibold text-muted">{safetyNote}</p> : null}
          <ActionButton
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={() => {
              onUseDraft(draft);
              setDraft("");
            }}
          >
            Use this draft
          </ActionButton>
        </div>
      ) : !error && !loading ? (
        <p className="mt-2 text-xs text-muted">Drafts a starting point from the diagnosis, care plan, nursing notes and recent vitals — review and edit before saving.</p>
      ) : null}
    </div>
  );
}
