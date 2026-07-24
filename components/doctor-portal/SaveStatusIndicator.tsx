import { Check, Loader2 } from "lucide-react";
import type { AutosaveState } from "@/hooks/useDraftRecovery";

/** Small autosave status readout — pairs with useDraftRecovery's onAutosave. Idle/pending render nothing, since "about to save in a second" isn't worth a permanent UI element. */
export function SaveStatusIndicator({ state }: { state: AutosaveState }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
        <Check size={12} /> Saved
      </span>
    );
  }
  return null;
}
