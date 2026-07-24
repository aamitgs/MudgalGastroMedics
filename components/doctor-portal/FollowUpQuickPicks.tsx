"use client";

import type { RefObject } from "react";

const quickOffsets = [3, 5, 7, 10, 15, 30];

function isoDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
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
  function pick(days: number) {
    const el = dateInputRef.current;
    if (!el) return;
    const value = isoDateAfter(days);
    el.value = value;
    onCommit(value);
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {quickOffsets.map((days) => (
        <button
          key={days}
          type="button"
          disabled={disabled}
          onClick={() => pick(days)}
          className="rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
