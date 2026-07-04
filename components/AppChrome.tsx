"use client";

import { usePathname } from "next/navigation";
import { CtaBand } from "@/components/CtaBand";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StaffChrome } from "@/components/StaffChrome";

/**
 * Product separation: the marketing website chrome (header with booking CTA,
 * CTA band, marketing footer) renders only on public pages. Authenticated
 * staff surfaces get the slim StaffChrome; the Hospital OS ships its own
 * full-screen shell.
 */
const staffChromeRoutes = ["/admin", "/doctor", "/login"];

export function AppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname?.startsWith("/mudgalgastromedics-os")) {
    return <>{children}</>;
  }

  if (staffChromeRoutes.some((route) => pathname?.startsWith(route))) {
    return <StaffChrome>{children}</StaffChrome>;
  }

  return (
    <>
      <Header />
      {children}
      <CtaBand />
      <Footer />
    </>
  );
}
