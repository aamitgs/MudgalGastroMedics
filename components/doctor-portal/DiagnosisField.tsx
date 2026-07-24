"use client";

import { useEffect, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import { inputClass } from "@/components/doctor-portal/shared-styles";
import { useControlledAutosave } from "@/hooks/useControlledAutosave";

export function DiagnosisField({
  visit,
  disabled,
  favourites,
  onSave,
  applyTemplate
}: {
  visit: OpdVisit;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => Promise<boolean>;
  /** A Clinical Template push-in — draft is internal state, so a parent can't just change the `visit` prop to update it. `nonce` changes on every apply so the same diagnosis text can be re-applied. */
  applyTemplate?: { value: string; nonce: number };
}) {
  const [draft, setDraft] = useState(visit.diagnosis ?? "");
  const autosave = useControlledAutosave(onSave);

  useEffect(() => {
    if (!applyTemplate) return;
    const value = applyTemplate.value;
    const timer = window.setTimeout(() => {
      setDraft(value);
      void onSave(value);
    }, 0);
    return () => window.clearTimeout(timer);
    // Deliberately nonce-only: re-applying the identical diagnosis text must
    // still push it in, and onSave/applyTemplate.value are read fresh, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTemplate?.nonce]);

  return (
    <label>
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">Diagnosis</span>
        <SaveStatusIndicator state={autosave.saveState} />
      </span>
      {!draft.trim() ? (
        <FavouriteChips
          favourites={favourites}
          onPick={(value) => {
            setDraft(value);
            void onSave(value);
          }}
        />
      ) : null}
      <input
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          autosave.onChange(event.target.value);
        }}
        onBlur={(event) => autosave.onBlur(event.target.value)}
        disabled={disabled}
        className={inputClass}
        placeholder="Short working diagnosis / impression"
      />
    </label>
  );
}
