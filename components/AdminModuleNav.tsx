type ModuleLink = { id: string; label: string };

/**
 * Sticky jump-nav for the operations dashboard. Links come from the server
 * page pre-filtered by the same permission registry that decides which module
 * sections render (Track 2.2) — the nav can never point at a hidden module.
 */
export function AdminModuleNav({ modules }: { modules: ModuleLink[] }) {
  return (
    <nav
      aria-label="Operations modules"
      className="sticky top-14 z-30 border-b border-line bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] items-center gap-1 overflow-x-auto py-2 [scrollbar-width:thin]">
        {modules.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-soft hover:text-brand"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
