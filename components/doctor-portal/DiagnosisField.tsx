"use client";

import { useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { inputClass } from "@/components/doctor-portal/shared-styles";

export function DiagnosisField({
  visit,
  disabled,
  favourites,
  onSave
}: {
  visit: OpdVisit;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(visit.diagnosis ?? "");

  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-ink">Diagnosis</span>
      {!draft.trim() ? <FavouriteChips favourites={favourites} onPick={(value) => { setDraft(value); onSave(value); }} /> : null}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => onSave(event.target.value)}
        disabled={disabled}
        className={inputClass}
        placeholder="Short working diagnosis / impression"
      />
    </label>
  );
}
