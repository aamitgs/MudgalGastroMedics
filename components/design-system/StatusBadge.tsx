import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** CLAUDE.md status-color rule: green=success, amber=warning, red=critical, blue=info, gray=inactive. */
export type BadgeTone = "success" | "warning" | "critical" | "info" | "inactive";

/**
 * One canonical class set per semantic tone, converged from the majority shade
 * already in use across admin modules before this existed (Track 2.2 audit).
 */
const toneClass: Record<BadgeTone, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  info: "border-cyan-200 bg-cyan-50 text-brand dark:border-cyan-900 dark:bg-cyan-950",
  inactive: "border-line bg-soft text-muted"
};

export function getStatusToneClass(tone: BadgeTone): string {
  return toneClass[tone];
}

/**
 * Shared status pill. Callers pass their own shape/size classes (rounding,
 * padding, uppercase, tracking) via `className` — those vary intentionally by
 * surface and aren't part of what this component converges.
 */
export function StatusBadge({
  tone,
  className,
  children
}: {
  tone: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return <span className={cn("border font-bold", toneClass[tone], className)}>{children}</span>;
}
