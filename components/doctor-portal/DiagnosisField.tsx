"use client";

import { useEffect, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import { inputClass } from "@/components/doctor-portal/shared-styles";
import { useControlledAutosave } from "@/hooks/useControlledAutosave";
import type { AutosaveState } from "@/hooks/useDraftRecovery";

export function DiagnosisField({
  visit,
  disabled,
  favourites,
  onSave,
  applyTemplate,
  onSaveStateChange
}: {
  visit: OpdVisit;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => Promise<boolean>;
  /** A Clinical Template push-in — draft is internal state, so a parent can't just change the `visit` prop to update it. `nonce` changes on every apply so the same diagnosis text can be re-applied. */
  applyTemplate?: { value: string; nonce: number };
  /** Lets a parent (the sticky consultation header) fold this field's save state into one aggregate indicator — this component's own draft/autosave state stays private otherwise. */
  onSaveStateChange?: (state: AutosaveState) => void;
}) {
  const [draft, setDraft] = useState(visit.diagnosis ?? "");
  const autosave = useControlledAutosave(onSave);

  useEffect(() => {
    onSaveStateChange?.(autosave.saveState);
    // onSaveStateChange is a fresh closure most renders — reporting on identity
    // change would fire far more often than the state it's meant to track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosave.saveState]);

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
    <div>
      <label htmlFor="visit-diagnosis">
        <span className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-ink">Diagnosis</span>
          <SaveStatusIndicator state={autosave.saveState} />
        </span>
      </label>
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
        id="visit-diagnosis"
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
    </div>
  );
}
