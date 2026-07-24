"use client";

import { useEffect, useId, useState } from "react";
import { inputClass } from "@/components/doctor-portal/shared-styles";

type MedicineSuggestion = { name: string; genericName?: string; dosageForm?: string; manufacturer?: string; unit: string; quantity: number };
type SuggestionsResponse = { ok: boolean; medicines?: MedicineSuggestion[] };

/**
 * Predictive text for the Prescription table's Medicine Name field, backed
 * by the hospital's real pharmacy stock (app/api/pharmacy/medicine-suggestions)
 * rather than an invented drug list — picking a suggestion names something
 * the hospital can actually dispense, and typos that would otherwise slip
 * past lib/clinical/drug-interactions.ts's name-matching are less likely.
 */
export function MedicineAutocomplete({
  id,
  value,
  onChange,
  onBlur,
  onPick,
  disabled
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onPick: (name: string) => void;
  disabled?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const listboxId = useId();

  useEffect(() => {
    const trimmed = value.trim();
    let active = true;
    // All setState calls deferred into the timer callback — none run
    // synchronously in the effect body (react-hooks/set-state-in-effect).
    const timer = window.setTimeout(async () => {
      if (trimmed.length < 2) {
        if (active) setSuggestions([]);
        return;
      }
      const response = await fetch(`/api/pharmacy/medicine-suggestions?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" }).catch(() => null);
      if (!active) return;
      const data = ((await response?.json().catch(() => ({}))) ?? {}) as SuggestionsResponse;
      setSuggestions(response?.ok && data.ok && data.medicines ? data.medicines : []);
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delayed so a suggestion's onClick still fires before the list unmounts.
          window.setTimeout(() => setOpen(false), 150);
          onBlur();
        }}
        disabled={disabled}
        placeholder="Medicine name"
        className={inputClass}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && suggestions.length > 0 ? (
        <ul id={listboxId} className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-line bg-white shadow-lg" role="listbox">
          {suggestions.map((suggestion) => {
            const metaParts = [suggestion.genericName, suggestion.dosageForm, suggestion.manufacturer].filter(Boolean);
            return (
              <li key={suggestion.name}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(suggestion.name);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-soft"
                  role="option"
                  aria-selected={suggestion.name === value}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{suggestion.name}</span>
                    <span className="shrink-0 text-xs text-muted">{suggestion.quantity} {suggestion.unit} in stock</span>
                  </span>
                  {metaParts.length ? <span className="truncate text-xs text-muted">{metaParts.join(" · ")}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
