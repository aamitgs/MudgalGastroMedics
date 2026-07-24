"use client";

import { useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import { inputClass } from "@/components/doctor-portal/shared-styles";
import { useControlledAutosave } from "@/hooks/useControlledAutosave";

export function DiagnosisField({
  visit,
  disabled,
  favourites,
  onSave
}: {
  visit: OpdVisit;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(visit.diagnosis ?? "");
  const autosave = useControlledAutosave(onSave);

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
