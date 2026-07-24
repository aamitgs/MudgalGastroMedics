"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReset, UseFormWatch } from "react-hook-form";

const STORAGE_PREFIX = "form-draft:";
/** Same bound as the Doctor Portal's field-level drafts (hooks/useDraftRecovery.ts) — a week-old abandoned registration shouldn't silently resurface. */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
/** Debounce for persisting the whole form, not one field — a little slower than per-field drafts since every keystroke anywhere in the form re-serializes everything. */
const SAVE_DEBOUNCE_MS = 600;

type StoredFormDraft<T> = { value: T; savedAt: number };

function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredFormDraft<T>;
    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  const draft: StoredFormDraft<T> = { value, savedAt: Date.now() };
  window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(draft));
}

function clearDraft(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Local-only draft persistence for create/POST forms (Patient Registration,
 * Appointment booking) — deliberately NOT server autosave. Those forms
 * create a brand-new record on submit; autosaving to the server on a
 * debounce the way the Doctor Portal's edit-in-place fields do would mint a
 * duplicate patient/appointment on every tick instead of updating one. This
 * only ever touches localStorage, so a half-filled registration survives a
 * crash/closed tab/accidental navigation, and is restored (with an explicit
 * notice, never silently) the next time this form mounts — cleared once the
 * form is actually submitted.
 */
export function useFormDraft<T extends FieldValues>(key: string, watch: UseFormWatch<T>, reset: UseFormReset<T>) {
  const [restored, setRestored] = useState(false);
  const debounceRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const draft = readDraft<T>(key);
      if (draft) {
        reset(draft);
        setRestored(true);
      }
      readyRef.current = true;
    }, 0);
    return () => {
      window.clearTimeout(restoreTimer);
      readyRef.current = false;
    };
    // Deliberately key-only: a one-time "restore on mount" check, not a sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const subscription = watch((values) => {
      // Ignore the reset() call above notifying its own subscribers — only
      // persist changes the user actually makes after that point.
      if (!readyRef.current) return;
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => writeDraft(key, values as T), SAVE_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(debounceRef.current);
    };
  }, [key, watch]);

  function clear() {
    window.clearTimeout(debounceRef.current);
    clearDraft(key);
    setRestored(false);
  }

  return { restored, clear };
}
