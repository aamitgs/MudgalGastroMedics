"use client";

import { Tag, X } from "lucide-react";
import { useId, useState } from "react";
import { searchIcd10 } from "@/lib/icd10-codes";

/**
 * Optional ICD-10 attachment for the working diagnosis (Track: ICD-10
 * coding), from a curated GI/hepatology subset filtered entirely client-
 * side (no server round-trip needed for ~35 static entries). Never inferred
 * from the free-text diagnosis — a doctor picks it, or doesn't.
 */
export function Icd10CodePicker({
  code,
  label,
  onPick,
  disabled
}: {
  code?: string;
  label?: string;
  onPick: (code: string, label: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const matches = searchIcd10(query);

  if (code) {
    return (
      <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
        <Tag size={11} className="shrink-0" />
        {code}
        <span className="min-w-0 truncate font-normal text-ink" title={label}>{label}</span>
        {!disabled ? (
          <button type="button" onClick={() => onPick("", "")} aria-label="Remove ICD-10 code" className="shrink-0 text-brand/70 hover:text-brand">
            <X size={11} />
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <div className="relative mt-1.5">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder="Attach ICD-10 code (optional)"
        className="min-h-8 w-full max-w-xs rounded border border-line bg-white px-2.5 text-xs text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && matches.length > 0 ? (
        <ul id={listboxId} role="listbox" className="absolute z-10 mt-1 w-full max-w-sm overflow-hidden rounded border border-line bg-white shadow-lg">
          {matches.map((entry) => (
            <li key={entry.code}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(entry.code, entry.label);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-soft"
                role="option"
                aria-selected={false}
              >
                <span className="shrink-0 font-bold text-brand">{entry.code}</span>
                <span className="truncate text-ink">{entry.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
