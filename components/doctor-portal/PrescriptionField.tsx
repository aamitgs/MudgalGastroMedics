"use client";

import { AlertTriangle, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { OpdVisit, PrescriptionItem } from "@/lib/opd-types";
import { detectDrugInteractions } from "@/lib/clinical/drug-interactions";
import { detectMedicationOverlap } from "@/lib/clinical/medication-overlap";
import { prescriptionInstructionPresets, resolveInstructionText } from "@/lib/prescription-instructions";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FavouriteChips } from "@/components/doctor-portal/FavouriteChips";
import { InteractionGuard } from "@/components/doctor-portal/InteractionGuard";
import { MedicineAutocomplete } from "@/components/doctor-portal/MedicineAutocomplete";
import { PrescriptionTemplateMenu } from "@/components/doctor-portal/PrescriptionTemplateMenu";
import { SaveStatusIndicator } from "@/components/doctor-portal/SaveStatusIndicator";
import { inputClass, textareaClass } from "@/components/doctor-portal/shared-styles";
import { useControlledAutosave } from "@/hooks/useControlledAutosave";

function newItemId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyItem(prefill?: Partial<PrescriptionItem>): PrescriptionItem {
  return { id: newItemId(), medicine: "", strength: "", instruction: prescriptionInstructionPresets[0].id, days: "", ...prefill };
}

/**
 * Prescription entry: a structured medicine table (Name/Strength/Instruction/
 * Days — the redesigned prescription pad's Rx table, Track: prescription pad
 * redesign) plus the original free-text notes field underneath it for
 * anything a row doesn't capture. Both feed the same live duplicate-
 * medication (Track 0.4) and drug interaction (Track 0.5) detection —
 * advisory only, never blocking. Templates and the free-text favourites stay
 * tied to the notes field exactly as before; medicine-row favourites are a
 * separate, additive quick-add of individually frequent past medicines.
 */
export function PrescriptionField({
  visit,
  currentMedicines,
  disabled,
  favourites,
  favouriteItems,
  onSave,
  onSaveItems
}: {
  visit: OpdVisit;
  currentMedicines?: string;
  disabled?: boolean;
  favourites: string[];
  favouriteItems: PrescriptionItem[];
  onSave: (value: string) => Promise<boolean>;
  onSaveItems: (items: PrescriptionItem[]) => void;
}) {
  const [draft, setDraft] = useState(visit.prescription ?? "");
  const [items, setItems] = useState<PrescriptionItem[]>(visit.prescriptionItems ?? []);
  const notesAutosave = useControlledAutosave(onSave);

  // Both entry paths (rows + free notes) feed one combined text so duplicate/
  // interaction detection catches a drug regardless of which the doctor used.
  const combinedMedicationText = useMemo(
    () => [draft, ...items.map((item) => `${item.medicine} ${item.strength ?? ""}`)].join(" "),
    [draft, items]
  );
  const overlap = useMemo(() => detectMedicationOverlap(combinedMedicationText, currentMedicines ?? ""), [combinedMedicationText, currentMedicines]);
  const interactions = useMemo(() => detectDrugInteractions(combinedMedicationText, currentMedicines ?? ""), [combinedMedicationText, currentMedicines]);
  const highRiskInteractions = interactions.filter((match) => match.severity === "high");
  const moderateInteractions = interactions.filter((match) => match.severity === "moderate");

  // Fully-blank rows (an "Add medicine" click the doctor never filled in)
  // never persist — only rows with an actual medicine name are saved.
  function commit(next: PrescriptionItem[]) {
    setItems(next);
    onSaveItems(next.filter((item) => item.medicine.trim()));
  }

  function updateItem(id: string, patch: Partial<PrescriptionItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem(prefill?: Partial<PrescriptionItem>) {
    const next = [...items, emptyItem(prefill)];
    if (prefill?.medicine) commit(next);
    else setItems(next);
  }

  function removeItem(id: string) {
    commit(items.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-ink">Prescription (Rx)</span>
          <ActionButton type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addItem()} disabled={disabled}>
            <Plus size={14} /> Add medicine
          </ActionButton>
        </div>

        {favouriteItems.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {favouriteItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => addItem({ medicine: item.medicine, strength: item.strength, instruction: item.instruction, days: item.days })}
                title={`Add ${item.medicine}${item.strength ? ` ${item.strength}` : ""}`}
                className="max-w-[220px] truncate rounded-full border border-line bg-soft/60 px-2.5 py-1 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={11} className="mr-1 inline -mt-0.5" />
                {item.medicine}
              </button>
            ))}
          </div>
        ) : null}

        {items.length ? (
          <div className="grid gap-2">
            {items.map((item) => {
              const isKnownPreset = prescriptionInstructionPresets.some((preset) => preset.id === item.instruction);
              const preview = resolveInstructionText(item.instruction);
              return (
                <div key={item.id} className="grid gap-1.5 rounded border border-line bg-white p-2.5">
                  <div className="grid grid-cols-[1.3fr_0.8fr_auto] items-center gap-1.5">
                    <MedicineAutocomplete
                      value={item.medicine}
                      onChange={(value) => updateItem(item.id, { medicine: value })}
                      onBlur={() => commit(items)}
                      onPick={(name) => commit(items.map((row) => (row.id === item.id ? { ...row, medicine: name } : row)))}
                      disabled={disabled}
                    />
                    <input
                      value={item.strength ?? ""}
                      onChange={(event) => updateItem(item.id, { strength: event.target.value })}
                      onBlur={() => commit(items)}
                      disabled={disabled}
                      placeholder="Strength"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={disabled}
                      aria-label={`Remove ${item.medicine || "this row"}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded border border-line text-muted transition hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-[1.6fr_0.7fr] items-center gap-1.5">
                    <select
                      value={isKnownPreset ? item.instruction : "custom"}
                      onChange={(event) => commit(items.map((row) => (row.id === item.id ? { ...row, instruction: event.target.value === "custom" ? "" : event.target.value } : row)))}
                      disabled={disabled}
                      className={inputClass}
                    >
                      {prescriptionInstructionPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.label}</option>
                      ))}
                      <option value="custom">Custom…</option>
                    </select>
                    <input
                      value={item.days ?? ""}
                      onChange={(event) => updateItem(item.id, { days: event.target.value })}
                      onBlur={() => commit(items)}
                      disabled={disabled}
                      placeholder="Days"
                      className={inputClass}
                    />
                  </div>
                  {!isKnownPreset ? (
                    <input
                      value={item.instruction}
                      onChange={(event) => updateItem(item.id, { instruction: event.target.value })}
                      onBlur={() => commit(items)}
                      disabled={disabled}
                      placeholder="Custom instruction"
                      className={inputClass}
                    />
                  ) : preview.hindi ? (
                    <p className="text-xs text-muted">{preview.hindi}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <label>
        <span className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">Additional Notes</span>
            <SaveStatusIndicator state={notesAutosave.saveState} />
          </span>
          <PrescriptionTemplateMenu
            draft={draft}
            onInsert={(text) => {
              // Append rather than replace when something is already typed — a
              // template insert must never silently discard prescription text
              // the doctor has already written (Track 4.2's "never silently
              // lose data" principle applies just as much here).
              const next = draft.trim() ? `${draft}\n\n${text}` : text;
              setDraft(next);
              void onSave(next);
            }}
          />
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
        <textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            notesAutosave.onChange(event.target.value);
          }}
          onBlur={(event) => notesAutosave.onBlur(event.target.value)}
          disabled={disabled}
          className={textareaClass}
          placeholder="Anything not captured above — special instructions, regimen from a saved template, etc."
        />
      </label>

      {overlap.length ? (
        <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
            May duplicate current medication: <span className="uppercase">{overlap.join(", ")}</span>. Verify before prescribing.
          </p>
        </div>
      ) : null}
      {moderateInteractions.length ? (
        <div className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs" role="alert">
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
      {highRiskInteractions.length ? <InteractionGuard visitId={visit.id} matches={highRiskInteractions} /> : null}
    </div>
  );
}
