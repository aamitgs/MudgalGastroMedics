"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ScrollEdges = { left: boolean; right: boolean };

/**
 * Tracks whether a horizontally scrollable element still has content hidden
 * off its left or right edge.
 *
 * Exists because a wide data table on a phone gave no indication that more
 * columns existed — the last visible column simply looked like the last one.
 *
 * Measured rather than inferred from column count: the overflow depends on
 * viewport width, column resizing and column visibility toggles, so a
 * ResizeObserver on the element is the only thing that stays correct through
 * all three. Attach `ref` to the element that actually scrolls, and `onScroll`
 * to the same element.
 */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false });

  const sync = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    // 1px tolerance: sub-pixel layout leaves a fractional remainder that would
    // otherwise keep the "more content" hint lit at the far right.
    setEdges({ left: node.scrollLeft > 1, right: node.scrollLeft < maxScroll - 1 });
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    // The table element resizes independently of its scroll container when
    // columns are shown/hidden or resized, and that is what changes overflow.
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, [sync]);

  return { ref, edges, onScroll: sync, overflowing: edges.left || edges.right };
}
