/**
 * Shared loading skeleton for staff modules — mirrors the typical module
 * layout (KPI tile row + list rows) so content doesn't jump when data lands.
 * Rendered instead of bare "Loading..." text per the shared UX patterns.
 */
export function ModuleSkeleton({ rows = 3, tiles = 4 }: { rows?: number; tiles?: number }) {
  return (
    <div className="grid gap-3 p-4" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: tiles }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded border border-line bg-soft/70" />
        ))}
      </div>
      <div className="grid gap-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded border border-line bg-soft/50" />
        ))}
      </div>
    </div>
  );
}
