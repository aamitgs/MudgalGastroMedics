"use client";

import { useEffect, useRef, useState } from "react";
import { AUTOSAVE_DEBOUNCE_MS, SAVED_DISPLAY_MS, type AutosaveState } from "@/hooks/useDraftRecovery";

/**
 * Debounced autosave for controlled (value + onChange) fields — Diagnosis
 * and the Prescription table's free-text notes, which already keep their
 * own local draft state and don't fit useDraftRecovery's uncontrolled-ref
 * shape. Same ~1.5s "stop typing and it saves itself" behavior, without the
 * localStorage crash-recovery layer (these are short/secondary fields where
 * that trade-off isn't worth the extra complexity — see PrescriptionField's
 * own comment on why its structured rows get the safety net instead).
 *
 * Only ever call `onSave` for a PATCH to an existing record — never a
 * create/POST, which would mint a new record on every debounce tick.
 */
export function useControlledAutosave(onSave: (value: string) => Promise<boolean>) {
  const [saveState, setSaveState] = useState<AutosaveState>("idle");
  const debounceRef = useRef(0);
  const savedDisplayRef = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(debounceRef.current);
      window.clearTimeout(savedDisplayRef.current);
    },
    []
  );

  async function commit(value: string) {
    setSaveState("saving");
    const ok = await onSave(value);
    if (!ok) {
      setSaveState("idle");
      return;
    }
    setSaveState("saved");
    window.clearTimeout(savedDisplayRef.current);
    savedDisplayRef.current = window.setTimeout(() => setSaveState("idle"), SAVED_DISPLAY_MS);
  }

  function onChange(value: string) {
    window.clearTimeout(debounceRef.current);
    window.clearTimeout(savedDisplayRef.current);
    setSaveState("pending");
    debounceRef.current = window.setTimeout(() => void commit(value), AUTOSAVE_DEBOUNCE_MS);
  }

  function onBlur(value: string) {
    window.clearTimeout(debounceRef.current);
    void commit(value);
  }

  return { saveState, onChange, onBlur };
}
