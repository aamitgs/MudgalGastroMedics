"use client";

import { HospitalOsErrorBoundary } from "@/components/design-system/HospitalOsErrorBoundary";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <HospitalOsErrorBoundary error={error} reset={reset} />;
}
