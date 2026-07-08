type RecentValueChipsProps = {
  values: string[];
  onPick: (value: string) => void;
};

/**
 * "Recently used" quick-insert chips (Track 3.2) for free-text fields whose
 * values genuinely recur across different records — allergy names, chronic
 * conditions, medicine names. A click inserts the value; the caller owns the
 * useRecentValues() instance (it also needs `remember()` on successful save)
 * and passes `values` down, so there's a single source of truth per field
 * rather than two hook instances racing each other. A click appends rather
 * than replaces, since these fields often hold several comma-separated items
 * — which is also why this isn't a native <input list> autocomplete.
 */
export function RecentValueChips({ values, onPick }: RecentValueChipsProps) {
  if (!values.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-muted">Recent:</span>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="rounded-full border border-line bg-soft px-2 py-0.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
        >
          {value}
        </button>
      ))}
    </div>
  );
}
