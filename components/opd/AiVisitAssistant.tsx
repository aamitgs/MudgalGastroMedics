"use client";

import { Bot, Send } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";

type Turn = { role: "user" | "assistant"; content: string };
type AskResponse = { ok: boolean; answer?: string; safetyNote?: string; error?: string };

const historyLimit = 20;

/**
 * Screen-context-only Q&A about the current OPD visit (Track 4.3) — deliberately
 * NOT an agentic assistant: it can only answer from the fields already loaded
 * on this consultation card, never queries other patients/records on its own.
 * Purely informational (no "use this" write-back like the discharge-summary/
 * referral-letter/certificate drafts) — there's nothing to save, just answers.
 */
export function AiVisitAssistant({ visitId }: { visitId: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [safetyNote, setSafetyNote] = useState("");

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    const history = turns.slice(-historyLimit);
    const nextTurns: Turn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    setQuestion("");

    const response = await fetch("/api/ai/visit-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId, question: trimmed, history })
    });
    const data = (await response.json().catch(() => ({}))) as AskResponse;
    setLoading(false);
    if (!response.ok || !data.ok || !data.answer) {
      setError(data.error || "Unable to answer that question.");
      return;
    }
    setTurns([...nextTurns, { role: "assistant", content: data.answer }]);
    setSafetyNote(data.safetyNote || "");
  }

  return (
    <div className="mt-3 rounded border border-cyan-200 bg-cyan-50 p-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <Bot size={14} /> Ask about this visit
      </p>
      {turns.length === 0 ? (
        <p className="mt-2 text-xs text-muted">Ask a question about this patient&apos;s visit — allergies, history, what you noted earlier. Answers are grounded only in this visit&apos;s own record.</p>
      ) : (
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded border border-cyan-200 bg-white p-3">
          {turns.map((turn, index) => (
            <div key={index} className={turn.role === "user" ? "text-right" : "text-left"}>
              <p
                className={
                  turn.role === "user"
                    ? "inline-block rounded bg-soft px-3 py-1.5 text-sm text-ink"
                    : "inline-block rounded bg-cyan-50 px-3 py-1.5 text-sm text-ink"
                }
              >
                {turn.content}
              </p>
            </div>
          ))}
        </div>
      )}
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
      {safetyNote ? <p className="mt-2 text-xs font-semibold text-muted">{safetyNote}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void ask();
            }
          }}
          placeholder="e.g. Does this patient have any known allergies?"
          className="min-h-9 flex-1 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
        />
        <ActionButton variant="primary" size="sm" onClick={() => void ask()} loading={loading} disabled={!question.trim()}>
          <Send size={13} /> Ask
        </ActionButton>
      </div>
    </div>
  );
}
