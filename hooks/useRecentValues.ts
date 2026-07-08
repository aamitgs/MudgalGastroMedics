"use client";

import { useCallback, useState } from "react";

const maxRecentValues = 8;

/**
 * Small localStorage-backed "recently used" list per field key (Track 3.2) —
 * for free-text fields whose values genuinely recur across different records
 * (allergy names, chronic conditions, medicine names), not per-record fields
 * like phone numbers or addresses which are unique per person.
 *
 * Only ever mounted client-side (dynamically-loaded /admin modules), so
 * reading localStorage in the lazy useState initializer is safe.
 */
export function useRecentValues(key: string) {
  const storageKey = `recent-values:${key}`;
  const [values, setValues] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const remember = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setValues((current) => {
        const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, maxRecentValues);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Storage can be full/unavailable (private browsing) — recency is a
          // convenience, never a requirement, so failures are silently ignored.
        }
        return next;
      });
    },
    [storageKey]
  );

  return { values, remember };
}
