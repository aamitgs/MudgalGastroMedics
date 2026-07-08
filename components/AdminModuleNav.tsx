"use client";

import { ADMIN_MODULE_JUMP_EVENT } from "@/components/hospital-os/LazyModuleSection";

type ModuleLink = { id: string; label: string };

/**
 * Sticky jump-nav for the operations dashboard. Links come from the server
 * page pre-filtered by the same permission registry that decides which module
 * sections render (Track 2.2) — the nav can never point at a hidden module.
 *
 * Scrolling is JS-driven, not a native `<a href="#...">` jump (Track 4.1): the
 * target module mounts immediately via a custom event (see
 * LazyModuleSection), independent of scroll position, so a few gentle
 * re-corrections are enough to land the viewport on it as modules above keep
 * resolving from skeleton to real (usually taller) content for a moment.
 */
export function AdminModuleNav({ modules }: { modules: ModuleLink[] }) {
  function jumpTo(id: string) {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      window.history.replaceState(null, "", `#${id}`);
      window.dispatchEvent(new CustomEvent(ADMIN_MODULE_JUMP_EVENT, { detail: { id } }));

      const scroll = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
      scroll();
      [250, 700, 1500].forEach((delay) => window.setTimeout(scroll, delay));
    };
  }

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
            onClick={jumpTo(link.id)}
            className="shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-soft hover:text-brand"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
