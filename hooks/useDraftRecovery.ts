"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type StoredDraft = { value: string; savedAt: number };

const STORAGE_PREFIX = "doctor-portal-draft:";
/** Bounds how long a stale, never-synced draft can resurface — a week-old browser-tab leftover shouldn't silently override today's note. */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
/** Typing pause before a draft is written — frequent enough to survive a crash mid-paragraph, rare enough to not thrash localStorage on every keystroke. */
const SAVE_DEBOUNCE_MS = 400;
/** Typing pause before an autosave hits the server — long enough that a fast typist doesn't trigger a PATCH per sentence, short enough that stepping away mid-note still saves within a couple seconds. Shared with useControlledAutosave, which drives the same behavior for controlled (value+onChange) fields that don't fit this hook's uncontrolled-ref shape. */
export const AUTOSAVE_DEBOUNCE_MS = 1500;
/** How long the "Saved" state shows before fading back to idle. */
export const SAVED_DISPLAY_MS = 2000;

export type AutosaveState = "idle" | "pending" | "saving" | "saved";

function readDraft(key: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string) {
  if (typeof window === "undefined") return;
  const draft: StoredDraft = { value, savedAt: Date.now() };
  window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(draft));
}

function clearDraft(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Crash/lost-tab recovery for consultation fields that only save to the
 * server on blur (Clinical Note, Advice, Referral Letter, Certificate Note,
 * and now every Clinical Examination field) — anything typed but never
 * blurred (browser crash, accidental tab close, a network drop right as the
 * doctor moves to the next field) was previously gone with no way back.
 * This mirrors that value into localStorage as the doctor types and
 * restores it if the server-saved value on next mount doesn't already
 * contain it.
 *
 * Optionally also drives true autosave: pass `onAutosave` and, ~1.5s after
 * the doctor stops typing, the field saves to the server on its own — no
 * blur required. Safe here specifically because these are PATCHes to one
 * field on an *existing* visit record (idempotent, no duplicate created no
 * matter how many times it fires) — this pattern must never be pointed at a
 * create/POST endpoint, which would mint a new record per autosave tick.
 *
 * Built for an uncontrolled <textarea>/<input> (defaultValue + onBlur). The
 * caller owns the ref (a hook returning a ref bundled in an object trips
 * react-hooks/refs, since the compiler can no longer verify it's never read
 * mid-render) — create it with useRef, attach it to the field, and pass it
 * in here. Wire `onInput` alongside the existing onBlur, and call
 * `onCommit()` once that onBlur's own save actually succeeds. `restored`
 * flips true only when a draft was actually applied, so the field can show
 * a small "recovered unsaved text" notice instead of silently overwriting.
 */
export function useDraftRecovery<T extends HTMLTextAreaElement | HTMLInputElement>(
  ref: RefObject<T | null>,
  key: string,
  serverValue: string,
  onAutosave?: (value: string) => Promise<boolean>
) {
  const [restored, setRestored] = useState(false);
  const [saveState, setSaveState] = useState<AutosaveState>("idle");
  const debounceRef = useRef(0);
  const autosaveRef = useRef(0);
  const savedDisplayRef = useRef(0);

  useEffect(() => {
    const draft = readDraft(key);
    if (draft !== null && draft !== serverValue && ref.current) {
      ref.current.value = draft;
      setRestored(true);
    }
    return () => {
      window.clearTimeout(debounceRef.current);
      window.clearTimeout(autosaveRef.current);
      window.clearTimeout(savedDisplayRef.current);
    };
    // Deliberately key-only: this is a one-time "is there unsent typing from
    // before this mount" check, not a sync — re-running it whenever
    // serverValue changes (e.g. right after this same field's own save)
    // would re-apply a draft that's already been superseded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function onInput(event: React.FormEvent<T>) {
    const value = event.currentTarget.value;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => writeDraft(key, value), SAVE_DEBOUNCE_MS);

    if (!onAutosave) return;
    window.clearTimeout(autosaveRef.current);
    window.clearTimeout(savedDisplayRef.current);
    setSaveState("pending");
    autosaveRef.current = window.setTimeout(async () => {
      setSaveState("saving");
      const ok = await onAutosave(value);
      if (!ok) {
        setSaveState("idle");
        return;
      }
      window.clearTimeout(debounceRef.current);
      clearDraft(key);
      setRestored(false);
      setSaveState("saved");
      savedDisplayRef.current = window.setTimeout(() => setSaveState("idle"), SAVED_DISPLAY_MS);
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function onCommit() {
    window.clearTimeout(debounceRef.current);
    window.clearTimeout(autosaveRef.current);
    clearDraft(key);
    setRestored(false);
    setSaveState("saved");
    window.clearTimeout(savedDisplayRef.current);
    savedDisplayRef.current = window.setTimeout(() => setSaveState("idle"), SAVED_DISPLAY_MS);
  }

  function discard() {
    clearDraft(key);
    if (ref.current) ref.current.value = serverValue;
    setRestored(false);
  }

  return { restored, saveState, onInput, onCommit, discard };
}
