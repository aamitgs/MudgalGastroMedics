"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { HospitalOsRouteLoading } from "@/components/design-system/HospitalOsRouteLoading";

const HospitalOperatingSystem = dynamic(
  () => import("@/components/chrome/HospitalOperatingSystem").then((module) => module.HospitalOperatingSystem),
  {
    ssr: false,
    loading: () => <HospitalOsRouteLoading />
  }
);

export function HospitalOsDynamic({ roleTodayBand }: { roleTodayBand?: ReactNode } = {}) {
  return <HospitalOperatingSystem roleTodayBand={roleTodayBand} />;
}
