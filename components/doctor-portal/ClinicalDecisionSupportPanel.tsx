"use client";

import { AlertTriangle, ChevronDown, Info, Lightbulb, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CdsRecommendation } from "@/lib/clinical/decision-support";

function actionLabel(action: NonNullable<CdsRecommendation["action"]>): string {
  switch (action.kind) {
    case "insert-investigation":
      return "Add to investigations";
    case "insert-advice":
      return "Add to advice";
    case "set-follow-up":
      return `Set ${action.days}-day follow-up`;
  }
}

/**
 * Clinical Decision Support panel (docs/clinical-decision-support.md). Surfaces
 * the deterministic engine's recommendations as a NON-BLOCKING, collapsible
 * advisory list — it never gates completing the consultation. Each card
 * explains *why* it fired, offers an optional one-click action (delegated to
 * the parent, which owns the field mutations), and can be dismissed. Dismissal
 * is session-local (clears for this visit) and audit-logged. Warnings sort
 * first (the engine does this) and colour amber; informational suggestions
 * colour blue, per the status-colour contract.
 */
export function ClinicalDecisionSupportPanel({
  visitId,
  recommendations,
  disabled,
  onAction
}: {
  visitId: string;
  recommendations: CdsRecommendation[];
  disabled?: boolean;
  onAction: (rec: CdsRecommendation) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(true);

  const visible = useMemo(
    () => recommendations.filter((rec) => !dismissed.has(rec.ruleId)),
    [recommendations, dismissed]
  );

  if (!visible.length) return null;

  const warningCount = visible.filter((rec) => rec.severity === "warning").length;

  function dismiss(rec: CdsRecommendation) {
    setDismissed((prev) => new Set(prev).add(rec.ruleId));
    // Advisory dismissal: fire-and-forget the audit write. If it fails we don't
    // resurrect the card (more annoying than a missed low-stakes log) and don't
    // interrupt the clinician with a retry toast — this isn't a safety ack.
    void fetch("/api/clinical/cds-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId, ruleId: rec.ruleId, category: rec.category, reason: "" })
    }).catch(() => {});
  }

  return (
    <section className="rounded border border-line bg-white" aria-label="Clinical decision support">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <Lightbulb size={16} className="shrink-0 text-brand" />
        <span className="text-sm font-bold text-ink">Clinical Decision Support</span>
        <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-bold text-muted">
          {visible.length}
          {warningCount ? <span className="text-amber-700"> · {warningCount} to review</span> : null}
        </span>
        <ChevronDown size={16} className={`ml-auto shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="grid gap-2 border-t border-line p-3">
          {visible.map((rec) => {
            const warning = rec.severity === "warning";
            return (
              <div
                key={rec.ruleId}
                className={`flex items-start gap-2.5 rounded border p-3 ${
                  warning
                    ? "border-amber-300 bg-amber-50 dark:bg-amber-950/40"
                    : "border-blue-200 bg-blue-50 dark:bg-blue-950/40"
                }`}
              >
                {warning ? (
                  <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
                ) : (
                  <Info size={17} className="mt-0.5 shrink-0 text-blue-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${warning ? "text-amber-900 dark:text-amber-200" : "text-blue-900 dark:text-blue-200"}`}>
                    {rec.title}
                  </p>
                  <p className={`mt-0.5 text-sm leading-relaxed ${warning ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"}`}>
                    {rec.why}
                  </p>
                  {rec.action ? (
                    <button
                      type="button"
                      onClick={() => onAction(rec)}
                      disabled={disabled}
                      className="mt-2 inline-flex items-center rounded border border-line bg-white px-2.5 py-1 text-xs font-bold text-brand transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLabel(rec.action)}
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(rec)}
                  aria-label={`Dismiss: ${rec.title}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted transition hover:bg-soft hover:text-ink"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
