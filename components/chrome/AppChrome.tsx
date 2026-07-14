"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { CtaBand } from "@/components/site/CtaBand";
import { OfflineBanner } from "@/components/design-system/OfflineBanner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PublicCareSearch } from "@/components/site/PublicCareSearch";
import { StaffChrome } from "@/components/chrome/StaffChrome";

/**
 * Product separation: the marketing website chrome (header with booking CTA,
 * CTA band, marketing footer) renders only on public pages. Authenticated
 * staff surfaces get the slim StaffChrome; the Hospital OS ships its own
 * full-screen shell.
 */
const staffChromeRoutes = ["/admin", "/doctor", "/login"];

export function AppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isBlogRoute = pathname === "/blog" || Boolean(pathname?.startsWith("/blog/"));

  // Single root switch every route renders through, so wrapping here makes
  // every motion.* component honor the OS reduced-motion setting
  // automatically (Track 1.8) — individual components no longer each need
  // their own useReducedMotion() check to be covered by this baseline; a
  // few still call it explicitly to skip non-duration motion (e.g. initial
  // slide-in offsets), which MotionConfig alone doesn't affect.
  if (pathname?.startsWith("/mudgalgastromedics-os")) {
    return (
      <MotionConfig reducedMotion="user">
        <OfflineBanner />
        {children}
      </MotionConfig>
    );
  }

  if (staffChromeRoutes.some((route) => pathname?.startsWith(route))) {
    return (
      <MotionConfig reducedMotion="user">
        <StaffChrome>{children}</StaffChrome>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Header />
      {isBlogRoute ? null : <PublicCareSearch />}
      {children}
      <CtaBand />
      <Footer />
    </MotionConfig>
  );
}
