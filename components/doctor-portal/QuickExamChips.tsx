"use client";

import { ListChecks } from "lucide-react";
import type { RefObject } from "react";

export const generalExaminationChips = ["Conscious", "Cooperative", "Afebrile", "Pallor", "Icterus", "Clubbing", "Edema"];
export const perAbdomenChips = ["Soft", "Non Tender", "No Guarding", "No Rigidity", "No Organomegaly", "Normal Bowel Sounds"];

/**
 * One-click structured findings for an otherwise free-text exam field. The
 * field stays an uncontrolled textarea (useDraftRecovery owns it via ref,
 * same as typing) — a chip click reads the field's current value at click
 * time, toggles the finding in/out of the comma list, writes it back through
 * the ref, then hands off to the same onCommit path onBlur already uses so
 * it saves and shows the same status indicator, not a separate mechanism.
 */
export function QuickExamChips({
  chips,
  textareaRef,
  disabled,
  onCommit
}: {
  chips: string[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  onCommit: (value: string) => void;
}) {
  function toggle(finding: string) {
    const el = textareaRef.current;
    if (!el) return;
    const current = el.value.split(",").map((token) => token.trim()).filter(Boolean);
    const next = current.includes(finding) ? current.filter((token) => token !== finding) : [...current, finding];
    el.value = next.join(", ");
    onCommit(el.value);
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <ListChecks size={13} className="text-muted" aria-hidden="true" />
      {chips.map((finding) => (
        <button
          key={finding}
          type="button"
          disabled={disabled}
          onClick={() => toggle(finding)}
          className="rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {finding}
        </button>
      ))}
    </div>
  );
}
