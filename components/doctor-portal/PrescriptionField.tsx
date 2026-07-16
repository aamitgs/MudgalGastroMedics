"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import type { OpdVisit } from "@/lib/opd-types";
import { detectDrugInteractions } from "@/lib/clinical/drug-interactions";
import { detectMedicationOverlap } from "@/lib/clinical/medication-overlap";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { InteractionGuard } from "@/components/doctor-portal/InteractionGuard";
import { textareaClass } from "@/components/doctor-portal/shared-styles";

/**
 * Prescription entry with live duplicate-medication detection (Clinical Safety,
 * Track 0.4) and drug–drug interaction detection (Track 0.5). Advisory only —
 * both checks are free-text heuristics, so they warn and never block. Saving
 * is unchanged (onBlur).
 */
export function PrescriptionField({
  visit,
  currentMedicines,
  disabled,
  favourites,
  onSave
}: {
  visit: OpdVisit;
  currentMedicines?: string;
  disabled?: boolean;
  favourites: string[];
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(visit.prescription ?? "");
  const overlap = useMemo(
    () => detectMedicationOverlap(draft, currentMedicines ?? ""),
    [draft, currentMedicines]
  );
  const interactions = useMemo(
    () => detectDrugInteractions(draft, currentMedicines ?? ""),
    [draft, currentMedicines]
  );
  const highRiskInteractions = interactions.filter((match) => match.severity === "high");
  const moderateInteractions = interactions.filter((match) => match.severity === "moderate");

  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-ink">Prescription</span>
      {!draft.trim() ? (
        <FavouriteChips
          favourites={favourites}
          onPick={(value) => {
            setDraft(value);
            onSave(value);
          }}
        />
      ) : null}
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => onSave(event.target.value)}
        disabled={disabled}
        className={textareaClass}
        placeholder="Medicine, dose, frequency, duration, instructions"
      />
      {overlap.length ? (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
            May duplicate current medication: <span className="uppercase">{overlap.join(", ")}</span>. Verify before prescribing.
          </p>
        </div>
      ) : null}
      {moderateInteractions.length ? (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
            {moderateInteractions.map((match) => (
              <p key={match.ruleId}>
                {match.drugA} + {match.drugB}: {match.mechanism}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {highRiskInteractions.length ? (
        <div className="mt-2">
          <InteractionGuard visitId={visit.id} matches={highRiskInteractions} />
        </div>
      ) : null}
    </label>
  );
}
