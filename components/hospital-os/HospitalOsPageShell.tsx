"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HospitalOsShell } from "@/components/hospital-os/HospitalOsShell";

/**
 * Convenience wrapper for the 14+ per-module routes (Track 4.13,
 * docs/build-roadmap.md): bundles the QueryClientProvider every Hospital OS
 * page needs (react-query powers HospitalOsShell's session/nav-badge
 * queries) with the shell itself, so each module's page.tsx only needs to
 * import this one component instead of wiring both by hand.
 */
export function HospitalOsPageShell({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <HospitalOsShell>{children}</HospitalOsShell>
    </QueryClientProvider>
  );
}
