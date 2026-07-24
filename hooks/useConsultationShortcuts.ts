"use client";

import { useEffect } from "react";

const sectionIds = [
  "visit-section-examination",
  "visit-section-diagnosis",
  "visit-section-prescription",
  "visit-section-clinical-note",
  "visit-section-followup",
  "visit-section-referral",
  "visit-section-certificate"
];

function focusById(id: string) {
  document.getElementById(id)?.focus();
}

function scrollToSection(index: number) {
  const id = sectionIds[index];
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Doctor Portal keyboard shortcuts (Track: keyboard-first consultation) —
 * Tab/Shift+Tab field-to-field navigation is already native browser
 * behavior, nothing to add there. Disabled while `enabled` is false (before
 * identity is confirmed, or while a dialog/popover has its own key
 * handling) so this never fights another control for a keystroke.
 */
export function useConsultationShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const isModifierCombo = event.ctrlKey || event.metaKey;
      if (isModifierCombo && event.key === "Enter") {
        event.preventDefault();
        document.getElementById("visit-complete-button")?.click();
        return;
      }
      if (isModifierCombo && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        focusById("visit-diagnosis");
        return;
      }
      if (isModifierCombo && (event.key === "p" || event.key === "P")) {
        event.preventDefault();
        focusById("visit-prescription-notes");
        return;
      }
      if (isModifierCombo && event.key === " ") {
        event.preventDefault();
        document.getElementById("visit-add-medicine-button")?.click();
        return;
      }
      if (event.altKey && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        scrollToSection(Number(event.key) - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
