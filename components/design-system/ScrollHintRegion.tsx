"use client";

import type { ReactNode } from "react";
import { useScrollEdges } from "@/components/design-system/useScrollEdges";
import { cn } from "@/lib/utils";

/**
 * A horizontally scrollable region that says so when content is off-screen.
 *
 * Wide tables on a phone scroll sideways by design — the OS keeps full column
 * sets rather than hiding columns — but the rightmost visible column then
 * looks like the last one and staff never find the rest.
 *
 * The fades deliberately sit on the outer, non-scrolling wrapper: an overlay
 * placed inside the scroller scrolls away with the very content it marks.
 * The text hint sits in the page flow rather than floating, because this
 * region is often nested inside a vertically scrolling area, where an
 * absolutely positioned badge lands at the bottom of the full content instead
 * of the bottom of the visible area.
 *
 * Both cues are aria-hidden: the content is already reachable without them,
 * and a screen reader user is not swiping.
 */
export function ScrollHintRegion({
  children,
  className,
  scrollerClassName,
  scrollerProps
}: {
  children: ReactNode;
  /** Applied to the outer, non-scrolling wrapper. */
  className?: string;
  /** Applied to the element that actually scrolls. */
  scrollerClassName?: string;
  scrollerProps?: Record<string, string>;
}) {
  const { ref, edges, onScroll, overflowing } = useScrollEdges<HTMLDivElement>();

  return (
    <div className={cn("relative w-full", className)}>
      <div {...scrollerProps} ref={ref} onScroll={onScroll} className={cn("w-full overflow-x-auto", scrollerClassName)}>
        {children}
      </div>
      {edges.left ? (
        <div
          aria-hidden
          data-scroll-hint="left"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface to-transparent print:hidden"
        />
      ) : null}
      {edges.right ? (
        <div
          aria-hidden
          data-scroll-hint="right"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent print:hidden"
        />
      ) : null}
      {overflowing ? (
        <p aria-hidden data-scroll-hint="text" className="px-3 py-1.5 text-[11px] font-semibold text-muted sm:hidden print:hidden">
          Swipe the table sideways for more columns
        </p>
      ) : null}
    </div>
  );
}
