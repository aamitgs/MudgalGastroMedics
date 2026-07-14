import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HospitalOsDynamic } from "@/components/chrome/HospitalOsDynamic";
import { WorkspaceLauncher } from "@/components/chrome/WorkspaceLauncher";
import { RoleTodayBand } from "@/components/hospital-os/RoleTodayBand";
import { accessContextFromCookieStore, canOpenAdminShell } from "@/lib/access/page-auth";

export const metadata: Metadata = {
  title: { absolute: "Dashboard • MudgalGastromedics OS" },
  description: "Premium Hospital Operating System interface for Mudgal Gastromedics Hospital operations, clinical workflows, patient records and live command center.",
  alternates: { canonical: "/mudgalgastromedics-os" },
  robots: { index: false, follow: false }
};

export default async function HospitalOsPage() {
  const cookieStore = await cookies();
  const context = await accessContextFromCookieStore(cookieStore);

  if (!canOpenAdminShell(context)) {
    return (
      <main className="hospital-os-theme grid min-h-screen place-items-center bg-[var(--hos-bg)] p-6">
        <WorkspaceLauncher />
      </main>
    );
  }

  // RoleTodayBand is an async server component; the dashboard tree below it is
  // entirely client-rendered (next/dynamic, ssr:false), so it's rendered here
  // and passed down as an already-resolved prop rather than imported client-side
  // (this is what used to be /admin's per-role "Today" band, retired with /admin
  // — see docs/build-roadmap.md, Track 4.13).
  return <HospitalOsDynamic roleTodayBand={<RoleTodayBand role={context.activeRole} />} />;
}
