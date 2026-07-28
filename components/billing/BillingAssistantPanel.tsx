"use client";

import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import { formatPaise } from "@/lib/billing-calc";
import type { Recommendation } from "@/lib/billing-assistant";

const iconFor = {
  warning: AlertTriangle,
  action: Lightbulb,
  info: Info
} as const;

const toneClass = {
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  action: "border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950",
  info: "border-line bg-soft/60"
} as const;

/**
 * The billing assistant's suggestions for the bill in front of the clerk
 * (Track 5.11, §30).
 *
 * Every item states the figures behind it and what to do about it, and none of
 * them act on their own — §30's own rule is that the assistant recommends and
 * never bills. Presented as suggestions rather than alerts so it stays useful
 * at a busy counter instead of becoming noise people learn to scroll past.
 */
export function BillingAssistantPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations.length) return null;

  return (
    <section aria-label="Billing suggestions" className="grid gap-2 rounded border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-brand">
        <Lightbulb size={13} /> Before you collect
      </p>

      <ul className="grid gap-2">
        {recommendations.map((entry) => {
          const Icon = iconFor[entry.severity];
          return (
            <li key={`${entry.kind}-${entry.title}`} className={`grid gap-1 rounded border p-3 ${toneClass[entry.severity]}`}>
              <p className="flex flex-wrap items-baseline gap-2 text-sm font-bold text-ink">
                <Icon size={14} className="shrink-0" />
                {entry.title}
                {entry.amountPaise ? <span className="tabular-nums">{formatPaise(entry.amountPaise)}</span> : null}
              </p>
              <p className="text-xs text-muted">{entry.detail}</p>
              {entry.suggestedAction ? <p className="text-xs font-semibold text-ink">{entry.suggestedAction}</p> : null}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted">Suggestions only — nothing here changes a bill on its own.</p>
    </section>
  );
}
