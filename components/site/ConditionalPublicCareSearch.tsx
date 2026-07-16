"use client";

import { usePathname } from "next/navigation";
import { PublicCareSearch } from "@/components/site/PublicCareSearch";

/**
 * Hidden on /blog — the article-focused blog layout has its own navigation
 * emphasis and doesn't need the site-wide care search bar competing for
 * attention above the fold. Was a pathname branch inside AppChrome.tsx
 * before the route-groups migration (Track 4.1); this is the one piece of
 * that branching that couldn't move into a plain Server Component layout,
 * since deciding "hide on this one route" needs the current pathname.
 */
export function ConditionalPublicCareSearch() {
  const pathname = usePathname();
  const isBlogRoute = pathname === "/blog" || Boolean(pathname?.startsWith("/blog/"));
  if (isBlogRoute) return null;
  return <PublicCareSearch />;
}
