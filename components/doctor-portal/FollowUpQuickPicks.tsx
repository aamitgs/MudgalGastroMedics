"use client";

import type { RefObject } from "react";

type QuickPick = { label: string; days?: number; months?: number };

const quickPicks: QuickPick[] = [
  { label: "3d", days: 3 },
  { label: "5d", days: 5 },
  { label: "7d", days: 7 },
  { label: "10d", days: 10 },
  { label: "15d", days: 15 },
  { label: "1 month", months: 1 },
  { label: "2 month", months: 2 },
  { label: "3 month", months: 3 }
];

function isoDateAfter({ days, months }: QuickPick) {
  const date = new Date();
  // Calendar-month math for the month picks (setMonth), not a 30-day
  // approximation, so "1 month" lands on the same day next month.
  if (months) date.setMonth(date.getMonth() + months);
  if (days) date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Follow-up Date is a plain uncontrolled input (defaultValue, onBlur only —
 * no draft/autosave, it's a single low-frequency field) — a quick-pick sets
 * the ref's value directly and calls the same commit the date picker's own
 * onBlur uses, so behavior stays identical to typing a date and tabbing away.
 */
export function FollowUpQuickPicks({
  dateInputRef,
  disabled,
  onCommit
}: {
  dateInputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  function pick(quick: QuickPick) {
    const el = dateInputRef.current;
    if (!el) return;
    const value = isoDateAfter(quick);
    el.value = value;
    onCommit(value);
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {quickPicks.map((quick) => (
        <button
          key={quick.label}
          type="button"
          disabled={disabled}
          onClick={() => pick(quick)}
          className="rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {quick.label}
        </button>
      ))}
    </div>
  );
}
