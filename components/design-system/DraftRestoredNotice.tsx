import { History, X } from "lucide-react";

/** Shown when a field/form's typing was recovered from before a crash/closed tab — pairs with hooks/useDraftRecovery.ts and hooks/useFormDraft.ts. */
export function DraftRestoredNotice({
  onDiscard,
  message = "Recovered unsaved text from before — review and save, or discard it."
}: {
  onDiscard: () => void;
  message?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 px-2.5 py-1.5 text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
        <History size={13} className="shrink-0" /> {message}
      </span>
      <button type="button" onClick={onDiscard} className="inline-flex shrink-0 items-center gap-1 font-bold text-amber-700 hover:text-amber-900">
        <X size={12} /> Discard
      </button>
    </div>
  );
}
