import type { AccessRole } from "@/lib/access/matrix";
import { createAnalyticsSnapshot } from "@/lib/analytics";
import { buildRoleDashboard, type RoleDashboardTile } from "@/lib/role-dashboard";

const toneClass: Record<RoleDashboardTile["tone"], string> = {
  primary: "text-ink",
  success: "text-teal",
  warning: "text-gold",
  danger: "text-coral"
};

/**
 * Role-specific "Today" command band at the top of /admin (Track 2.3):
 * live counts + quick actions per active role, rendered server-side from the
 * same analytics snapshot the OS dashboard uses. Answers P3's questions —
 * what is happening, what needs attention, what do I do first.
 */
export async function RoleTodayBand({ role }: { role: AccessRole }) {
  const dashboard = buildRoleDashboard(role, await createAnalyticsSnapshot());
  if (!dashboard) return null;

  return (
    <section aria-label={dashboard.heading} className="rounded border border-line/80 bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-brand">{dashboard.heading}</h2>
        <div className="flex flex-wrap gap-2">
          {dashboard.actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded border border-line bg-soft px-2.5 py-1 text-xs font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dashboard.tiles.map((tile) => (
          <a key={tile.label} href={tile.href} className="group rounded border border-line bg-soft/60 p-3 transition hover:border-brand">
            <p className={`text-xl font-bold ${toneClass[tile.tone]}`}>{tile.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted group-hover:text-brand">{tile.label}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
