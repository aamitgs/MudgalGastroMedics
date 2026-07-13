"use client";

import Link from "next/link";
import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { site } from "@/lib/site-data";

type SystemInfo = { ok: boolean; version?: string; environment?: string };

const shortcuts: Array<{ keys: string; action: string }> = [
  { keys: "Ctrl / ⌘ + K", action: "Open command palette (Hospital OS)" },
  { keys: "Esc", action: "Close dialog, palette, or overlay" },
  { keys: "↑ / ↓", action: "Move between sidebar items and table rows" },
  { keys: "Enter", action: "Open the focused item" }
];

function formatSync(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

/**
 * Enterprise footer for authenticated staff surfaces (Part 1 spec): product
 * identity + live system meta (version, environment, status, last sync) and the
 * standard links. Deliberately minimal — no marketing content.
 */
export function StaffFooter() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const response = await fetch("/api/health", { cache: "no-store" }).catch(() => null);
      if (!active) return;
      if (response?.ok) {
        const data = await response.json().catch(() => null);
        if (active && data) setSystem({ ok: Boolean(data.ok), version: data.version, environment: data.environment });
      } else if (active) {
        setSystem({ ok: false });
      }
      if (active) setLastSync(new Date());
    })();
    return () => {
      active = false;
    };
  }, []);

  const statusOk = system?.ok ?? true;

  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="mx-auto flex w-[min(1560px,calc(100%-32px))] flex-col gap-3 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">MudgalGastromedics OS</p>
          <p className="mt-0.5">Connected Healthcare. Unified Operations. · Enterprise Healthcare Platform</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-semibold">
          <span className="inline-flex items-center gap-1.5" aria-label="System status">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${system === null ? "bg-line" : statusOk ? "bg-teal" : "bg-coral"}`} />
            {system === null ? "Checking…" : statusOk ? "Operational" : "Degraded"}
          </span>
          {system?.version ? <span>v{system.version}</span> : null}
          {system?.environment && system.environment !== "production" ? (
            <span className="rounded bg-gold/15 px-1.5 py-0.5 uppercase tracking-wide text-gold">{system.environment}</span>
          ) : null}
          {lastSync ? <span>Last sync {formatSync(lastSync)} IST</span> : null}

          <span aria-hidden="true" className="text-line">|</span>
          <Link href="/privacy" className="transition hover:text-brand">Privacy</Link>
          <Link href="/terms" className="transition hover:text-brand">Terms</Link>
          <a href={`mailto:${site.email}`} className="transition hover:text-brand">Support</a>

          <Dialog>
            <DialogTrigger className="inline-flex items-center gap-1 transition hover:text-brand">
              <Keyboard size={13} /> Shortcuts
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Keyboard shortcuts</DialogTitle>
              </DialogHeader>
              <ul className="mt-2 grid gap-2">
                {shortcuts.map((shortcut) => (
                  <li key={shortcut.keys} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted">{shortcut.action}</span>
                    <kbd className="shrink-0 rounded border border-line bg-soft px-2 py-0.5 font-mono text-xs font-semibold text-ink">{shortcut.keys}</kbd>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>

          <span aria-hidden="true" className="text-line">|</span>
          <span>© {new Date().getFullYear()} Mudgal Gastromedics Hospital</span>
        </div>
      </div>
    </footer>
  );
}
